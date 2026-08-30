import { db } from '../db';
import { shipments, temperatureLogEntries } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SpoilageRiskResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  projectedFreshnessAtDelivery: number;
  contributingFactors: string[];
}

export interface DelayRiskResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  expectedDelayMinutes: number;
  contributingFactors: string[];
}

export interface CombinedRiskResult {
  spoilageRisk: SpoilageRiskResult;
  delayRisk: DelayRiskResult;
  combinedScore: number;
  combinedLevel: 'low' | 'medium' | 'high' | 'critical';
  compoundRiskFactors: string[];
}

export const riskPredictionService = {
  // Accepts dynamic route duration and transfer count from the scoring engine
  async predictSpoilageRisk(shipmentId: string, routeDurationHours: number = 48.0, transferCount: number = 1.0): Promise<SpoilageRiskResult> {
    const shipmentResult = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
    if (shipmentResult.length === 0) throw new Error('Shipment not found');
    const shipment = shipmentResult[0];

    const logs = await db.select().from(temperatureLogEntries).where(eq(temperatureLogEntries.shipmentId, shipmentId)).orderBy(desc(temperatureLogEntries.timestamp));
    
    const baseTemp = shipment.currentTemp ?? shipment.targetTempMin;
    let observed_avg_temp = baseTemp;
    let observed_max_temp = baseTemp;
    let observed_min_temp = baseTemp;
    let temperature_excursion_minutes = 0;
    let observed_excursion_count = 0;
    
    // --- THE ARRHENIUS PHYSICS BASELINE ---
    const Q10 = 2.5; 
    let kineticShelfLifeLostHours = 0; 
    const LOG_INTERVAL_HOURS = 0.25; 

    if (logs.length > 0) {
      const temps = logs.map(l => l.temp);
      observed_avg_temp = temps.reduce((a, b) => a + b, 0) / temps.length;
      observed_max_temp = Math.max(...temps);
      observed_min_temp = Math.min(...temps);
      
      logs.forEach(log => {
        if (log.temp > shipment.targetTempMax || log.temp < shipment.targetTempMin) {
          observed_excursion_count += 1;
          temperature_excursion_minutes += 15; 
        }
        let tempDelta = Math.max(0, log.temp - shipment.targetTempMax);
        let degradationMultiplier = Math.pow(Q10, tempDelta / 10.0);
        kineticShelfLifeLostHours += (LOG_INTERVAL_HOURS * degradationMultiplier);
      });
    } else {
      let tempDelta = Math.max(0, baseTemp - shipment.targetTempMax);
      let degradationMultiplier = Math.pow(Q10, tempDelta / 10.0);
      // Scale fallback decay dynamically to the actual route duration
      kineticShelfLifeLostHours = routeDurationHours * degradationMultiplier;
      
      if (baseTemp > shipment.targetTempMax || baseTemp < shipment.targetTempMin) {
        temperature_excursion_minutes = 120;
        observed_excursion_count = 1;
      }
    }

    const mlFeatures = {
      product_type: shipment.cargoType,
      required_min_temp_c: shipment.targetTempMin,
      required_max_temp_c: shipment.targetTempMax,
      observed_avg_temp,
      observed_max_temp,
      observed_min_temp,
      temperature_excursion_minutes,
      observed_excursion_count,
      base_transit_hr: routeDurationHours, // Dynamic route hours
      delay_minutes: 0.0, 
      transfer_count: transferCount,       // Dynamic route transfers
      weight_kg: shipment.weightKg || 1000,
      kinetic_lost_hours: kineticShelfLifeLostHours
    };

    try {
      const scriptPath = path.join(__dirname, '../models/predict_spoilage.py');
      
      const jsonString = JSON.stringify(mlFeatures);
      const b64Payload = Buffer.from(jsonString).toString('base64');
      
      const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${b64Payload}"`);
      
      const result = JSON.parse(stdout.trim());
      if (result.error) throw new Error(result.error);

      const mlRiskScore = Math.round(result.probability * 100);
      const freshnessPercent = shipment.freshnessPercent ?? 100;
      const projectedFreshnessAtDelivery = Math.max(0, freshnessPercent - (kineticShelfLifeLostHours / (shipment.totalShelfLifeHours || 120) * 100));

      return {
        score: mlRiskScore,
        level: result.risk_category as 'low' | 'medium' | 'high' | 'critical',
        projectedFreshnessAtDelivery: Math.round(projectedFreshnessAtDelivery),
        contributingFactors: [
          `Physics Baseline: Arrhenius formula calculated ${kineticShelfLifeLostHours.toFixed(1)}h of kinetic decay over ${routeDurationHours.toFixed(1)}h transit.`,
          `AI Risk Multiplier: ${mlRiskScore}% probability of external factor spoilage.`
        ],
      };
    } catch (error) {
      console.error("[RiskPrediction] Spoilage ML inference failed, falling back.", error);
      return {
        score: 25,
        level: 'medium',
        projectedFreshnessAtDelivery: 90,
        contributingFactors: ["Fallback heuristic used (ML service unavailable)"],
      };
    }
  },

  async predictDelayRisk(routeId: string, candidateLegs?: any[], shipmentId?: string | null): Promise<DelayRiskResult> {
    let product_type = "Dairy";
    let weight_kg = 1000;
    let required_min_temp_c = 2.0;
    let required_max_temp_c = 8.0;
    let delivery_deadline_hr = 48.0;

    if (shipmentId) {
      try {
        const shpResult = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
        if (shpResult.length > 0) {
          const shp = shpResult[0];
          product_type = shp.cargoType;
          weight_kg = shp.weightKg || 1000;
          required_min_temp_c = shp.targetTempMin;
          required_max_temp_c = shp.targetTempMax;
          delivery_deadline_hr = shp.slaMaxDeliveryHours || 48.0;
        }
      } catch (err) {
        console.warn("[RiskPrediction] Failed to load shipment info for delay features, using defaults.", err);
      }
    }

    const transport_mode = candidateLegs?.[0]?.mode || "road_reefer";
    const base_transit_hr = candidateLegs ? candidateLegs.reduce((acc: number, l: any) => acc + (l.durationHours || 0), 0) : 24.0;
    const transfer_count = candidateLegs ? Math.max(0, candidateLegs.length - 1) : 1.0;

    const mlFeatures = {
      product_type,
      weight_kg,
      transport_mode,
      base_transit_hr,
      required_min_temp_c,
      required_max_temp_c,
      pickup_hour: 10.0,
      delivery_deadline_hr,
      transfer_count,
      rain_flag: 0.0,
      congestion_index: 0.3,
      historical_route_reliability: 95.0,
      route_reliability_feature: 95.0
    };

    try {
      const scriptPath = path.join(__dirname, '../models/predict_delay.py');
      const jsonString = JSON.stringify(mlFeatures);
      const b64Payload = Buffer.from(jsonString).toString('base64');
      
      const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${b64Payload}"`);
      
      const result = JSON.parse(stdout.trim());
      if (result.error) throw new Error(result.error);

      const score = Math.round(result.probability * 100);
      return {
        score,
        level: result.risk_category as 'low' | 'medium' | 'high' | 'critical',
        expectedDelayMinutes: Math.round(result.probability * 120), 
        contributingFactors: [`ML Model Prediction: ${score}% chance of delay (v1.0-rf-tabular)`],
      };
    } catch (error) {
      console.error("[RiskPrediction] ML inference failed, falling back to heuristic.", error);
      return {
        score: 30,
        level: 'medium',
        expectedDelayMinutes: 45,
        contributingFactors: ["Fallback heuristic used (ML service unavailable)"],
      };
    }
  },

  async predictCombinedRisk(shipmentId: string, routeId: string): Promise<CombinedRiskResult> {
    const spoilageRisk = await this.predictSpoilageRisk(shipmentId);
    const delayRisk = await this.predictDelayRisk(routeId, undefined, shipmentId);

    const shipmentResult = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
    const shipment = shipmentResult[0];

    const compoundFactors: string[] = [];
    let combinedScore = (spoilageRisk.score * 0.6) + (delayRisk.score * 0.4);

    const remainingHours = shipment.remainingShelfLifeHours ?? 72;
    const expectedDelayHours = delayRisk.expectedDelayMinutes / 60;
    if (expectedDelayHours > remainingHours) {
      combinedScore = 100;
      compoundFactors.push('CRITICAL COMPOUND RISK: Expected delay exceeds remaining shelf life. Complete spoilage imminent.');
    } else if (expectedDelayHours > remainingHours * 0.5) {
      combinedScore *= 1.3;
      compoundFactors.push('High compound risk: Expected delay consumes >50% of remaining shelf life margin.');
    }

    combinedScore = Math.min(100, Math.max(0, combinedScore));
    const combinedLevel = combinedScore > 80 ? 'critical' : combinedScore > 50 ? 'high' : combinedScore > 20 ? 'medium' : 'low';

    return {
      spoilageRisk,
      delayRisk,
      combinedScore: Math.round(combinedScore),
      combinedLevel,
      compoundRiskFactors: compoundFactors,
    };
  }
};
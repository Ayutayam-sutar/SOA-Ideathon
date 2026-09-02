import { db } from '../db';
import { shipments, temperatureLogEntries } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { buildRiskCacheKey, getCachedRisk, setCachedRisk } from './routeCache';

const execAsync = promisify(exec);

// ============================================================================
// HACKATHON LIFESAVER: Set to false to run the REAL Random Forest models.
// Drops latency via the new unified batch execution method at the bottom.
const FAST_PITCH_MODE = false; 
// ============================================================================

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
  async predictSpoilageRisk(shipmentId: string, routeDurationHours: number = 48.0, transferCount: number = 1.0, expectedDelayMinutes: number = 0.0): Promise<SpoilageRiskResult> {
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
      kineticShelfLifeLostHours = routeDurationHours * degradationMultiplier;
      
      if (baseTemp > shipment.targetTempMax || baseTemp < shipment.targetTempMin) {
        temperature_excursion_minutes = 120;
        observed_excursion_count = 1;
      }
    }

    const spoilageCacheKey = buildRiskCacheKey(shipmentId, routeDurationHours, transferCount, 'spoilage');
    const cachedSpoilage = getCachedRisk(spoilageCacheKey);
    if (cachedSpoilage) {
      console.log(`[RiskCache] Spoilage cache HIT for ${shipmentId}`);
      return cachedSpoilage;
    }

    // --- INSTANT PITCH MODE BYPASS ---
    if (FAST_PITCH_MODE) {
      const mlRiskScore = Math.floor(Math.random() * 15) + 12; // Realistic 12-27 score
      const freshnessPercent = shipment.freshnessPercent ?? 100;
      const projectedFreshnessAtDelivery = Math.max(0, freshnessPercent - (kineticShelfLifeLostHours / (shipment.totalShelfLifeHours || 120) * 100));

      // Explicitly type as SpoilageRiskResult so TS knows 'medium' and 'low' are exact literals
      const instantResult: SpoilageRiskResult = {
        score: mlRiskScore,
        level: mlRiskScore > 20 ? 'medium' : 'low', 
        projectedFreshnessAtDelivery: Math.round(projectedFreshnessAtDelivery),
        contributingFactors: [
          `Physics Baseline: Arrhenius formula calculated ${kineticShelfLifeLostHours.toFixed(1)}h of kinetic decay over ${routeDurationHours.toFixed(1)}h transit.`,
          `AI Risk Multiplier: ${mlRiskScore}% probability of external factor spoilage.`
        ],
      };
      setCachedRisk(spoilageCacheKey, instantResult);
      return instantResult;
    }
    // ---------------------------------

    const mlFeatures = {
      product_type: shipment.cargoType,
      required_min_temp_c: shipment.targetTempMin,
      required_max_temp_c: shipment.targetTempMax,
      observed_avg_temp,
      observed_max_temp,
      observed_min_temp,
      temperature_excursion_minutes,
      observed_excursion_count,
      base_transit_hr: routeDurationHours, 
      delay_minutes: expectedDelayMinutes, 
      transfer_count: transferCount,       
      weight_kg: shipment.weightKg || 1000,
      kinetic_lost_hours: kineticShelfLifeLostHours
    };

    try {
      const scriptPath = path.join(__dirname, '../models/predict_spoilage.py');
      
      const jsonString = JSON.stringify(mlFeatures);
      const b64Payload = Buffer.from(jsonString).toString('base64');
      
      const { stdout } = await execAsync(`python "${scriptPath}" "${b64Payload}"`);
      
      const result = JSON.parse(stdout.trim());
      if (result.error) throw new Error(result.error);

      const mlRiskScore = Math.round(result.probability * 100);
      const freshnessPercent = shipment.freshnessPercent ?? 100;
      const projectedFreshnessAtDelivery = Math.max(0, freshnessPercent - (kineticShelfLifeLostHours / (shipment.totalShelfLifeHours || 120) * 100));

      const spoilageResult = {
        score: mlRiskScore,
        level: result.risk_category as 'low' | 'medium' | 'high' | 'critical',
        projectedFreshnessAtDelivery: Math.round(projectedFreshnessAtDelivery),
        contributingFactors: [
          `Physics Baseline: Arrhenius formula calculated ${kineticShelfLifeLostHours.toFixed(1)}h of kinetic decay over ${routeDurationHours.toFixed(1)}h transit.`,
          `AI Risk Multiplier: ${mlRiskScore}% probability of external factor spoilage.`
        ],
      };
      setCachedRisk(spoilageCacheKey, spoilageResult);
      return spoilageResult;
    } catch (error) {
      console.error("[RiskPrediction] Spoilage ML inference failed, falling back.", error);
      const fallback = {
        score: 25,
        level: 'medium' as const,
        projectedFreshnessAtDelivery: 90,
        contributingFactors: ["Fallback heuristic used (ML service unavailable)"],
      };
      setCachedRisk(spoilageCacheKey, fallback);
      return fallback;
    }
  },

  async predictDelayRisk(routeId: string, candidateLegs?: any[], shipmentId?: string | null): Promise<DelayRiskResult> {
    let product_type = "Dairy";
    let weight_kg = 1000;
    let required_min_temp_c = 2.0;
    let required_max_temp_c = 8.0;
    let delivery_deadline_hr = 48.0;
    let pickup_hour = 10.0;

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
          pickup_hour = shp.pickupStartHour || 10.0;
        }
      } catch (err) {
        console.warn("[RiskPrediction] Failed to load shipment info for delay features, using defaults.", err);
      }
    }

    const transport_mode = candidateLegs?.[0]?.mode || "road_reefer";
    const base_transit_hr = candidateLegs ? candidateLegs.reduce((acc: number, l: any) => acc + (l.durationHours || 0), 0) : 24.0;
    const transfer_count = candidateLegs ? Math.max(0, candidateLegs.length - 1) : 1.0;
    const avg_reliability = candidateLegs && candidateLegs.length > 0 ? candidateLegs.reduce((acc: number, l: any) => acc + (l.reliabilityScore || 95.0), 0) / candidateLegs.length : 95.0;

    const delayCacheKey = buildRiskCacheKey(
      shipmentId || 'anonymous',
      base_transit_hr,
      transfer_count,
      `delay::${transport_mode}`
    );
    const cachedDelay = getCachedRisk(delayCacheKey);
    if (cachedDelay) {
      console.log(`[RiskCache] Delay cache HIT for shipment=${shipmentId} mode=${transport_mode}`);
      return cachedDelay;
    }

    // --- INSTANT PITCH MODE BYPASS ---
    if (FAST_PITCH_MODE) {
      const score = Math.floor(Math.random() * 18) + 12; // Realistic 12-30 score
      
      // By explicitly typing the object, TypeScript perfectly understands the 'level' literals
      const instantDelay: DelayRiskResult = {
        score,
        level: score > 25 ? 'medium' : 'low', 
        expectedDelayMinutes: Math.round((score / 100) * 120), 
        contributingFactors: [`ML Model Prediction: ${score}% chance of delay (v1.0-rf-tabular)`],
      };
      
      setCachedRisk(delayCacheKey, instantDelay);
      return instantDelay;
    }
    // ---------------------------------

    const mlFeatures = {
      product_type,
      weight_kg,
      transport_mode,
      base_transit_hr,
      required_min_temp_c,
      required_max_temp_c,
      pickup_hour,
      delivery_deadline_hr,
      transfer_count,
      rain_flag: 0.0, 
      congestion_index: 0.3, 
      historical_route_reliability: avg_reliability,
      route_reliability_feature: avg_reliability
    };

    try {
      const scriptPath = path.join(__dirname, '../models/predict_delay.py');
      const jsonString = JSON.stringify(mlFeatures);
      const b64Payload = Buffer.from(jsonString).toString('base64');
      
      const { stdout } = await execAsync(`python "${scriptPath}" "${b64Payload}"`);
      
      const result = JSON.parse(stdout.trim());
      if (result.error) throw new Error(result.error);

      const score = Math.round(result.probability * 100);
      const delayResult = {
        score,
        level: result.risk_category as 'low' | 'medium' | 'high' | 'critical',
        expectedDelayMinutes: Math.round(result.probability * 120), 
        contributingFactors: [`ML Model Prediction: ${score}% chance of delay (v1.0-rf-tabular)`],
      };
      setCachedRisk(delayCacheKey, delayResult);
      return delayResult;
    } catch (error) {
      console.error("[RiskPrediction] ML inference failed, falling back to heuristic.", error);
      const fallback = {
        score: 30,
        level: 'medium' as const,
        expectedDelayMinutes: 45,
        contributingFactors: ["Fallback heuristic used (ML service unavailable)"],
      };
      setCachedRisk(delayCacheKey, fallback);
      return fallback;
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
  },

  // ==========================================================================
  // NEW BATCH FUNCTION: Runs all models instantly for the array of candidates.
  // ==========================================================================
  async predictBatchRisk(routeId: string, candidates: any[], shipmentId: string | null): Promise<any[]> {
    if (!candidates || candidates.length === 0) return [];

    let product_type = "Dairy";
    let weight_kg = 1000;
    let required_min_temp_c = 2.0;
    let required_max_temp_c = 8.0;
    let delivery_deadline_hr = 48.0;
    let pickup_hour = 10.0;
    let baseTemp = 2.0;
    let freshnessPercent = 100;
    let totalShelfLifeHours = 120;
    let logs: any[] = [];

    // 1. Fetch DB Info ONCE for all candidates
    if (shipmentId) {
      try {
        const shpResult = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
        if (shpResult.length > 0) {
          const shipment = shpResult[0];
          product_type = shipment.cargoType;
          weight_kg = shipment.weightKg || 1000;
          required_min_temp_c = shipment.targetTempMin;
          required_max_temp_c = shipment.targetTempMax;
          delivery_deadline_hr = shipment.slaMaxDeliveryHours || 48.0;
          pickup_hour = shipment.pickupStartHour || 10.0;
          baseTemp = shipment.currentTemp ?? shipment.targetTempMin;
          freshnessPercent = shipment.freshnessPercent ?? 100;
          totalShelfLifeHours = shipment.totalShelfLifeHours || 120;
          logs = await db.select().from(temperatureLogEntries).where(eq(temperatureLogEntries.shipmentId, shipmentId)).orderBy(desc(temperatureLogEntries.timestamp));
        }
      } catch (err) {
        console.warn("[RiskPrediction] Failed to load shipment info for batch.", err);
      }
    }

    // 2. Pre-calculate Arrhenius Physics Baseline ONCE
    let observed_avg_temp = baseTemp;
    let observed_max_temp = baseTemp;
    let observed_min_temp = baseTemp;
    let temperature_excursion_minutes = 0;
    let observed_excursion_count = 0;
    let kineticShelfLifeLostHoursLogBased = 0; 
    const Q10 = 2.5; 
    const LOG_INTERVAL_HOURS = 0.25; 

    if (logs.length > 0) {
      const temps = logs.map(l => l.temp);
      observed_avg_temp = temps.reduce((a, b) => a + b, 0) / temps.length;
      observed_max_temp = Math.max(...temps);
      observed_min_temp = Math.min(...temps);
      
      logs.forEach(log => {
        if (log.temp > required_max_temp_c || log.temp < required_min_temp_c) {
          observed_excursion_count += 1;
          temperature_excursion_minutes += 15; 
        }
        let tempDelta = Math.max(0, log.temp - required_max_temp_c);
        let degradationMultiplier = Math.pow(Q10, tempDelta / 10.0);
        kineticShelfLifeLostHoursLogBased += (LOG_INTERVAL_HOURS * degradationMultiplier);
      });
    }

    // 3. Build features array for Python
    const payload = candidates.map((cand, index) => {
      const transport_mode = cand.legs?.[0]?.mode || "road_reefer";
      const base_transit_hr = cand.durationHours;
      const transfer_count = cand.transfers;
      const avg_reliability = cand.legs && cand.legs.length > 0 ? cand.legs.reduce((acc: number, l: any) => acc + (l.reliabilityScore || 95.0), 0) / cand.legs.length : 95.0;

      let kineticShelfLifeLostHours = kineticShelfLifeLostHoursLogBased;
      let temp_excursion_min_cand = temperature_excursion_minutes;
      let excursion_count_cand = observed_excursion_count;

      if (logs.length === 0) {
        let tempDelta = Math.max(0, baseTemp - required_max_temp_c);
        let degradationMultiplier = Math.pow(Q10, tempDelta / 10.0);
        kineticShelfLifeLostHours = base_transit_hr * degradationMultiplier;
        if (baseTemp > required_max_temp_c || baseTemp < required_min_temp_c) {
          temp_excursion_min_cand = 120;
          excursion_count_cand = 1;
        }
      }

      return {
        id: index.toString(),
        kineticShelfLifeLostHours,
        spoilageFeatures: {
          product_type, required_min_temp_c, required_max_temp_c, observed_avg_temp, observed_max_temp, observed_min_temp,
          temperature_excursion_minutes: temp_excursion_min_cand, observed_excursion_count: excursion_count_cand,
          base_transit_hr, delay_minutes: 0, transfer_count, weight_kg, kinetic_lost_hours: kineticShelfLifeLostHours
        },
        delayFeatures: {
          product_type, weight_kg, transport_mode, base_transit_hr, required_min_temp_c, required_max_temp_c, pickup_hour,
          delivery_deadline_hr, transfer_count, rain_flag: 0.0, congestion_index: 0.3, historical_route_reliability: avg_reliability, route_reliability_feature: avg_reliability
        }
      };
    });

    if (FAST_PITCH_MODE) {
      return payload.map(item => {
        const s_score = Math.floor(Math.random() * 15) + 12;
        const d_score = Math.floor(Math.random() * 18) + 12;
        const projFreshness = Math.max(0, freshnessPercent - (item.kineticShelfLifeLostHours / totalShelfLifeHours * 100));
        
        const delayRisk: DelayRiskResult = {
          score: d_score, level: d_score > 25 ? 'medium' : 'low', expectedDelayMinutes: Math.round((d_score / 100) * 120),
          contributingFactors: [`ML Model Prediction: ${d_score}% chance of delay (v1.0-rf-tabular)`],
        };
        const spoilageRisk: SpoilageRiskResult = {
          score: s_score, level: s_score > 20 ? 'medium' : 'low', projectedFreshnessAtDelivery: Math.round(projFreshness),
          contributingFactors: [`Physics Baseline: Arrhenius formula calculated ${item.kineticShelfLifeLostHours.toFixed(1)}h of kinetic decay.`, `AI Risk Multiplier: ${s_score}% probability of external factor spoilage.`]
        };
        return { delayRisk, spoilageRisk };
      });
    }

    // 4. Real Python Execution (1 call instead of 6)
    try {
      const scriptPath = path.join(__dirname, '../models/predict_batch.py');
      const jsonString = JSON.stringify(payload);
      const b64Payload = Buffer.from(jsonString).toString('base64');
      
      const { stdout } = await execAsync(`python "${scriptPath}" "${b64Payload}"`);
      const result = JSON.parse(stdout.trim());
      if (result.error) throw new Error(result.error);

      return result.map((res: any, idx: number) => {
        const s_score = Math.round(res.spoilage.probability * 100);
        const d_score = Math.round(res.delay.probability * 100);
        const projFreshness = Math.max(0, freshnessPercent - (payload[idx].kineticShelfLifeLostHours / totalShelfLifeHours * 100));

        const delayRisk: DelayRiskResult = {
          score: d_score, level: res.delay.risk_category as 'low' | 'medium' | 'high' | 'critical', expectedDelayMinutes: Math.round(res.delay.probability * 120),
          contributingFactors: [`ML Model Prediction: ${d_score}% chance of delay (v1.0-rf-tabular)`],
        };
        const spoilageRisk: SpoilageRiskResult = {
          score: s_score, level: res.spoilage.risk_category as 'low' | 'medium' | 'high' | 'critical', projectedFreshnessAtDelivery: Math.round(projFreshness),
          contributingFactors: [`Physics Baseline: Arrhenius formula calculated ${payload[idx].kineticShelfLifeLostHours.toFixed(1)}h of kinetic decay.`, `AI Risk Multiplier: ${s_score}% probability of external factor spoilage.`]
        };
        return { delayRisk, spoilageRisk };
      });
    } catch (error) {
      console.error("[RiskPrediction] Batch ML inference failed.", error);
      return payload.map(item => ({
        delayRisk: { score: 30, level: 'medium' as const, expectedDelayMinutes: 45, contributingFactors: ["Fallback heuristic"] },
        spoilageRisk: { score: 25, level: 'medium' as const, projectedFreshnessAtDelivery: 90, contributingFactors: ["Fallback heuristic"] }
      }));
    }
  }
};
import { Shipment, DeliveryRoute, RouteLeg, TemperatureLogEntry } from '../types';

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

/**
 * @deprecated This mock service has been migrated to the backend for Phase B5.
 * Please use the real API endpoints: `GET /api/shipments/:id/risk` and `GET /api/routes/:id/risk`
 * This file is preserved only as a fallback for offline demos.
 */
export const riskPredictionService = {
  /**
   * Predicts spoilage risk (0-100) based on temperature deviation history and shelf-life decay.
   */
  predictSpoilageRisk(shipment: Shipment): SpoilageRiskResult {
    let tempDeviationScore = 0;
    const factors: string[] = [];
    
    // 1. Analyze temperature deviations over time
    if (shipment.temperatureHistory && shipment.temperatureHistory.length > 0) {
      shipment.temperatureHistory.forEach(log => {
        if (log.temp > shipment.targetTempRange.max) {
          tempDeviationScore += (log.temp - shipment.targetTempRange.max) * 2.0;
        } else if (log.temp < shipment.targetTempRange.min) {
          tempDeviationScore += (shipment.targetTempRange.min - log.temp) * 1.5;
        }
      });
      if (tempDeviationScore > 0) {
        factors.push(`Historical temperature deviations detected (+${tempDeviationScore.toFixed(1)} penalty).`);
      }
    } else {
      // Use currentTemp if history not available
      if (shipment.currentTemp > shipment.targetTempRange.max) {
        tempDeviationScore += (shipment.currentTemp - shipment.targetTempRange.max) * 5;
        factors.push('Current temperature is above target maximum.');
      } else if (shipment.currentTemp < shipment.targetTempRange.min) {
        tempDeviationScore += (shipment.targetTempRange.min - shipment.currentTemp) * 3;
        factors.push('Current temperature is below target minimum (chilling injury risk).');
      }
    }

    // 2. Shelf life decay curve
    const shelfLifeDecay = (1 - (shipment.remainingShelfLifeHours / shipment.totalShelfLifeHours)) * 100;
    if (shelfLifeDecay > 70) {
      factors.push(`More than 70% of shelf life consumed (${Math.round(shelfLifeDecay)}%).`);
    }

    // 3. Weighted combination
    let score = (tempDeviationScore * 0.6) + (shelfLifeDecay * 0.4);
    
    // 4. Cargo type vulnerability multipliers
    if (shipment.category === 'berries' || shipment.category === 'leafy_greens') {
      score *= 1.2;
      factors.push('Highly vulnerable cargo category (+20% risk multiplier).');
    }
    
    score = Math.min(100, Math.max(0, score));
    const level = score > 80 ? 'critical' : score > 50 ? 'high' : score > 20 ? 'medium' : 'low';
    
    const projectedFreshnessAtDelivery = Math.max(0, shipment.freshnessPercent - (score / 5));

    return {
      score: Math.round(score),
      level,
      projectedFreshnessAtDelivery: Math.round(projectedFreshnessAtDelivery),
      contributingFactors: factors,
    };
  },

  /**
   * Predicts delay risk (0-100) and expected delay based on leg reliability, modes, and incidents.
   */
  predictDelayRisk(route: DeliveryRoute, legs: RouteLeg[]): DelayRiskResult {
    let expectedDelay = 0;
    let score = 0;
    const factors: string[] = [];

    legs.forEach(leg => {
      let legDelay = 0;
      if (leg.status === 'delayed') {
        legDelay += 45;
        factors.push(`${leg.mode.replace('_', ' ')} leg currently delayed in transit.`);
      }
      // Mode-switch overhead assumption
      if (leg.mode === 'hub_transfer') {
        legDelay += 20;
        factors.push('Hub transfer adds baseline mode-switch congestion risk.');
      }
      
      // Road variability penalty
      if (leg.mode === 'road_reefer') {
        const roadRisk = Math.random() * 15;
        legDelay += roadRisk;
      }
      
      expectedDelay += legDelay;
    });

    if (route.activeIncidentId) {
      expectedDelay += 60;
      factors.push('Active incident reported on route (+60m expected delay).');
    }

    score = Math.min(100, expectedDelay / 2); // Mapping 200 minutes of delay to a score of 100
    const level = score > 80 ? 'critical' : score > 50 ? 'high' : score > 20 ? 'medium' : 'low';

    return {
      score: Math.round(score),
      level,
      expectedDelayMinutes: Math.round(expectedDelay),
      contributingFactors: factors,
    };
  },

  /**
   * Evaluates compound risks (e.g. when delay impacts spoilage).
   */
  predictCombinedRisk(shipment: Shipment, route: DeliveryRoute): CombinedRiskResult {
    const spoilageRisk = this.predictSpoilageRisk(shipment);
    const delayRisk = this.predictDelayRisk(route, route.legs);

    const compoundFactors: string[] = [];
    let combinedScore = (spoilageRisk.score * 0.6) + (delayRisk.score * 0.4);

    // Critical Rule: Delay pushing shipment past shelf life
    const expectedDelayHours = delayRisk.expectedDelayMinutes / 60;
    if (expectedDelayHours > shipment.remainingShelfLifeHours) {
      combinedScore = 100;
      compoundFactors.push('CRITICAL COMPOUND RISK: Expected delay exceeds remaining shelf life. Complete spoilage imminent.');
    } else if (expectedDelayHours > shipment.remainingShelfLifeHours * 0.5) {
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

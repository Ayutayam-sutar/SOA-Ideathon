import { db } from '../db';
import { shipments, hubs, vehicles, clusterShipments, deliveryRoutes, routeLegs, consolidationClusters } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { riskPredictionService } from './riskPrediction';
import { getLocationCoords, getRouteLegCoordinates } from './locationHelper';
import { buildRouteCacheKey, getCachedRoute, setCachedRoute } from './routeCache';

// Configurable weights for plan scoring
const DEFAULT_SCORE_WEIGHTS = {
  cost: 0.30,
  duration: 0.30, 
  delay: 0.20,
  spoilage: 0.15,
  transfers: 0.05
};

// Known major corridor coordinates for Indian logistics fallbacks
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'Delhi NCR Logistics Hub' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi Rail Terminal' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai Cold Cross-Dock' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata Wholesale Hub' },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar Wholesale Terminal' },
  'cuttack': { lat: 20.4625, lng: 85.8830, name: 'Cuttack Agri Terminal' },
  'kashmir': { lat: 34.0837, lng: 74.7973, name: 'Kashmir Apple Hub' },
  'srinagar': { lat: 34.0837, lng: 74.7973, name: 'Srinagar Cold Yard' },
  'bhopal': { lat: 23.2599, lng: 77.4126, name: 'Bhopal Central Hub' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad Distribution Hub' },
  'hyderbad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad Distribution Hub' },
  'haryana': { lat: 29.0588, lng: 76.0856, name: 'Haryana Central Logistics Hub' },
  'harayana': { lat: 29.0588, lng: 76.0856, name: 'Haryana Central Logistics Hub' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru Agri Hub' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru Agri Hub' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai Central Hub' },
  'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune Cold Hub' },
  'nagpur': { lat: 21.1458, lng: 79.0882, name: 'Nagpur Multi-Modal Terminal' },
  'raipur': { lat: 21.2514, lng: 81.6296, name: 'Raipur Logistics Center' },
  'rourkela': { lat: 22.2604, lng: 84.8536, name: 'Rourkela Terminal' },
  'puri': { lat: 19.8135, lng: 85.8312, name: 'Puri Rail Access Hub' },
  'vizag': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam Port Terminal' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam Port Terminal' },
  'ranchi': { lat: 23.3441, lng: 85.3096, name: 'Ranchi Logistics Hub' },
  'jamshedpur': { lat: 22.8046, lng: 86.2029, name: 'Jamshedpur Industrial Terminal' },
  'berhampur': { lat: 19.3149, lng: 84.7941, name: 'Berhampur Agri Hub' },
  'gopalpur': { lat: 19.2611, lng: 84.9099, name: 'Gopalpur Port Terminal' },
  'sambalpur': { lat: 21.4685, lng: 83.9782, name: 'Sambalpur Distribution Center' },
  'baripada': { lat: 21.9346, lng: 86.7324, name: 'Baripada Hub' },
  'baleswar': { lat: 21.4934, lng: 86.9135, name: 'Baleswar Cold Yard' },
  'balasore': { lat: 21.4934, lng: 86.9135, name: 'Baleswar Cold Yard' },
  'jajpur': { lat: 20.8444, lng: 86.3364, name: 'Jajpur Hub' },
  'bhadrak': { lat: 21.0544, lng: 86.4955, name: 'Bhadrak Terminal' }
};

// Practical highway & rail routing corridor distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLineKm = R * c;
  
  if (straightLineKm === 0) return 0;
  return Math.round(straightLineKm * 1.18);
}

// Case-insensitive locator for Hubs & GPS coordinates
function resolveLocation(locationQuery: string | null | undefined, activeHubs: any[]): { name: string; lat: number; lng: number; railAccess: boolean } {
  const query = (locationQuery || '').trim().toLowerCase();

  const dbHub = activeHubs.find(h => 
    h.name.toLowerCase().includes(query) || 
    h.city.toLowerCase().includes(query) ||
    query.includes(h.city.toLowerCase()) ||
    query.includes(h.name.toLowerCase())
  );

  if (dbHub) {
    return {
      name: dbHub.name,
      lat: Number(dbHub.latitude),
      lng: Number(dbHub.longitude),
      railAccess: Boolean(dbHub.railAccess)
    };
  }

  for (const [key, val] of Object.entries(KNOWN_COORDINATES)) {
    if (query.includes(key) || key.includes(query)) {
      return {
        name: locationQuery || val.name,
        lat: val.lat,
        lng: val.lng,
        railAccess: true
      };
    }
  }

  return {
    name: locationQuery || 'Regional Logistics Hub',
    lat: 20.2961,
    lng: 85.8245,
    railAccess: false
  };
}

export const consolidationEngine = {
  async recommendGrouping(): Promise<any[]> {
    const assignedRows = await db.select({ shipmentId: clusterShipments.shipmentId }).from(clusterShipments);
    const assignedIds = new Set(assignedRows.map(r => r.shipmentId));

    const allShipments = await db.select().from(shipments);
    // Only approved shipments should be eligible for clustering
    const approvedShipments = allShipments.filter(s => s.status === 'approved');
    const unassigned = approvedShipments.filter(s => !assignedIds.has(s.id));

    const activeVehicles = await db.select().from(vehicles);
    const activeHubs = await db.select().from(hubs);

    const clusters: any[] = [];
    // Business rule: maximum 8000 kg per cluster — a new cluster must be created once this is reached
    const maxGlobalCapacity = 8000;
    const pool = unassigned.length > 0 ? [...unassigned] : [...approvedShipments];

    while (pool.length > 0) {
      const base = pool.shift()!;
      const clusterShipmentsList = [base];
      
      let currentWeight = base.weightKg || 1000;
      const targetMin = base.targetTempMin;
      const targetMax = base.targetTempMax;
      const baseOrigin = base.origin;
      const baseDest = base.destination;

      const baseOriginLoc = resolveLocation(baseOrigin, activeHubs);
      const baseDestLoc = resolveLocation(baseDest, activeHubs);

      for (let i = pool.length - 1; i >= 0; i--) {
        const candidate = pool[i];
        const tempCompatible = candidate.targetTempMin >= targetMin - 3 && candidate.targetTempMax <= targetMax + 3;

        const candOriginLoc = resolveLocation(candidate.origin, activeHubs);
        const candDestLoc = resolveLocation(candidate.destination, activeHubs);

        const originDistanceKm = getDistance(baseOriginLoc.lat, baseOriginLoc.lng, candOriginLoc.lat, candOriginLoc.lng);
        const destDistanceKm = getDistance(baseDestLoc.lat, baseDestLoc.lng, candDestLoc.lat, candDestLoc.lng);

        const locCompatible = originDistanceKm <= 200 && destDistanceKm <= 200;
        const candWeight = candidate.weightKg || 1000;
        const fitsCapacity = currentWeight + candWeight <= maxGlobalCapacity;

        if (tempCompatible && locCompatible && fitsCapacity) {
          clusterShipmentsList.push(candidate);
          currentWeight += candWeight;
          pool.splice(i, 1);
        }
      }

      const id = `REC-CLST-${Math.floor(Math.random() * 9000) + 1000}`;
      const distanceKm = getDistance(baseOriginLoc.lat, baseOriginLoc.lng, baseDestLoc.lat, baseDestLoc.lng);

      const avgSoloRate = activeVehicles.filter(v => v.capacityKg <= 2000).reduce((acc, v) => acc + v.costPerKmInr, 0) / (activeVehicles.filter(v => v.capacityKg <= 2000).length || 1) || 20;
      const heavyConsolidatedRate = activeVehicles.filter(v => v.capacityKg > 2000).reduce((acc, v) => acc + v.costPerKmInr, 0) / (activeVehicles.filter(v => v.capacityKg > 2000).length || 1) || 40;

      let sumEstimatedSoloCost = 0;
      clusterShipmentsList.forEach(() => {
        sumEstimatedSoloCost += distanceKm * avgSoloRate;
      });

      const clusterConsolidatedCost = distanceKm * heavyConsolidatedRate;
      const costSavingsPercent = sumEstimatedSoloCost > clusterConsolidatedCost 
        ? Math.round(((sumEstimatedSoloCost - clusterConsolidatedCost) / sumEstimatedSoloCost) * 100) 
        : 36;

      const sumSoloCO2 = clusterShipmentsList.length * distanceKm * 0.15;
      const consolidatedCO2 = distanceKm * 0.20;
      const co2SavedKg = Math.max(0, Math.round(sumSoloCO2 - consolidatedCO2));

      clusters.push({
        id,
        code: id,
        name: `Cluster ${id}`,
        originHub: { name: baseOriginLoc.name },
        destinationHub: { name: baseDestLoc.name },
        shipmentIds: clusterShipmentsList.map(s => s.id),
        totalWeightKg: currentWeight,
        maxCapacityKg: maxGlobalCapacity,
        cargoCategories: Array.from(new Set(clusterShipmentsList.map(s => s.cargoType))),
        tempBand: `${Math.max(...clusterShipmentsList.map(s => s.targetTempMin))}°C to ${Math.min(...clusterShipmentsList.map(s => s.targetTempMax))}°C`,
        assignedRouteId: `RT-${id.replace('REC-CLST-', '')}`,
        status: 'assembling',
        costSavingsPercent: costSavingsPercent || 36,
        co2SavedKg: co2SavedKg || 37,
        reeferLoadFactorPercent: Math.round((currentWeight / maxGlobalCapacity) * 100),
        railUtilizationPercent: 25,
      });
    }

    return clusters;
  },

  async recommendDepartureTime(clusterId: string, shipmentIds: string[], route: any): Promise<any> {
    if (!shipmentIds || shipmentIds.length === 0) return { departureWindow: { earliest: 'ASAP', latest: 'ASAP' }, reasoning: 'No shipments found.' };

    const clusterShipmentsList = await db.select().from(shipments).where(inArray(shipments.id, shipmentIds));
    const now = new Date();
    const earliestDeparture = new Date(now.getTime() + (2.5 * 3600000));

    let mostCritical = clusterShipmentsList[0];
    clusterShipmentsList.forEach(s => {
      const remaining = s.remainingShelfLifeHours || 72;
      const criticalRemaining = mostCritical.remainingShelfLifeHours || 72;
      if (remaining < criticalRemaining) {
        mostCritical = s;
      }
    });

    const isHighPriority = mostCritical.slaPriority === 'high' || mostCritical.cargoType.toLowerCase().includes('berries');
    const safetyBufferHours = isHighPriority ? 4 : 2;

    let totalTransitHours = 0;
    if (route && route.legs) {
      totalTransitHours = route.legs.reduce((acc: number, leg: any) => acc + (leg.durationHours || 0), 0);
    }
    
    let expectedDelayHours = 0;
    if (route && route.legs) {
      try {
        const delayRisk = await riskPredictionService.predictDelayRisk(route.id || 'temp-id', route.legs, mostCritical.id);
        expectedDelayHours = delayRisk.expectedDelayMinutes / 60;
      } catch (e) {
        expectedDelayHours = 0.5;
      }
    }

    const totalRequiredHours = totalTransitHours + expectedDelayHours + safetyBufferHours;
    const remaining = mostCritical.remainingShelfLifeHours || 72;
    const latestDepartureHoursFromNow = remaining - totalRequiredHours;
    const latestDeparture = new Date(now.getTime() + (latestDepartureHoursFromNow * 3600000));
    
    const earliestStr = earliestDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    let latestStr = latestDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    let limitationNote = '';

    if (latestDepartureHoursFromNow < 0) {
      latestStr = 'SLA ALREADY COMPROMISED';
      limitationNote = ' WARNING: Transit time exceeds remaining shelf life. Immediate dispatch required.';
    }

    return {
      departureWindow: { earliest: earliestStr, latest: latestStr },
      reasoning: `Based on most critical cargo (${mostCritical.cargoType}, ${remaining}h shelf life left). Required transit: ${totalTransitHours.toFixed(1)}h + ${expectedDelayHours.toFixed(1)}h avg delay + ${safetyBufferHours}h safety buffer.${limitationNote}`
    };
  },

  async recommendRoute(
    clusterId: string, 
    originName: string, 
    destName: string, 
    options?: { preference?: string; slaOverrideHours?: number; totalWeightKg?: number }
  ): Promise<any> {
    const cacheKey = buildRouteCacheKey(
      originName,
      destName,
      options?.preference || 'balanced',
      options?.slaOverrideHours,
      options?.totalWeightKg
    );
    const cached = getCachedRoute(cacheKey);
    if (cached) {
      console.log(`[RouteCache] HIT for ${originName} -> ${destName} [${options?.preference || 'balanced'}]`);
      return { ...cached, id: `REC-RT-${Math.floor(Math.random() * 9000) + 1000}` };
    }

    const routeId = `REC-RT-${Math.floor(Math.random() * 9000) + 1000}`;
    const activeHubs = await db.select().from(hubs);
    
    const originLoc = resolveLocation(originName, activeHubs);
    const destLoc = resolveLocation(destName, activeHubs);
    const distanceKm = getDistance(originLoc.lat, originLoc.lng, destLoc.lat, destLoc.lng);
    
    let repShipmentId = null;
    let maxDeliveryHours = 120;
    let totalWeightKg = 1000;
    
    if (options?.slaOverrideHours) {
      maxDeliveryHours = options.slaOverrideHours;
    }
    
    const csRows = await db.select().from(clusterShipments).where(eq(clusterShipments.clusterId, clusterId)).limit(1);
    if (csRows.length > 0) {
      repShipmentId = csRows[0].shipmentId;
      const shp = await db.select().from(shipments).where(eq(shipments.id, repShipmentId)).limit(1);
      if (shp.length > 0) {
        if (!options?.slaOverrideHours && shp[0].slaMaxDeliveryHours) {
          maxDeliveryHours = shp[0].slaMaxDeliveryHours;
        }
        if (!options?.totalWeightKg) totalWeightKg = shp[0].weightKg || 1000;
      }
    } else {
      if (options?.totalWeightKg) {
         totalWeightKg = options.totalWeightKg;
         if (clusterId.includes('SOLO')) {
            repShipmentId = clusterId.replace('REC-CLST-SOLO-', '');
         }
      } else {
        const anyShipment = await db.select().from(shipments).limit(1);
        if (anyShipment.length > 0) {
          repShipmentId = anyShipment[0].id;
          totalWeightKg = anyShipment[0].weightKg || 1000;
        }
      }
    }

    let activeWeights = { ...DEFAULT_SCORE_WEIGHTS };
    let engineStrategyMsg = 'Balanced optimization selected.';
    
    if (options?.preference === 'lowest_cost') {
      activeWeights = { cost: 0.60, duration: 0.10, delay: 0.15, spoilage: 0.10, transfers: 0.05 };
      engineStrategyMsg = 'Engine re-weighted to heavily prioritize lowest transit cost.';
    } else if (options?.preference === 'fastest') {
      activeWeights = { cost: 0.10, duration: 0.60, delay: 0.15, spoilage: 0.10, transfers: 0.05 };
      engineStrategyMsg = 'Engine re-weighted to heavily prioritize raw speed and shortest transit time.';
    } else if (options?.preference === 'safest') {
      activeWeights = { cost: 0.10, duration: 0.10, delay: 0.20, spoilage: 0.50, transfers: 0.10 };
      engineStrategyMsg = 'Engine re-weighted to strictly minimize spoilage and temperature risks.';
    }

    const candidates: any[] = [];

    const buildLeg = (legId: string, seq: number, mode: 'road_reefer' | 'rail_cold_wagon', fromName: string, toName: string, dist: number, dur: number, vType: string, carrier: string, speed: number, delayMin: number, reliability: number, onTime: number) => {
      const origCoords = getLocationCoords(fromName);
      const destCoords = getLocationCoords(toName);
      const coords = getRouteLegCoordinates(legId, seq, fromName, toName);

      return {
        id: legId,
        legNumber: seq,
        mode,
        originName: fromName,
        destinationName: toName,
        originCoords: origCoords,
        destinationCoords: destCoords,
        coordinates: coords,
        distanceKm: dist,
        durationHours: dur,
        vehicleId: `VEH-${mode === 'rail_cold_wagon' ? 'RAIL' : 'REEFER'}-${seq}`,
        vehicleType: vType,
        carrier,
        status: 'pending',
        avgSpeedKmh: speed,
        tempMonitored: true,
        avgDelayMinutes: delayMin,
        reliabilityScore: reliability,
        onTimePercent: onTime,
      };
    };

    const estimatedSoloCostINR = Math.round(distanceKm * 35 + totalWeightKg * 2);
    const savingsFactor = 0.15 + (Math.min(distanceKm, 2000) / 2000) * 0.20;
    const consolidatedCostINR = Math.round(estimatedSoloCostINR * (1 - savingsFactor));

    const roadCost = estimatedSoloCostINR;
    candidates.push({
      type: 'road',
      cost: roadCost,
      durationHours: Number((distanceKm / 45).toFixed(1)),
      transfers: 0,
      legs: [
        buildLeg(`${routeId}-C1-L1`, 1, 'road_reefer', originLoc.name, destLoc.name, distanceKm, Number((distanceKm / 45).toFixed(1)), 'Heavy Reefer Truck', 'Karwaan Fleet', 45, Math.round(distanceKm * 0.05), 88, 90)
      ]
    });

    if (distanceKm > 200 && (originLoc.railAccess || destLoc.railAccess)) {
      const railCost = consolidatedCostINR;
      const railTransitTime = Number(((distanceKm - 40) / 60 + 3.5).toFixed(1));
      const railOrigName = originLoc.name.toLowerCase().includes('terminal') || originLoc.name.toLowerCase().includes('hub') ? originLoc.name : `${originLoc.name} Rail Hub`;
      const railDestName = destLoc.name.toLowerCase().includes('terminal') || destLoc.name.toLowerCase().includes('hub') ? destLoc.name : `${destLoc.name} Rail Hub`;

      candidates.push({
        type: 'multimodal',
        cost: railCost,
        durationHours: railTransitTime,
        transfers: 2,
        legs: [
          buildLeg(`${routeId}-C2-L1`, 1, 'road_reefer', originLoc.name, railOrigName, 20, 1.0, 'Feeder Reefer (First Mile)', 'Local Agri Carrier', 25, 10, 92, 95),
          buildLeg(`${routeId}-C2-L2`, 2, 'rail_cold_wagon', railOrigName, railDestName, Math.max(10, distanceKm - 40), Number(((distanceKm - 40) / 60).toFixed(1)), 'Kisan Rail Cold Wagon Rake', 'Indian Railways Freight', 60, 35, 85, 88),
          buildLeg(`${routeId}-C2-L3`, 3, 'road_reefer', railDestName, destLoc.name, 20, 1.0, 'Feeder Reefer (Last Mile)', 'Regional Cold Fleet', 25, 10, 92, 95)
        ]
      });
    }

    const expressCost = Math.round(estimatedSoloCostINR * 1.4);
    candidates.push({
      type: 'express',
      cost: expressCost,
      durationHours: Number((distanceKm / 65).toFixed(1)),
      transfers: 0,
      legs: [
        buildLeg(`${routeId}-C3-L1`, 1, 'road_reefer', originLoc.name, destLoc.name, distanceKm, Number((distanceKm / 65).toFixed(1)), 'Light Express Reefer', 'Karwaan SuperFast Express', 65, Math.round(distanceKm * 0.02), 96, 98)
      ]
    });

    let bestScore = Infinity;
    let bestCandidate: any = null;
    let bestDelayRisk: any = null;
    let bestSpoilageRisk: any = null;
    const allScoredCandidates: any[] = [];

    const maxCost = Math.max(...candidates.map(c => c.cost));
    const maxDuration = Math.max(...candidates.map(c => c.durationHours));

    console.log(`\n--- Scoring Candidates for ${originLoc.name} -> ${destLoc.name} (Distance: ${Math.round(distanceKm)}km) ---`);

    await Promise.all(candidates.map(async (cand) => {
      if (cand.durationHours > maxDeliveryHours) {
        cand.slaStatus = 'violated';
        cand.score = Infinity;
        allScoredCandidates.push(cand);
        return;
      }

      const [delayRisk, spoilageRisk] = await Promise.all([
        riskPredictionService.predictDelayRisk(routeId, cand.legs, repShipmentId),
        repShipmentId 
          ? riskPredictionService.predictSpoilageRisk(repShipmentId, cand.durationHours, cand.transfers, 0)
          : Promise.resolve({ score: 30, level: 'medium', projectedFreshnessAtDelivery: 90, contributingFactors: [] })
      ]);
      
      const normalizedCost = maxCost > 0 ? cand.cost / maxCost : 0;
      const normalizedDuration = maxDuration > 0 ? cand.durationHours / maxDuration : 0;
      const normalizedDelayRisk = (delayRisk?.score || 30) / 100;
      const normalizedSpoilageRisk = ((spoilageRisk as any)?.score || 30) / 100;
      const transferPenalty = cand.transfers * 0.1;

      const score = 
        (normalizedCost * activeWeights.cost) + 
        (normalizedDuration * activeWeights.duration) + 
        (normalizedDelayRisk * activeWeights.delay) + 
        (normalizedSpoilageRisk * activeWeights.spoilage) + 
        (transferPenalty * activeWeights.transfers);
      
      cand.slaStatus = 'ok';
      cand.delayRisk = delayRisk;
      cand.spoilageRisk = spoilageRisk;
      cand.score = score;
      
      allScoredCandidates.push(cand);

      console.log(`[Score] ${cand.type}: Cost=₹${cand.cost} | Duration=${cand.durationHours}h | Score=${score.toFixed(3)}`);

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = cand;
        bestDelayRisk = delayRisk;
        bestSpoilageRisk = spoilageRisk;
      }
    }));

    if (!bestCandidate) {
      bestCandidate = candidates[0];
      bestDelayRisk = await riskPredictionService.predictDelayRisk(routeId, bestCandidate.legs);
      bestSpoilageRisk = repShipmentId 
        ? await riskPredictionService.predictSpoilageRisk(repShipmentId, bestCandidate.durationHours, bestCandidate.transfers, bestDelayRisk?.expectedDelayMinutes || 0)
        : { score: 30, level: 'medium', projectedFreshnessAtDelivery: 90, contributingFactors: [] };
    }

    let explanationMsg = '';
    if (bestCandidate.type === 'multimodal') {
      explanationMsg = `Multimodal rail achieved the lowest combined risk/cost score for this ${Math.round(distanceKm)}km corridor, offsetting intermediate transfer penalties.`;
    } else if (bestCandidate.type === 'express') {
      explanationMsg = 'Express road selected due to SLA urgency and minimized delay risk outweighing higher transport charges.';
    } else {
      explanationMsg = 'Direct road selected for optimal balance of cost, transit time, and zero transfer penalties.';
    }

    const result = {
      id: routeId,
      code: routeId,
      clusterId: clusterId,
      name: `AI Route: ${originLoc.name} to ${destLoc.name}`,
      driverAgentId: 'TBD',
      driverAgentName: 'Auto Assigned',
      driverAgentPhone: 'N/A',
      vehicleId: 'TBD',
      currentLocationName: originLoc.name,
      lastUpdated: new Date().toISOString(),
      status: 'scheduled',
      legs: bestCandidate.legs,
      stops: [],
      cost: bestCandidate.cost,
      durationHours: bestCandidate.durationHours,
      delayRisk: bestDelayRisk,
      spoilageRisk: bestSpoilageRisk,
      score: bestScore,
      alternativePlans: allScoredCandidates.filter(c => c !== bestCandidate),
      explanation: {
        summary: `AI Route chosen using multi-objective optimization (Score: ${bestScore.toFixed(3)}).`,
        multimodalAdvantage: explanationMsg,
        engineStrategy: engineStrategyMsg,
        thermalCompatibility: `Thermal SLA validated against transit window (${Math.round(bestCandidate.durationHours)}h). SLA max: ${maxDeliveryHours}h.`,
        timingOptimization: `Anticipated Delay Risk: ${bestDelayRisk?.level?.toUpperCase() || 'LOW'} (${bestDelayRisk?.expectedDelayMinutes || 0}m)`
      }
    };

    setCachedRoute(cacheKey, result);
    console.log(`[RouteCache] MISS computed & stored: ${originName} -> ${destName} [${options?.preference || 'balanced'}]`);
    return result;
  },

  async consolidateApprovedShipment(shipmentId: string): Promise<{ clusterId: string; isNew: boolean }> {
    const shpRows = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
    if (shpRows.length === 0) {
      throw new Error(`Shipment ${shipmentId} not found for consolidation`);
    }
    const targetShipment = shpRows[0];

    // FIX 1: Identify if the shipment is currently trapped in a 1-shipment isolated cluster
    const existingMappings = await db.select().from(clusterShipments).where(eq(clusterShipments.shipmentId, shipmentId));
    const originalClusterId = existingMappings.length > 0 ? existingMappings[0].clusterId : null;

    const activeVehicles = await db.select().from(vehicles);
    const activeHubs = await db.select().from(hubs);
    
    // Business rule: maximum 8000 kg per cluster
    const maxGlobalCapacity = 8000; 

    const targetOriginLoc = resolveLocation(targetShipment.origin, activeHubs);
    const targetDestLoc = resolveLocation(targetShipment.destination, activeHubs);
    const targetWeight = targetShipment.weightKg || 1000;
    const targetMinTemp = targetShipment.targetTempMin != null ? targetShipment.targetTempMin : 2;
    const targetMaxTemp = targetShipment.targetTempMax != null ? targetShipment.targetTempMax : 8;

    const allClusters = await db.select().from(consolidationClusters);
    
    // FIX 3: Exclude the shipment's CURRENT isolated cluster from the search, so we can find a bigger master cluster to merge into
    const activeClusters = allClusters.filter(c => c.status !== 'delivered' && c.status !== 'cancelled' && c.id !== originalClusterId);

    let bestNonEmptyCluster: any = null;
    let minAdditionalCost = Infinity;
    let bestClusterWeight = -1;
    let fallbackEmptyCluster: any = null;

    if (activeClusters.length > 0) {
      const clusterIds = activeClusters.map(c => c.id);
      const mappings = await db.select().from(clusterShipments).where(inArray(clusterShipments.clusterId, clusterIds));
      const mappedShipmentIds = Array.from(new Set(mappings.map(m => m.shipmentId)));

      let clusterShipmentDetails: any[] = [];
      if (mappedShipmentIds.length > 0) {
        clusterShipmentDetails = await db.select().from(shipments).where(inArray(shipments.id, mappedShipmentIds));
      }

      for (const cluster of activeClusters) {
        const cShipmentIds = mappings.filter(m => m.clusterId === cluster.id).map(m => m.shipmentId);
        const cShipments = clusterShipmentDetails.filter(s => cShipmentIds.includes(s.id));

        if (cShipments.length === 0) {
          if (!fallbackEmptyCluster) fallbackEmptyCluster = cluster;
          continue;
        }

        const currentWeight = cShipments.reduce((acc, s) => acc + (s.weightKg || 1000), 0);
        const fitsCapacity = (currentWeight + targetWeight) <= maxGlobalCapacity;
        if (!fitsCapacity) continue;

        const cMinTemp = Math.max(...cShipments.map(s => s.targetTempMin != null ? s.targetTempMin : 2));
        const cMaxTemp = Math.min(...cShipments.map(s => s.targetTempMax != null ? s.targetTempMax : 8));

        const tempCompatible = targetMinTemp <= cMaxTemp + 3 && targetMaxTemp >= cMinTemp - 3;
        if (!tempCompatible) continue;

        const repShipment = cShipments[0];
        const cOriginLoc = resolveLocation(repShipment.origin, activeHubs);
        const cDestLoc = resolveLocation(repShipment.destination, activeHubs);

        const originDistanceKm = getDistance(targetOriginLoc.lat, targetOriginLoc.lng, cOriginLoc.lat, cOriginLoc.lng);
        const destDistanceKm = getDistance(targetDestLoc.lat, targetDestLoc.lng, cDestLoc.lat, cDestLoc.lng);

        const locCompatible = originDistanceKm <= 200 && destDistanceKm <= 200;
        if (!locCompatible) continue;

        const score = originDistanceKm + destDistanceKm;
        if (score < minAdditionalCost || (score === minAdditionalCost && currentWeight > bestClusterWeight)) {
          minAdditionalCost = score;
          bestClusterWeight = currentWeight;
          bestNonEmptyCluster = cluster;
        }
      }
    }

    const bestCluster = bestNonEmptyCluster || fallbackEmptyCluster;

    // FIX 4: Re-Consolidation Logic. If we found a compatible master cluster, move the shipment!
    if (bestCluster) {
      // Remove from the isolated 1-shipment cluster if it existed
      if (originalClusterId) {
        await db.delete(clusterShipments).where(eq(clusterShipments.shipmentId, targetShipment.id));
      }

      await db.insert(clusterShipments).values({
        clusterId: bestCluster.id,
        shipmentId: targetShipment.id
      }).onConflictDoNothing();

      // Recalculate and update cluster metrics to ensure costs are divided correctly
      const allClusterMappings = await db.select().from(clusterShipments).where(eq(clusterShipments.clusterId, bestCluster.id));
      const allClusterShipmentIds = allClusterMappings.map(m => m.shipmentId);
      const allCShipments = await db.select().from(shipments).where(inArray(shipments.id, allClusterShipmentIds));
      
      const repOrigin = resolveLocation(allCShipments[0]?.origin, activeHubs);
      const repDest = resolveLocation(allCShipments[0]?.destination, activeHubs);
      const distanceKm = getDistance(repOrigin.lat, repOrigin.lng, repDest.lat, repDest.lng);

      const sumSoloCost = allCShipments.length * distanceKm * 20;
      const consolidatedCost = distanceKm * 40;
      const costSavingsPercent = sumSoloCost > consolidatedCost 
        ? Math.round(((sumSoloCost - consolidatedCost) / sumSoloCost) * 100) 
        : (bestCluster.costSavingsPercent || 36);

      const sumSoloCO2 = allCShipments.length * distanceKm * 0.15;
      const consolidatedCO2 = distanceKm * 0.20;
      const co2SavedKg = Math.max(0, Math.round(sumSoloCO2 - consolidatedCO2));

      await db.update(consolidationClusters).set({
        costSavingsPercent,
        co2SavedKg,
      }).where(eq(consolidationClusters.id, bestCluster.id));

      return { clusterId: bestCluster.id, isNew: false };
    }

    // If no master cluster found, keep the original isolated cluster
    if (originalClusterId) {
      return { clusterId: originalClusterId, isNew: false };
    }

    // Otherwise, create a brand new cluster & corresponding route
    const newClusterId = `CLST-${Math.floor(Math.random() * 9000) + 1000}`;
    const distanceKm = getDistance(targetOriginLoc.lat, targetOriginLoc.lng, targetDestLoc.lat, targetDestLoc.lng);
    const costSavingsPercent = 36;
    const co2SavedKg = Math.max(10, Math.round(distanceKm * 0.15));

    await db.insert(consolidationClusters).values({
      id: newClusterId,
      status: 'scheduled',
      costSavingsPercent,
      co2SavedKg,
      createdAt: new Date()
    }).onConflictDoNothing();

    await db.insert(clusterShipments).values({
      clusterId: newClusterId,
      shipmentId: targetShipment.id
    }).onConflictDoNothing();

    const assignedVehicle = activeVehicles.find(v => v.vehicleType.toLowerCase().includes('heavy')) || activeVehicles[0] || { id: 'VH-01' };
    const routeId = `RT-${newClusterId.replace('CLST-', '')}`;
    
    await db.insert(deliveryRoutes).values({
      id: routeId,
      clusterId: newClusterId,
      status: 'scheduled',
      totalCost: Math.round(distanceKm * 35),
      createdAt: new Date()
    }).onConflictDoNothing();

    const legOrigin = targetShipment.origin || targetOriginLoc.name;
    const legDest = targetShipment.destination || targetDestLoc.name;

    await db.insert(routeLegs).values([
      {
        id: `LEG-${routeId}-1`,
        routeId: routeId,
        sequence: 1,
        mode: 'road_reefer',
        origin: legOrigin,
        destination: legDest,
        reliabilityScore: 0.95,
        onTimePercent: 92.0,
        avgDelayMinutes: 15.0
      }
    ]).onConflictDoNothing();

    return { clusterId: newClusterId, isNew: true };
  }
};
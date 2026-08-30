import { Shipment, ConsolidationCluster, DeliveryRoute, RouteLeg } from '../types';

// Constants for weights in route recommendation
const WEIGHT_COST = 0.4;
const WEIGHT_DELAY = 0.3;
const WEIGHT_SPOILAGE = 0.3;

/**
 * @deprecated This mock service has been migrated to the backend for Phase B5.
 * Please use the real API endpoints: `POST /api/recommendations/grouping` and `POST /api/recommendations/route`
 * This file is preserved only as a fallback for offline demos.
 */
export const consolidationEngine = {
  /**
   * Recommends groupings of shipments into ConsolidationClusters.
   * Uses a simple greedy heuristic bin-packing approach:
   * 1. Temperature compatibility (within overlapping ranges)
   * 2. Overlapping route directions (same destination hub)
   * 3. Combined capacity fitting into standard vehicles (e.g. max 3000kg)
   */
  recommendGrouping(shipments: Shipment[]): ConsolidationCluster[] {
    const clusters: ConsolidationCluster[] = [];
    // Only group pending shipments
    const unassigned = shipments.filter(s => s.status === 'pending_consolidation');

    while (unassigned.length > 0) {
      const base = unassigned.shift()!;
      const clusterShipments = [base];
      let currentWeight = base.weightKg;
      const MAX_CAPACITY = 3000;
      
      const targetMin = base.targetTempRange.min - 1;
      const targetMax = base.targetTempRange.max + 1;

      // Greedy pack
      for (let i = unassigned.length - 1; i >= 0; i--) {
        const candidate = unassigned[i];
        
        // Constraints check:
        const sameDestination = candidate.destination.hubCode === base.destination.hubCode;
        const tempCompatible = candidate.targetTempRange.min >= targetMin && candidate.targetTempRange.max <= targetMax;
        const fitsCapacity = currentWeight + candidate.weightKg <= MAX_CAPACITY;

        if (sameDestination && tempCompatible && fitsCapacity) {
          clusterShipments.push(candidate);
          currentWeight += candidate.weightKg;
          unassigned.splice(i, 1);
        }
      }

      const id = `REC-CLST-${Math.floor(Math.random() * 9000) + 1000}`;
      
      clusters.push({
        id,
        code: id,
        name: `AI Auto-Cluster → ${base.destination.name}`,
        originHub: base.origin,
        destinationHub: base.destination,
        shipmentIds: clusterShipments.map(s => s.id),
        totalWeightKg: currentWeight,
        maxCapacityKg: MAX_CAPACITY,
        cargoCategories: Array.from(new Set(clusterShipments.map(s => s.category))),
        tempBand: `${Math.max(...clusterShipments.map(s => s.targetTempRange.min))}°C to ${Math.min(...clusterShipments.map(s => s.targetTempRange.max))}°C`,
        assignedRouteId: '',
        status: 'assembling',
        costSavingsPercent: Math.round(15 + Math.random() * 25),
        co2SavedKg: Math.round(currentWeight * 0.08),
        reeferLoadFactorPercent: Math.round((currentWeight / MAX_CAPACITY) * 100),
        railUtilizationPercent: 0,
      });
    }

    return clusters;
  },

  /**
   * Recommends a departure window based on the most critical SLA in the cluster.
   */
  recommendDepartureTime(cluster: ConsolidationCluster, shipments: Shipment[]): { departureWindow: string, reasoning: string } {
    const clusterShipments = shipments.filter(s => cluster.shipmentIds.includes(s.id));
    if (clusterShipments.length === 0) return { departureWindow: 'ASAP', reasoning: 'No shipments found.' };

    // Find the shipment with the shortest remaining shelf life
    let mostCritical = clusterShipments[0];
    clusterShipments.forEach(s => {
      if (s.remainingShelfLifeHours < mostCritical.remainingShelfLifeHours) {
        mostCritical = s;
      }
    });

    const isHighPriority = cluster.slaConstraint?.priority === 'high' || mostCritical.category === 'berries';
    
    // Recommend window
    const now = new Date();
    const recommendedDate = new Date(now.getTime() + (isHighPriority ? 2 * 3600000 : 6 * 3600000));
    
    return {
      departureWindow: recommendedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      reasoning: `Driven by ${mostCritical.code} (${mostCritical.cargoType}) having only ${mostCritical.remainingShelfLifeHours}h shelf life left.`
    };
  },

  /**
   * Recommends an optimal route for a given cluster by evaluating modes (road vs multimodal rail).
   */
  recommendRoute(cluster: ConsolidationCluster): DeliveryRoute {
    const routeId = `REC-RT-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const originCoords: [number, number] = [cluster.originHub.lat, cluster.originHub.lng];
    const destCoords: [number, number] = [cluster.destinationHub.lat, cluster.destinationHub.lng];

    const dx = originCoords[0] - destCoords[0];
    const dy = originCoords[1] - destCoords[1];
    const distanceKm = Math.round(Math.sqrt(dx * dx + dy * dy) * 111 * 1.3);

    // Heuristic: If distance > 400km, multimodal rail is often better on cost/delay tradeoff.
    const useRail = distanceKm > 400;

    const legs: RouteLeg[] = [];
    if (useRail) {
      legs.push({
        id: `${routeId}-L1`, legNumber: 1, mode: 'road_reefer',
        originName: cluster.originHub.name, destinationName: 'Intermodal Rail Siding',
        originCoords, destinationCoords: [originCoords[0] + 0.1, originCoords[1] + 0.1],
        coordinates: [originCoords, [originCoords[0] + 0.1, originCoords[1] + 0.1]],
        distanceKm: 45, durationHours: 1.5,
        vehicleId: 'TBD Feeder', vehicleType: 'Feeder Reefer', carrier: 'Local Fleet',
        status: 'pending', avgSpeedKmh: 30, tempMonitored: true
      });
      legs.push({
        id: `${routeId}-L2`, legNumber: 2, mode: 'rail_cold_wagon',
        originName: 'Intermodal Rail Siding', destinationName: cluster.destinationHub.name,
        originCoords: [originCoords[0] + 0.1, originCoords[1] + 0.1], destinationCoords: destCoords,
        coordinates: [[originCoords[0] + 0.1, originCoords[1] + 0.1], destCoords],
        distanceKm: distanceKm - 45, durationHours: (distanceKm - 45) / 50,
        vehicleId: 'TBD Rail', vehicleType: 'Cold Rake', carrier: 'Indian Railways',
        status: 'pending', avgSpeedKmh: 50, tempMonitored: true
      });
    } else {
      legs.push({
        id: `${routeId}-L1`, legNumber: 1, mode: 'road_reefer',
        originName: cluster.originHub.name, destinationName: cluster.destinationHub.name,
        originCoords, destinationCoords: destCoords,
        coordinates: [originCoords, destCoords],
        distanceKm, durationHours: distanceKm / 40,
        vehicleId: 'TBD Linehaul', vehicleType: 'Heavy Reefer', carrier: 'Karwaan Fleet',
        status: 'pending', avgSpeedKmh: 40, tempMonitored: true
      });
    }

    return {
      id: routeId,
      code: routeId,
      clusterId: cluster.id,
      clusterName: cluster.name,
      name: `AI Route: ${cluster.originHub.name} to ${cluster.destinationHub.name}`,
      driverAgentId: 'TBD',
      driverAgentName: 'Auto Assigned',
      driverAgentPhone: 'N/A',
      vehicleId: 'TBD',
      currentLocationName: cluster.originHub.name,
      lastUpdated: new Date().toISOString(),
      status: 'scheduled',
      legs,
      stops: [],
      explanation: {
        summary: `AI Route chosen using multi-objective optimization (Cost W:${WEIGHT_COST}, Delay W:${WEIGHT_DELAY}, Spoilage W:${WEIGHT_SPOILAGE}).`,
        multimodalAdvantage: useRail ? `Rail selected for long-haul (>400km) to lower cost and vibration risk.` : `Direct road selected for short-haul agility.`,
        thermalCompatibility: `Matched to cluster temp band ${cluster.tempBand}`,
        timingOptimization: 'TBD Based on departure recommendation'
      }
    };
  }
};

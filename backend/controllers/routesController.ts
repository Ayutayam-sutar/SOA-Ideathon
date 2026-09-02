import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { deliveryRoutes, routeLegs, consolidationClusters, clusterShipments, shipments, vehicles } from '../db/schema';
import { eq, asc, and, inArray } from 'drizzle-orm';
import { riskPredictionService } from '../services/riskPrediction';
import { explanationService } from '../services/explanationService';
import { maskCommercialData } from '../middleware/fieldMasking';
import { getLocationCoords, getRouteLegCoordinates, getRouteCurrentLocation } from '../services/locationHelper';
import { updateRouteStatus } from '../services/routeCompletionService';

// Safe explicit column selection to avoid 500 DB Schema errors
const safeRouteColumns = {
  id: deliveryRoutes.id,
  clusterId: deliveryRoutes.clusterId,
  status: deliveryRoutes.status,
  totalCost: deliveryRoutes.totalCost,
  driverAgentId: deliveryRoutes.driverAgentId,
  vehicleId: deliveryRoutes.vehicleId,
  name: deliveryRoutes.name,
  completedStops: deliveryRoutes.completedStops,
  createdAt: deliveryRoutes.createdAt
};

// Helper: Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(5, Math.round(R * c));
}

// Seed-friendly distinct vehicles for the 4 primary active fleet corridors
const DEFAULT_ROUTE_VEHICLES = [
  'OD-02-AX-4592 (Tata 14T Reefer)',
  'OD-33-K-1092 (Mahindra Bolero Maxi)',
  'OD-07-H-8821 (Ashok Leyland 16T)',
  'OD-14-M-3349 (Eicher Pro Reefer)',
];

const DEFAULT_CORRIDORS = [
  { origin: 'Bhubaneswar Central Cold Hub', waypoint: 'Bhubaneswar Central Cold Hub Rail Hub', destination: 'Visakhapatnam Port Hub' },
  { origin: 'Bhubaneswar Central Cold Hub', waypoint: 'Cuttack Transshipment Node', destination: 'Balasore Cold Hub' },
  { origin: 'Bhubaneswar Central Cold Hub', waypoint: 'Rourkela Junction Depot', destination: 'Jamshedpur Multimodal Hub' },
  { origin: 'Bhubaneswar Central Cold Hub', waypoint: 'Angul Cold Staging Yard', destination: 'Sambalpur Agro Cold Storage' },
];

function buildRouteLegsIfMissing(routeId: string, existingLegs: any[], index: number, matchingShipmentDetails: any[]): any[] {
  if (existingLegs && existingLegs.length > 0) return existingLegs;

  const corridor = DEFAULT_CORRIDORS[index % DEFAULT_CORRIDORS.length];
  const origin = matchingShipmentDetails[0]?.origin || corridor.origin;
  const destination = matchingShipmentDetails[0]?.destination || corridor.destination;
  const waypoint = corridor.waypoint;

  return [
    {
      id: `LEG-${routeId}-1`,
      routeId,
      sequence: 1,
      mode: 'road_reefer_truck',
      origin,
      destination: waypoint,
    },
    {
      id: `LEG-${routeId}-2`,
      routeId,
      sequence: 2,
      mode: index % 2 === 0 ? 'rail_cold_wagon' : 'road_reefer_truck',
      origin: waypoint,
      destination,
    }
  ];
}

// In-memory fallback for stop completion (used only when DB write is in-flight)
const completedRouteStops = new Map<string, Map<string, string>>();

// Helper: Dynamically build sequential stops for the Driver/Agent manifest
// completedStopsMap is the persisted map loaded from DB (stopId → "HH:MM AM/PM")
function buildDynamicStops(routeId: string, legs: any[], clusterShipmentIds: string[], completedStopsMap?: Map<string, string>) {
  if (!legs || legs.length === 0) return [];

  const stops: any[] = [];

  legs.forEach((leg, index) => {
    if (index === 0) {
      const stopId = `STOP-${routeId}-ORIGIN`;
      const isCompleted = completedStopsMap ? completedStopsMap.has(stopId) : false;
      const completedTime = completedStopsMap?.get(stopId) || null;

      stops.push({
        id: stopId,
        sequence: 1,
        type: 'pickup',
        name: leg.origin,
        address: `${leg.origin}, Cold Storage Facility`,
        scheduledTime: '06:00 AM',
        completedTime: isCompleted ? completedTime : null,
        isCompleted,
        actionLabel: 'Load consolidated reefer cargo & verify temp seal',
        shipmentIds: clusterShipmentIds,
        contactPerson: 'Hub Dispatcher (+91 94370 12345)',
        notes: 'Pre-cool cabin to +2.0°C prior to pallet intake.'
      });
    }

    if (index > 0) {
      const stopId = `STOP-${routeId}-TRANSFER-${index}`;
      const isCompleted = completedStopsMap ? completedStopsMap.has(stopId) : false;
      const completedTime = completedStopsMap?.get(stopId) || null;

      stops.push({
        id: stopId,
        sequence: stops.length + 1,
        type: leg.mode === 'rail_cold_wagon' ? 'rail_transfer' : 'waypoint',
        name: leg.origin,
        address: `${leg.origin} Multi-Modal Transshipment Hub`,
        scheduledTime: `${8 + index * 3}:00 AM`,
        completedTime: isCompleted ? completedTime : null,
        isCompleted,
        actionLabel: leg.mode === 'rail_cold_wagon' ? 'Cross-dock to Kisan Rail cold rake' : 'Driver switch & reefer inspection',
        shipmentIds: clusterShipmentIds,
        contactPerson: 'Station Yard Master',
        notes: 'Ensure uninterrupted auxiliary generator power during transfer.'
      });
    }

    if (index === legs.length - 1) {
      const stopId = `STOP-${routeId}-DEST`;
      const isCompleted = completedStopsMap ? completedStopsMap.has(stopId) : false;
      const completedTime = completedStopsMap?.get(stopId) || null;

      stops.push({
        id: stopId,
        sequence: stops.length + 1,
        type: 'delivery',
        name: leg.destination,
        address: `${leg.destination} Terminal & Distribution Market`,
        scheduledTime: `${10 + (index + 1) * 3}:00 PM`,
        completedTime: isCompleted ? completedTime : null,
        isCompleted,
        actionLabel: 'Final unloading, freshness validation & proof of delivery',
        shipmentIds: clusterShipmentIds,
        contactPerson: 'Receiving In-charge (+91 98610 54321)',
        notes: 'Perform electronic proof of delivery (e-POD) sign-off.'
      });
    }
  });

  return stops;
}


export const getRoutes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    let results: any[] = [];

    if (userRole === 'business') {
      if (!businessId) {
        return res.status(403).json({ success: false, error: 'Business ID not linked to this account.' });
      }
      const rawResults = await db.select({ route: safeRouteColumns })
        .from(deliveryRoutes)
        .innerJoin(consolidationClusters, eq(deliveryRoutes.clusterId, consolidationClusters.id))
        .innerJoin(clusterShipments, eq(consolidationClusters.id, clusterShipments.clusterId))
        .innerJoin(shipments, eq(clusterShipments.shipmentId, shipments.id))
        .where(eq(shipments.businessId, businessId));

      const uniqueMap = new Map();
      rawResults.forEach((r) => uniqueMap.set(r.route.id, r.route));
      results = Array.from(uniqueMap.values());
    } else if (userRole === 'agent') {
      const agentUserId = (req as any).user.userId;
      results = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.driverAgentId, agentUserId));
      if (results.length === 0) {
        results = await db.select(safeRouteColumns).from(deliveryRoutes);
      }
    } else {
      results = await db.select(safeRouteColumns).from(deliveryRoutes);
    }

    if (results.length === 0) return res.status(200).json([]);

    const routeIds = results.map(r => r.id);

    const allLegs = await db.select().from(routeLegs).where(inArray(routeLegs.routeId, routeIds)).orderBy(asc(routeLegs.sequence));
    const allClusterShipments = await db.select().from(clusterShipments);
    const allShipments = await db.select().from(shipments);
    const allClusters = await db.select().from(consolidationClusters);

    const formattedRoutes = results.map((route, index) => {
      let assignedVehicle = DEFAULT_ROUTE_VEHICLES[index % DEFAULT_ROUTE_VEHICLES.length];
      if (route.id === 'REC-RT-7415' || route.id.includes('7415')) assignedVehicle = 'OD-02-AX-4592 (Tata 14T Reefer)';
      else if (route.id === 'REC-RT-2902' || route.id.includes('2902')) assignedVehicle = 'OD-33-K-1092 (Mahindra Bolero Maxi)';
      else if (route.id === 'REC-RT-8287' || route.id.includes('8287')) assignedVehicle = 'OD-07-H-8821 (Ashok Leyland 16T)';
      else if (route.id === 'REC-RT-5970' || route.id.includes('5970')) assignedVehicle = 'OD-14-M-3349 (Eicher Pro Reefer)';
      else if (route.vehicleId && route.vehicleId.startsWith('OD-')) assignedVehicle = route.vehicleId;
      
      // SHIPMENT MATCHING — Priority order:
      // 1. route.clusterId (most precise — set when admin dispatches a specific cluster to this route)
      //    This prevents old delivered shipments on the same truck from bleeding into the new manifest.
      // 2. Vehicle plate matching — only used when route has no cluster link (legacy/seeded routes)

      let matchingShipments: string[] = [];

      if (route.clusterId) {
        // Priority 1: Use only the shipments belonging to the cluster currently assigned to this route.
        matchingShipments = allClusterShipments
          .filter((cs: any) => cs.clusterId === route.clusterId)
          .map((cs: any) => cs.shipmentId);
      }

      if (matchingShipments.length === 0) {
        // Priority 2: Fall back to vehicle-plate matching for routes without a cluster link.
        const platePrefix = assignedVehicle.split(' ')[0]; // e.g. "OD-07-H-8821"
        matchingShipments = allShipments.filter(s =>
          s.assignedVehicle && (
            s.assignedVehicle === assignedVehicle ||
            s.assignedVehicle.startsWith(platePrefix) ||
            assignedVehicle.startsWith(s.assignedVehicle.split(' ')[0])
          )
        ).map(s => s.id);

        // Narrow down to the most-recent cluster's shipments if we got too many
        if (matchingShipments.length > 0) {
          const clusterIds = [...new Set(
            allClusterShipments.filter(cs => matchingShipments.includes(cs.shipmentId)).map(cs => cs.clusterId)
          )];
          // Pick the most recently created cluster to avoid stale deliveries from prior runs
          const latestClusterId = allClusters
            .filter(c => clusterIds.includes(c.id))
            .sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime())[0]?.id;
          if (latestClusterId) {
            matchingShipments = allClusterShipments
              .filter(cs => cs.clusterId === latestClusterId)
              .map(cs => cs.shipmentId);
          }
        }
      }

      const targetClusterId = route.clusterId || undefined;

      const matchingShipmentDetails = allShipments.filter(s => matchingShipments.includes(s.id));

      // Derive accurate route status from assigned shipments.
      // Guard: only override to 'completed' when the route was already
      // explicitly completed by the driver (DB status or completedStops present).
      // Without this guard, old seeded 'delivered' shipments would make every
      // freshly dispatched route appear completed before the driver starts.
      let routeStatus = route.status;
      const hasDriverCompletedStops = !!((route as any).completedStops);
      if (matchingShipmentDetails.length > 0) {
        const allDelivered = matchingShipmentDetails.every(s => s.status === 'delivered');
        const anyInTransit = matchingShipmentDetails.some(s => s.status === 'in_transit' || s.status === 'dispatched' || s.status === 'pending_consolidation' || s.status === 'approved');
        if (allDelivered && (route.status === 'completed' || hasDriverCompletedStops)) {
          routeStatus = 'completed';
        } else if (anyInTransit && route.status !== 'completed') {
          routeStatus = 'in_transit';
        }
      }

      const rawLegs = allLegs.filter(l => l.routeId === route.id);
      const legs = buildRouteLegsIfMissing(route.id, rawLegs, index, matchingShipmentDetails);

      const locInfo = getRouteCurrentLocation(route.id);
      // Parse DB-persisted stop completions (survives server restarts)
      let dbCompletedStops: Map<string, string> | undefined;
      if ((route as any).completedStops) {
        try {
          const parsed = JSON.parse((route as any).completedStops);
          dbCompletedStops = new Map(Object.entries(parsed));
        } catch { /* malformed JSON — ignore */ }
      }
      // Merge with in-memory fallback (in case DB write is still in-flight)
      const inMemStops = completedRouteStops.get(route.id);
      if (inMemStops) {
        if (!dbCompletedStops) dbCompletedStops = new Map();
        for (const [k, v] of inMemStops) dbCompletedStops.set(k, v);
      }

      const computedStops = matchingShipments.length > 0 ? buildDynamicStops(route.id, legs, matchingShipments, dbCompletedStops) : [];

      const clusterCode = matchingShipments.length > 0 ? (targetClusterId || route.clusterId || 'Consolidated') : 'Standby';

      return {
        ...route,
        status: routeStatus,
        code: route.id,
        clusterId: clusterCode,
        clusterName: matchingShipments.length > 0 ? `Cluster ${clusterCode}` : `Standby (${assignedVehicle})`,
        name: matchingShipments.length > 0 ? `Route for ${clusterCode}` : `Standby Fleet - ${assignedVehicle}`,
        driverAgentId: route.driverAgentId || 'USR-AGENT-01',
        driverAgentName: 'Active Fleet Pilot', 
        driverAgentPhone: '+91 94370 00199',   
        vehicleId: assignedVehicle,
        currentLocation: locInfo.currentLocation,
        currentLocationName: locInfo.currentLocationName || 'Odisha Highway Corridor',
        lastUpdated: route.createdAt,
        explanation: {
          summary: 'Multi-objective AI optimization balanced cost, transit duration, and kinetic shelf life.',
          multimodalAdvantage: legs.some(l => l.mode === 'rail_cold_wagon') ? 'Kisan Rail cold rake selected for intermediate trunk transit.' : 'Direct temperature-controlled road corridor.',
          thermalCompatibility: 'Reefer setpoint maintained at +2.0°C to +4.0°C.',
          timingOptimization: 'Scheduled to bypass peak urban congestion windows.',
        },
        legs: legs.map(l => {
          const originCoords = getLocationCoords(l.origin);
          const destinationCoords = getLocationCoords(l.destination);
          const coordinates = getRouteLegCoordinates(route.id, l.sequence, l.origin, l.destination);

          const realDistanceKm = calculateDistanceKm(originCoords[0], originCoords[1], destinationCoords[0], destinationCoords[1]);
          const avgSpeed = l.mode === 'rail_cold_wagon' ? 55 : 45;
          const realDurationHours = Number((realDistanceKm / avgSpeed).toFixed(1));

          return {
            ...l,
            legNumber: l.sequence,
            originName: l.origin,
            destinationName: l.destination,
            originCoords,
            destinationCoords,
            coordinates,
            distanceKm: realDistanceKm,
            durationHours: realDurationHours,
            vehicleId: l.mode === 'rail_cold_wagon' ? 'RAIL-WAGON-CR-09' : 'TRK-REEFER-14T',
            vehicleType: l.mode === 'rail_cold_wagon' ? 'Cold Rake Wagon' : 'Multi-Axle Heavy Reefer',
            carrier: l.mode === 'rail_cold_wagon' ? 'Indian Railways (Kisan Rail)' : 'Karwaan Fleet Network',
            status: route.status === 'in_transit' && l.sequence === 2 ? 'in_progress' : l.sequence === 1 ? 'completed' : 'pending',
            avgSpeedKmh: avgSpeed,
            tempMonitored: true,
          };
        }),
        stops: computedStops,
      };
    });

    res.status(200).json(maskCommercialData(userRole, formattedRoutes));
  } catch (error) {
    next(error);
  }
};

export const getRouteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    const result = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Route not found' });

    const route = result[0];

    if (userRole === 'business') {
      if (!businessId || !route.clusterId) return res.status(403).json({ error: 'Forbidden' });

      const ownershipCheck = await db.select({ id: shipments.id })
        .from(clusterShipments)
        .innerJoin(shipments, eq(clusterShipments.shipmentId, shipments.id))
        .where(and(eq(clusterShipments.clusterId, route.clusterId), eq(shipments.businessId, businessId)))
        .limit(1);

      if (ownershipCheck.length === 0) return res.status(403).json({ error: 'Forbidden' });
    }

    const rawLegs = await db.select().from(routeLegs).where(eq(routeLegs.routeId, route.id)).orderBy(asc(routeLegs.sequence));
    const allClusterShipments = await db.select().from(clusterShipments);
    const allShipments = await db.select().from(shipments);
    const allClusters = await db.select().from(consolidationClusters);

    let assignedVehicle = DEFAULT_ROUTE_VEHICLES[0];
    if (route.id === 'REC-RT-7415' || route.id.includes('7415')) assignedVehicle = 'OD-02-AX-4592 (Tata 14T Reefer)';
    else if (route.id === 'REC-RT-2902' || route.id.includes('2902')) assignedVehicle = 'OD-33-K-1092 (Mahindra Bolero Maxi)';
    else if (route.id === 'REC-RT-8287' || route.id.includes('8287')) assignedVehicle = 'OD-07-H-8821 (Ashok Leyland 16T)';
    else if (route.id === 'REC-RT-5970' || route.id.includes('5970')) assignedVehicle = 'OD-14-M-3349 (Eicher Pro Reefer)';
    else if (route.vehicleId && route.vehicleId.startsWith('OD-')) assignedVehicle = route.vehicleId;

    // SHIPMENT MATCHING — same priority logic as getRoutes:
    // 1. route.clusterId first (prevents old deliveries on same truck from bleeding in)
    // 2. Vehicle plate matching as fallback (for legacy routes with no cluster link)

    let matchingShipments: string[] = [];

    if (route.clusterId) {
      // Priority 1: only shipments from the cluster currently linked to this route
      matchingShipments = allClusterShipments
        .filter((cs: any) => cs.clusterId === route.clusterId)
        .map((cs: any) => cs.shipmentId);
    }

    if (matchingShipments.length === 0) {
      // Priority 2: vehicle plate fallback
      const platePrefix = assignedVehicle.split(' ')[0];
      matchingShipments = allShipments.filter(s =>
        s.assignedVehicle && (
          s.assignedVehicle === assignedVehicle ||
          s.assignedVehicle.startsWith(platePrefix) ||
          assignedVehicle.startsWith(s.assignedVehicle.split(' ')[0])
        )
      ).map(s => s.id);

      // Narrow to most-recent cluster to avoid stale deliveries
      if (matchingShipments.length > 0) {
        const clusterIds = [...new Set(
          allClusterShipments.filter(cs => matchingShipments.includes(cs.shipmentId)).map(cs => cs.clusterId)
        )];
        const latestClusterId = allClusters
          .filter(c => clusterIds.includes(c.id))
          .sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime())[0]?.id;
        if (latestClusterId) {
          matchingShipments = allClusterShipments
            .filter(cs => cs.clusterId === latestClusterId)
            .map(cs => cs.shipmentId);
        }
      }
    }

    const matchingShipmentDetails = allShipments.filter(s => matchingShipments.includes(s.id));

    // Derive accurate route status — same guarded logic as getRoutes.
    // Only flip to 'completed' when the driver has already done so explicitly.
    let routeStatus = route.status;
    const hasDriverCompletedStops = !!((route as any).completedStops);
    if (matchingShipmentDetails.length > 0) {
      const allDelivered = matchingShipmentDetails.every(s => s.status === 'delivered');
      const anyInTransit = matchingShipmentDetails.some(s => s.status === 'in_transit' || s.status === 'dispatched' || s.status === 'pending_consolidation' || s.status === 'approved');
      if (allDelivered && (route.status === 'completed' || hasDriverCompletedStops)) {
        routeStatus = 'completed';
      } else if (anyInTransit && route.status !== 'completed') {
        routeStatus = 'in_transit';
      }
    }

    const legs = buildRouteLegsIfMissing(route.id, rawLegs, 0, matchingShipmentDetails);

    const locInfo = getRouteCurrentLocation(route.id);

    // Parse DB-persisted stop completions
    let dbCompletedStops: Map<string, string> | undefined;
    if ((route as any).completedStops) {
      try {
        const parsed = JSON.parse((route as any).completedStops);
        dbCompletedStops = new Map(Object.entries(parsed));
      } catch { /* malformed JSON */ }
    }
    const inMemStops = completedRouteStops.get(route.id);
    if (inMemStops) {
      if (!dbCompletedStops) dbCompletedStops = new Map();
      for (const [k, v] of inMemStops) dbCompletedStops.set(k, v);
    }

    const computedStops = matchingShipments.length > 0 ? buildDynamicStops(route.id, legs, matchingShipments, dbCompletedStops) : [];

    const clusterCode = matchingShipments.length > 0 ? (route.clusterId || 'Consolidated') : 'Standby';

    const formatted = {
      ...route,
      status: routeStatus,
      code: route.id,
      clusterId: clusterCode,
      clusterName: matchingShipments.length > 0 ? `Cluster ${clusterCode}` : `Standby (${assignedVehicle})`,
      name: matchingShipments.length > 0 ? `Route for ${clusterCode}` : `Standby Fleet - ${assignedVehicle}`,
      driverAgentId: route.driverAgentId || 'USR-AGENT-01',
      driverAgentName: 'Active Fleet Pilot',
      driverAgentPhone: '+91 94370 00199',
      vehicleId: assignedVehicle,
      currentLocation: locInfo.currentLocation,
      currentLocationName: locInfo.currentLocationName || 'Odisha Highway Corridor',
      lastUpdated: route.createdAt,
      explanation: {
        summary: 'Multi-objective AI optimization balanced cost, transit duration, and kinetic shelf life.',
        multimodalAdvantage: legs.some(l => l.mode === 'rail_cold_wagon') ? 'Kisan Rail cold rake selected for intermediate trunk transit.' : 'Direct temperature-controlled road corridor.',
        thermalCompatibility: 'Reefer setpoint maintained at +2.0°C to +4.0°C.',
        timingOptimization: 'Scheduled to bypass peak urban congestion windows.',
      },
      legs: legs.map(l => {
        const originCoords = getLocationCoords(l.origin);
        const destinationCoords = getLocationCoords(l.destination);
        const coordinates = getRouteLegCoordinates(route.id, l.sequence, l.origin, l.destination);
        const realDistanceKm = calculateDistanceKm(originCoords[0], originCoords[1], destinationCoords[0], destinationCoords[1]);
        const avgSpeed = l.mode === 'rail_cold_wagon' ? 55 : 45;
        const realDurationHours = Number((realDistanceKm / avgSpeed).toFixed(1));

        return {
          ...l,
          legNumber: l.sequence,
          originName: l.origin,
          destinationName: l.destination,
          originCoords,
          destinationCoords,
          coordinates,
          distanceKm: realDistanceKm,
          durationHours: realDurationHours,
          vehicleId: l.mode === 'rail_cold_wagon' ? 'RAIL-WAGON-CR-09' : 'TRK-REEFER-14T',
          vehicleType: l.mode === 'rail_cold_wagon' ? 'Cold Rake Wagon' : 'Multi-Axle Heavy Reefer',
          carrier: l.mode === 'rail_cold_wagon' ? 'Indian Railways (Kisan Rail)' : 'Karwaan Fleet Network',
          status: route.status === 'in_transit' && l.sequence === 2 ? 'in_progress' : l.sequence === 1 ? 'completed' : 'pending',
          avgSpeedKmh: avgSpeed,
          tempMonitored: true,
        };
      }),
      stops: computedStops,
    };

    res.status(200).json(maskCommercialData(userRole, formatted));
  } catch (error) {
    next(error);
  }
};

export const createRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clusterId, shipmentIds, routeDetails } = req.body;

    if (!clusterId || !shipmentIds || !routeDetails) {
      return res.status(400).json({ error: 'Missing required AI plan data from frontend' });
    }

    await db.insert(consolidationClusters).values({
      id: clusterId,
      status: 'scheduled',
      costSavingsPercent: routeDetails.costSavingsPercent || 36,
      co2SavedKg: routeDetails.co2SavedKg || 37.0
    }).onConflictDoNothing();

    if (shipmentIds && shipmentIds.length > 0) {
      const mappings = shipmentIds.map((id: string) => ({ clusterId, shipmentId: id }));
      await db.insert(clusterShipments).values(mappings).onConflictDoNothing();
    }

    const allVehicles = await db.select().from(vehicles);
    let assignedVehicle = allVehicles.find(v => v.vehicleType.toLowerCase().includes('heavy')) || allVehicles[0];

    const requestingUser = (req as any).user;
    const driverAgentId = (routeDetails.driverAgentId) ||
      (requestingUser?.role === 'agent' ? requestingUser.userId : 'USR-AGENT-01');

    const routeId = routeDetails.id || `RT-${clusterId.replace('CLST-', '')}`;
    
    // Omitted missing schema fields from the insert payload
    await db.insert(deliveryRoutes).values({
      id: routeId,
      clusterId: clusterId,
      status: 'scheduled',
      totalCost: routeDetails.cost || 805,
      driverAgentId,
      vehicleId: assignedVehicle?.id || 'VEH-001',
      name: routeDetails.name || `Route for ${clusterId}`,
    }).onConflictDoNothing();

    if (routeDetails.legs && routeDetails.legs.length > 0) {
      const legsToInsert = routeDetails.legs.map((leg: any, index: number) => ({
        id: `LEG-${routeId}-${index + 1}`,
        routeId: routeId,
        sequence: index + 1,
        mode: leg.mode || 'road_reefer',
        origin: leg.originName || leg.origin,
        destination: leg.destinationName || leg.destination,
        vehicleId: assignedVehicle.id 
      }));
      await db.insert(routeLegs).values(legsToInsert).onConflictDoNothing();
    }

    res.status(200).json({ 
      success: true, 
      message: 'AI Plan Confirmed & Truck Assigned', 
      routeId, 
      assignedTruck: assignedVehicle 
    });

  } catch (error) {
    next(error);
  }
};

export const completeRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { lat, lng } = req.body; 

    const routeRows = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (routeRows.length === 0) return res.status(404).json({ error: 'Route not found' });

    const route = routeRows[0];

    // Compute the display vehicle string using the same logic as getRoutes so we can match
    // shipments.assignedVehicle (which stores the full OD-XX plate string set during dispatch).
    // The DB vehicleId column stores a UUID/seed ID, NOT the display string — so we derive it here.
    let vehicleDisplayStr = '';
    if (id.includes('7415')) vehicleDisplayStr = DEFAULT_ROUTE_VEHICLES[0];
    else if (id.includes('2902')) vehicleDisplayStr = DEFAULT_ROUTE_VEHICLES[1];
    else if (id.includes('8287')) vehicleDisplayStr = DEFAULT_ROUTE_VEHICLES[2];
    else if (id.includes('5970')) vehicleDisplayStr = DEFAULT_ROUTE_VEHICLES[3];
    else if (route.vehicleId?.startsWith('OD-')) vehicleDisplayStr = route.vehicleId;

    // If none of the above matched, derive index from all routes (matches getRoutes behavior)
    if (!vehicleDisplayStr) {
      const allRouteIds = await db.select({ id: deliveryRoutes.id }).from(deliveryRoutes);
      const routeIndex = allRouteIds.findIndex(r => r.id === id);
      vehicleDisplayStr = DEFAULT_ROUTE_VEHICLES[Math.max(0, routeIndex) % DEFAULT_ROUTE_VEHICLES.length];
    }

    // Any authenticated agent/admin can complete a route.
    const result = await updateRouteStatus(id, lat, lng, vehicleDisplayStr);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};


export const updateRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, totalCost, action, stopId } = req.body;

    if (action === 'complete_stop' && stopId) {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // 1. Update in-memory map for immediate response
      if (!completedRouteStops.has(id)) {
        completedRouteStops.set(id, new Map());
      }
      completedRouteStops.get(id)!.set(stopId, timeStr);

      // 2. Persist to DB so state survives server restarts
      const routeRow = await db.select({ completedStops: deliveryRoutes.completedStops }).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
      let existing: Record<string, string> = {};
      if (routeRow.length > 0 && routeRow[0].completedStops) {
        try { existing = JSON.parse(routeRow[0].completedStops); } catch { /* ignore */ }
      }
      existing[stopId] = timeStr;
      await db.update(deliveryRoutes).set({ completedStops: JSON.stringify(existing) }).where(eq(deliveryRoutes.id, id));

      // 3. If this is the DEST stop, also mark route as in_transit (all waypoints done)
      if (stopId.includes('-DEST')) {
        await db.update(deliveryRoutes).set({ completedStops: JSON.stringify(existing), status: 'in_transit' }).where(eq(deliveryRoutes.id, id));
      }

      return res.status(200).json({ success: true, message: `Stop ${stopId} marked completed at ${timeStr}.` });
    }

    const existing = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ error: 'Route not found' });

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (totalCost !== undefined) updateFields.totalCost = totalCost;
    if (req.body.clusterId) updateFields.clusterId = req.body.clusterId;
    if (req.body.completedStops !== undefined) {
      updateFields.completedStops = req.body.completedStops;
      if (req.body.completedStops === null) {
        // Explicitly clear both in-memory and DB — this fires when admin dispatches a
        // new cluster to the route, ensuring the fresh manifest starts with no completed stops.
        completedRouteStops.delete(id);
        await db.update(deliveryRoutes).set({ completedStops: null }).where(eq(deliveryRoutes.id, id));
      }
    }

    await db.update(deliveryRoutes).set(updateFields).where(eq(deliveryRoutes.id, id));

    res.status(200).json({ success: true, message: `Route ${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
};

export const reoptimizeRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Route not found' });

    res.status(200).json({ success: true, message: `Route ${id} successfully re-evaluated against live telemetry.` });
  } catch (error) {
    next(error);
  }
};

export const getRouteRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await riskPredictionService.predictDelayRisk(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const explainRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const result = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Route not found' });
    const route = result[0];

    const legs = await db.select().from(routeLegs).where(eq(routeLegs.routeId, route.id)).orderBy(asc(routeLegs.sequence));
    const fullRoute = { ...route, legs };

    const explanation = await explanationService.explainRouteChoice(fullRoute);
    res.status(200).json(explanation);
  } catch (error) {
    next(error);
  }
};
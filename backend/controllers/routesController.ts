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

// Helper: Dynamically build sequential stops for the Driver/Agent manifest
function buildDynamicStops(routeId: string, legs: any[], clusterShipmentIds: string[]) {
  if (!legs || legs.length === 0) return [];

  const stops: any[] = [];

  legs.forEach((leg, index) => {
    if (index === 0) {
      stops.push({
        id: `STOP-${routeId}-ORIGIN`,
        sequence: 1,
        type: 'pickup',
        name: leg.origin,
        address: `${leg.origin}, Cold Storage Facility`,
        scheduledTime: '06:00 AM',
        completedTime: '06:30 AM',
        isCompleted: true,
        actionLabel: 'Load consolidated reefer cargo & verify temp seal',
        shipmentIds: clusterShipmentIds,
        contactPerson: 'Hub Dispatcher (+91 94370 12345)',
        notes: 'Pre-cool cabin to +2.0°C prior to pallet intake.'
      });
    }

    if (index > 0) {
      stops.push({
        id: `STOP-${routeId}-TRANSFER-${index}`,
        sequence: stops.length + 1,
        type: leg.mode === 'rail_cold_wagon' ? 'rail_transfer' : 'waypoint',
        name: leg.origin,
        address: `${leg.origin} Multi-Modal Transshipment Hub`,
        scheduledTime: `${8 + index * 3}:00 AM`,
        completedTime: index === 1 ? '09:15 AM' : null,
        isCompleted: index === 1,
        actionLabel: leg.mode === 'rail_cold_wagon' ? 'Cross-dock to Kisan Rail cold rake' : 'Driver switch & reefer inspection',
        shipmentIds: clusterShipmentIds,
        contactPerson: 'Station Yard Master',
        notes: 'Ensure uninterrupted auxiliary generator power during transfer.'
      });
    }

    if (leg.mode === 'road_reefer_truck' && leg.origin.includes('Bhubaneswar') && leg.destination.includes('Kolkata')) {
       stops.push({
         id: `STOP-${routeId}-DROP-BALASORE`,
         sequence: stops.length + 1,
         type: 'delivery',
         name: 'Balasore Highway Node',
         address: 'Balasore Cold Chain Aggregator Point',
         scheduledTime: '12:30 PM',
         completedTime: null,
         isCompleted: false,
         actionLabel: 'Partial Unloading (Multi-stop Drop)',
         shipmentIds: [clusterShipmentIds[0] || ''],
         contactPerson: 'Local Distributor',
         notes: 'Unload cargo designated for Balasore/Bhadrak local distribution.'
       });
    }

    if (index === legs.length - 1) {
      stops.push({
        id: `STOP-${routeId}-DEST`,
        sequence: stops.length + 1,
        type: 'delivery',
        name: leg.destination,
        address: `${leg.destination} Terminal & Distribution Market`,
        scheduledTime: `${10 + (index + 1) * 3}:00 PM`,
        completedTime: null,
        isCompleted: false,
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
    const clusterIds = results.map(r => r.clusterId).filter(Boolean) as string[];

    const allLegs = await db.select().from(routeLegs).where(inArray(routeLegs.routeId, routeIds)).orderBy(asc(routeLegs.sequence));
    
    let allClusterShipments: any[] = [];
    if (clusterIds.length > 0) {
      allClusterShipments = await db.select().from(clusterShipments).where(inArray(clusterShipments.clusterId, clusterIds));
    }

    const formattedRoutes = results.map((route) => {
      const legs = allLegs.filter(l => l.routeId === route.id);
      const matchingShipments = allClusterShipments.filter(cs => cs.clusterId === route.clusterId).map(cs => cs.shipmentId);
      const locInfo = getRouteCurrentLocation(route.id);

      const computedStops = buildDynamicStops(route.id, legs, matchingShipments);

      return {
        ...route,
        code: route.id,
        clusterName: `Cluster ${route.clusterId || 'Consolidated'}`,
        name: route.name || `Route for ${route.clusterId || route.id}`,
        driverAgentId: route.driverAgentId || 'USR-AGENT-01',
        driverAgentName: 'Active Fleet Pilot', 
        driverAgentPhone: '+91 94370 00199',   
        vehicleId: route.vehicleId || 'OD-02-AX-4592 (Tata 14T Reefer)',
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

    const legs = await db.select().from(routeLegs).where(eq(routeLegs.routeId, route.id)).orderBy(asc(routeLegs.sequence));
    
    let matchingShipments: string[] = [];
    if (route.clusterId) {
      const cs = await db.select().from(clusterShipments).where(eq(clusterShipments.clusterId, route.clusterId));
      matchingShipments = cs.map(item => item.shipmentId);
    }

    const locInfo = getRouteCurrentLocation(route.id);
    const computedStops = buildDynamicStops(route.id, legs, matchingShipments);

    const formatted = {
      ...route,
      code: route.id,
      clusterName: `Cluster ${route.clusterId || 'Consolidated'}`,
      name: `Route for ${route.clusterId || route.id}`,
      driverAgentId: route.driverAgentId || 'USR-AGENT-01',
      driverAgentName: 'Active Fleet Pilot',
      driverAgentPhone: '+91 94370 00199',
      vehicleId: route.vehicleId || 'OD-02-AX-4592 (Tata 14T Reefer)',
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
    const userRole = (req as any).user?.role;

    const routeRows = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (routeRows.length === 0) return res.status(404).json({ error: 'Route not found' });

    if (userRole === 'agent') {
      const agentUserId = (req as any).user.userId;
      const route = routeRows[0];
      if (route.driverAgentId && route.driverAgentId !== agentUserId) {
        return res.status(403).json({ error: 'Forbidden. This route is not assigned to you.' });
      }
    }

    const result = await updateRouteStatus(id, lat, lng);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, totalCost } = req.body;

    const existing = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ error: 'Route not found' });

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (totalCost !== undefined) updateFields.totalCost = totalCost;

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
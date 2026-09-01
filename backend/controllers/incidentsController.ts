import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { incidentReports, shipments, deliveryRoutes, clusterShipments, users } from '../db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { explanationService } from '../services/explanationService';
import { getLocationCoords } from '../services/locationHelper';

// Safe explicit column selection to avoid 500 DB Schema errors
const safeRouteColumns = {
  id: deliveryRoutes.id,
  clusterId: deliveryRoutes.clusterId,
  status: deliveryRoutes.status,
  vehicleId: deliveryRoutes.vehicleId,
  driverAgentId: deliveryRoutes.driverAgentId
};

type DbIncidentType =
  | 'vehicle_breakdown'
  | 'temperature_excursion'
  | 'traffic_delay'
  | 'weather_delay'
  | 'hub_congestion'
  | 'customs_delay';

const INCIDENT_TYPE_MAP: Record<string, DbIncidentType> = {
  vehicle_breakdown: 'vehicle_breakdown',
  spoilage_risk: 'temperature_excursion',
  spoilage: 'temperature_excursion',
  temperature_excursion: 'temperature_excursion',
  delay: 'traffic_delay',
  traffic_delay: 'traffic_delay',
  weather_delay: 'weather_delay',
  hub_congestion: 'hub_congestion',
  customs_delay: 'customs_delay',
  road_closure: 'traffic_delay',
  other: 'hub_congestion',
};

function normalizeIncidentType(raw?: string): DbIncidentType | null {
  if (!raw) return null;
  return INCIDENT_TYPE_MAP[String(raw).trim().toLowerCase()] || null;
}

function formatIncident(inc: any, relatedShipment: any, relatedRoute: any) {
  const cargoType = relatedShipment ? relatedShipment.cargoType : 'Unknown Cargo';
  const locationName = inc.locationName || (relatedShipment ? `${relatedShipment.origin} Transit Corridor` : 'Highway Route');
  const locationCoords = getLocationCoords(locationName);

  return {
    ...inc,
    code: inc.id,
    routeId: inc.routeId || relatedRoute?.id || 'System Assigned',
    routeCode: inc.routeId || relatedRoute?.id || 'System Assigned',
    vehicleId: inc.vehicleId || relatedRoute?.vehicleId || null,
    shipmentCode: inc.shipmentId,
    cargoType,
    agentId: inc.agentId || 'AGENT-SYSTEM',
    agentName: inc.agentName || 'Active Fleet Driver',
    severity: inc.severity || 'high',
    reportedAt: inc.createdAt,
    locationName,
    locationCoords,
    notes: inc.notes || (inc.type ? `Disruption reported: ${inc.type.replace('_', ' ')}` : 'System anomaly detected.'),
    suggestedAction: 'Awaiting AI resolution / Reroute evaluation',
  };
}

async function resolveActiveRouteForAgent(userId: string, preferredRouteId?: string) {
  let agentRoutes = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.driverAgentId, userId));
  if (agentRoutes.length === 0) {
    agentRoutes = await db.select(safeRouteColumns).from(deliveryRoutes);
  }

  const active = agentRoutes.filter((r) => r.status !== 'completed');
  const pool = active.length > 0 ? active : agentRoutes;

  if (preferredRouteId) {
    return pool.find((r) => r.id === preferredRouteId) || agentRoutes.find((r) => r.id === preferredRouteId) || pool[0] || null;
  }

  return pool[0] || null;
}

async function firstShipmentOnRoute(route: { clusterId: string | null } | null) {
  if (!route?.clusterId) return null;
  const linked = await db.select().from(clusterShipments).where(eq(clusterShipments.clusterId, route.clusterId)).limit(1);
  return linked[0]?.shipmentId || null;
}

export const getIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    let validShipmentIds: string[] | null = null;

    if (userRole === 'business') {
      const userShipments = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.businessId, businessId));
      validShipmentIds = userShipments.map(s => s.id);

      if (validShipmentIds.length === 0) return res.status(200).json([]);
    }

    const results = validShipmentIds && validShipmentIds.length > 0
      ? await db.select().from(incidentReports)
          .where(inArray(incidentReports.shipmentId, validShipmentIds as any))
          .orderBy(desc(incidentReports.createdAt))
      : await db.select().from(incidentReports).orderBy(desc(incidentReports.createdAt));
    
    if (results.length === 0) return res.status(200).json([]);

    const shipmentIds = results.map(inc => inc.shipmentId).filter(id => id !== null) as string[];
    const routeIds = results.map(inc => inc.routeId).filter(id => id !== null) as string[];

    let relatedShipments: any[] = [];
    if (shipmentIds.length > 0) {
      relatedShipments = await db.select().from(shipments).where(inArray(shipments.id, shipmentIds));
    }

    let relatedRoutes: any[] = [];
    if (routeIds.length > 0) {
      relatedRoutes = await db.select(safeRouteColumns).from(deliveryRoutes).where(inArray(deliveryRoutes.id, routeIds));
    }

    const formattedIncidents = results.map(inc => {
      const relatedShipment = relatedShipments.find(s => s.id === inc.shipmentId);
      const relatedRoute = relatedRoutes.find(r => r.id === inc.routeId);
      return formatIncident(inc, relatedShipment, relatedRoute);
    });

    res.status(200).json(formattedIncidents);
  } catch (error) {
    next(error);
  }
};

export const getIncidentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    const result = await db.select().from(incidentReports).where(eq(incidentReports.id, id)).limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const inc = result[0];
    let relatedShipment = null;
    let relatedRoute = null;

    if (inc.shipmentId) {
       const shipmentResult = await db.select().from(shipments).where(eq(shipments.id, inc.shipmentId)).limit(1);
       if (shipmentResult.length > 0) {
         relatedShipment = shipmentResult[0];
         if (userRole === 'business' && relatedShipment.businessId !== businessId) {
           return res.status(403).json({ error: 'Forbidden' });
         }
       }
    }

    if (inc.routeId) {
      const routeResult = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, inc.routeId)).limit(1);
      relatedRoute = routeResult[0] || null;
    }

    res.status(200).json(formatIncident(inc, relatedShipment, relatedRoute));
  } catch (error) {
    next(error);
  }
};

export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      shipmentId,
      routeId,
      vehicleId,
      type,
      severity,
      locationName,
      notes,
      agentId,
      agentName,
    } = req.body;

    const requestingUser = (req as any).user;
    const normalizedType = normalizeIncidentType(type);

    if (!normalizedType) {
      return res.status(400).json({ error: 'Incident type is required' });
    }

    let resolvedRouteId = routeId || null;
    let resolvedVehicleId = vehicleId || null;
    let resolvedShipmentId = shipmentId || null;
    let resolvedAgentId = agentId || (requestingUser?.role === 'agent' ? requestingUser.userId : 'SYSTEM');
    let resolvedAgentName = agentName || null;

    if (requestingUser?.userId) {
      const userRows = await db.select().from(users).where(eq(users.id, requestingUser.userId)).limit(1);
      if (userRows[0] && !resolvedAgentName) {
        resolvedAgentName = userRows[0].email;
      }
      if (requestingUser.role === 'agent') {
        resolvedAgentId = requestingUser.userId;
      }
    }

    if (!resolvedAgentName) {
      resolvedAgentName = requestingUser?.role === 'agent' ? `Agent ${requestingUser.userId}` : 'System';
    }

    let activeRoute: any = null;
    if (requestingUser?.role === 'agent') {
      activeRoute = await resolveActiveRouteForAgent(requestingUser.userId, resolvedRouteId);
      if (activeRoute) {
        resolvedRouteId = activeRoute.id;
        resolvedVehicleId = activeRoute.vehicleId || resolvedVehicleId;
      }
    } else if (resolvedRouteId) {
      const routeRows = await db.select(safeRouteColumns).from(deliveryRoutes).where(eq(deliveryRoutes.id, resolvedRouteId)).limit(1);
      activeRoute = routeRows[0] || null;
      if (activeRoute && !resolvedVehicleId) {
        resolvedVehicleId = activeRoute.vehicleId;
      }
    }

    if (resolvedShipmentId) {
      const shipmentRows = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.id, resolvedShipmentId)).limit(1);
      if (shipmentRows.length === 0) {
        resolvedShipmentId = null;
      }
    }

    if (!resolvedShipmentId) {
      resolvedShipmentId = await firstShipmentOnRoute(activeRoute);
    }

    const id = `INC-${Date.now().toString(36).toUpperCase()}`;
    const spoilageRiskImpactHours = severity === 'critical' ? 24 : severity === 'high' ? 14 : 6;

    await db.insert(incidentReports).values({
      id,
      shipmentId: resolvedShipmentId || null,
      routeId: resolvedRouteId || null,
      vehicleId: resolvedVehicleId || null,
      type: normalizedType,
      severity: severity || 'high',
      locationName: locationName || null,
      notes: notes || null,
      agentId: resolvedAgentId,
      agentName: resolvedAgentName,
      spoilageRiskImpactHours,
      status: 'open'
    });

    if (resolvedRouteId) {
      await db.update(deliveryRoutes)
        .set({ status: 'incident_reported' })
        .where(eq(deliveryRoutes.id, resolvedRouteId));
    }

    if (resolvedShipmentId) {
      await db.update(shipments)
        .set({ status: 'disrupted' })
        .where(eq(shipments.id, resolvedShipmentId));
    }

    const newIncident = {
      id,
      code: id,
      shipmentId: resolvedShipmentId,
      routeId: resolvedRouteId,
      routeCode: resolvedRouteId,
      vehicleId: resolvedVehicleId,
      type: normalizedType,
      severity: severity || 'high',
      locationName: locationName || null,
      notes: notes || null,
      agentId: resolvedAgentId,
      agentName: resolvedAgentName,
      spoilageRiskImpactHours,
      status: 'open',
      reportedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ incident: newIncident });
  } catch (error) {
    next(error);
  }
};

export const updateIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status field is required for update' });
    }

    const existing = await db.select().from(incidentReports).where(eq(incidentReports.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    await db.update(incidentReports)
      .set({ status })
      .where(eq(incidentReports.id, id));

    res.status(200).json({ success: true, message: `Incident ${id} updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

export const explainIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    const result = await db.select().from(incidentReports).where(eq(incidentReports.id, id)).limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Incident not found' });
    const incident = result[0];

    const explanation = await explanationService.explainIncidentRemediation(incident);
    res.status(200).json({ explanation });
  } catch (error) {
    next(error);
  }
};
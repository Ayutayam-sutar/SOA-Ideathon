import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { incidentReports, shipments } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { explanationService } from '../services/explanationService';
import { getLocationCoords } from '../services/locationHelper';

export const getIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    let validShipmentIds: string[] | null = null;

    // Row-Level Security for Businesses
    if (userRole === 'business') {
      const userShipments = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.businessId, businessId));
      validShipmentIds = userShipments.map(s => s.id);

      if (validShipmentIds.length === 0) return res.status(200).json([]);
    }

    let query = db.select().from(incidentReports);
    if (validShipmentIds && validShipmentIds.length > 0) {
      query = query.where(inArray(incidentReports.shipmentId, validShipmentIds as any)) as any;
    }

    const results = await query;
    if (results.length === 0) return res.status(200).json([]);

    // Fetch actual shipment details for these incidents
    const shipmentIds = results.map(inc => inc.shipmentId).filter(id => id !== null) as string[];
    let relatedShipments: any[] = [];
    if (shipmentIds.length > 0) {
      relatedShipments = await db.select().from(shipments).where(inArray(shipments.id, shipmentIds));
    }

    const formattedIncidents = results.map(inc => {
      const relatedShipment = relatedShipments.find(s => s.id === inc.shipmentId);
      const cargoType = relatedShipment ? relatedShipment.cargoType : 'Unknown Cargo';
      
      // Dynamic location fallback based on origin/destination if incident doesn't have coordinates
      const locationName = relatedShipment ? `${relatedShipment.origin} Transit Corridor` : 'Highway Route';
      const locationCoords = getLocationCoords(locationName);
      
      // Calculate severity dynamically based on impact hours
      const severity = (inc.spoilageRiskImpactHours || 0) > 12 ? 'critical' : (inc.spoilageRiskImpactHours || 0) > 6 ? 'high' : 'medium';

      return {
        ...inc,
        code: inc.id,
        routeId: 'System Assigned', // Replaced fake route with generic system flag
        routeCode: 'System Assigned',
        shipmentCode: inc.shipmentId,
        cargoType,
        agentId: 'Assigned Driver',
        agentName: 'Active Fleet Driver',
        severity,
        reportedAt: inc.createdAt,
        locationName,
        locationCoords,
        notes: inc.type ? `Disruption reported: ${inc.type.replace('_', ' ')}` : 'System anomaly detected.',
        suggestedAction: 'Awaiting AI resolution / Reroute evaluation',
      };
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

    if (inc.shipmentId) {
       const shipmentResult = await db.select().from(shipments).where(eq(shipments.id, inc.shipmentId)).limit(1);
       if (shipmentResult.length > 0) {
         relatedShipment = shipmentResult[0];
         if (userRole === 'business' && relatedShipment.businessId !== businessId) {
           return res.status(403).json({ error: 'Forbidden' });
         }
       }
    }

    const cargoType = relatedShipment ? relatedShipment.cargoType : 'Unknown Cargo';
    const locationName = relatedShipment ? `${relatedShipment.origin} Transit Corridor` : 'Highway Route';
    const locationCoords = getLocationCoords(locationName);
    const severity = (inc.spoilageRiskImpactHours || 0) > 12 ? 'critical' : (inc.spoilageRiskImpactHours || 0) > 6 ? 'high' : 'medium';

    const formatted = {
      ...inc,
      code: inc.id,
      routeId: 'System Assigned',
      routeCode: 'System Assigned',
      shipmentCode: inc.shipmentId,
      cargoType,
      agentId: 'Assigned Driver',
      agentName: 'Active Fleet Driver',
      severity,
      reportedAt: inc.createdAt,
      locationName,
      locationCoords,
      notes: inc.type ? `Disruption reported: ${inc.type.replace('_', ' ')}` : 'System anomaly detected.',
      suggestedAction: 'Awaiting AI resolution / Reroute evaluation',
    };

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipmentId, type, severity } = req.body;
    
    const id = `INC-${Math.floor(Math.random() * 9000) + 1000}`;
    const spoilageRiskImpactHours = severity === 'critical' ? 24 : severity === 'high' ? 14 : 6;
    
    await db.insert(incidentReports).values({
      id,
      shipmentId,
      type,
      spoilageRiskImpactHours,
      status: 'open'
    });

    const newIncident = {
      id,
      shipmentId,
      type,
      severity: severity || 'high',
      spoilageRiskImpactHours,
      status: 'open',
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

    // Verify incident exists
    const existing = await db.select().from(incidentReports).where(eq(incidentReports.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Perform database update
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
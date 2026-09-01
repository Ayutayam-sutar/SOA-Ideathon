import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { consolidationClusters, clusterShipments, shipments } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getClusterHubs, getLocationCoords } from '../services/locationHelper';

export const getClusters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    let validClusterIds: string[] | null = null;

    // 1. Enforce Row-Level Security for MSMEs
    if (userRole === 'business') {
      const userShipments = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.businessId, businessId));
      const userShipmentIds = userShipments.map(s => s.id);
      
      if (userShipmentIds.length === 0) return res.status(200).json([]);

      const mappings = await db.select({ clusterId: clusterShipments.clusterId }).from(clusterShipments).where(inArray(clusterShipments.shipmentId, userShipmentIds));
      validClusterIds = mappings.map(m => m.clusterId);

      if (validClusterIds.length === 0) return res.status(200).json([]);
    }

    // 2. Fetch Clusters
    let query = db.select().from(consolidationClusters);
    if (validClusterIds && validClusterIds.length > 0) {
      query = query.where(inArray(consolidationClusters.id, validClusterIds)) as any;
    }
    const results = await query;
    if (results.length === 0) return res.status(200).json([]);

    // 3. Batch Fetch Mappings & Shipments (Eliminates N+1 Query loop)
    const resultIds = results.map(r => r.id);
    const allMappings = await db.select().from(clusterShipments).where(inArray(clusterShipments.clusterId, resultIds));
    const allShipmentIds = allMappings.map(m => m.shipmentId);
    
    let allShipments: any[] = [];
    if (allShipmentIds.length > 0) {
      allShipments = await db.select().from(shipments).where(inArray(shipments.id, allShipmentIds));
    }

    // 4. Dynamically Calculate Real Cluster Data
    const formattedClusters = results.map((cluster) => {
      const clusterShipmentIds = allMappings.filter(m => m.clusterId === cluster.id).map(m => m.shipmentId);
      const clusterShipmentDetails = allShipments.filter(s => clusterShipmentIds.includes(s.id));
      
      const defaultHubs = getClusterHubs(cluster.id);
      const originName = clusterShipmentDetails[0]?.origin || defaultHubs.originHub.name;
      const destName = clusterShipmentDetails[0]?.destination || defaultHubs.destinationHub.name;
      const originCoords = getLocationCoords(originName);
      const destCoords = getLocationCoords(destName);

      const originHub = {
        name: originName,
        lat: originCoords[0],
        lng: originCoords[1],
        address: `${originName}, Regional Cold Terminal`,
        hubCode: 'ORI-HUB'
      };

      const destinationHub = {
        name: destName,
        lat: destCoords[0],
        lng: destCoords[1],
        address: `${destName}, Delivery Hub`,
        hubCode: 'DST-HUB'
      };
      
      // Calculate true metrics instead of mocking
      const totalWeightKg = clusterShipmentDetails.reduce((sum, s) => sum + (s.weightKg || 1000), 0);
      const cargoCategories = Array.from(new Set(clusterShipmentDetails.map(s => s.cargoType)));
      
      // Find the safe overlapping temperature zone
      const minTemp = clusterShipmentDetails.length > 0 ? Math.max(...clusterShipmentDetails.map(s => s.targetTempMin != null ? s.targetTempMin : 2)) : 2;
      const maxTemp = clusterShipmentDetails.length > 0 ? Math.min(...clusterShipmentDetails.map(s => s.targetTempMax != null ? s.targetTempMax : 8)) : 8;

      return {
        ...cluster,
        code: cluster.id,
        name: `Cluster ${cluster.id}`,
        originHub,
        destinationHub,
        shipmentIds: clusterShipmentIds,
        totalWeightKg,
        maxCapacityKg: 8000, 
        cargoCategories,
        tempBand: `${minTemp}°C to ${maxTemp}°C`,
        assignedRouteId: `RT-${cluster.id.split('-').pop()}`,
        reeferLoadFactorPercent: Math.min(100, Math.round((totalWeightKg / 8000) * 100)),
        railUtilizationPercent: 0,
      };
    });

    res.status(200).json(formattedClusters);
  } catch (error) {
    next(error);
  }
};

export const getClusterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user?.role;
    const businessId = (req as any).user?.businessId;

    const result = await db.select().from(consolidationClusters).where(eq(consolidationClusters.id, id)).limit(1);
    if (result.length === 0) return res.status(404).json({ error: 'Cluster not found' });

    const cluster = result[0];
    const mappings = await db.select({ shipmentId: clusterShipments.shipmentId }).from(clusterShipments).where(eq(clusterShipments.clusterId, cluster.id));
    const shipmentIds = mappings.map(m => m.shipmentId);

    if (userRole === 'business' && businessId) {
      const userShipments = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.businessId, businessId));
      const userShipmentIds = userShipments.map(s => s.id);
      const hasAccess = shipmentIds.some(id => userShipmentIds.includes(id));
      if (!hasAccess) return res.status(403).json({ error: 'Forbidden. Cargo not in cluster.' });
    }

    let clusterShipmentDetails: any[] = [];
    if (shipmentIds.length > 0) {
      clusterShipmentDetails = await db.select().from(shipments).where(inArray(shipments.id, shipmentIds));
    }

    const defaultHubs = getClusterHubs(cluster.id);
    const originName = clusterShipmentDetails[0]?.origin || defaultHubs.originHub.name;
    const destName = clusterShipmentDetails[0]?.destination || defaultHubs.destinationHub.name;
    const originCoords = getLocationCoords(originName);
    const destCoords = getLocationCoords(destName);

    const originHub = {
      name: originName,
      lat: originCoords[0],
      lng: originCoords[1],
      address: `${originName}, Regional Cold Terminal`,
      hubCode: 'ORI-HUB'
    };

    const destinationHub = {
      name: destName,
      lat: destCoords[0],
      lng: destCoords[1],
      address: `${destName}, Delivery Hub`,
      hubCode: 'DST-HUB'
    };
    
    // Calculate true metrics
    const totalWeightKg = clusterShipmentDetails.reduce((sum, s) => sum + (s.weightKg || 1000), 0);
    const cargoCategories = Array.from(new Set(clusterShipmentDetails.map(s => s.cargoType)));
    const minTemp = clusterShipmentDetails.length > 0 ? Math.max(...clusterShipmentDetails.map(s => s.targetTempMin != null ? s.targetTempMin : 2)) : 2;
    const maxTemp = clusterShipmentDetails.length > 0 ? Math.min(...clusterShipmentDetails.map(s => s.targetTempMax != null ? s.targetTempMax : 8)) : 8;

    const formatted = {
      ...cluster,
      code: cluster.id,
      name: `Cluster ${cluster.id}`,
      originHub,
      destinationHub,
      shipmentIds,
      totalWeightKg,
      maxCapacityKg: 8000,
      cargoCategories,
      tempBand: `${minTemp}°C to ${maxTemp}°C`,
      assignedRouteId: `RT-${cluster.id.split('-').pop()}`,
      reeferLoadFactorPercent: Math.min(100, Math.round((totalWeightKg / 8000) * 100)),
      railUtilizationPercent: 0,
    };

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const createCluster = async (req: Request, res: Response, next: NextFunction) => {
  // Can be wired to consolidationEngine.ts later
  res.status(501).json({ error: 'Creation handled internally via AI engine' });
};

export const updateCluster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, costSavingsPercent, co2SavedKg } = req.body;

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (costSavingsPercent !== undefined) updates.costSavingsPercent = Number(costSavingsPercent);
    if (co2SavedKg !== undefined) updates.co2SavedKg = Number(co2SavedKg);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const updated = await db.update(consolidationClusters).set(updates).where(eq(consolidationClusters.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: 'Cluster not found' });

    res.status(200).json({ success: true, cluster: updated[0] });
  } catch (error) {
    next(error);
  }
};
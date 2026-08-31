import { Request, Response, NextFunction } from 'express';
import { consolidationEngine } from '../services/consolidationEngine';
import { db } from '../db';
import { shipments, businesses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { maskCommercialData } from '../middleware/fieldMasking';
import { getShipmentRouteInfo } from '../services/locationHelper';
export const recommendGrouping = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clusters = await consolidationEngine.recommendGrouping();
    res.status(200).json(clusters);
  } catch (error) {
    next(error);
  }
};

export const recommendRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clusterId, originName, destName } = req.body;
    
    if (!clusterId || !originName || !destName) {
      return res.status(400).json({ error: 'clusterId, originName, and destName are required' });
    }

    const route = await consolidationEngine.recommendRoute(clusterId, originName, destName);
    res.status(200).json(route);
  } catch (error) {
    next(error);
  }
};

export const recommendDepartureTime = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clusterId, shipmentIds, route } = req.body;
    
    if (!clusterId || !shipmentIds || !Array.isArray(shipmentIds) || !route) {
      return res.status(400).json({ error: 'clusterId, shipmentIds array, and route object are required' });
    }

    const recommendation = await consolidationEngine.recommendDepartureTime(clusterId, shipmentIds, route);
    res.status(200).json(recommendation);
  } catch (error) {
    next(error);
  }
};

export const recommendPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipmentId } = req.body;
    if (!shipmentId) return res.status(400).json({ error: 'shipmentId is required' });

    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    // 1. Fetch Shipment Summary
    const shpResult = await db.select({
      shipment: shipments,
      business: businesses,
    }).from(shipments)
      .innerJoin(businesses, eq(shipments.businessId, businesses.id))
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (shpResult.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    
    const { shipment, business } = shpResult[0];

    // Enforce business ownership
    if (userRole === 'business' && shipment.businessId !== businessId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this shipment.' });
    }

    const routeInfo = getShipmentRouteInfo(shipment.id, shipment.cargoType, shipment.origin || undefined, shipment.destination || undefined);
    const originName = typeof shipment.origin === 'string' && shipment.origin ? shipment.origin : (routeInfo.origin?.name || routeInfo.origin);
    const destName = typeof shipment.destination === 'string' && shipment.destination ? shipment.destination : (routeInfo.destination?.name || routeInfo.destination);

    const shipmentSummary = {
      id: shipment.id,
      businessName: business.name,
      cargoType: shipment.cargoType,
      targetTempRange: { min: shipment.targetTempMin, max: shipment.targetTempMax },
      weightKg: shipment.weightKg || 1000,
      slaMaxDeliveryHours: shipment.slaMaxDeliveryHours,
      origin: originName,
      destination: destName
    };

    // 2. Candidate Groups
    const allClusters = await consolidationEngine.recommendGrouping();
    let targetCluster = allClusters.find(c => c.shipmentIds.includes(shipmentId));
    
    // If for some reason the shipment wasn't clustered (e.g. no pending status), generate a solo cluster for it
    if (!targetCluster) {
      targetCluster = {
        id: `REC-CLST-SOLO-${shipmentId}`,
        code: `REC-CLST-SOLO-${shipmentId}`,
        name: `AI Solo Cluster: ${originName} -> ${destName}`,
        originHub: { name: originName },
        destinationHub: { name: destName },
        shipmentIds: [shipmentId],
        totalWeightKg: shipment.weightKg || 1000,
        maxCapacityKg: 8000,
        cargoCategories: [shipment.cargoType],
        tempBand: `${shipment.targetTempMin}°C to ${shipment.targetTempMax}°C`,
        status: 'assembling',
        costSavingsPercent: 0,
        co2SavedKg: 0,
        reeferLoadFactorPercent: Math.round(((shipment.weightKg || 1000) / 8000) * 100)
      };
    }

    const candidateGroups = [targetCluster]; // In a real app we might return multiple grouping strategies

    // 3. Recommended Plan and Alternatives
    const recommendedRoute = await consolidationEngine.recommendRoute(
      targetCluster.id, 
      targetCluster.originHub.name, 
      targetCluster.destinationHub.name,
      { preference: req.body.optimizationPreference, slaOverrideHours: req.body.slaOverrideHours ? Number(req.body.slaOverrideHours) : undefined }
    );
    
    // 4. Departure Time
    const departure = await consolidationEngine.recommendDepartureTime(targetCluster.id, targetCluster.shipmentIds, recommendedRoute);

    // 5. Build massive JSON
    const masterJson = {
      shipmentSummary,
      candidateGroups,
      recommendedPlan: {
        id: recommendedRoute.id,
        name: recommendedRoute.name,
        cost: recommendedRoute.cost,
        eta: departure.departureWindow.earliest,
        departureWindow: departure.departureWindow,
        transitTimeHours: recommendedRoute.durationHours,
        vehicle: recommendedRoute.legs[0]?.vehicleType || 'TBD',
        transportModes: Array.from(new Set(recommendedRoute.legs.map((l: any) => l.mode))),
        route: {
          origin: originName,
          destination: destName,
          legs: recommendedRoute.legs
        },
        transferPoints: recommendedRoute.legs.length > 1 ? recommendedRoute.legs.slice(0, -1).map((l: any) => l.destinationName) : [],
        capacityUtilization: targetCluster.reeferLoadFactorPercent,
        delayProbability: recommendedRoute.delayRisk?.score || 0,
        spoilageProbability: recommendedRoute.spoilageRisk?.score || 0,
        slaStatus: (recommendedRoute.durationHours <= (shipment.slaMaxDeliveryHours || 120)) ? 'compliant' : 'violated',
        score: recommendedRoute.score,
        explanation: {
          ...recommendedRoute.explanation,
          departureReasoning: departure.reasoning
        }
      },
      candidatePlans: recommendedRoute.alternativePlans || []
    };

    // 6. Role-based Masking
    res.status(200).json(maskCommercialData(userRole, masterJson));
  } catch (error) {
    next(error);
  }
};


// backend/controllers/demoController.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { shipments, vehicles, deliveryRoutes, routeLegs, consolidationClusters, clusterShipments, incidentReports, temperatureLogEntries, businesses, users } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { consolidationEngine } from '../services/consolidationEngine';
/** Clear demo-related tables (in FK-safe order, topological) */
async function clearDemoData() {
  // Full topological deletion order for all tables:
  // temperatureLogEntries → incidentReports → routeLegs → deliveryRoutes
  //   → clusterShipments → consolidationClusters → vehicles → shipments
  await db.delete(temperatureLogEntries); // FK: → shipments.id
  await db.delete(incidentReports);       // FK: → shipments.id
  await db.delete(routeLegs);             // FK: → delivery_routes.id
  await db.delete(clusterShipments);      // FK: → consolidation_clusters.id + shipments.id
  await db.delete(deliveryRoutes);        // FK: → consolidation_clusters.id
  await db.delete(consolidationClusters);
  await db.delete(vehicles);
  await db.delete(shipments);
}

/** Seed a small, deterministic demo dataset */
async function seedDemoData() {
  const now = new Date();

  // Ensure demo businesses exist (upsert — safe to run even if main seed already ran)
  await db.insert(businesses).values([
    { id: 'BUS-001', name: 'Demo Farm Co.', contactInfo: 'demo@farmco.in' },
    { id: 'BUS-002', name: 'Demo Dairy Ltd.', contactInfo: 'demo@dairy.in' },
    { id: 'BUS-003', name: 'Demo Orchards Pvt.', contactInfo: 'demo@orchards.in' },
  ]).onConflictDoNothing();

  // Ensure demo user for BUS-001 exists (password: demo-access-2026)
  await db.insert(users).values([
    { id: 'USR-BIZ-DEMO-01', email: 'demo@farmco.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'business', businessId: 'BUS-001' },
  ]).onConflictDoNothing();


  // Vehicles – match schema fields
  const [vehicleA] = await db
    .insert(vehicles)
    .values({
      id: 'VEH-001',
      vehicleType: 'reefer_truck',
      capacityKg: 2000,
      minTempC: 0,
      maxTempC: 8,
      currentLocation: 'Bhubaneswar Central Cold Hub',
      status: 'available',
      costPerKmInr: 5,
      reliability: 0.95,
      temperatureControlScore: 0.9,
    })
    .returning();

  const [vehicleB] = await db
    .insert(vehicles)
    .values({
      id: 'VEH-002',
      vehicleType: 'reefer_truck',
      capacityKg: 1500,
      minTempC: 0,
      maxTempC: 8,
      currentLocation: 'Kolkata Distribution Hub',
      status: 'available',
      costPerKmInr: 4.5,
      reliability: 0.92,
      temperatureControlScore: 0.88,
    })
    .returning();

  // Shipments – include required fields from schema
  const baseShipment = {
    businessId: 'BUS-001',
    cargoType: 'berries',
    targetTempMin: 2,
    targetTempMax: 5,
    totalShelfLifeHours: 120,
    remainingShelfLifeHours: 120,
    freshnessPercent: 100,
    slaMaxDeliveryHours: 48,
    slaMaxSpoilagePercent: 5,
    slaPriority: 'high',
    createdAt: now,
    weightKg: 500,
    origin: 'Bhubaneswar Central Cold Hub',
    destination: 'Kolkata Distribution Hub',
  } as const;

  await db.insert(shipments).values([
    { ...baseShipment, id: 'SHP-001' },
    { ...baseShipment, id: 'SHP-002', weightKg: 600 },
    {
      id: 'SHP-003',
      businessId: 'BUS-002',
      cargoType: 'milk',
      targetTempMin: -2,
      targetTempMax: 0,
      totalShelfLifeHours: 96,
      remainingShelfLifeHours: 96,
      freshnessPercent: 100,
      slaMaxDeliveryHours: 24,
      slaMaxSpoilagePercent: 3,
      slaPriority: 'medium',
      createdAt: now,
      weightKg: 400,
      origin: 'Bhubaneswar Central Cold Hub',
      destination: 'Kolkata Distribution Hub',
    },
    {
      id: 'SHP-004',
      businessId: 'BUS-003',
      cargoType: 'berries',
      targetTempMin: 2,
      targetTempMax: 5,
      totalShelfLifeHours: 120,
      remainingShelfLifeHours: 120,
      freshnessPercent: 100,
      slaMaxDeliveryHours: 72,
      slaMaxSpoilagePercent: 5,
      slaPriority: 'low',
      createdAt: now,
      weightKg: 800,
      origin: 'Bhubaneswar Central Cold Hub',
      destination: 'Visakhapatnam Port Hub',
    },
  ]);

  // Use the consolidation engine to group shipments
  const clusters = await consolidationEngine.recommendGrouping();
  
  for (const c of clusters) {
    // 1. Insert Cluster
    const [insertedCluster] = await db.insert(consolidationClusters).values({
      id: c.id,
      costSavingsPercent: c.costSavingsPercent,
      co2SavedKg: c.co2SavedKg,
      status: 'active',
    }).returning();

    // 2. Insert Cluster Shipments
    const csInserts = c.shipmentIds.map((sid: string) => ({
      clusterId: insertedCluster.id,
      shipmentId: sid
    }));
    if (csInserts.length > 0) {
      await db.insert(clusterShipments).values(csInserts);
    }

    // 3. Recommend Route using ML and Optimization
    const route = await consolidationEngine.recommendRoute(
      insertedCluster.id, 
      c.originHub.name, 
      c.destinationHub.name
    );

    // 4. Save Route and Legs
    if (route && route.id) {
      await db.insert(deliveryRoutes).values({
        id: route.id,
        clusterId: insertedCluster.id,
        status: 'active',
        totalCost: route.cost || 10000,
      });

      const legInserts = route.legs.map((leg: any, idx: number) => ({
        id: leg.id || `${route.id}-L${idx+1}`,
        routeId: route.id,
        sequence: leg.legNumber || idx + 1,
        mode: leg.mode,
        origin: leg.originName,
        destination: leg.destinationName,
        reliabilityScore: leg.reliabilityScore || 90,
        onTimePercent: leg.onTimePercent || 95,
        avgDelayMinutes: leg.avgDelayMinutes || 0,
      }));

      if (legInserts.length > 0) {
        await db.insert(routeLegs).values(legInserts);
      }
    }
  }
}

/** Handler – reset + seed demo data. Only admin users should hit this endpoint. */
export const resetDemo = [requireAuth, requireRole(['admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await clearDemoData();
    await seedDemoData();
    res.status(200).json({ success: true, message: 'Demo data loaded' });
  } catch (err) {
    next(err);
  }
}];

import { db } from './db';
import { shipments, consolidationClusters, clusterShipments, deliveryRoutes, routeLegs } from './db/schema';
import { eq, inArray } from 'drizzle-orm';
import { consolidationEngine } from './services/consolidationEngine';

async function runClusteringTest() {
  console.log('=== Running Phase 2 Clustering Logic Test ===');

  const testShp1Id = `TEST-SHP-A-${Date.now()}`;
  const testShp2Id = `TEST-SHP-B-${Date.now()}`;
  const testShpFrozenId = `TEST-SHP-FROZEN-${Date.now()}`;

  try {
    // 1. Insert Test Shipment 1 (Berries, 2-6°C, Cuttack -> Bhubaneswar, 1200kg)
    await db.insert(shipments).values({
      id: testShp1Id,
      businessId: 'BIZ-01',
      cargoType: 'Fresh Strawberries',
      targetTempMin: 2,
      targetTempMax: 6,
      currentTemp: 4,
      totalShelfLifeHours: 120,
      remainingShelfLifeHours: 120,
      freshnessPercent: 100,
      weightKg: 1200,
      origin: 'Cuttack Agro-Packhouse',
      destination: 'Bhubaneswar Wholesale Terminal',
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`\n1. Approving Shipment 1 (${testShp1Id})...`);
    const res1 = await consolidationEngine.consolidateApprovedShipment(testShp1Id);
    console.log(`Result 1: Cluster ID: ${res1.clusterId}, isNew: ${res1.isNew}`);

    // 2. Insert Test Shipment 2 (Compatible: Blueberries, 2-6°C, Cuttack -> Bhubaneswar, 1500kg)
    await db.insert(shipments).values({
      id: testShp2Id,
      businessId: 'BIZ-01',
      cargoType: 'Fresh Blueberries',
      targetTempMin: 2,
      targetTempMax: 6,
      currentTemp: 3,
      totalShelfLifeHours: 120,
      remainingShelfLifeHours: 120,
      freshnessPercent: 100,
      weightKg: 1500,
      origin: 'Cuttack Agro-Packhouse',
      destination: 'Bhubaneswar Wholesale Terminal',
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`\n2. Approving Shipment 2 (${testShp2Id}) - Compatible with Shipment 1...`);
    const res2 = await consolidationEngine.consolidateApprovedShipment(testShp2Id);
    console.log(`Result 2: Cluster ID: ${res2.clusterId}, isNew: ${res2.isNew}`);

    if (res2.clusterId === res1.clusterId && res2.isNew === false) {
      console.log('✅ PASS: Shipment 2 was successfully consolidated into existing Cluster', res1.clusterId);
    } else {
      console.error('❌ FAIL: Expected Shipment 2 to be consolidated into Cluster', res1.clusterId, 'but got', res2.clusterId);
      process.exit(1);
    }

    // 3. Verify mappings in DB
    const clusterMembers = await db.select().from(clusterShipments).where(eq(clusterShipments.clusterId, res1.clusterId));
    const memberShipmentIds = clusterMembers.map(m => m.shipmentId);
    console.log(`Cluster ${res1.clusterId} now has ${clusterMembers.length} shipments:`, memberShipmentIds);

    if (memberShipmentIds.includes(testShp1Id) && memberShipmentIds.includes(testShp2Id)) {
      console.log('✅ PASS: Database mapping table confirms both shipments belong to the same cluster.');
    } else {
      console.error('❌ FAIL: Mappings do not include both test shipments.');
      process.exit(1);
    }

    // 4. Insert Test Shipment 3 (Incompatible: Frozen Seafood, -18°C, Visakhapatnam -> Delhi, 2000kg)
    await db.insert(shipments).values({
      id: testShpFrozenId,
      businessId: 'BIZ-01',
      cargoType: 'Frozen Seafood',
      targetTempMin: -22,
      targetTempMax: -18,
      currentTemp: -20,
      totalShelfLifeHours: 720,
      remainingShelfLifeHours: 720,
      freshnessPercent: 100,
      weightKg: 2000,
      origin: 'Visakhapatnam Port Terminal',
      destination: 'Delhi NCR Logistics Hub',
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`\n3. Approving Incompatible Shipment (${testShpFrozenId}) - Frozen cargo on different route...`);
    const res3 = await consolidationEngine.consolidateApprovedShipment(testShpFrozenId);
    console.log(`Result 3: Cluster ID: ${res3.clusterId}, isNew: ${res3.isNew}`);

    if (res3.clusterId !== res1.clusterId && res3.isNew === true) {
      console.log('✅ PASS: Incompatible shipment was placed into a brand new cluster:', res3.clusterId);
    } else {
      console.error('❌ FAIL: Expected a new cluster for incompatible shipment, got:', res3.clusterId);
      process.exit(1);
    }

    console.log('\n=== ALL PHASE 2 TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runClusteringTest();

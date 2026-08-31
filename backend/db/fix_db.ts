import { db } from './index';
import { shipments, deliveryRoutes, routeLegs, consolidationClusters, clusterShipments, incidentReports, temperatureLogEntries, businesses, users, vehicles } from './schema';
import { consolidationEngine } from '../services/consolidationEngine';

async function fixDb() {
  try {
    console.log('Testing clearDemoData...');
    await db.delete(temperatureLogEntries);
    await db.delete(incidentReports);
    await db.delete(routeLegs);
    await db.delete(clusterShipments);
    await db.delete(deliveryRoutes);
    await db.delete(consolidationClusters);
    await db.delete(shipments);
    console.log('Clear demo data succeeded.');

    console.log('Testing vehicle upsert...');
    await db
      .insert(vehicles)
      .values([
        {
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
        },
        {
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
        }
      ])
      .onConflictDoNothing();
    console.log('Vehicle upsert succeeded.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

fixDb();

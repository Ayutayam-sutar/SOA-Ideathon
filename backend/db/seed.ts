import { db } from './index';
import { users, businesses, shipments, consolidationClusters, clusterShipments, deliveryRoutes, routeLegs, incidentReports, hubs, vehicles } from './schema';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

function readCsv(filename: string) {
  const rootPath = path.join(process.cwd(), '../', filename);
  const currentPath = path.join(process.cwd(), filename);
  
  try {
    if (fs.existsSync(rootPath)) {
      const fileContent = fs.readFileSync(rootPath, 'utf-8');
      return parse(fileContent, { columns: true, skip_empty_lines: true });
    }
    const fileContent = fs.readFileSync(currentPath, 'utf-8');
    return parse(fileContent, { columns: true, skip_empty_lines: true });
  } catch (err) {
    console.log(`⚠️ Could not read ${filename}, skipping...`);
    return [];
  }
}

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Seed Businesses
    await db.insert(businesses).values([
      { id: 'BIZ-01', name: 'Sahyadri Agro Farms', contactInfo: 'contact@sahyadri.in' },
      { id: 'BIZ-02', name: 'Konkan Coast Orchards', contactInfo: 'export@konkanorchards.com' },
      { id: 'BIZ-03', name: 'Nashik Valley Greens & Grapes', contactInfo: 'logistics@nashikvalley.in' },
      { id: 'BIZ-04', name: 'Deccan Highlands Dairy & Fungi', contactInfo: 'supply@deccandairy.com' },
    ]).onConflictDoNothing();

    // 2. Seed Users
    await db.insert(users).values([
      { id: 'USR-ADMIN-01', email: 'admin@karwaan.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'admin' },
      { id: 'USR-BIZ-01', email: 'logistics@sahyadri.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'business', businessId: 'BIZ-01' },
      { id: 'USR-AGENT-01', email: 'agent1@karwaan.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'agent' },
    ]).onConflictDoNothing();

    // 3. Seed Consolidation Clusters
    await db.insert(consolidationClusters).values([
      { id: 'CLST-OD-01', costSavingsPercent: 25, co2SavedKg: 85.0, status: 'in_transit' },
      { id: 'CLST-OD-02', costSavingsPercent: 30, co2SavedKg: 120.0, status: 'in_transit' },
      { id: 'CLST-OD-03', costSavingsPercent: 15, co2SavedKg: 40.0, status: 'in_transit' },
      { id: 'CLST-OD-04', costSavingsPercent: 35, co2SavedKg: 210.0, status: 'in_transit' },
      { id: 'CLST-OD-05', costSavingsPercent: 20, co2SavedKg: 95.0, status: 'in_transit' },
      { id: 'CLST-OD-07', costSavingsPercent: 22, co2SavedKg: 110.0, status: 'in_transit' },
      { id: 'CLST-OD-08', costSavingsPercent: 40, co2SavedKg: 350.0, status: 'in_transit' },
      { id: 'CLST-OD-10', costSavingsPercent: 28, co2SavedKg: 130.0, status: 'in_transit' },
      { id: 'CLST-KOL-01', costSavingsPercent: 20, co2SavedKg: 60.0, status: 'in_transit' },
      { id: 'CLST-KOL-02', costSavingsPercent: 15, co2SavedKg: 30.0, status: 'in_transit' },
      { id: 'CLST-KOL-03', costSavingsPercent: 32, co2SavedKg: 140.0, status: 'in_transit' },
    ]).onConflictDoNothing();

    // 4. Seed Delivery Routes
    await db.insert(deliveryRoutes).values([
      { id: 'RT-OD-01', clusterId: 'CLST-OD-01', status: 'in_transit', totalCost: 15000 },
      { id: 'RT-OD-02', clusterId: 'CLST-OD-02', status: 'in_transit', totalCost: 28000 },
      { id: 'RT-OD-03', clusterId: 'CLST-OD-03', status: 'in_transit', totalCost: 8000 },
      { id: 'RT-OD-04', clusterId: 'CLST-OD-04', status: 'in_transit', totalCost: 25000 },
      { id: 'RT-OD-05', clusterId: 'CLST-OD-05', status: 'in_transit', totalCost: 18000 },
      { id: 'RT-OD-07', clusterId: 'CLST-OD-07', status: 'in_transit', totalCost: 22000 },
      { id: 'RT-OD-08', clusterId: 'CLST-OD-08', status: 'in_transit', totalCost: 65000 },
      { id: 'RT-OD-10', clusterId: 'CLST-OD-10', status: 'in_transit', totalCost: 19000 },
      { id: 'RT-KOL-01', clusterId: 'CLST-KOL-01', status: 'in_transit', totalCost: 12000 },
      { id: 'RT-KOL-02', clusterId: 'CLST-KOL-02', status: 'in_transit', totalCost: 5000 },
      { id: 'RT-KOL-03', clusterId: 'CLST-KOL-03', status: 'in_transit', totalCost: 20000 },
    ]).onConflictDoNothing();

    // 5. Seed Route Legs
    await db.insert(routeLegs).values([
      { id: 'LEG-OD-01-1', routeId: 'RT-OD-01', sequence: 1, mode: 'rail_cold_wagon', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Cuttack', reliabilityScore: 97, onTimePercent: 95, avgDelayMinutes: 5 },
      { id: 'LEG-OD-01-2', routeId: 'RT-OD-01', sequence: 2, mode: 'rail_cold_wagon', origin: 'Cuttack', destination: 'Jajpur', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 6 },
      { id: 'LEG-OD-01-3', routeId: 'RT-OD-01', sequence: 3, mode: 'rail_cold_wagon', origin: 'Jajpur', destination: 'Bhadrak', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 6 },
      { id: 'LEG-OD-01-4', routeId: 'RT-OD-01', sequence: 4, mode: 'rail_cold_wagon', origin: 'Bhadrak', destination: 'Baleswar', reliabilityScore: 95, onTimePercent: 92, avgDelayMinutes: 8 },
      { id: 'LEG-OD-01-5', routeId: 'RT-OD-01', sequence: 5, mode: 'road_reefer', origin: 'Baleswar', destination: 'Baripada', reliabilityScore: 92, onTimePercent: 90, avgDelayMinutes: 12 },
      { id: 'LEG-OD-02-1', routeId: 'RT-OD-02', sequence: 1, mode: 'rail_cold_wagon', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Cuttack', reliabilityScore: 97, onTimePercent: 95, avgDelayMinutes: 5 },
      { id: 'LEG-OD-02-2', routeId: 'RT-OD-02', sequence: 2, mode: 'rail_cold_wagon', origin: 'Cuttack', destination: 'Jajpur', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 6 },
      { id: 'LEG-OD-02-3', routeId: 'RT-OD-02', sequence: 3, mode: 'rail_cold_wagon', origin: 'Jajpur', destination: 'Bhadrak', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 6 },
      { id: 'LEG-OD-02-4', routeId: 'RT-OD-02', sequence: 4, mode: 'rail_cold_wagon', origin: 'Bhadrak', destination: 'Baleswar', reliabilityScore: 95, onTimePercent: 92, avgDelayMinutes: 8 },
      { id: 'LEG-OD-02-5', routeId: 'RT-OD-02', sequence: 5, mode: 'rail_cold_wagon', origin: 'Baleswar', destination: 'Kolkata', reliabilityScore: 94, onTimePercent: 91, avgDelayMinutes: 10 },
      { id: 'LEG-OD-03-1', routeId: 'RT-OD-03', sequence: 1, mode: 'rail_cold_wagon', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Puri', reliabilityScore: 98, onTimePercent: 97, avgDelayMinutes: 5 },
      { id: 'LEG-OD-04-1', routeId: 'RT-OD-04', sequence: 1, mode: 'rail_cold_wagon', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Vizag', reliabilityScore: 94, onTimePercent: 91, avgDelayMinutes: 12 },
      { id: 'LEG-OD-05-1', routeId: 'RT-OD-05', sequence: 1, mode: 'road_reefer', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Rourkela', reliabilityScore: 91, onTimePercent: 88, avgDelayMinutes: 20 },
      { id: 'LEG-OD-07-1', routeId: 'RT-OD-07', sequence: 1, mode: 'road_reefer', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Raipur', reliabilityScore: 89, onTimePercent: 86, avgDelayMinutes: 25 },
      { id: 'LEG-OD-08-01', routeId: 'RT-OD-08', sequence: 1, mode: 'rail_cold_wagon', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Cuttack', reliabilityScore: 97, onTimePercent: 95, avgDelayMinutes: 5 },
      { id: 'LEG-OD-08-02', routeId: 'RT-OD-08', sequence: 2, mode: 'rail_cold_wagon', origin: 'Cuttack', destination: 'Jajpur', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 6 },
      { id: 'LEG-OD-08-03', routeId: 'RT-OD-08', sequence: 3, mode: 'rail_cold_wagon', origin: 'Jajpur', destination: 'Bhadrak', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 6 },
      { id: 'LEG-OD-08-04', routeId: 'RT-OD-08', sequence: 4, mode: 'rail_cold_wagon', origin: 'Bhadrak', destination: 'Baleswar', reliabilityScore: 95, onTimePercent: 92, avgDelayMinutes: 8 },
      { id: 'LEG-OD-08-05', routeId: 'RT-OD-08', sequence: 5, mode: 'rail_cold_wagon', origin: 'Baleswar', destination: 'Hijli', reliabilityScore: 94, onTimePercent: 91, avgDelayMinutes: 10 },
      { id: 'LEG-OD-08-06', routeId: 'RT-OD-08', sequence: 6, mode: 'rail_cold_wagon', origin: 'Hijli', destination: 'Tatanagar Junction', reliabilityScore: 93, onTimePercent: 90, avgDelayMinutes: 12 },
      { id: 'LEG-OD-08-07', routeId: 'RT-OD-08', sequence: 7, mode: 'rail_cold_wagon', origin: 'Tatanagar Junction', destination: 'Muri Junction', reliabilityScore: 94, onTimePercent: 92, avgDelayMinutes: 11 },
      { id: 'LEG-OD-08-08', routeId: 'RT-OD-08', sequence: 8, mode: 'rail_cold_wagon', origin: 'Muri Junction', destination: 'Bokaro Steel City', reliabilityScore: 95, onTimePercent: 93, avgDelayMinutes: 9 },
      { id: 'LEG-OD-08-09', routeId: 'RT-OD-08', sequence: 9, mode: 'rail_cold_wagon', origin: 'Bokaro Steel City', destination: 'Gomoh Junction', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 7 },
      { id: 'LEG-OD-08-10', routeId: 'RT-OD-08', sequence: 10, mode: 'rail_cold_wagon', origin: 'Gomoh Junction', destination: 'Koderma Junction', reliabilityScore: 95, onTimePercent: 93, avgDelayMinutes: 8 },
      { id: 'LEG-OD-08-11', routeId: 'RT-OD-08', sequence: 11, mode: 'rail_cold_wagon', origin: 'Koderma Junction', destination: 'Gaya Junction', reliabilityScore: 94, onTimePercent: 92, avgDelayMinutes: 10 },
      { id: 'LEG-OD-08-12', routeId: 'RT-OD-08', sequence: 12, mode: 'rail_cold_wagon', origin: 'Gaya Junction', destination: 'PT. Deen Dayal Upadhyaya Junction', reliabilityScore: 95, onTimePercent: 93, avgDelayMinutes: 9 },
      { id: 'LEG-OD-08-13', routeId: 'RT-OD-08', sequence: 13, mode: 'rail_cold_wagon', origin: 'PT. Deen Dayal Upadhyaya Junction', destination: 'Prayagraj Junction', reliabilityScore: 93, onTimePercent: 91, avgDelayMinutes: 12 },
      { id: 'LEG-OD-08-14', routeId: 'RT-OD-08', sequence: 14, mode: 'rail_cold_wagon', origin: 'Prayagraj Junction', destination: 'Kanpur Central', reliabilityScore: 94, onTimePercent: 92, avgDelayMinutes: 11 },
      { id: 'LEG-OD-08-15', routeId: 'RT-OD-08', sequence: 15, mode: 'rail_cold_wagon', origin: 'Kanpur Central', destination: 'New Delhi', reliabilityScore: 96, onTimePercent: 94, avgDelayMinutes: 8 },
      { id: 'LEG-OD-10-1', routeId: 'RT-OD-10', sequence: 1, mode: 'road_reefer', origin: 'Bhubaneswar Wholesale Terminal', destination: 'Koraput', reliabilityScore: 90, onTimePercent: 87, avgDelayMinutes: 18 },
      { id: 'LEG-OD-10-2', routeId: 'RT-OD-10', sequence: 2, mode: 'road_reefer', origin: 'Koraput', destination: 'Malkangiri', reliabilityScore: 88, onTimePercent: 85, avgDelayMinutes: 22 },
      { id: 'LEG-KOL-01-1', routeId: 'RT-KOL-01', sequence: 1, mode: 'road_reefer', origin: 'Kolkata', destination: 'Dhanbad', reliabilityScore: 91, onTimePercent: 88, avgDelayMinutes: 15 },
      { id: 'LEG-KOL-02-1', routeId: 'RT-KOL-02', sequence: 1, mode: 'road_reefer', origin: 'Kolkata', destination: 'Diamond Harbour', reliabilityScore: 94, onTimePercent: 92, avgDelayMinutes: 10 },
      { id: 'LEG-KOL-03-1', routeId: 'RT-KOL-03', sequence: 1, mode: 'rail_cold_wagon', origin: 'Kolkata', destination: 'Patna', reliabilityScore: 93, onTimePercent: 90, avgDelayMinutes: 14 },
    ]).onConflictDoNothing();

    console.log('📦 Parsing CSV datasets...');
    
    // Seed Hubs
    const hubsData = readCsv('hubs_clean.csv');
    if (hubsData.length > 0) {
      const hubsToInsert = hubsData.map((row: any) => ({
        id: String(row.hub_id),
        name: String(row.hub_name),
        city: String(row.city),
        roadAccess: Number(row.road_access),
        railAccess: Number(row.rail_access),
        coldStorage: Number(row.cold_storage),
        reeferCrossDock: Number(row.reefer_cross_dock),
        capacityKg: Number(row.capacity_kg),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        handlingCostPerKg: Number(row.handling_cost_per_kg),
        coldStorageCostPerKgHr: Number(row.cold_storage_cost_per_kg_hr),
      }));
      await db.insert(hubs).values(hubsToInsert).onConflictDoNothing();
      console.log(`✅ Seeded ${hubsToInsert.length} hubs from CSV.`);
    }

    // Seed Vehicles
    const vehiclesData = readCsv('vehicles_clean.csv');
    if (vehiclesData.length > 0) {
      const vehiclesToInsert = vehiclesData.map((row: any) => ({
        id: String(row.vehicle_id),
        vehicleType: String(row.vehicle_type),
        capacityKg: Number(row.capacity_kg),
        minTempC: Number(row.min_temp_c),
        maxTempC: Number(row.max_temp_c),
        currentLocation: String(row.current_location),
        status: String(row.status),
        costPerKmInr: Number(row.cost_per_km_inr),
        reliability: Number(row.reliability),
        temperatureControlScore: Number(row.temperature_control_score),
      }));
      await db.insert(vehicles).values(vehiclesToInsert).onConflictDoNothing();
      console.log(`✅ Seeded ${vehiclesToInsert.length} vehicles from CSV.`);
    }

    // Seed Shipments
    const shipmentsData = readCsv('current_shipments_clean.csv');
    if (shipmentsData.length > 0) {
      const shipmentsToInsert = shipmentsData.map((row: any) => ({
        id: String(row.shipment_id),
        businessId: String(row.shipper_id),
        cargoType: String(row.product_type),
        targetTempMin: Number(row.required_min_temp_c),
        targetTempMax: Number(row.required_max_temp_c),
        weightKg: Number(row.weight_kg),
        origin: String(row.origin),
        destination: String(row.destination),
        pickupStartHour: Number(row.pickup_start_hour),
        pickupEndHour: Number(row.pickup_end_hour),
        deliveryDeadlineHr: Number(row.delivery_deadline_hr),
        slaPriority: String(row.priority),
        currentTemp: Number(row.required_min_temp_c) + 2,
        totalShelfLifeHours: 72,
        remainingShelfLifeHours: 72,
        freshnessPercent: 100
      }));

      const distinctBusinessIds = [...new Set(shipmentsToInsert.map((s: any) => s.businessId))];
      const businessesToInsert = distinctBusinessIds.map((id: unknown) => ({
        id: String(id),
        name: `Imported Business ${id}`,
        contactInfo: `${id}@example.com`
      }));
      await db.insert(businesses).values(businessesToInsert).onConflictDoNothing();

      await db.insert(shipments).values(shipmentsToInsert).onConflictDoNothing();
      console.log(`✅ Seeded ${shipmentsToInsert.length} current shipments from CSV.`);
    }

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
import { db } from './index';
import {
  users, businesses, shipments, consolidationClusters, clusterShipments,
  deliveryRoutes, routeLegs, incidentReports, hubs, vehicles,
  vehicleAvailability, temperatureLogEntries
} from './schema';
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

/** Insert rows in batches to avoid query-size limits on Neon */
async function batchInsert(table: any, rows: any[], batchSize = 500, label = '') {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await db.insert(table).values(batch).onConflictDoNothing();
    inserted += batch.length;
    if (label) {
      process.stdout.write(`\r   ${label}: ${inserted}/${rows.length}`);
    }
  }
  if (label) console.log(); // newline after progress
  return inserted;
}

/** Map CSV route mode values to the schema's route_mode enum */
function mapRouteMode(csvMode: string): 'road_reefer' | 'rail_cold_wagon' | 'hub_transfer' | 'local_transport' {
  switch (csvMode.toLowerCase().trim()) {
    case 'road': return 'road_reefer';
    case 'rail': return 'rail_cold_wagon';
    case 'local': return 'local_transport';
    case 'hub': return 'hub_transfer';
    default: return 'road_reefer';
  }
}

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // ── 1. Seed Businesses (hardcoded) ──────────────────────────────────
    await db.insert(businesses).values([
      { id: 'BIZ-01', name: 'Sahyadri Agro Farms', contactInfo: 'contact@sahyadri.in' },
      { id: 'BIZ-02', name: 'Konkan Coast Orchards', contactInfo: 'export@konkanorchards.com' },
      { id: 'BIZ-03', name: 'Nashik Valley Greens & Grapes', contactInfo: 'logistics@nashikvalley.in' },
      { id: 'BIZ-04', name: 'Deccan Highlands Dairy & Fungi', contactInfo: 'supply@deccandairy.com' },
    ]).onConflictDoNothing();
    console.log('✅ Seeded 4 businesses.');

    // ── 2. Seed Users (hardcoded) ───────────────────────────────────────
    await db.insert(users).values([
      { id: 'USR-ADMIN-01', email: 'admin@karwaan.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'admin' },
      { id: 'USR-BIZ-01', email: 'logistics@sahyadri.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'business', businessId: 'BIZ-01' },
      { id: 'USR-AGENT-01', email: 'agent1@karwaan.in', passwordHash: '$2b$10$kTCEHO1NFipwfDr9yhxqZOZe8vCoZbvtE1lB3N4USvVuNfub30MVG', role: 'agent' },
    ]).onConflictDoNothing();
    console.log('✅ Seeded 3 users.');

    // ── 3. Seed Consolidation Clusters (hardcoded) ──────────────────────
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
    console.log('✅ Seeded 11 consolidation clusters.');

    // ═══════════════════════════════════════════════════════════════════
    //  CSV-Driven Seeding
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n📦 Parsing CSV datasets...');

    // ── 4. Seed Hubs from CSV ───────────────────────────────────────────
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

    // ── 5. Seed Vehicles from CSV ───────────────────────────────────────
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

    // ── 6. Seed Routes from routes_clean.csv ────────────────────────────
    //    (replaces old hardcoded deliveryRoutes + routeLegs)
    const routesData = readCsv('routes_clean.csv');
    if (routesData.length > 0) {
      // 6a. Insert delivery routes
      const routesToInsert = routesData.map((row: any) => ({
        id: String(row.route_id),
        status: 'available' as const,
        totalCost: Number(row.base_cost_inr) || 0,
      }));
      await batchInsert(deliveryRoutes, routesToInsert, 500, 'Routes');
      console.log(`✅ Seeded ${routesToInsert.length} delivery routes from routes_clean.csv.`);

      // 6b. Insert one route leg per route
      const legsToInsert = routesData.map((row: any) => ({
        id: `${String(row.route_id)}-L1`,
        routeId: String(row.route_id),
        sequence: 1,
        mode: mapRouteMode(String(row.mode)),
        origin: String(row.origin),
        destination: String(row.destination),
        reliabilityScore: Number(row.reliability) * 100 || 85, // CSV stores as 0-1 fraction
        onTimePercent: Number(row.reliability) * 100 || 85,
        avgDelayMinutes: Math.round(((Number(row.avg_transit_hr) || 0) * 60) * (1 - (Number(row.reliability) || 0.85)) ) || 10,
      }));
      await batchInsert(routeLegs, legsToInsert, 500, 'Route Legs');
      console.log(`✅ Seeded ${legsToInsert.length} route legs from routes_clean.csv.`);
    }

    // ── 7. Seed Vehicle Availability from vehicle_availability_clean.csv ─
    const vaData = readCsv('vehicle_availability_clean.csv');
    if (vaData.length > 0) {
      const vaToInsert = vaData.map((row: any) => ({
        id: String(row.availability_id),
        vehicleId: String(row.vehicle_id),
        date: String(row.date),
        vehicleType: String(row.vehicle_type),
        capacityKg: Number(row.capacity_kg),
        minTempC: Number(row.min_temp_c),
        maxTempC: Number(row.max_temp_c),
        homeLocation: String(row.home_location),
        currentLocation: String(row.current_location),
        availabilityStatus: String(row.availability_status),
        availableFrom: String(row.available_from || ''),
        availableUntil: String(row.available_until || ''),
        estimatedCostPerKm: Number(row.estimated_cost_per_km) || 0,
        maintenanceStatus: String(row.maintenance_status || 'good'),
        utilizationRate: Number(row.utilization_rate) || 0,
      }));
      const vaCount = await batchInsert(vehicleAvailability, vaToInsert, 500, 'Vehicle Availability');
      console.log(`✅ Seeded ${vaCount} vehicle availability records from CSV.`);
    }

    // ── 8. Seed Current Shipments from current_shipments_clean.csv ──────
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

    // ── 9. Seed Historical Shipments from historical_shipments_clean.csv ─
    //    (Required: temperature_history_clean.csv references these HS* IDs via FK)
    const histShipmentsData = readCsv('historical_shipments_clean.csv');
    if (histShipmentsData.length > 0) {
      // Ensure a default business exists for historical shipments
      await db.insert(businesses).values([
        { id: 'BIZ-HIST', name: 'Historical Import', contactInfo: 'historical@karwaan.in' }
      ]).onConflictDoNothing();

      const histToInsert = histShipmentsData.map((row: any) => ({
        id: String(row.shipment_id),
        businessId: 'BIZ-HIST',
        cargoType: String(row.product_type),
        targetTempMin: Number(row.required_min_temp_c),
        targetTempMax: Number(row.required_max_temp_c),
        weightKg: Math.round(Number(row.weight_kg)) || 0,
        origin: String(row.origin),
        destination: String(row.destination),
        pickupStartHour: Math.round(Number(row.pickup_hour)) || 0,
        deliveryDeadlineHr: Math.round(Number(row.delivery_deadline_hr)) || 0,
        totalShelfLifeHours: 72,
        remainingShelfLifeHours: 0,  // historical — already delivered
        freshnessPercent: 0,
      }));
      const histCount = await batchInsert(shipments, histToInsert, 500, 'Historical Shipments');
      console.log(`✅ Seeded ${histCount} historical shipments from CSV.`);
    }

    // ── 10. Seed Temperature History from temperature_history_clean.csv ──
    const tempData = readCsv('temperature_history_clean.csv');
    if (tempData.length > 0) {
      const baseTime = new Date('2025-01-01T00:00:00Z');

      const tempToInsert = tempData.map((row: any) => ({
        shipmentId: String(row.shipment_id),
        timestamp: new Date(baseTime.getTime() + (Number(row.hour_from_departure) || 0) * 3600000),
        temp: Number(row.temperature_c),
        location: 'in_transit',
      }));
      const tempCount = await batchInsert(temperatureLogEntries, tempToInsert, 500, 'Temperature Logs');
      console.log(`✅ Seeded ${tempCount} temperature log entries from CSV.`);
    }

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
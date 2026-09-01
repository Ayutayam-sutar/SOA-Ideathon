import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { hubs } from '../db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

function loadHubsFromCsv() {
  const possiblePaths = [
    path.join(process.cwd(), '../hubs_clean.csv'),
    path.join(process.cwd(), 'hubs_clean.csv'),
    path.join(__dirname, '../../hubs_clean.csv'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const fileContent = fs.readFileSync(p, 'utf-8');
      const rows = parse(fileContent, { columns: true, skip_empty_lines: true });
      return rows.map((r: any) => ({
        id: String(r.hub_id),
        name: String(r.hub_name),
        city: String(r.city),
        roadAccess: Number(r.road_access) || 1,
        railAccess: Number(r.rail_access) || 0,
        coldStorage: Number(r.cold_storage) || 1,
        reeferCrossDock: Number(r.reefer_cross_dock) || 0,
        capacityKg: Number(r.capacity_kg) || 5000,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        handlingCostPerKg: Number(r.handling_cost_per_kg) || 2.0,
        coldStorageCostPerKgHr: Number(r.cold_storage_cost_per_kg_hr) || 0.15,
        hubCode: String(r.hub_id),
      }));
    }
  }
  return [];
}

export const getHubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbHubs = await db.select().from(hubs);
    if (dbHubs.length === 0) {
      const csvHubs = loadHubsFromCsv();
      return res.status(200).json(csvHubs);
    }
    const formatted = dbHubs.map(h => ({
      ...h,
      hubCode: h.id,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    try {
      const csvHubs = loadHubsFromCsv();
      return res.status(200).json(csvHubs);
    } catch {
      next(error);
    }
  }
};

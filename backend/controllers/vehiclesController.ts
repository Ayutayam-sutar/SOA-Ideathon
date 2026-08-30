import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { vehicles } from '../db/schema';

export const getVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allVehicles = await db.select().from(vehicles);
    res.status(200).json({ vehicles: allVehicles });
  } catch (error) {
    next(error);
  }
};

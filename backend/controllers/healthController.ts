import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    // Perform a basic query to verify DB connectivity
    const result = await db.execute(sql`SELECT 1 as health`);
    
    if (result.rows.length > 0) {
      res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ status: 'error', message: 'Database returned empty result' });
    }
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

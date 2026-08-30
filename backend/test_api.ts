import { Request, Response } from 'express';
import { recommendPlan } from './controllers/recommendationsController';
import { db } from './db';
import { shipments } from './db/schema';

// Mock Express Next function
const next = (err?: any) => {
  if (err) console.error("Error passed to next:", err);
};

async function testApi() {
  console.log("=== Testing recommendPlan API Endpoint ===");
  
  // Pick an arbitrary shipment
  const allShipments = await db.select().from(shipments).limit(1);
  if (allShipments.length === 0) {
    console.log("No shipments found in DB!");
    process.exit(1);
  }
  const targetShipmentId = allShipments[0].id;
  const businessId = allShipments[0].businessId;

  console.log(`\nTesting as ADMIN...`);
  await runMockRequest(targetShipmentId, { role: 'admin', businessId: null });

  console.log(`\nTesting as BUSINESS (Owning)...`);
  await runMockRequest(targetShipmentId, { role: 'business', businessId });

  console.log(`\nTesting as AGENT (Masked Commercial Data)...`);
  await runMockRequest(targetShipmentId, { role: 'agent', businessId: null });
  
  process.exit(0);
}

async function runMockRequest(shipmentId: string, user: any) {
  return new Promise<void>((resolve) => {
    const req = {
      body: { shipmentId },
      user
    } as unknown as Request;
    
    const res = {
      status: (code: number) => {
        return {
          json: (data: any) => {
            console.log(`[Status ${code}] JSON Payload length: ${JSON.stringify(data).length} chars`);
            if (user.role === 'agent') {
              // Verify masking
              console.log("Agent Mode Check: Is 'cost' present in recommendedPlan?", data.recommendedPlan?.cost !== undefined ? "YES (FAIL)" : "NO (PASS)");
              console.log("Agent Mode Check: Is 'cost' present in candidatePlans[0]?", data.candidatePlans?.[0]?.cost !== undefined ? "YES (FAIL)" : "NO (PASS)");
            }
            if (user.role === 'admin') {
              console.log("Admin Mode Check: Is 'cost' present in recommendedPlan?", data.recommendedPlan?.cost !== undefined ? "YES (PASS)" : "NO (FAIL)");
            }
            resolve();
          }
        }
      }
    } as unknown as Response;

    recommendPlan(req, res, next);
  });
}

testApi().catch(console.error);

/**
 * routeCompletionService.ts
 *
 * GPS-ready abstraction for completing a delivery route.
 * Currently triggered manually via the "Finish Delivery" button.
 * Structured so a future GPS webhook can call updateRouteStatus()
 * directly when the truck breaches the destination geofence.
 */

import { db } from '../db';
import { deliveryRoutes, clusterShipments, shipments, consolidationClusters } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

export interface RouteCompletionResult {
  routeId: string;
  status: 'completed';
  deliveredShipmentIds: string[];
  lat?: number;
  lng?: number;
  completedAt: string;
}

/**
 * Marks a route as COMPLETED and cascades the status change to all
 * consolidated shipments within it (IN_TRANSIT → DELIVERED).
 *
 * @param routeId   - The delivery route ID
 * @param lat       - Optional GPS latitude (for future geofence triggers)
 * @param lng       - Optional GPS longitude (for future geofence triggers)
 */
export async function updateRouteStatus(
  routeId: string,
  lat?: number,
  lng?: number
): Promise<RouteCompletionResult> {
  // 1. Validate route exists
  const routeRows = await db.select().from(deliveryRoutes).where(eq(deliveryRoutes.id, routeId)).limit(1);
  if (routeRows.length === 0) {
    throw new Error(`Route ${routeId} not found`);
  }

  const route = routeRows[0];
  if (route.status === 'completed') {
    // Idempotent: already completed — return without error
    return {
      routeId,
      status: 'completed',
      deliveredShipmentIds: [],
      lat,
      lng,
      completedAt: new Date().toISOString(),
    };
  }

  // 2. Mark the route itself as completed
  await db
    .update(deliveryRoutes)
    .set({ status: 'completed' })
    .where(eq(deliveryRoutes.id, routeId));

  // 3. Find all shipment IDs in this route's cluster
  let deliveredShipmentIds: string[] = [];
  if (route.clusterId) {
    const clusterMappings = await db
      .select({ shipmentId: clusterShipments.shipmentId })
      .from(clusterShipments)
      .where(eq(clusterShipments.clusterId, route.clusterId));

    deliveredShipmentIds = clusterMappings.map((m) => m.shipmentId);

    // 4. Cascade: update all in-transit shipments to delivered
    if (deliveredShipmentIds.length > 0) {
      await db
        .update(shipments)
        .set({ status: 'delivered' })
        .where(inArray(shipments.id, deliveredShipmentIds));

      console.log(
        `[RouteCompletion] Route ${routeId} completed. ${deliveredShipmentIds.length} shipments marked DELIVERED.`,
        lat != null ? `GPS: (${lat}, ${lng})` : '(manual trigger)'
      );
    }

    // 5. Mark the cluster as delivered too
    await db
      .update(consolidationClusters)
      .set({ status: 'delivered' })
      .where(eq(consolidationClusters.id, route.clusterId));
  }

  return {
    routeId,
    status: 'completed',
    deliveredShipmentIds,
    lat,
    lng,
    completedAt: new Date().toISOString(),
  };
}

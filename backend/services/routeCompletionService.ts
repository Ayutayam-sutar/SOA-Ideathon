/**
 * routeCompletionService.ts
 *
 * GPS-ready abstraction for completing a delivery route.
 * Triggered manually via the "Finish Delivery" button.
 * Structured so a future GPS webhook can call updateRouteStatus()
 * directly when the truck breaches the destination geofence.
 */

import { db } from '../db';
import { deliveryRoutes, clusterShipments, shipments, consolidationClusters } from '../db/schema';
import { eq, inArray, like } from 'drizzle-orm';

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
 * @param routeId          - The delivery route ID
 * @param lat              - Optional GPS latitude
 * @param lng              - Optional GPS longitude
 * @param vehicleDisplayStr - Human-readable vehicle string (e.g. "OD-07-H-8821 (Ashok Leyland 16T)")
 *                           used to match shipments.assignedVehicle when clusterId is stale/missing
 */
export async function updateRouteStatus(
  routeId: string,
  lat?: number,
  lng?: number,
  vehicleDisplayStr?: string
): Promise<RouteCompletionResult> {
  // 1. Validate route exists
  const routeRows = await db.select().from(deliveryRoutes).where(eq(deliveryRoutes.id, routeId)).limit(1);
  if (routeRows.length === 0) {
    throw new Error(`Route ${routeId} not found`);
  }

  const route = routeRows[0];
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


  // 6. Vehicle fallback: match shipments by assignedVehicle plate prefix
  //    Covers the case where dispatch set shipments.assignedVehicle but didn't update the route's clusterId.
  //    vehicleDisplayStr is passed from completeRoute controller and contains the real OD-XX plate string.
  const vehicleStr = vehicleDisplayStr || '';
  const platePrefix = vehicleStr.split(' ')[0]; // e.g. "OD-07-H-8821"

  if (platePrefix && platePrefix.startsWith('OD-')) {
    const vehicleRows = await db
      .select({ id: shipments.id, clusterId: clusterShipments.clusterId })
      .from(shipments)
      .leftJoin(clusterShipments, eq(clusterShipments.shipmentId, shipments.id))
      .where(like(shipments.assignedVehicle, `${platePrefix}%`));

    const vehicleShipmentIds = vehicleRows
      .map(s => s.id)
      .filter(id => !deliveredShipmentIds.includes(id));

    if (vehicleShipmentIds.length > 0) {
      await db
        .update(shipments)
        .set({ status: 'delivered' })
        .where(inArray(shipments.id, vehicleShipmentIds));

      deliveredShipmentIds = [...deliveredShipmentIds, ...vehicleShipmentIds];
      console.log(`[RouteCompletion] ${vehicleShipmentIds.length} shipments DELIVERED via vehicle fallback (${platePrefix}).`);
    }
  }

  // 7. Universal cluster cascade: Mark all clusters containing ANY delivered shipment as 'delivered'
  if (deliveredShipmentIds.length > 0) {
    const parentClusters = await db
      .select({ clusterId: clusterShipments.clusterId })
      .from(clusterShipments)
      .where(inArray(clusterShipments.shipmentId, deliveredShipmentIds));

    const uniqueClusterIds = [...new Set(parentClusters.map((c) => c.clusterId))];
    if (uniqueClusterIds.length > 0) {
      await db
        .update(consolidationClusters)
        .set({ status: 'delivered' })
        .where(inArray(consolidationClusters.id, uniqueClusterIds));

      console.log(`[RouteCompletion] ${uniqueClusterIds.length} cluster(s) marked DELIVERED via parent shipment cascade:`, uniqueClusterIds);
    }
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

import { apiClient } from '../lib/apiClient';
import {
  User,
  Shipment,
  ConsolidationCluster,
  DeliveryRoute,
  IncidentReport,
  BusinessEntity,
  IncidentType,
} from '../types';

class DataService {
  // Users & Auth 
  public async getActiveUser(): Promise<User | null> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.user;
    } catch {
      return null;
    }
  }

  public async getUsers(): Promise<User[]> {
    return [];
  }

  public async getBusinesses(): Promise<BusinessEntity[]> {
    return [];
  }

  public async getBusinessById(id: string): Promise<BusinessEntity | undefined> {
    return undefined;
  }

  // Vehicles
  public async getVehicles(): Promise<any[]> {
    try {
      const res = await apiClient.get('/vehicles');
      return Array.isArray(res) ? res : res.vehicles || [];
    } catch {
      return [];
    }
  }

  // Shipments
  public async getShipments(): Promise<Shipment[]> {
    const data = await apiClient.get('/shipments');
    return Array.isArray(data) ? data : data.shipments || [];
  }

  public async getShipmentById(id: string): Promise<Shipment | undefined> {
    try {
      const data = await apiClient.get(`/shipments/${id}`);
      return data.id ? data : data.shipment;
    } catch {
      return undefined;
    }
  }

  public async getShipmentsByBusiness(businessId: string): Promise<Shipment[]> {
    const data = await apiClient.get('/shipments');
    return Array.isArray(data) ? data : data.shipments || [];
  }

  public async createShipment(data: {
    businessId: string;
    cargoType: string;
    category: Shipment['category'];
    weightKg: number;
    volumeCbm: number;
    originName: string;
    originLat: number;
    originLng: number;
    originAddress: string;
    destinationName: string;
    destinationLat: number;
    destinationLng: number;
    destinationAddress: string;
    targetTempMin: number;
    targetTempMax: number;
    totalShelfLifeHours?: number;
    slaMaxDeliveryHours?: number;
    slaMaxSpoilagePercent?: number;
    slaPriority?: string;
    deliveryDeadline: string;
    notes?: string;
  }): Promise<Shipment> {
    const res = await apiClient.post('/shipments', data);
    return res.shipment;
  }

  // Clusters & Routes
  public async getClusters(): Promise<ConsolidationCluster[]> {
    const res = await apiClient.get('/clusters');
    return Array.isArray(res) ? res : res.clusters || [];
  }

  public async getClusterById(id: string): Promise<ConsolidationCluster | undefined> {
    try {
      const res = await apiClient.get(`/clusters/${id}`);
      return res.id ? res : res.cluster;
    } catch {
      return undefined;
    }
  }

  public async getRoutes(): Promise<DeliveryRoute[]> {
    const res = await apiClient.get('/routes');
    return Array.isArray(res) ? res : res.routes || [];
  }

  public async getRouteById(id: string): Promise<DeliveryRoute | undefined> {
    try {
      const res = await apiClient.get(`/routes/${id}`);
      return res.id ? res : res.route;
    } catch {
      return undefined;
    }
  }

  public async markStopCompleted(routeId: string, stopId: string): Promise<void> {
    await apiClient.patch(`/routes/${routeId}`, { action: 'complete_stop', stopId });
  }

  // Incidents
  public async getIncidents(): Promise<IncidentReport[]> {
    const res = await apiClient.get('/incidents');
    return Array.isArray(res) ? res : res.incidents || [];
  }

  public async getIncidentById(id: string): Promise<IncidentReport | undefined> {
    try {
      const res = await apiClient.get(`/incidents/${id}`);
      return res.id ? res : res.incident;
    } catch {
      return undefined;
    }
  }

  public async createIncident(data: {
    routeId: string;
    shipmentId: string;
    type: IncidentType;
    severity: IncidentReport['severity'];
    locationName: string;
    locationCoords?: [number, number];
    notes: string;
    agentId: string;
  }): Promise<IncidentReport> {
    const res = await apiClient.post('/incidents', data);
    return res.incident;
  }

  public async reoptimizeRoute(routeId: string, incidentId: string): Promise<void> {
    await apiClient.post(`/routes/${routeId}/reoptimize`, { incidentId });
  }

  public async resolveIncident(incidentId: string): Promise<void> {
    await apiClient.patch(`/incidents/${incidentId}`, { status: 'resolved' });
  }

  // Recommendations
  public async recommendRoute(clusterId: string, originName: string, destName: string): Promise<any> {
    return apiClient.post('/recommendations/route', { clusterId, originName, destName });
  }

  public async recommendDepartureTime(clusterId: string, shipmentIds: string[], route: any): Promise<{ departureWindow: { earliest: string, latest: string }, reasoning: string }> {
    return apiClient.post('/recommendations/departure-time', { clusterId, shipmentIds, route });
  }

  public async getAIPlan(shipmentId: string, options?: { optimizationPreference?: string; slaOverrideHours?: number }): Promise<any> {
    // Send both optimizationPreference and fallback preference parameter mapping to guarantee backend compatibility
    const payload = {
      shipmentId,
      optimizationPreference: options?.optimizationPreference,
      preference: options?.optimizationPreference,
      slaOverrideHours: options?.slaOverrideHours
    };
    return apiClient.post('/recommendations/plan', payload);
  }

  public async resetDemoData(): Promise<void> {
    try {
      await apiClient.post('/demo/reset');
    } catch (err) {
      console.error('Failed to reset demo data:', err);
      throw err;
    }
  }
}

export const dataService = new DataService();
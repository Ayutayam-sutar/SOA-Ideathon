import { apiClient } from '../lib/apiClient';
import {
  User,
  Shipment,
  ConsolidationCluster,
  DeliveryRoute,
  IncidentReport,
  BusinessEntity,
  IncidentType,
  Hub,
} from '../types';

export const DEFAULT_HUBS: Hub[] = [
  { id: 'H001', name: 'Bhubaneswar Central Cold Hub', city: 'Bhubaneswar', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 7000, latitude: 20.2961, longitude: 85.8245, handlingCostPerKg: 2.35, coldStorageCostPerKgHr: 0.12, hubCode: 'BBS' },
  { id: 'H002', name: 'Cuttack Agro Hub', city: 'Cuttack', roadAccess: 1, railAccess: 0, coldStorage: 1, reeferCrossDock: 1, capacityKg: 5000, latitude: 20.4625, longitude: 85.8830, handlingCostPerKg: 1.68, coldStorageCostPerKgHr: 0.17, hubCode: 'CTC' },
  { id: 'H003', name: 'Berhampur Collection Hub', city: 'Berhampur', roadAccess: 1, railAccess: 0, coldStorage: 1, reeferCrossDock: 0, capacityKg: 4500, latitude: 19.3150, longitude: 84.7941, handlingCostPerKg: 2.52, coldStorageCostPerKgHr: 0.09, hubCode: 'BAM' },
  { id: 'H004', name: 'Puri Agri Hub', city: 'Puri', roadAccess: 1, railAccess: 0, coldStorage: 1, reeferCrossDock: 0, capacityKg: 3500, latitude: 19.8135, longitude: 85.8312, handlingCostPerKg: 2.19, coldStorageCostPerKgHr: 0.22, hubCode: 'PURI' },
  { id: 'H005', name: 'Gopalpur Port Logistics Hub', city: 'Gopalpur', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 0, capacityKg: 4000, latitude: 19.2586, longitude: 84.9145, handlingCostPerKg: 0.99, coldStorageCostPerKgHr: 0.19, hubCode: 'GPL' },
  { id: 'H006', name: 'Balasore Cold Hub', city: 'Balasore', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 5000, latitude: 21.4942, longitude: 86.9317, handlingCostPerKg: 2.75, coldStorageCostPerKgHr: 0.21, hubCode: 'BLS' },
  { id: 'H007', name: 'Kharagpur Multimodal Hub', city: 'Kharagpur', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 6500, latitude: 22.3460, longitude: 87.2320, handlingCostPerKg: 2.32, coldStorageCostPerKgHr: 0.14, hubCode: 'KGP' },
  { id: 'H008', name: 'Kolkata Distribution Hub', city: 'Kolkata', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 10000, latitude: 22.5726, longitude: 88.3639, handlingCostPerKg: 2.37, coldStorageCostPerKgHr: 0.25, hubCode: 'CCU' },
  { id: 'H009', name: 'Jamshedpur Multimodal Hub', city: 'Jamshedpur', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 6000, latitude: 22.8046, longitude: 86.2029, handlingCostPerKg: 1.06, coldStorageCostPerKgHr: 0.23, hubCode: 'JSR' },
  { id: 'H010', name: 'Rourkela Logistics Hub', city: 'Rourkela', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 0, capacityKg: 4500, latitude: 22.2604, longitude: 84.8536, handlingCostPerKg: 1.70, coldStorageCostPerKgHr: 0.21, hubCode: 'ROU' },
  { id: 'H011', name: 'Sambalpur Agri Hub', city: 'Sambalpur', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 0, capacityKg: 4500, latitude: 21.4669, longitude: 83.9812, handlingCostPerKg: 1.54, coldStorageCostPerKgHr: 0.11, hubCode: 'SBP' },
  { id: 'H012', name: 'Ranchi Cold Hub', city: 'Ranchi', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 5000, latitude: 23.3441, longitude: 85.3096, handlingCostPerKg: 2.65, coldStorageCostPerKgHr: 0.16, hubCode: 'RNC' },
  { id: 'H013', name: 'Visakhapatnam Port Hub', city: 'Visakhapatnam', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 8000, latitude: 17.6868, longitude: 83.2185, handlingCostPerKg: 2.09, coldStorageCostPerKgHr: 0.09, hubCode: 'VTZ' },
  { id: 'H014', name: 'Raipur Logistics Hub', city: 'Raipur', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 6000, latitude: 21.2514, longitude: 81.6296, handlingCostPerKg: 2.45, coldStorageCostPerKgHr: 0.11, hubCode: 'RPR' },
  { id: 'H015', name: 'Hyderabad Distribution Hub', city: 'Hyderabad', roadAccess: 1, railAccess: 1, coldStorage: 1, reeferCrossDock: 1, capacityKg: 9000, latitude: 17.3850, longitude: 78.4867, handlingCostPerKg: 1.69, coldStorageCostPerKgHr: 0.20, hubCode: 'HYD' },
];

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

  // Hubs
  public async getHubs(): Promise<Hub[]> {
    try {
      const res = await apiClient.get('/hubs');
      if (Array.isArray(res) && res.length > 0) return res;
      if (res.hubs && Array.isArray(res.hubs) && res.hubs.length > 0) return res.hubs;
      return DEFAULT_HUBS;
    } catch {
      return DEFAULT_HUBS;
    }
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
    const rawList: Shipment[] = Array.isArray(data) ? data : data.shipments || [];
    return rawList.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.dispatchTime || 0).getTime();
      const timeB = new Date(b.createdAt || b.dispatchTime || 0).getTime();
      return timeB - timeA;
    });
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
    const rawList: Shipment[] = Array.isArray(data) ? data : data.shipments || [];
    return rawList.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.dispatchTime || 0).getTime();
      const timeB = new Date(b.createdAt || b.dispatchTime || 0).getTime();
      return timeB - timeA;
    });
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
    status?: string;
  }): Promise<Shipment> {
    const res = await apiClient.post('/shipments', data);
    return res.shipment;
  }
  public async confirmShipment(shipmentId: string, agreedCost?: number): Promise<void> {
    return apiClient.patch(`/shipments/${shipmentId}`, { status: 'pending', agreedCost });
  }

  public async approveShipment(shipmentId: string): Promise<void> {
    return apiClient.patch(`/shipments/${shipmentId}`, { status: 'approved' });
  }

  public async rejectShipment(shipmentId: string, reason: string): Promise<void> {
    return apiClient.patch(`/shipments/${shipmentId}`, { status: 'rejected', rejectionReason: reason });
  }

  public async assignVehicle(shipmentId: string, vehicleId: string): Promise<void> {
    return apiClient.patch(`/shipments/${shipmentId}`, { status: 'in_transit', assignedVehicle: vehicleId });
  }

  // Clusters & Routes
  public async getClusters(): Promise<ConsolidationCluster[]> {
    const res = await apiClient.get('/clusters');
    const rawList: ConsolidationCluster[] = Array.isArray(res) ? res : res.clusters || [];
    return rawList.sort((a, b) => {
      const timeA = new Date((a as any).createdAt || 0).getTime();
      const timeB = new Date((b as any).createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });
  }

  public async getClusterById(id: string): Promise<ConsolidationCluster | undefined> {
    try {
      const res = await apiClient.get(`/clusters/${id}`);
      return res.id ? res : res.cluster;
    } catch {
      return undefined;
    }
  }

  public async updateClusterStatus(clusterId: string, status: string): Promise<void> {
    await apiClient.patch(`/clusters/${clusterId}`, { status });
  }

  public async linkRouteToCluster(routeId: string, clusterId: string): Promise<void> {
    // Updates the delivery_routes.clusterId so completeRoute cascade works correctly
    await apiClient.patch(`/routes/${routeId}`, { clusterId, status: 'in_transit', completedStops: null });
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

  public async completeRoute(routeId: string, lat?: number, lng?: number): Promise<{
    success: boolean;
    routeId: string;
    deliveredShipmentIds: string[];
    completedAt: string;
  }> {
    return apiClient.put(`/routes/${routeId}/complete`, { lat, lng });
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
    routeId?: string;
    vehicleId?: string;
    shipmentId?: string;
    type: IncidentType;
    severity?: IncidentReport['severity'];
    locationName?: string;
    locationCoords?: [number, number];
    notes: string;
    agentId?: string;
    agentName?: string;
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
  public async recommendGrouping(): Promise<any[]> {
    const res = await apiClient.post('/recommendations/grouping', {});
    return Array.isArray(res) ? res : res.clusters || res;
  }

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
}

export const dataService = new DataService();
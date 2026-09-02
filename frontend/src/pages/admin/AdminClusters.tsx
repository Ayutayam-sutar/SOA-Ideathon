import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FreshnessGauge } from "../../components/FreshnessGauge";
import { dataService } from "../../services/dataService";
import { CheckCircle2 } from "lucide-react";

import {
  Shipment,
  ConsolidationCluster,
  DeliveryRoute,
} from "../../types";
import { useAuth } from "../../contexts/AuthContext";


export const AdminClusters: React.FC = () => {
  const navigate = useNavigate();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [clusters, setClusters] = useState<ConsolidationCluster[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [selectedClusterId, setSelectedClusterId] =
    useState<string>("");

  const { hasAccess } = useAuth();

  const [dispatchingClusterId, setDispatchingClusterId] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const currentClusters = await dataService.getClusters();
      setClusters(currentClusters);
      setShipments(await dataService.getShipments());
      const currentRoutes = await dataService.getRoutes();
      setRoutes(currentRoutes);
      if (currentRoutes.length > 0) {
        setSelectedVehicleId(currentRoutes[0].vehicleId || currentRoutes[0].code);
      }
    };
    loadData();
  }, []);

  const visibleRoutes = routes.slice(0, 4);

  const activeAssignedRoute = visibleRoutes.find(
    (r) => (r.vehicleId || r.code) === selectedVehicleId || r.id === selectedVehicleId || r.code === selectedVehicleId
  ) || visibleRoutes[0];

  const handleDispatchCluster = async (cluster: ConsolidationCluster) => {
    try {
      setDispatchingClusterId(cluster.id);

      // Aggregate total weight from approved consolidated shipments
      const clusterShipments = shipments.filter(s => cluster.shipmentIds.includes(s.id));
      const calculatedWeight = clusterShipments.reduce((sum, s) => sum + (s.weightKg || 0), 0);
      const totalWeightKg = calculatedWeight > 0 ? calculatedWeight : (cluster.totalWeightKg || 1000);

      const assignedVehicle = selectedVehicleId || visibleRoutes[0]?.vehicleId || visibleRoutes[0]?.code || 'OD-02-AX-4592 (Tata 14T Reefer)';

      // 1. Assign chosen vehicle to all shipments in the cluster (sets status → in_transit)
      await Promise.all(
        cluster.shipmentIds.map((shipmentId: string) =>
          dataService.assignVehicle(shipmentId, assignedVehicle)
        )
      );

      // 2. Update cluster status to 'in_transit' so the backend can cascade on completion
      await dataService.updateClusterStatus(cluster.id, 'in_transit');

      // 3. Link the delivery route that uses this vehicle to this cluster
      //    so completeRoute can find it and cascade delivery status correctly
      const matchingRoute = visibleRoutes.find(r =>
        r.vehicleId === assignedVehicle || r.vehicleId?.startsWith(assignedVehicle.split(' ')[0])
      );
      if (matchingRoute) {
        await dataService.linkRouteToCluster(matchingRoute.id, cluster.id);
      }

      // 4. Refresh cluster and shipment datasets
      const [updatedClusters, updatedShipments] = await Promise.all([
        dataService.getClusters(),
        dataService.getShipments()
      ]);
      setClusters(updatedClusters);
      setShipments(updatedShipments);

      setDispatchSuccess(`Cluster ${cluster.code || cluster.id} (${totalWeightKg} kg) assigned to ${assignedVehicle} and dispatched successfully!`);
      
      setTimeout(() => {
        setDispatchSuccess(null);
        setSelectedClusterId("");
      }, 2500);
    } catch (err: any) {
      console.error("Failed to dispatch fleet:", err);
      alert('Failed to dispatch fleet: ' + (err?.message || 'Unknown error'));
    } finally {
      setDispatchingClusterId(null);
    }
  };


  const selectedCluster = selectedClusterId ? (
    clusters.find(
      (cluster) => cluster.id === selectedClusterId
    )
  ) : null;

  const clusterShipments = selectedCluster ? shipments.filter(s => selectedCluster.shipmentIds.includes(s.id)) : [];
  const isAlreadyDispatched = Boolean(
    selectedCluster && (
      selectedCluster.status === 'in_transit' ||
      selectedCluster.status === 'dispatched' ||
      selectedCluster.status === 'delivered' ||
      (clusterShipments.length > 0 && clusterShipments.every(s => s.status === 'in_transit' || s.status === 'delivered'))
    )
  );

  const existingAssignedVehicle = clusterShipments.find(s => s.assignedVehicle)?.assignedVehicle;
  const currentAssignedVehicle = isAlreadyDispatched
    ? (existingAssignedVehicle || selectedVehicleId || visibleRoutes[0]?.vehicleId || 'OD-02-AX-4592 (Tata 14T Reefer)')
    : (selectedVehicleId || visibleRoutes[0]?.vehicleId || visibleRoutes[0]?.code || 'OD-02-AX-4592 (Tata 14T Reefer)');

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#D6DCD4] pb-3">
        <h1 className="font-display font-bold text-2xl text-[#163832]">
          Consolidation Clusters
        </h1>

        <p className="text-xs text-[#596560] mt-0.5">
          Multi-shipper cargo grouping and reefer capacity optimization
        </p>
      </div>

      {/* ── Pending / Active Clusters ── */}
      {(() => {
        const pendingClusters = clusters.filter(
          c => c.status !== 'delivered' && c.status !== 'completed'
        );
        return (
          <section>
            <h2 className="font-display font-semibold text-base text-[#163832] mb-3 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D98E2B]" />
              Pending Clusters
              <span className="text-xs font-mono font-normal text-[#596560]">({pendingClusters.length})</span>
            </h2>

            {pendingClusters.length === 0 ? (
              <div className="text-sm text-[#596560] bg-[#F3F5F2] rounded-lg px-4 py-6 text-center font-mono">
                No pending clusters — all approved shipments have been dispatched or are awaiting approval.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {pendingClusters.map((cluster) => {
                  const isSelected = cluster.id === selectedClusterId;
                  return (
                    <div
                      key={cluster.id}
                      onClick={() => setSelectedClusterId(cluster.id)}
                      className={`bg-[#FFFFFF] border-2 rounded-[6px] p-5 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-[#163832] shadow-md ring-1 ring-[#163832]"
                          : "border-[#D6DCD4] hover:border-[#5C7A50]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-[#163832] text-white rounded">
                          {cluster.code}
                        </span>

                        {hasAccess('cost_savings') && (
                          <span className="font-mono text-[11px] font-bold text-[#5C7A50]">
                            +{cluster.costSavingsPercent}% Cost Saved
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-base text-[#163832] mb-1">
                        {cluster.name}
                      </h4>

                      <div className="text-xs text-[#596560] mb-3">
                        <strong>Hub:</strong>{" "}
                        {cluster.originHub.name} →{" "}
                        {cluster.destinationHub.name}
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-[11px] font-mono text-[#596560]">
                          <span>Capacity Utilization</span>

                          <span className="font-bold text-[#163832]">
                            {cluster.totalWeightKg} /{" "}
                            {cluster.maxCapacityKg} kg (
                            {cluster.reeferLoadFactorPercent}%)
                          </span>
                        </div>

                        <div className="w-full bg-[#E5EBE3] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#5C7A50] h-full rounded-full transition-all"
                            style={{
                              width: `${cluster.reeferLoadFactorPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-[#F3F5F2] p-2.5 rounded text-[11px] font-mono text-[#596560] space-y-1">
                        <div>
                          Temp Sync:{" "}
                          <span className="text-[#163832] font-semibold">
                            {cluster.tempBand}
                          </span>
                        </div>

                        <div>
                          Grouped Shipments:{" "}
                          <span className="text-[#163832] font-semibold">
                            {cluster.shipmentIds.length} Consignments
                          </span>
                        </div>

                        <div>
                          CO₂ Reduction:{" "}
                          <span className="text-[#5C7A50] font-semibold">
                            -{cluster.co2SavedKg} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* ── Completed Clusters ── */}
      {(() => {
        const completedClusters = clusters.filter(
          c => c.status === 'delivered' || c.status === 'completed'
        );
        if (completedClusters.length === 0) return null;
        return (
          <section>
            <h2 className="font-display font-semibold text-base text-[#163832] mb-3 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#5C7A50]" />
              Completed Clusters
              <span className="text-xs font-mono font-normal text-[#596560]">({completedClusters.length})</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {completedClusters.map((cluster) => {
                const isSelected = cluster.id === selectedClusterId;
                return (
                  <div
                    key={cluster.id}
                    onClick={() => setSelectedClusterId(cluster.id)}
                    className={`bg-gray-50 border-2 rounded-[6px] p-5 cursor-pointer transition-all duration-200 opacity-80 ${
                      isSelected
                        ? "border-[#163832] shadow-md ring-1 ring-[#163832] opacity-100"
                        : "border-gray-200 hover:border-[#5C7A50] hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-gray-500 text-white rounded">
                        {cluster.code}
                      </span>

                      <span className="font-mono text-[11px] font-bold text-[#5C7A50] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-base text-gray-600 mb-1">
                      {cluster.name}
                    </h4>

                    <div className="text-xs text-gray-500 mb-3">
                      <strong>Hub:</strong>{" "}
                      {cluster.originHub.name} →{" "}
                      {cluster.destinationHub.name}
                    </div>

                    <div className="bg-gray-100 p-2.5 rounded text-[11px] font-mono text-gray-500 space-y-1">
                      <div>
                        Grouped Shipments:{" "}
                        <span className="text-gray-700 font-semibold">
                          {cluster.shipmentIds.length} Consignments
                        </span>
                      </div>

                      {hasAccess('cost_savings') && (
                        <div>
                          Cost Saved:{" "}
                          <span className="text-[#5C7A50] font-semibold">
                            +{cluster.costSavingsPercent}%
                          </span>
                        </div>
                      )}

                      <div>
                        CO₂ Reduction:{" "}
                        <span className="text-[#5C7A50] font-semibold">
                          -{cluster.co2SavedKg} kg
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}


      {/* Cluster Details Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163832]/80 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#E5EBE3] p-5 bg-[#F8FAF7] gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 bg-[#163832] text-white rounded">
                    {selectedCluster.code}
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#163832]">
                    {selectedCluster.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#596560]">
                  <span>Assigned Corridor:</span>
                  <span className="font-bold text-[#163832]">
                    {activeAssignedRoute ? `Route ${activeAssignedRoute.code}` : (selectedCluster.assignedRouteId || 'Pending Allocation')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isAlreadyDispatched ? (
                  <>
                    <div className="flex items-center gap-2 bg-[#163832]/10 border border-[#163832]/20 px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="font-mono text-xs text-[#596560]">Assigned Fleet:</span>
                      <span className="font-mono text-xs font-bold text-[#163832]">
                        🚚 {currentAssignedVehicle}
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#5C7A50]/15 text-[#5C7A50] border border-[#5C7A50]/30 flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> FLEET DISPATCHED
                    </span>
                  </>
                ) : (
                  <>
                    {/* Fleet Vehicle Dropdown Selector (only visible routes/vehicles from Routes page) */}
                    <div className="flex items-center gap-2 bg-white border border-[#D6DCD4] px-3 py-1.5 rounded-lg shadow-sm">
                      <label className="font-mono text-xs font-bold text-[#163832] uppercase whitespace-nowrap">
                        Fleet Vehicle:
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="bg-transparent text-xs font-mono font-bold text-[#163832] focus:outline-none cursor-pointer max-w-[220px] truncate"
                      >
                        {visibleRoutes.map((route) => {
                          const vehVal = route.vehicleId || route.code;
                          const vehLabel = route.vehicleId ? `${route.vehicleId} [${route.code}]` : `Route ${route.code}`;
                          return (
                            <option key={route.id} value={vehVal}>
                              🚚 {vehLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button 
                      onClick={() => selectedCluster && handleDispatchCluster(selectedCluster)}
                      disabled={dispatchingClusterId === selectedCluster.id}
                      id="dispatch-btn"
                      className={`px-4 py-2 text-white rounded-lg text-xs font-mono font-semibold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${
                        dispatchingClusterId === selectedCluster.id
                          ? 'bg-emerald-700 cursor-not-allowed opacity-90'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                      }`}
                    >
                      {dispatchingClusterId === selectedCluster.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          Dispatching...
                        </>
                      ) : (
                        'Dispatch Fleet 🚚'
                      )}
                    </button>
                  </>
                )}

                {activeAssignedRoute && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/routes", {
                        state: {
                          selectedRouteId: activeAssignedRoute.id,
                        },
                      })
                    }
                    className="px-3.5 py-2 bg-[#163832] text-white rounded-lg text-xs font-mono font-semibold hover:bg-[#0F2622] transition-colors shadow-sm whitespace-nowrap"
                  >
                    View Assigned Route Logic →
                  </button>
                )}
                <button 
                  onClick={() => setSelectedClusterId("")}
                  className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>

            {dispatchSuccess && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs font-mono text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <span>✅</span>
                <span>{dispatchSuccess}</span>
              </div>
            )}

            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              {/* Route & Multi-stop Information Header */}
              <div className="mb-6 bg-white border border-[#E5EBE3] p-4 rounded-xl shadow-sm">
                 <h4 className="font-display font-bold text-[#163832] mb-3 border-b border-gray-100 pb-2">Logistics Routing Plan</h4>
                 <div className="flex items-center gap-3 text-sm text-[#596560]">
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-[#163832]">{selectedCluster.originHub.name}</span>
                     <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase">Origin</span>
                   </div>
                   
                   {/* Multi-stop representation (MOCK) */}
                   <span className="text-gray-400">→</span>
                   <div className="flex items-center gap-2 border-dashed border-b-2 border-emerald-200 pb-0.5">
                     <span className="font-medium text-emerald-800">Multi-Stop Waypoints Included</span>
                   </div>
                   <span className="text-gray-400">→</span>

                   <div className="flex items-center gap-2">
                     <span className="font-bold text-[#163832]">{selectedCluster.destinationHub.name}</span>
                     <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase">Destination</span>
                   </div>
                 </div>
                 <p className="text-xs text-gray-500 mt-3 font-mono">
                   * Route includes intermediate drops based on individual shipment destinations within the corridor.
                 </p>
              </div>

              <h4 className="font-display font-bold text-[#163832] mb-4">Consolidated Shipments ({selectedCluster.shipmentIds.length})</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {shipments
                  .filter((shipment) =>
                    selectedCluster.shipmentIds.includes(
                      shipment.id
                    )
                  )
                  .sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.dispatchTime || 0).getTime();
                    const timeB = new Date(b.createdAt || b.dispatchTime || 0).getTime();
                    return timeB - timeA;
                  })
                  .map((shipment) => (
                    <div
                      key={shipment.id}
                      className="bg-white border border-[#E5EBE3] shadow-sm hover:border-[#5C7A50]/50 rounded-xl p-4 flex flex-col justify-between transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-mono font-bold text-sm text-[#163832]">
                            {shipment.code}
                          </div>
                          <div className="font-semibold text-xs text-[#1A211E] mt-0.5">
                            {shipment.cargoType}
                          </div>
                          <div className="text-[11px] text-[#596560]">
                            {shipment.businessName}
                          </div>
                        </div>
                        <span className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                                shipment.status === 'in_transit' ? 'bg-[#5C7A50]/10 text-[#5C7A50] border border-[#5C7A50]/20' : 
                                shipment.status === 'pending' ? 'bg-[#D98E2B]/10 text-[#D98E2B] border border-[#D98E2B]/20' :
                                shipment.status === 'approved' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                (shipment.status === 'disrupted' || shipment.status === 'rejected') ? 'bg-red-50 text-red-700 border border-red-200' : 
                                shipment.status === 'delivered' ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-[#D98E2B]/10 text-[#D98E2B] border border-[#D98E2B]/20'
                              }`}>
                                {shipment.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="border-t border-[#E5EBE3] pt-3 flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-1">Dest: {shipment.destination.name.split(',')[0]}</div>
                          <div className="font-mono text-[11px] text-[#5C7A50] font-bold">
                            {shipment.weightKg}kg • Temp: {shipment.currentTemp}°C
                          </div>
                        </div>
                        <FreshnessGauge
                          percentage={shipment.freshnessPercent}
                          remainingHours={
                            shipment.remainingShelfLifeHours
                          }
                          size="sm"
                          showHours
                          predictedRiskLevel={shipment.spoilageRiskLevel}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-[#E5EBE3] p-4 bg-white flex justify-end">
               <button 
                  onClick={() => setSelectedClusterId("")}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
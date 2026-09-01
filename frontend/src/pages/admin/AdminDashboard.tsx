import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { CheckCircle2, Boxes, Layers, ThermometerSnowflake, ShieldAlert, ArrowUpRight } from "lucide-react";

import { FreshnessGauge } from "../../components/FreshnessGauge";
import { dataService } from "../../services/dataService";

import {
  Shipment,
  ConsolidationCluster,
  DeliveryRoute,
  IncidentReport,
  User,
  INCIDENT_TYPE_LABELS,
} from "../../types";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [clusters, setClusters] = useState<ConsolidationCluster[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [reoptimizeSuccessMsg, setReoptimizeSuccessMsg] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const u = await dataService.getActiveUser();
        if (u) setUser(u);
        setShipments(await dataService.getShipments());
        setClusters(await dataService.getClusters());
        setRoutes(await dataService.getRoutes());
        setIncidents(await dataService.getIncidents());
        setVehicles(await dataService.getVehicles());
      } catch (err: any) {
        setLoadError('Failed to load dashboard data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const poll = setInterval(async () => {
      try {
        setIncidents(await dataService.getIncidents());
      } catch {
        /* keep last known list */
      }
    }, 8000);
    return () => clearInterval(poll);
  }, []);

  const activeShipmentsCount = shipments.filter(
    (shipment) => shipment.status !== "delivered"
  ).length;

  const activeClustersCount = clusters.filter(
    (cluster) => cluster.status !== "completed"
  ).length;

  const atRiskCount = shipments.filter(
    (shipment) =>
      shipment.freshnessPercent <= 50 ||
      shipment.status === "disrupted"
  ).length;

  const openIncidents = incidents.filter(
    (incident) => incident.status === "open"
  );

  const availableVehiclesCount = vehicles.filter(v => v.status === 'available').length || vehicles.length;

  const totalSystemSavings = shipments.reduce((acc, s) => acc + ((s.estimatedSoloCostINR || 0) - (s.consolidatedCostINR || 0)), 0);

  const handleReoptimizeRoute = async (
    routeId: string,
    incidentId?: string
  ) => {
    const route = routes.find((item) => item.id === routeId);

    const incId =
      incidentId ||
      route?.activeIncidentId ||
      incidents.find(
        (incident) =>
          incident.routeId === routeId &&
          incident.status === "open"
      )?.id ||
      "INC-4091";

    await dataService.reoptimizeRoute(routeId, incId);

    setRoutes(await dataService.getRoutes());
    setIncidents(await dataService.getIncidents());

    setReoptimizeSuccessMsg(
      `Route ${routeId} successfully re-optimized! New multimodal corridor applied.`
    );

    setTimeout(() => {
      setReoptimizeSuccessMsg(null);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#E5EBE3] border-t-[#5C7A50] rounded-full animate-spin" />
        <span className="font-mono text-sm text-[#596560]">Loading Operations Dashboard...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold text-sm mb-2">Connection Error</p>
          <p className="text-red-600 text-xs mb-4">{loadError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#163832] text-white rounded text-xs font-bold">Retry</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center text-sm font-mono text-[#596560]">Loading Dashboard...</div>;
  }

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#D6DCD4] pb-3">
        <h1 className="font-display font-bold text-2xl text-[#163832]">
          Platform Operations & Consolidation Grid
        </h1>

        <p className="text-xs text-[#596560] font-sans mt-0.5">
          Live multi-shipper cold corridor optimization and spoilage risk
          dispatch
        </p>
      </div>

      {reoptimizeSuccessMsg && (
        <div className="bg-[#163832] text-[#FFFFFF] px-4 py-3 rounded-[6px] border border-[#245249] flex items-center justify-between text-xs font-mono animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5C7A50]" />
            <span>{reoptimizeSuccessMsg}</span>
          </div>

          <span className="text-white/70 text-[10px]">
            FRESHNESS RECOVERED
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Active Shipments -> /admin/shipments */}
        <div
          onClick={() => navigate('/admin/shipments')}
          className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#163832]/50 hover:-translate-y-0.5 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#596560] uppercase group-hover:text-[#163832] transition-colors">
            <span>Active Shipments</span>
            <Boxes className="w-4 h-4 text-[#163832] group-hover:scale-110 transition-transform" />
          </div>

          <div className="font-mono font-bold text-2xl text-[#163832] mt-1">
            {activeShipmentsCount}
          </div>

          <div className="text-[11px] text-[#596560] font-sans mt-0.5">
            {shipments.length} total across all routes
          </div>
        </div>

        {/* Card 2: Consolidation Clusters -> /admin/clusters */}
        <div
          onClick={() => navigate('/admin/clusters')}
          className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#5C7A50]/50 hover:-translate-y-0.5 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#596560] uppercase group-hover:text-[#5C7A50] transition-colors">
            <span>Consolidation Clusters</span>
            <Layers className="w-4 h-4 text-[#5C7A50] group-hover:scale-110 transition-transform" />
          </div>

          <div className="font-mono font-bold text-2xl text-[#5C7A50] mt-1">
            {activeClustersCount}
          </div>

          <div className="text-[11px] text-[#596560] font-sans mt-0.5">
            {activeClustersCount > 0 ? `${activeClustersCount} active cluster${activeClustersCount !== 1 ? 's' : ''}` : 'No active clusters'}
          </div>
        </div>

        {/* Card 3: At-Risk Cargo -> /admin/shipments */}
        <div
          onClick={() => navigate('/admin/shipments')}
          className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#D98E2B]/50 hover:-translate-y-0.5 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#596560] uppercase group-hover:text-[#D98E2B] transition-colors">
            <span>At-Risk Cargo (&lt;50%)</span>
            <ThermometerSnowflake className="w-4 h-4 text-[#D98E2B] group-hover:scale-110 transition-transform" />
          </div>

          <div
            className={`font-mono font-bold text-2xl mt-1 ${atRiskCount > 0
                ? "text-[#D98E2B]"
                : "text-[#163832]"
              }`}
          >
            {atRiskCount}
          </div>

          <div className="text-[11px] text-[#596560] font-sans mt-0.5">
            Monitored by Freshness Gauge
          </div>
        </div>

        {/* Card 4: Open Incidents -> /admin/incidents */}
        <div
          onClick={() => navigate('/admin/incidents')}
          className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#B3462C]/50 hover:-translate-y-0.5 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#596560] uppercase group-hover:text-[#B3462C] transition-colors">
            <span>Open Incidents</span>
            <ShieldAlert className="w-4 h-4 text-[#B3462C] group-hover:scale-110 transition-transform" />
          </div>

          <div
            className={`font-mono font-bold text-2xl mt-1 ${openIncidents.length > 0
                ? "text-[#B3462C]"
                : "text-[#163832]"
              }`}
          >
            {openIncidents.length}
          </div>

          <div className="text-[11px] text-[#596560] font-sans mt-0.5">
            {openIncidents.length > 0
              ? "Re-optimization pending"
              : "All routes clear"}
          </div>
        </div>

        {/* Card 5: Available Fleet -> /admin/routes */}
        <div
          onClick={() => navigate('/admin/routes')}
          className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#5C7A50]/50 hover:-translate-y-0.5 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#596560] uppercase group-hover:text-[#5C7A50] transition-colors">
            <span>Available Fleet</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5C7A50] group-hover:scale-110 transition-transform"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="4" height="6" x="10" y="10" rx="1" /></svg>
          </div>

          <div className="font-mono font-bold text-2xl text-[#163832] mt-1">
            {availableVehiclesCount}
          </div>

          <div className="text-[11px] text-[#596560] font-sans mt-0.5">
            Total capacity: {Math.round(vehicles.reduce((a, v) => a + v.capacityKg, 0) / 1000)}T
          </div>
        </div>

        {/* Card 6: Est. Sys. Savings -> /admin/clusters */}
        <div
          onClick={() => navigate('/admin/clusters')}
          className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#163832]/50 hover:-translate-y-0.5 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-[#596560] uppercase group-hover:text-[#163832] transition-colors">
            <span>Estimated System Savings</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#163832] group-hover:scale-110 transition-transform"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
          </div>

          <div className="font-mono font-bold text-2xl text-[#163832] mt-1 truncate">
            ₹{totalSystemSavings > 0 ? totalSystemSavings.toLocaleString() : '0'}
          </div>

          <div className="text-[11px] text-[#596560] font-sans mt-0.5">
            Aggregated across network
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#163832]">
                Incident & Disruption Queue
              </h3>

              <span className="font-mono text-xs text-[#B3462C] font-semibold">
                {openIncidents.length} ACTION REQUIRED
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-3.5 rounded-[6px] border text-xs space-y-2 ${incident.status === "open"
                      ? "bg-[#FCEBE6] border-[#B3462C]/40"
                      : "bg-[#FFFFFF] border-[#D6DCD4]"
                    }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-[#163832]">
                      {incident.code}
                    </span>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${incident.status === "open"
                          ? "bg-[#B3462C] text-white"
                          : "bg-[#5C7A50] text-white"
                        }`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <div className="font-semibold text-[#1A211E]">
                    {INCIDENT_TYPE_LABELS[incident.type] ||
                      incident.type?.replace(/_/g, " ").toUpperCase()}{" "}
                    • {incident.cargoType}
                  </div>

                  <p className="text-[#596560] text-[11px] leading-relaxed">
                    {incident.notes}
                  </p>

                  <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#596560]">
                      Route: {incident.routeCode}
                    </span>

                    {incident.status === "open" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleReoptimizeRoute(
                            incident.routeId,
                            incident.id
                          )
                        }
                        className="px-2.5 py-1 bg-[#B3462C] hover:bg-[#8F341E] text-white rounded font-mono text-[10px] font-bold tracking-wider transition-colors"
                      >
                        Re-Optimize Route
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-[#5C7A50] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {incidents.length === 0 && (
                <div className="py-8 text-center text-xs text-[#596560] border border-dashed border-[#D6DCD4] rounded-[6px]">
                  No driver incidents yet. Reports from the Delivery Agent dashboard appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#163832]">
                High-Priority Cargo Freshness Monitored
              </h3>

              <span className="text-xs text-[#596560]">
                Biological decay tracking across active reefer clusters
              </span>
            </div>

            <Link
              to="/admin/shipments"
              className="text-xs font-mono text-[#163832] font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All {shipments.length} Shipments</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {shipments.slice(0, 3).map((shipment) => (
              <div
                key={shipment.id}
                onClick={() => navigate('/admin/shipments')}
                className="p-3.5 bg-[#F8FAF7] border border-[#E5EBE3] rounded-[6px] flex items-center justify-between cursor-pointer transition-all hover:bg-[#F0F4EE] hover:border-[#D6DCD4] hover:shadow-sm"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#163832]">
                      {shipment.code}
                    </span>

                    <span className="font-mono text-[10px] text-[#596560]">
                      {shipment.weightKg}kg
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-[#1A211E] line-clamp-1">
                    {shipment.cargoType}
                  </div>

                  <div className="text-[11px] text-[#596560] font-mono">
                    Temp: {shipment.currentTemp}°C •{" "}
                    {shipment.destination.name.split(",")[0]}
                  </div>
                </div>

                <FreshnessGauge
                  percentage={shipment.freshnessPercent}
                  remainingHours={shipment.remainingShelfLifeHours}
                  totalHours={shipment.totalShelfLifeHours}
                  predictedRiskLevel={shipment.spoilageRiskLevel}
                  size="sm"
                  showHours
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
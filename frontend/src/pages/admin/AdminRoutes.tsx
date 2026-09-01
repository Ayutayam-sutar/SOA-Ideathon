import React, { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";

import { KarwaanMap } from "../../components/KarwaanMap";
import { RouteExplanationPanel } from "../../components/RouteExplanationPanel";
import { dataService } from "../../services/dataService";

import { DeliveryRoute, IncidentReport } from "../../types";

export const AdminRoutes: React.FC = () => {
  const location = useLocation();

  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string>("");

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const currentRoutes = await dataService.getRoutes();
      setRoutes(currentRoutes);
      setIncidents(await dataService.getIncidents());

      const requestedRoute =
        (
          location.state as
            | { selectedRouteId?: string }
            | null
        )?.selectedRouteId;

      const visibleRoutes = currentRoutes.slice(0, 4);

      if (
        requestedRoute &&
        visibleRoutes.some(
          (route) => route.id === requestedRoute
        )
      ) {
        setSelectedRouteId(requestedRoute);
      } else {
        setSelectedRouteId(
          visibleRoutes[0]?.id || ""
        );
      }
    };
    loadData();
  }, [location.state]);

  const visibleRoutes = routes.slice(0, 4);

  const selectedRoute =
    visibleRoutes.find(
      (route) => route.id === selectedRouteId
    ) || visibleRoutes[0];

  const handleReoptimizeRoute = async (
    routeId: string,
    incidentId?: string
  ) => {
    const route = routes.find(
      (item) => item.id === routeId
    );

    const incident =
      incidentId ||
      route?.activeIncidentId ||
      incidents.find(
        (item) =>
          item.routeId === routeId &&
          item.status === "open"
      )?.id ||
      "INC-4091";

    await dataService.reoptimizeRoute(
      routeId,
      incident
    );
    
    setRoutes(await dataService.getRoutes());
    setIncidents(await dataService.getIncidents());

    setSuccessMessage(
      `Route ${routeId} successfully re-optimized! New multimodal corridor applied.`
    );

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#D6DCD4] pb-3">
        <h1 className="font-display font-bold text-2xl text-[#163832]">
          Delivery Routes
        </h1>

        <p className="text-xs text-[#596560] mt-0.5">
          Multimodal route optimization and decision logic
        </p>
      </div>

      {successMessage && (
        <div className="bg-[#163832] text-white px-4 py-3 rounded-[6px] border border-[#245249] text-xs font-mono">
          {successMessage}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {visibleRoutes.map((route) => (
          <button
            key={route.id}
            type="button"
            onClick={() =>
              setSelectedRouteId(route.id)
            }
            className={`px-4 py-2 rounded text-xs font-mono transition-all whitespace-nowrap border flex items-center gap-2 ${
              selectedRouteId === route.id
                ? "bg-[#163832] text-white border-[#163832] font-bold shadow-sm"
                : "bg-[#FFFFFF] text-[#596560] border-[#D6DCD4] hover:border-[#163832]"
            }`}
          >
            <span>Route: {route.code}</span>
            <span className="opacity-75 text-[11px] font-normal">
              • {route.vehicleId?.split('(')[0]?.trim() || 'Tata Reefer'}
            </span>

            <span className="ml-1 text-[10px] opacity-80">
              (
              {route.status === "incident_reported"
                ? "⚠️ DISRUPTED"
                : route.status.toUpperCase()}
              )
            </span>
          </button>
        ))}
      </div>

      {selectedRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <RouteExplanationPanel
              route={selectedRoute}
              canReoptimize={true}
              onReoptimize={() =>
                handleReoptimizeRoute(
                  selectedRoute.id
                )
              }
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-[#163832]">
                  Route Geography & Active Vehicle
                </h4>
                <span className="bg-[#5C7A50]/15 text-[#5C7A50] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#5C7A50]/20">
                  LIVE FLEET
                </span>
              </div>

              <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-2.5 rounded text-xs space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-[#163832]">🚚 {selectedRoute.vehicleId || 'OD-02-AX-4592 (Tata 14T Reefer)'}</span>
                  <span className="text-[#5C7A50] font-bold text-[11px]">ACTIVE</span>
                </div>
                <div className="text-[11px] text-[#596560] flex items-center justify-between">
                  <span>Pilot: {selectedRoute.driverAgentName || 'Active Fleet Pilot'}</span>
                  <span className="font-mono">{selectedRoute.driverAgentPhone || '+91 94370 00199'}</span>
                </div>
              </div>

              <KarwaanMap
                routes={[selectedRoute]}
                selectedRouteId={selectedRoute.id}
                height="220px"
              />
            </div>

            <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-[#E5EBE3] pb-2">
                <h4 className="font-display font-bold text-sm text-[#163832]">
                  Ordered Stops & Waypoints
                </h4>
                <span className="text-xs font-mono text-[#596560]">
                  {selectedRoute.stops.length} Sequence Nodes
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedRoute.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${
                      stop.isCompleted
                        ? "bg-[#F8FAF7] border-[#E5EBE3] opacity-80"
                        : "bg-[#FFFFFF] border-[#D6DCD4]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                        stop.isCompleted
                          ? "bg-[#5C7A50] text-white"
                          : "bg-[#163832] text-white"
                      }`}
                    >
                      {stop.sequence}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between font-semibold text-[#1A211E]">
                        <span>{stop.name}</span>

                        <span className="font-mono text-[10px] text-[#596560]">
                          {stop.scheduledTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#596560]">
                        {stop.actionLabel}
                      </p>

                      <div className="text-[10px] font-mono text-[#5C7A50] mt-0.5">
                        {stop.tempRequirement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
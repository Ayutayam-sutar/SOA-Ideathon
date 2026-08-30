import React, { useEffect, useState } from "react";

import { CheckCircle2 } from "lucide-react";

import { IncidentModal } from "../../components/IncidentModal";
import { dataService } from "../../services/dataService";

import {
  IncidentReport,
  DeliveryRoute,
  Shipment,
} from "../../types";

export const AdminIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [isIncidentModalOpen, setIsIncidentModalOpen] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIncidents(await dataService.getIncidents());
      setRoutes(await dataService.getRoutes());
      setShipments(await dataService.getShipments());
    };
    loadData();
  }, []);

  const handleReoptimizeRoute = async (
    routeId: string,
    incidentId: string
  ) => {
    await dataService.reoptimizeRoute(
      routeId,
      incidentId
    );
    setIncidents(await dataService.getIncidents());
    setRoutes(await dataService.getRoutes());

    setSuccessMessage(
      `Route ${routeId} successfully re-optimized! New multimodal corridor applied.`
    );

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <>
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="border-b border-[#D6DCD4] pb-3">
          <h1 className="font-display font-bold text-2xl text-[#163832]">
            Incident Inbox
          </h1>

          <p className="text-xs text-[#596560] mt-0.5">
            Telemetry and spoilage disruption reports
          </p>
        </div>

        {successMessage && (
          <div className="bg-[#163832] text-white px-4 py-3 rounded-[6px] border border-[#245249] text-xs font-mono">
            {successMessage}
          </div>
        )}

        <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5EBE3] pb-3">
            <div>
              <h3 className="font-display font-bold text-lg text-[#163832]">
                Incident Inbox & Spoilage Disruption Reports
              </h3>

              <span className="text-xs text-[#596560]">
                Telemetry and observations submitted by
                on-ground delivery captains
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsIncidentModalOpen(true)
              }
              className="px-3.5 py-2 bg-[#B3462C] hover:bg-[#8F341E] text-white rounded text-xs font-mono font-bold tracking-wide transition-colors shadow-sm"
            >
              + Log Manual Incident
            </button>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-4 rounded-[6px] border space-y-3 ${
                  incident.status === "open"
                    ? "bg-[#FCEBE6] border-[#B3462C]/40"
                    : "bg-[#F8FAF7] border-[#E5EBE3]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#163832] text-white px-2 py-0.5 rounded">
                      {incident.code}
                    </span>

                    <span className="font-display font-bold text-sm text-[#1A211E]">
                      {incident.type
                        .replace("_", " ")
                        .toUpperCase()}{" "}
                      • {incident.cargoType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#596560]">
                      Reported:{" "}
                      {new Date(
                        incident.reportedAt
                      ).toLocaleTimeString()}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        incident.status === "open"
                          ? "bg-[#B3462C] text-white"
                          : "bg-[#5C7A50] text-white"
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white/70 p-3 rounded text-xs font-mono">
                  <div>
                    <strong>Location:</strong>{" "}
                    {incident.locationName}
                  </div>

                  <div>
                    <strong>Agent:</strong>{" "}
                    {incident.agentName}
                  </div>

                  <div>
                    <strong>Shelf-Life Impact:</strong>{" "}
                    -{incident.spoilageRiskImpactHours}h
                  </div>
                </div>

                <p className="text-xs text-[#1A211E] leading-relaxed">
                  <strong>Observation Notes:</strong>{" "}
                  {incident.notes}
                </p>

                <div className="bg-[#FFFFFF] border border-[#D6DCD4] p-2.5 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-[#596560]">
                    <strong className="text-[#163832]">
                      Suggested Engine Action:
                    </strong>{" "}
                    {incident.suggestedAction}
                  </div>

                  {incident.status === "open" ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleReoptimizeRoute(
                          incident.routeId,
                          incident.id
                        )
                      }
                      className="px-4 py-1.5 bg-[#B3462C] hover:bg-[#8F341E] text-white rounded text-xs font-mono font-bold transition-colors shrink-0"
                    >
                      Re-optimize Affected Route
                    </button>
                  ) : (
                    <span className="font-mono text-xs text-[#5C7A50] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Re-routed & Freshness Restored
                    </span>
                  )}
                </div>
              </div>
            ))}

            {incidents.length === 0 && (
              <div className="py-10 text-center text-xs text-[#596560]">
                No incidents reported.
              </div>
            )}
          </div>
        </div>
      </main>

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() =>
          setIsIncidentModalOpen(false)
        }
        routes={routes}
        shipments={shipments}
      />
    </>
  );
};
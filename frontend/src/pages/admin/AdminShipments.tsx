import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
} from "lucide-react";

import { FreshnessGauge } from "../../components/FreshnessGauge";
import { dataService } from "../../services/dataService";

import { Shipment } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

type RiskFilter =
  | "all"
  | "optimal"
  | "moderate"
  | "critical";

export const AdminShipments: React.FC = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [searchQuery, setSearchQuery] = useState("");
  const { hasAccess } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setShipments(await dataService.getShipments());
    };
    loadData();
  }, []);

  const filteredShipments = shipments.filter((shipment) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      shipment.code.toLowerCase().includes(query) ||
      shipment.cargoType.toLowerCase().includes(query) ||
      shipment.businessName.toLowerCase().includes(query) ||
      shipment.destination.name.toLowerCase().includes(query);

    const matchesRisk =
      riskFilter === "all"
        ? true
        : riskFilter === "optimal"
        ? shipment.freshnessPercent >= 70
        : riskFilter === "moderate"
        ? shipment.freshnessPercent >= 36 &&
          shipment.freshnessPercent < 70
        : shipment.freshnessPercent < 36;

    const matchesStatus = 
      statusFilter === "all" 
        ? true 
        : shipment.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#D6DCD4] pb-3">
        <h1 className="font-display font-bold text-2xl text-[#163832]">
          Shipments
        </h1>

        <p className="text-xs text-[#596560] mt-0.5">
          Monitor active cold-chain shipments and freshness telemetry
        </p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#E5EBE3] pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#596560]" />

            <input
              type="text"
              placeholder="Search by shipment ID, cargo, shipper, destination..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-[#163832]"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[#596560] text-[11px] mr-1">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F3F5F2] border border-[#D6DCD4] text-[#596560] rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#163832] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_transit">In Transit</option>
              <option value="rejected">Rejected</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
            <span className="text-[#596560] text-[11px] mr-1">
              Risk:
            </span>

            <button
              type="button"
              onClick={() => setRiskFilter("all")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                riskFilter === "all"
                  ? "bg-[#163832] text-white font-bold"
                  : "bg-[#F3F5F2] text-[#596560] hover:bg-[#E5EBE3]"
              }`}
            >
              All ({shipments.length})
            </button>

            <button
              type="button"
              onClick={() => setRiskFilter("optimal")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                riskFilter === "optimal"
                  ? "bg-[#5C7A50] text-white font-bold"
                  : "bg-[#F3F5F2] text-[#5C7A50] hover:bg-[#E5EBE3]"
              }`}
            >
              Optimal (70%+)
            </button>

            <button
              type="button"
              onClick={() => setRiskFilter("moderate")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                riskFilter === "moderate"
                  ? "bg-[#D98E2B] text-white font-bold"
                  : "bg-[#F3F5F2] text-[#D98E2B] hover:bg-[#E5EBE3]"
              }`}
            >
              Moderate (36-69%)
            </button>

            <button
              type="button"
              onClick={() => setRiskFilter("critical")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                riskFilter === "critical"
                  ? "bg-[#B3462C] text-white font-bold"
                  : "bg-[#F3F5F2] text-[#B3462C] hover:bg-[#E5EBE3]"
              }`}
            >
              Critical (&lt;36%)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D6DCD4] text-[#596560] font-mono text-[11px] uppercase bg-[#F8FAF7]">
                <th className="py-2.5 px-3">Shipment Code</th>
                <th className="py-2.5 px-3">Cargo & Category</th>
                <th className="py-2.5 px-3">Shipper</th>
                <th className="py-2.5 px-3">Destination Hub</th>
                <th className="py-2.5 px-3">Temp Telemetry</th>
                <th className="py-2.5 px-3">Freshness Gauge</th>
                {hasAccess('cost_savings') && <th className="py-2.5 px-3">Savings</th>}
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E5EBE3]">
              {filteredShipments.map((shipment) => (
                <tr
                  key={shipment.id}
                  onClick={() => navigate(`/admin/shipments/${shipment.id}`)}
                  className="hover:bg-[#F8FAF7] transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-3 font-mono font-bold text-[#163832]">
                    {shipment.code}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#1A211E]">
                      {shipment.cargoType}
                    </div>

                    <div className="text-[10px] font-mono text-[#596560]">
                      {shipment.weightKg} kg •{" "}
                      {shipment.volumeCbm} m³
                    </div>
                  </td>

                  <td className="py-3 px-3 text-[#1A211E]">
                    {shipment.businessName}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-[#1A211E]">
                      {shipment.destination.name.split(",")[0]}
                    </div>

                    <div className="text-[10px] font-mono text-[#596560]">
                      Hub:{" "}
                      {shipment.destination.hubCode || "TERM"}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`font-semibold ${
                        shipment.currentTemp >
                        shipment.targetTempRange.max
                          ? "text-[#B3462C]"
                          : "text-[#163832]"
                      }`}
                    >
                      {shipment.currentTemp}°C
                    </span>

                    <div className="text-[10px] text-[#596560]">
                      Target:{" "}
                      {shipment.targetTempRange.min}–
                      {shipment.targetTempRange.max}°C
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <FreshnessGauge
                      percentage={shipment.freshnessPercent}
                      remainingHours={
                        shipment.remainingShelfLifeHours
                      }
                      totalHours={
                        shipment.totalShelfLifeHours
                      }
                      size="sm"
                      showHours
                      predictedRiskLevel={shipment.spoilageRiskLevel}
                    />
                  </td>

                  {hasAccess('cost_savings') && (
                    <td className="py-3 px-3 font-mono text-[#5C7A50] font-bold">
                      +{shipment.costSavingsPercent}%

                      <div className="text-[10px] text-[#596560] font-normal">
                        ₹
                        {(
                          shipment.estimatedSoloCostINR -
                          shipment.consolidatedCostINR
                        ).toLocaleString()}{" "}
                        saved
                      </div>
                    </td>
                  )}

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        shipment.status === "in_transit"
                          ? "bg-[#5C7A50]/15 text-[#5C7A50]"
                          : shipment.status === "disrupted"
                          ? "bg-[#B3462C]/15 text-[#B3462C]"
                          : shipment.status === "delivered"
                          ? "bg-[#163832]/15 text-[#163832]"
                          : "bg-[#D98E2B]/15 text-[#D98E2B]"
                      }`}
                    >
                      {shipment.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredShipments.length === 0 && (
                <tr>
                  <td
                    colSpan={hasAccess('cost_savings') ? 8 : 7}
                    className="py-10 text-center text-xs text-[#596560]"
                  >
                    No shipments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};
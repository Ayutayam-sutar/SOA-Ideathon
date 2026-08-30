import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FreshnessGauge } from "../../components/FreshnessGauge";
import { dataService } from "../../services/dataService";

import {
  Shipment,
  ConsolidationCluster,
} from "../../types";
import { consolidationEngine } from "../../services/consolidationEngine";
import { useAuth } from "../../contexts/AuthContext";


export const AdminClusters: React.FC = () => {
  const navigate = useNavigate();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [clusters, setClusters] = useState<ConsolidationCluster[]>([]);

  const [selectedClusterId, setSelectedClusterId] =
    useState<string>("");

  const { hasAccess } = useAuth();

  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendedClusters, setRecommendedClusters] = useState<ConsolidationCluster[]>([]);
  const [clusterDetails, setClusterDetails] = useState<Record<string, { aiRoute: any, depTime: any }>>({});
  const [isGenerating, setIsGenerating] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      const currentClusters = await dataService.getClusters();
      setClusters(currentClusters);
      setShipments(await dataService.getShipments());

      if (currentClusters.length > 0) {
        setSelectedClusterId(currentClusters[0].id);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Generate AI recommendations on demand for pending shipments
    if (showRecommendations && shipments.length > 0) {
      const generate = async () => {
        setIsGenerating(true);
        try {
          const recs = consolidationEngine.recommendGrouping(shipments);
          setRecommendedClusters(recs);

          const details: Record<string, any> = {};
          for (const cluster of recs) {
            const aiRoute = await dataService.recommendRoute(cluster.id, cluster.originHub.name, cluster.destinationHub.name);
            const depTime = await dataService.recommendDepartureTime(cluster.id, cluster.shipmentIds, aiRoute);
            details[cluster.id] = { aiRoute, depTime };
          }
          setClusterDetails(details);
        } catch(e) {
          console.error(e);
        } finally {
          setIsGenerating(false);
        }
      };
      generate();
    }
  }, [showRecommendations, shipments]);


  const selectedCluster =
    clusters.find(
      (cluster) => cluster.id === selectedClusterId
    ) || clusters[0];

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

      <div className="flex justify-between items-center bg-[#F3F5F2] border border-[#D6DCD4] rounded p-3">
        <div>
          <h2 className="font-display font-bold text-sm text-[#163832]">AI Recommended Plan</h2>
          <p className="text-[11px] text-[#596560]">Auto-group pending shipments using predictive capacity and temp-compatibility modeling.</p>
        </div>
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className="px-4 py-1.5 bg-[#5C7A50] text-white rounded text-xs font-mono font-semibold hover:bg-[#4A6340] transition-colors"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : showRecommendations ? "Hide Recommendations" : "Generate Recommendations ✨"}
        </button>
      </div>

      {showRecommendations && (
        <div className="border border-[#5C7A50]/40 bg-[#5C7A50]/5 rounded-[6px] p-4 space-y-4 shadow-sm mb-6">
          <h3 className="font-display font-bold text-lg text-[#163832]">Recommended Clusters</h3>
          {recommendedClusters.length === 0 ? (
            <p className="text-sm text-[#596560]">No pending shipments require consolidation at this time.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendedClusters.map(cluster => {
                const details = clusterDetails[cluster.id];
                const aiRoute = details?.aiRoute;
                const depTime = details?.depTime;

                return (
                  <div key={cluster.id} className="bg-white border-2 border-[#5C7A50]/30 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-[#5C7A50] text-white rounded">
                        ✨ RECOMMENDED
                      </span>
                      {hasAccess('cost_savings') && (
                        <span className="font-mono text-[11px] font-bold text-[#5C7A50]">
                          ~{cluster.costSavingsPercent}% Cost Saved
                        </span>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-base text-[#163832] mb-1">{cluster.name}</h4>
                    
                    <div className="text-xs text-[#596560] mb-3">
                      <strong>Hub:</strong> {cluster.originHub.name} → {cluster.destinationHub.name}
                    </div>

                    {!details ? (
                      <div className="text-xs text-[#596560] py-4 text-center animate-pulse">Running Multi-Objective Optimization...</div>
                    ) : (
                      <>
                        <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-2 rounded mb-3 text-[11px]">
                          <div className="font-bold text-[#163832] mb-1">AI Route Strategy:</div>
                          <p className="text-[#596560] mb-1">{aiRoute?.explanation?.multimodalAdvantage}</p>
                          <div className="flex gap-2">
                            {aiRoute?.legs?.map((leg: any, idx: number) => (
                              <span key={leg.id} className="font-mono bg-[#E5EBE3] px-1 rounded">{idx + 1}. {leg.mode.replace('_', ' ').toUpperCase()}</span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#F3F5F2] border border-[#D6DCD4] p-2 rounded mb-3 text-[11px]">
                          <div className="font-bold text-[#B3462C] mb-1">AI Departure Schedule:</div>
                          <p className="text-[#596560] mb-1">{depTime?.reasoning}</p>
                          <div className="font-mono font-bold text-[#163832] mt-1">
                            Window: {depTime?.departureWindow?.earliest} - {depTime?.departureWindow?.latest}
                          </div>
                        </div>

                        <div className="bg-[#F3F5F2] p-2.5 rounded text-[11px] font-mono text-[#596560] space-y-1">
                          <div>Temp Sync: <span className="text-[#163832] font-semibold">{cluster.tempBand}</span></div>
                          <div>Grouped Shipments: <span className="text-[#163832] font-semibold">{cluster.shipmentIds.length} Consignments</span></div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {clusters.map((cluster) => {
          const isSelected =
            cluster.id === selectedClusterId;

          return (
            <div
              key={cluster.id}
              onClick={() =>
                setSelectedClusterId(cluster.id)
              }
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

      {selectedCluster && (
        <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5EBE3] pb-3">
            <div>
              <h3 className="font-display font-bold text-lg text-[#163832]">
                Consolidated Cargo Manifest for{" "}
                {selectedCluster.code}:{" "}
                {selectedCluster.name}
              </h3>

              <span className="font-mono text-xs text-[#596560]">
                Assigned Multimodal Route:{" "}
                {selectedCluster.assignedRouteId}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/routes", {
                  state: {
                    selectedRouteId:
                      selectedCluster.assignedRouteId,
                  },
                })
              }
              className="px-3 py-1.5 bg-[#163832] text-white rounded text-xs font-mono font-semibold hover:bg-[#0F2622] transition-colors"
            >
              View Assigned Route Logic →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shipments
              .filter((shipment) =>
                selectedCluster.shipmentIds.includes(
                  shipment.id
                )
              )
              .map((shipment) => (
                <div
                  key={shipment.id}
                  className="bg-[#F8FAF7] border border-[#E5EBE3] rounded p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-[#163832]">
                      {shipment.code}
                    </div>

                    <div className="font-semibold text-xs text-[#1A211E]">
                      {shipment.cargoType}
                    </div>

                    <div className="text-[11px] text-[#596560]">
                      {shipment.businessName}
                    </div>

                    <div className="font-mono text-[10px] text-[#5C7A50] mt-1">
                      {shipment.weightKg}kg • Temp:{" "}
                      {shipment.currentTemp}°C
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
              ))}
          </div>
        </div>
      )}
    </main>
  );
};
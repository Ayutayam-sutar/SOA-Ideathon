import React, { useEffect, useState } from "react";

import { KarwaanMap } from "../../components/KarwaanMap";
import { dataService } from "../../services/dataService";

import {
  Shipment,
  ConsolidationCluster,
  DeliveryRoute,
} from "../../types";

export const AdminMap: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [clusters, setClusters] = useState<ConsolidationCluster[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setShipments(await dataService.getShipments());
      setClusters(await dataService.getClusters());
      setRoutes(await dataService.getRoutes());
    };
    loadData();
  }, []);

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="border-b border-[#D6DCD4] pb-3">
        <h1 className="font-display font-bold text-2xl text-[#163832]">
          Network Map
        </h1>

        <p className="text-xs text-[#596560] mt-0.5">
          Full interactive agri-logistics corridors
        </p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-[#163832]">
              Full Interactive Agri-Logistics Corridors
            </h3>

            <span className="text-xs text-[#596560]">
              Showing all active shipments, consolidation hubs,
              and multimodal rail wagons
            </span>
          </div>
        </div>

        <KarwaanMap
          shipments={shipments}
          clusters={clusters}
          routes={routes}
          height="560px"
        />
      </div>
    </main>
  );
};
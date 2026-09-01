import React, { useEffect, useState } from "react";
import { KarwaanMap } from "../../components/KarwaanMap";
import { dataService } from "../../services/dataService";
import { Hub } from "../../types";

export const AdminMap: React.FC = () => {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const hubsData = await dataService.getHubs();
        setHubs(hubsData);
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setIsLoading(false);
      }
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
          Full interactive agri-logistics consolidation hubs
        </p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-[#163832]">
              Regional Agri-Logistics Consolidation Hubs
            </h3>

            <span className="text-xs text-[#596560]">
              Showing all {hubs.length || 15} regional consolidation and cross-dock facilities
            </span>
          </div>
        </div>

        <KarwaanMap
          hubs={hubs}
          routes={[]}
          height="580px"
        />
      </div>
    </main>
  );
};
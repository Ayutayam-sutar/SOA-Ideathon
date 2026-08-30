import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="mt-2 bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-2.5 text-[11px] font-sans flex flex-wrap gap-x-4 gap-y-1.5 items-center justify-center shadow-sm select-none">
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-1 bg-[#5C7A50] rounded-full inline-block" />
        <span className="text-[#1A211E] font-medium">Road Reefer Route</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-1 border-b-2 border-dashed border-[#163832] inline-block mb-1" />
        <span className="text-[#1A211E] font-medium">Rail Cold Wagon Rake</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#5C7A50] inline-block" />
        <span className="text-[#1A211E] font-medium">Optimal Freshness (70%+)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#D98E2B] inline-block" />
        <span className="text-[#1A211E] font-medium">Moderate Risk (36-69%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#B3462C] inline-block" />
        <span className="text-[#1A211E] font-medium">Disrupted / Low Freshness</span>
      </div>
    </div>
  );
};

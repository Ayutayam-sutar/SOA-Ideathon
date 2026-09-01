import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, Train, Layers, ShieldCheck, ThermometerSnowflake, Zap } from 'lucide-react';

interface Particle {
  id: number;
  originX: number;
  originY: number;
  color: string;
  name: string;
  weight: string;
  category: string;
}

const ORIGINS = [
  { id: 1, name: 'Daringbadi Strawberries', x: 80, y: 190, weight: '420 kg', color: '#5C7A50' },
  { id: 2, name: 'Sambalpur Dairy', x: 60, y: 90, weight: '350 kg', color: '#5C7A50' },
  { id: 3, name: 'Khurda Mushrooms', x: 120, y: 30, weight: '210 kg', color: '#D98E2B' },
  { id: 4, name: 'Koraput Organics', x: 40, y: 150, weight: '280 kg', color: '#5C7A50' },
];

export const ConsolidationHeroVisualizer: React.FC = () => {
  const [cycle, setCycle] = useState(0);
  const [isConsolidated, setIsConsolidated] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCycle((prev) => prev + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const subTimer = setTimeout(() => {
      setIsConsolidated(true);
    }, 1800);
    const resetTimer = setTimeout(() => {
      setIsConsolidated(false);
    }, 4200);
    return () => {
      clearTimeout(subTimer);
      clearTimeout(resetTimer);
    };
  }, [cycle]);

  return (
    <div className="relative w-full max-w-2xl bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 md:p-6 shadow-sm overflow-hidden select-none">
      {/* Header bar / technical readouts */}
      <div className="flex items-center justify-between border-b border-[#E5EBE3] pb-3 mb-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#163832]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#5C7A50] animate-ping" />
          <span className="font-semibold tracking-wide uppercase">Consolidation Engine v2.4</span>
        </div>
        <div className="flex items-center gap-3 text-[#596560]">
          <span className="hidden sm:inline">THERMAL BAND: 2°C – 4°C</span>
          <span className="text-[#163832] font-bold bg-[#F3F5F2] px-2 py-0.5 rounded border border-[#D6DCD4]">
            LIVE SIMULATION
          </span>
        </div>
      </div>

      {/* SVG Animation Area */}
      <div className="relative w-full h-[240px] sm:h-[260px] bg-[#F8FAF7] rounded border border-[#E5EBE3] overflow-hidden">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(#C4D1C2 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        <svg className="w-full h-full" viewBox="0 0 540 240" fill="none">
          {/* Feeder Path Lines converging to Hub (X: 230, Y: 120) */}
          <path d="M 80 190 Q 150 170 230 120" stroke="#CBD7C8" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 60 90 Q 140 100 230 120" stroke="#CBD7C8" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 120 30 Q 170 70 230 120" stroke="#CBD7C8" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 40 150 Q 130 140 230 120" stroke="#CBD7C8" strokeWidth="2" strokeDasharray="4 4" />

          {/* Consolidated Multimodal Line (Road Reefer -> Rail Wagon -> Terminal) */}
          {/* Section 1: Road corridor (Solid) */}
          <path
            d="M 230 120 L 360 120"
            stroke="#163832"
            strokeWidth={isConsolidated ? '6' : '3'}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          {/* Section 2: Rail line (Dashed / Double-line aesthetic) */}
          <path
            d="M 360 120 L 480 120"
            stroke="#163832"
            strokeWidth="5"
            strokeDasharray="6 3"
            strokeLinecap="round"
          />

          {/* Animated Particles converging from origins to Hub */}
          {ORIGINS.map((item, idx) => (
            <motion.circle
              key={`${item.id}-${cycle}`}
              cx={item.x}
              cy={item.y}
              r="4.5"
              fill={item.color}
              initial={{
                cx: item.x,
                cy: item.y,
                opacity: 0.9,
                scale: 1,
              }}
              animate={{
                cx: [item.x, item.x + (230 - item.x) * 0.5, 230],
                cy: [item.y, item.y + (120 - item.y) * 0.5, 120],
                opacity: [1, 1, 0],
                scale: [1, 1.2, 0.6],
              }}
              transition={{
                duration: 1.6,
                delay: idx * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Animated Consolidated High-Volume Payload moving from Hub to Terminal */}
          <motion.circle
            key={`consolidated-${cycle}`}
            cx={230}
            cy={120}
            r={isConsolidated ? 8 : 0}
            fill="#163832"
            initial={{ cx: 230, cy: 120, opacity: 0 }}
            animate={
              isConsolidated
                ? {
                    cx: [230, 360, 480],
                    cy: [120, 120, 120],
                    opacity: [0, 1, 1],
                  }
                : { opacity: 0 }
            }
            transition={{
              duration: 2.2,
              delay: 0.2,
              ease: 'easeInOut',
            }}
          />

          {/* Node 1: Origin Points */}
          {ORIGINS.map((origin) => (
            <g key={`node-${origin.id}`}>
              <circle cx={origin.x} cy={origin.y} r="5" fill="#FFFFFF" stroke={origin.color} strokeWidth="2.5" />
              <text
                x={origin.x + 8}
                y={origin.y + 4}
                className="text-[9px] font-mono fill-[#596560] font-medium select-none"
              >
                {origin.name.split(' ')[0]} ({origin.weight})
              </text>
            </g>
          ))}

          {/* Node 2: Bhubaneswar Agro Hub (Consolidation Point) */}
          <g transform="translate(230, 120)">
            <circle cx="0" cy="0" r="14" fill="#163832" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="#5C7A50" strokeWidth="1.5" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '8s' }} />
            <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" className="text-[9px] font-mono font-bold">HUB</text>
            <text x="0" y="28" textAnchor="middle" fill="#163832" className="text-[10px] font-bold font-sans">Bhubaneswar Aggregator</text>
          </g>

          {/* Node 3: Khurda Road / Rail Interchange */}
          <g transform="translate(360, 120)">
            <rect x="-10" y="-10" width="20" height="20" rx="3" fill="#FFFFFF" stroke="#163832" strokeWidth="2" />
            <text x="0" y="3" textAnchor="middle" fill="#163832" className="text-[8px] font-mono font-bold">RAIL</text>
            <text x="0" y="24" textAnchor="middle" fill="#596560" className="text-[9px] font-mono font-medium">Khurda Road Siding</text>
          </g>

          {/* Node 4: Final Terminal */}
          <g transform="translate(480, 120)">
            <circle cx="0" cy="0" r="9" fill="#5C7A50" stroke="#FFFFFF" strokeWidth="2" />
            <text x="0" y="24" textAnchor="middle" fill="#163832" className="text-[10px] font-bold font-sans">Paradip Port / Terminal</text>
          </g>
        </svg>

        {/* Floating live status card overlay */}
        <div className="absolute bottom-2 left-2 bg-[#FFFFFF]/90 backdrop-blur-sm border border-[#D6DCD4] rounded px-3 py-1.5 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#163832] font-semibold">
            <Layers className="w-3.5 h-3.5 text-[#5C7A50]" />
            <span>4 Shipments Consolidated</span>
          </div>
          <span className="text-[#D6DCD4]">|</span>
          <span className="font-mono text-[#5C7A50] font-bold">1,260 kg payload</span>
        </div>

        <div className="absolute top-2 right-2 bg-[#163832] text-[#FFFFFF] rounded px-2.5 py-1 flex items-center gap-2 text-[11px] font-mono shadow-sm">
          <ThermometerSnowflake className="w-3.5 h-3.5 text-[#769669]" />
          <span>Active Temp: +2.8°C</span>
        </div>
      </div>

      {/* Metric comparison footer */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E5EBE3] text-center">
        <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-2 rounded">
          <div className="text-[10px] font-mono uppercase text-[#596560]">Freight Cost Savings</div>
          <div className="text-base font-bold font-mono text-[#5C7A50] mt-0.5">38.4%</div>
          <div className="text-[10px] text-[#596560]">vs. isolated trucks</div>
        </div>
        <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-2 rounded">
          <div className="text-[10px] font-mono uppercase text-[#596560]">Avg Freshness Index</div>
          <div className="text-base font-bold font-mono text-[#163832] mt-0.5">84.2%</div>
          <div className="text-[10px] text-[#596560]">unbroken cold-chain</div>
        </div>
        <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-2 rounded">
          <div className="text-[10px] font-mono uppercase text-[#596560]">CO₂ Reductions</div>
          <div className="text-base font-bold font-mono text-[#5C7A50] mt-0.5">-42.0%</div>
          <div className="text-[10px] text-[#596560]">multimodal rail legs</div>
        </div>
      </div>
    </div>
  );
};

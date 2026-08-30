import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Package,
  Truck,
  ThermometerSnowflake,
  Route,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Boxes,
  Factory,
  TrainFront,
  Navigation,
  Activity,
  ShieldCheck,
  Leaf,
  Gauge,
} from 'lucide-react';

interface Step {
  number: string;
  title: string;
  description: string;
  points?: string[];
  icon: React.ElementType;
  type:
    | 'discovery'
    | 'consolidation'
    | 'freshness'
    | 'routing'
    | 'incident'
    | 'rerouting'
    | 'delivery';
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Shipment Discovery',
    description:
      'Karwaan first determines what needs to be transported, where it needs to go, how much is required, and the temperature conditions necessary to ensure its safe and reliable journey.',
    icon: MapPin,
    type: 'discovery',
  },
  {
    number: '02',
    title: 'Smart Consolidation',
    description:
      'Compatible shipments from multiple farmers and MSMEs are intelligently grouped into optimized loads, reducing empty capacity and transportation cost.',
    points: [
      'Compatible temperature ranges',
      'Lower transportation costs & shared routes',
        'Reduced CO₂ emissions with optimized vehicle utilization',
    ],
    icon: Boxes,
    type: 'consolidation',
  },
  {
    number: '03',
    title: 'Freshness Intelligence',
    description:
      'Karwaan continuously monitors temperature, transit time, and environmental exposure to assess product freshness and accurately estimate remaining shelf life throughout the journey.',
    points: [
      'Live temperature monitoring',
      'Dynamic shelf-life prediction',
      'Crate-level freshness visibility',
    ],
    icon: ThermometerSnowflake,
    type: 'freshness',
  },
  {
    number: '04',
    title: 'Multimodal Route Planning',
    description:
      'The system combines road, rail and cold-chain infrastructure to identify efficient routes while balancing cost, transit time and freshness risk.',
    points: [
      'Road + rail route optimization',
      'Cold-storage hub awareness',
      'Explainable route selection',
    ],
    icon: Route,
    type: 'routing',
  },
  {
    number: '05',
    title: 'Incident Detection',
    description:
      'Karwaan continuously watches for disruptions such as traffic bottlenecks, temperature excursions, vehicle issues and infrastructure failures.',
    points: [
      'Temperature excursion alerts',
      'Traffic and route disruption detection',
      'Operational risk scoring',
    ],
    icon: AlertTriangle,
    type: 'incident',
  },
  {
    number: '06',
    title: 'Dynamic Re-Routing',
    description:
      'When a disruption threatens delivery or freshness, Karwaan recalculates the journey and identifies the best available alternative.',
    points: [
      'Alternative route generation',
      'Rail and chilling-depot alternatives',
      'Freshness-aware decisions',
    ],
    icon: RefreshCw,
    type: 'rerouting',
  },
  {
    number: '07',
    title: 'Safe Delivery',
    description:
      'The shipment reaches its destination with complete visibility into its route, freshness condition and operational history.',
    points: [
      'End-to-end shipment visibility',
      'Delivery confirmation',
      'Complete operational trail',
    ],
    icon: CheckCircle2,
    type: 'delivery',
  },
];

/* -------------------------------------------------------------------------- */
/*                                VISUALS                                     */
/* -------------------------------------------------------------------------- */

const DiscoveryVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute left-[4%] top-[8%] h-24 w-24 rounded-full bg-[#DCECE5]/70 blur-[1px]" />
    <div className="absolute right-[5%] top-[10%] h-20 w-20 rounded-full bg-[#EAF0DC]" />

    <div className="absolute left-[8%] right-[8%] top-[7%] h-[72%] rounded-[22px] border border-[#D4E0D8] bg-white shadow-[0_18px_45px_rgba(22,56,50,0.08)]">
      <div className="absolute inset-0 overflow-hidden rounded-[22px]">
        <div className="absolute left-[10%] top-[25%] h-px w-[80%] rotate-[8deg] bg-[#B7CEC2]" />
        <div className="absolute left-[15%] top-[60%] h-px w-[70%] -rotate-[12deg] bg-[#B7CEC2]" />
        <div className="absolute left-[30%] top-[5%] h-[90%] w-px rotate-[25deg] bg-[#B7CEC2]" />
        <div className="absolute right-[25%] top-[5%] h-[90%] w-px -rotate-[18deg] bg-[#B7CEC2]" />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 500 250"
          fill="none"
        >
          <path
            d="M95 145 C180 185 240 75 315 105 C355 120 385 100 415 78"
            stroke="#5C7A50"
            strokeWidth="3"
            strokeDasharray="7 7"
          />
        </svg>

        <div className="absolute left-[17%] top-[48%]">
          <span className="absolute -inset-3 animate-ping rounded-full bg-[#5C7A50]/20" />
          <MapPin className="relative h-8 w-8 fill-[#5C7A50] text-[#163832]" />
        </div>

        <div className="absolute right-[17%] top-[28%]">
          <MapPin className="h-8 w-8 fill-[#D98E2B] text-[#163832]" />
        </div>

        <div className="absolute bottom-[17%] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#D6DCD4] bg-white px-3 py-2 shadow-sm">
          <Package className="h-4 w-4 text-[#5C7A50]" />
          <span className="font-mono text-[9px] font-bold text-[#163832]">
            24 CRATES
          </span>
        </div>
      </div>
    </div>

    <div className="absolute bottom-[3%] left-[2%] rounded-xl border border-[#D6DCD4] bg-white p-3 shadow-[0_10px_25px_rgba(22,56,50,0.10)]">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4F0EA]">
          <Leaf className="h-4 w-4 text-[#5C7A50]" />
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-[#89938E]">
            Commodity
          </div>
          <div className="text-xs font-bold text-[#163832]">
            Fresh Produce
          </div>
        </div>
      </div>
    </div>

    <div className="absolute bottom-[3%] right-[2%] rounded-xl border border-[#D6DCD4] bg-white p-3 shadow-[0_10px_25px_rgba(22,56,50,0.10)]">
      <div className="flex items-center gap-2">
        <Navigation className="h-4 w-4 text-[#D98E2B]" />
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-[#89938E]">
            Destination
          </div>
          <div className="text-xs font-bold text-[#163832]">
            Distribution Hub
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ConsolidationVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute left-[8%] top-[7%] h-28 w-28 rounded-full bg-[#DDEDE5]/60" />
    <div className="absolute right-[5%] bottom-[8%] h-32 w-32 rounded-full bg-[#E8EEDC]/70" />

    <div className="absolute left-[9%] right-[9%] top-[5%] h-[53%] rounded-[20px] border border-[#D2DED7] bg-white p-3 shadow-[0_18px_40px_rgba(22,56,50,0.09)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#5C7A50]" />
        <div className="h-2 w-16 rounded-full bg-[#D8E3DC]" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="h-10 rounded-lg bg-[#E4F1EA] p-2">
          <Package className="h-4 w-4 text-[#5C7A50]" />
        </div>
        <div className="h-10 rounded-lg bg-[#FFF0D9] p-2">
          <Truck className="h-4 w-4 text-[#D98E2B]" />
        </div>
        <div className="h-10 rounded-lg bg-[#E7EEF5] p-2">
          <Route className="h-4 w-4 text-[#54748A]" />
        </div>
        <div className="h-10 rounded-lg bg-[#E9EDE7] p-2">
          <Activity className="h-4 w-4 text-[#5C7A50]" />
        </div>
      </div>

      <div className="mt-3 h-14 rounded-lg border border-[#E2E8E3] p-2">
        <svg viewBox="0 0 400 80" className="h-full w-full">
          <path
            d="M0 65 C55 45 70 55 110 32 C150 10 180 50 220 30 C265 5 300 42 340 22 C365 12 380 18 400 5"
            fill="none"
            stroke="#5C7A50"
            strokeWidth="4"
          />
        </svg>
      </div>
    </div>

    <div className="absolute bottom-[8%] left-[7%] flex gap-2">
      {['A', 'B', 'C'].map((item, index) => (
        <div
          key={item}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#D6DCD4] bg-white shadow-sm"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              index === 0
                ? 'bg-[#DDECE5]'
                : index === 1
                  ? 'bg-[#F8E9D0]'
                  : 'bg-[#E1EBF0]'
            }`}
          >
            <Package className="h-4 w-4 text-[#163832]" />
          </div>
        </div>
      ))}
    </div>

    <div className="absolute bottom-[7%] right-[7%] flex h-20 w-32 items-center justify-center rounded-xl border border-[#C7D6CE] bg-[#163832] shadow-lg">
      <Truck className="h-10 w-10 text-white" />
      <div className="absolute -top-3 right-2 rounded-full bg-[#5C7A50] px-2 py-1 font-mono text-[8px] font-bold text-white">
        82% LOAD
      </div>
    </div>
  </div>
);

const FreshnessVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute left-[12%] top-[10%] h-32 w-32 rounded-full bg-[#DDECE4]/70" />
    <div className="absolute right-[8%] bottom-[10%] h-28 w-28 rounded-full bg-[#F4E8D4]/60" />

    <div className="absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[14px] border-[#DDE7DF] bg-white shadow-[0_18px_45px_rgba(22,56,50,0.10)]">
      <div className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-l-[#5C7A50] border-t-[#5C7A50] rotate-[-30deg]" />

      <div className="text-center">
        <div className="font-mono text-3xl font-bold text-[#163832]">
          91%
        </div>
        <div className="mt-1 font-mono text-[8px] uppercase tracking-widest text-[#89938E]">
          Freshness
        </div>
      </div>
    </div>

    <div className="absolute left-[3%] top-[18%] rounded-xl border border-[#D6DCD4] bg-white p-3 shadow-md">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E1EEF1]">
          <ThermometerSnowflake className="h-4 w-4 text-[#397487]" />
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-[#89938E]">
            Temperature
          </div>
          <div className="text-sm font-bold text-[#163832]">3.2°C</div>
        </div>
      </div>
    </div>

    <div className="absolute right-[3%] top-[17%] rounded-xl border border-[#D6DCD4] bg-white p-3 shadow-md">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-[#5C7A50]" />
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-[#89938E]">
            Shelf Life
          </div>
          <div className="text-sm font-bold text-[#163832]">42h</div>
        </div>
      </div>
    </div>

    <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2 rounded-xl border border-[#D6DCD4] bg-white px-5 py-3 shadow-md">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 animate-pulse text-[#5C7A50]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#163832]">
          Live IoT telemetry
        </span>
      </div>
    </div>
  </div>
);

const RoutingVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute inset-[5%] rounded-[22px] border border-[#D6DCD4] bg-[#F8FAF7] shadow-[0_18px_40px_rgba(22,56,50,0.06)]">
      <div className="absolute inset-0 overflow-hidden rounded-[22px] bg-white">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-[20%] top-0 h-full w-px rotate-[18deg] bg-[#DCE4DE]" />
          <div className="absolute left-[50%] top-0 h-full w-px rotate-[-20deg] bg-[#DCE4DE]" />
          <div className="absolute right-[22%] top-0 h-full w-px rotate-[25deg] bg-[#DCE4DE]" />
          <div className="absolute left-0 top-[30%] h-px w-full rotate-[7deg] bg-[#DCE4DE]" />
          <div className="absolute left-0 top-[65%] h-px w-full rotate-[-10deg] bg-[#DCE4DE]" />
        </div>

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 500 280"
          fill="none"
        >
          <path
            d="M65 215 C120 180 135 80 215 115 C270 140 295 190 345 140 C390 95 420 100 455 65"
            stroke="#D6DCD4"
            strokeWidth="10"
            strokeLinecap="round"
          />

          <path
            d="M65 215 C120 180 135 80 215 115 C270 140 295 190 345 140 C390 95 420 100 455 65"
            stroke="#5C7A50"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 8"
          />
        </svg>

        <div className="absolute bottom-[17%] left-[10%] flex h-9 w-9 items-center justify-center rounded-full bg-[#163832] shadow-md">
          <MapPin className="h-4 w-4 text-white" />
        </div>

        <div className="absolute left-[43%] top-[34%] flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0D8]">
          <TrainFront className="h-5 w-5 text-[#D98E2B]" />
        </div>

        <div className="absolute right-[9%] top-[13%] flex h-11 w-11 items-center justify-center rounded-full bg-[#DCECE4]">
          <Truck className="h-5 w-5 text-[#163832]" />
        </div>

        <div className="absolute right-[7%] top-[17%] h-4 w-4 animate-pulse rounded-full bg-[#D98E2B]" />
      </div>
    </div>

    <div className="absolute bottom-[2%] left-[5%] rounded-xl border border-[#D6DCD4] bg-white px-4 py-3 shadow-md">
      <div className="flex items-center gap-2">
        <Route className="h-4 w-4 text-[#5C7A50]" />
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-[#89938E]">
            Optimized route
          </div>
          <div className="text-xs font-bold text-[#163832]">
            Road + Rail
          </div>
        </div>
      </div>
    </div>
  </div>
);

const IncidentVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute left-[8%] top-[8%] h-28 w-28 rounded-full bg-[#F6E8D5]/70" />

    <div className="absolute bottom-[17%] left-[8%] flex h-20 w-36 items-center justify-center rounded-xl bg-[#163832] shadow-lg">
      <Truck className="h-10 w-10 text-white" />

      <div className="absolute -top-4 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#D98E2B] shadow-md">
        <AlertTriangle className="h-4 w-4 text-white" />
      </div>
    </div>

    <div className="absolute right-[5%] top-[9%] w-[52%] rounded-xl border border-[#E7D7C2] bg-white p-4 shadow-[0_18px_40px_rgba(22,56,50,0.09)]">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF0D9]">
          <AlertTriangle className="h-4 w-4 text-[#D98E2B]" />
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-[#89938E]">
            Incident detected
          </div>
          <div className="text-xs font-bold text-[#163832]">
            Route disruption
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8ECE8]">
        <div className="h-full w-[72%] rounded-full bg-[#D98E2B]" />
      </div>

      <div className="mt-2 flex justify-between font-mono text-[8px] text-[#89938E]">
        <span>Risk</span>
        <span className="font-bold text-[#D98E2B]">72%</span>
      </div>
    </div>

    <div className="absolute bottom-[15%] right-[10%] flex items-end gap-1">
      <span className="h-3 w-1 rounded-full bg-[#D98E2B]" />
      <span className="h-5 w-1 rounded-full bg-[#D98E2B]" />
      <span className="h-8 w-1 rounded-full bg-[#D98E2B]" />
      <span className="h-11 w-1 rounded-full bg-[#D98E2B]" />
    </div>
  </div>
);

const ReroutingVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute inset-[5%] rounded-[22px] border border-[#D6DCD4] bg-white shadow-[0_18px_40px_rgba(22,56,50,0.07)]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 500 280"
        fill="none"
      >
        <path
          d="M55 210 C150 160 150 85 250 125 C330 155 355 85 450 60"
          stroke="#C9D3CC"
          strokeWidth="5"
          strokeDasharray="7 7"
        />

        <path
          d="M55 210 C135 250 210 225 270 185 C340 140 370 115 450 60"
          stroke="#5C7A50"
          strokeWidth="5"
          strokeDasharray="8 7"
        />

        <circle cx="55" cy="210" r="10" fill="#163832" />
        <circle cx="450" cy="60" r="10" fill="#5C7A50" />
      </svg>

      <div className="absolute left-[48%] top-[49%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#5C7A50] shadow-lg">
        <RefreshCw className="h-5 w-5 animate-spin text-white [animation-duration:3s]" />
      </div>

      <div className="absolute bottom-[10%] left-[18%] rounded-lg border border-[#D6DCD4] bg-[#F8FAF7] px-3 py-2">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-[#5C7A50]" />
          <span className="font-mono text-[8px] font-bold text-[#163832]">
            CHILLING HUB
          </span>
        </div>
      </div>

      <div className="absolute right-[8%] top-[8%] rounded-lg bg-[#E3F0E9] px-3 py-2">
        <span className="font-mono text-[8px] font-bold text-[#163832]">
          SAFE ROUTE
        </span>
      </div>
    </div>
  </div>
);

const DeliveryVisual: React.FC = () => (
  <div className="relative h-full min-h-[330px] w-full">
    <div className="absolute left-[8%] top-[9%] h-32 w-32 rounded-full bg-[#DDECE4]/70" />
    <div className="absolute right-[8%] bottom-[10%] h-28 w-28 rounded-full bg-[#E8EEDC]/70" />

    <div className="absolute right-[10%] top-[11%] flex h-24 w-24 items-center justify-center rounded-2xl border border-[#C8D9CF] bg-white shadow-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E3F0E9]">
        <CheckCircle2 className="h-8 w-8 text-[#5C7A50]" />
      </div>
    </div>

    <div className="absolute bottom-[18%] left-[10%] flex h-20 w-36 items-center justify-center rounded-xl bg-[#163832] shadow-lg">
      <Truck className="h-10 w-10 text-white" />

      <div className="absolute -right-2 -top-3 rounded-full bg-[#5C7A50] px-2 py-1 font-mono text-[8px] font-bold text-white">
        DELIVERED
      </div>
    </div>

    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 500 300"
      fill="none"
    >
      <path
        d="M125 225 C205 250 245 180 300 165 C355 150 355 110 405 85"
        stroke="#5C7A50"
        strokeWidth="3"
        strokeDasharray="7 7"
      />
    </svg>

    <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 rounded-xl border border-[#D6DCD4] bg-white px-5 py-3 shadow-md">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#5C7A50]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#163832]">
          Freshness maintained
        </span>
      </div>
    </div>
  </div>
);

const StepVisual: React.FC<{ type: Step['type'] }> = ({ type }) => {
  switch (type) {
    case 'discovery':
      return <DiscoveryVisual />;
    case 'consolidation':
      return <ConsolidationVisual />;
    case 'freshness':
      return <FreshnessVisual />;
    case 'routing':
      return <RoutingVisual />;
    case 'incident':
      return <IncidentVisual />;
    case 'rerouting':
      return <ReroutingVisual />;
    case 'delivery':
      return <DeliveryVisual />;
    default:
      return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                         FLOW CONNECTOR                                     */
/* -------------------------------------------------------------------------- */

const FlowConnector: React.FC<{
  reverse?: boolean;
  visible: boolean;
}> = ({ reverse = false, visible }) => {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-10 hidden h-[150px] w-[263px] -translate-x-1/2 lg:block ${
        reverse ? 'bottom-[-82px]' : 'bottom-[-78px]'
      }`}
      aria-hidden="true"
    >
      <svg
        className={`h-full w-full overflow-visible transition-all duration-1000 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        viewBox="0 0 263 275"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: reverse ? 'scaleX(-1)' : undefined,
        }}
      >
        <path
          d="M8.13678 249.647C7.47108 250.081 6.59001 249.602 6.59106 248.808L6.60444 238.689C6.60544 237.931 7.4158 237.45 8.08162 237.811L16.5478 242.408C17.2136 242.77 17.2512 243.712 16.6163 244.125L8.13678 249.647Z"
          fill="currentColor"
          className="text-[#5C7A50]"
        />

        <path
          d="M261.961 37.8891C216.908 65.6243 128.226 135.486 133.916 193.05C141.029 265.005 265.134 173.468 173.666 148.634C89.2542 125.715 30.9125 210.547 13.9796 236.702"
          stroke="url(#uctWorkArrow2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 6"
          className="text-[#5C7A50]"
        />

        <defs>
          <linearGradient
            id="uctWorkArrow2"
            x1="13.9797"
            y1="234.5"
            x2="276.704"
            y2="60.1939"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         MAIN COMPONENT                                     */
/* -------------------------------------------------------------------------- */

export const HowItWorks: React.FC = () => {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(
    new Set([0])
  );

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((section, index) => {
      if (!section) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;

          setVisibleSteps((previous) => {
            const next = new Set(previous);
            next.add(index);
            return next;
          });
        },
        {
          threshold: 0.28,
          rootMargin: '0px 0px -12% 0px',
        }
      );

      observer.observe(section);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <section
      id="how-we-work"
      className="relative overflow-hidden bg-white text-[#161C1A]"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="px-4 pb-12 pt-20 sm:pb-14 sm:pt-24 lg:pb-16 lg:pt-28">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-[#161C1A] sm:text-5xl lg:text-[52px]">
            How We Work
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#66716C] sm:text-base">
            From fragmented agricultural shipments to optimized,
            freshness-aware delivery.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Workflow                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {steps.map((step, index) => {
          const isVisible = visibleSteps.has(index);
          const isReverse = index % 2 === 1;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.number}>
              <div
                ref={(element) => {
                  sectionRefs.current[index] = element;
                }}
                className="relative"
              >
                <div
                  className={`grid min-h-0 grid-cols-1 items-center gap-10 py-14 sm:py-16 md:grid-cols-2 md:gap-12 lg:gap-20 lg:py-20 ${
                    isReverse ? 'md:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  {/* ------------------------------------------------------ */}
                  {/* Illustration                                             */}
                  {/* ------------------------------------------------------ */}

                  <div
                    className={`relative flex items-center justify-center ${
                      isReverse ? 'md:justify-end' : 'md:justify-start'
                    }`}
                  >
                    <div
                      className={`w-full max-w-[610px] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isVisible
                          ? 'translate-y-0 scale-100 opacity-100'
                          : 'translate-y-10 scale-[0.97] opacity-0'
                      }`}
                    >
                      <StepVisual type={step.type} />
                    </div>
                  </div>

                  {/* ------------------------------------------------------ */}
                  {/* Content                                                  */}
                  {/* ------------------------------------------------------ */}

                  <div
                    className={`flex ${
                      isReverse
                        ? 'md:justify-start'
                        : 'md:justify-end'
                    }`}
                  >
                    <div
                      className={`w-full max-w-[560px] transition-all duration-1000 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isVisible
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-10 opacity-0'
                      }`}
                    >
                      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E7F0EC] px-4 py-2">
                        <span className="font-mono text-xs font-bold tracking-wide text-[#163832]">
                          Step {step.number}
                        </span>
                      </div>

                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#163832] text-white md:hidden">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-[#161C1A] sm:text-4xl lg:text-[42px]">
                        {step.title}
                      </h3>

                      <p className="mt-5 max-w-[550px] text-base leading-7 text-[#64706A] sm:text-lg sm:leading-8">
                        {step.description}
                      </p>

                      {step.points && (
                        <div className="mt-6 space-y-3.5">
                          {step.points.map((point, pointIndex) => (
                            <div
                              key={point}
                              className={`flex items-start gap-3 transition-all duration-700 ${
                                isVisible
                                  ? 'translate-x-0 opacity-100'
                                  : 'translate-x-5 opacity-0'
                              }`}
                              style={{
                                transitionDelay: isVisible
                                  ? `${350 + pointIndex * 100}ms`
                                  : '0ms',
                              }}
                            >
                              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E2EFE8]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#006B58]" />
                              </div>

                              <span className="text-sm leading-6 text-[#596560] sm:text-base">
                                {point}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-7 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C7A50]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5C7A50]" />
                        Intelligent logistics workflow
                      </div>
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------- */}
                {/* Connector                                                 */}
                {/* -------------------------------------------------------- */}

                {index < steps.length - 1 && (
                  <FlowConnector
                    reverse={isReverse}
                    visible={isVisible}
                  />
                )}

                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2 md:hidden">
                    <div
                      className={`relative h-14 w-px overflow-hidden bg-[#DCE7E0] transition-all duration-700 ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-0 h-full w-full origin-top bg-[#5C7A50] transition-transform duration-1000 ease-out ${
                          isVisible ? 'scale-y-100' : 'scale-y-0'
                        }`}
                      />

                      <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#5C7A50] bg-white" />
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
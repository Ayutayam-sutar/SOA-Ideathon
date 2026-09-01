import React from 'react';
import { Link } from 'react-router-dom';
import { ConsolidationHeroVisualizer } from '../components/ConsolidationHeroVisualizer';
import { ArrowRight, Layers, ThermometerSnowflake, Network, ShieldCheck, Sparkles, Truck, Train, ChevronRight } from 'lucide-react';
import HowItWorks from '../components/HowItWorksFlow';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F3F5F2] text-[#1A211E] flex flex-col selection:bg-[#5C7A50] selection:text-[#FFFFFF]">
      {/* Top Navbar */}
      <header className="bg-[#163832] text-[#FFFFFF] border-b border-[#245249] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border border-white/20 flex-shrink-0 flex items-center justify-center p-0.5">
              <img src="/karwaan-logo.png" alt="Karwaan Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-tight text-[#FFFFFF]">
                KARWAAN
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#C4D1C2] uppercase -mt-0.5">
                Agri-Logistics Consolidation
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Value Proposition Left Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#163832]/8 border border-[#163832]/20 rounded text-xs font-mono text-[#163832] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#5C7A50] animate-pulse" />
                <span>AI-Powered Multimodal Consolidation &amp; Cold-Chain Intelligence</span>
              </div>

              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#163832] tracking-tight leading-[1.12]">
                AI-powered multimodal freight consolidation and cold-chain risk intelligence for MSMEs.
              </h1>

              <p className="text-base sm:text-lg text-[#596560] leading-relaxed max-w-xl font-sans">
                Karwaan pools fragmented farm shipments into high-efficiency road and rail cold chains,
                tracks live spoilage risk at the crate level, and automatically re-routes when disruptions strike.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/select-role"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#163832] hover:bg-[#0F2622] text-[#FFFFFF] rounded font-sans font-semibold text-sm transition-all shadow-sm group"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Key Capability Pillars (real system capabilities, not marketing claims) */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#D6DCD4]">
                <div>
                  <div className="font-mono font-bold text-sm sm:text-base text-[#163832] leading-tight">Consolidation Engine</div>
                  <div className="text-xs text-[#596560] font-sans mt-0.5">LTL cost optimization via multi-shipper clustering</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-sm sm:text-base text-[#5C7A50] leading-tight">Spoilage Modeling</div>
                  <div className="text-xs text-[#596560] font-sans mt-0.5">Biological decay risk per cargo category</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-sm sm:text-base text-[#D98E2B] leading-tight">Incident Re-routing</div>
                  <div className="text-xs text-[#596560] font-sans mt-0.5">Live disruption-triggered multimodal alternatives</div>
                </div>
              </div>
            </div>

            {/* Visualizer Right Column (Deliberate Purposeful Consolidation Animation) */}
            <div className="lg:col-span-6 flex justify-center">
              <ConsolidationHeroVisualizer />
            </div>
          </div>
        </section>
        <HowItWorks />
        {/* Core Architecture Section (3 Pillars) */}
        <section className="bg-[#FFFFFF] border-y border-[#D6DCD4] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <span className="font-mono text-xs uppercase font-bold text-[#5C7A50] tracking-wider">
                System Pillars
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#163832] mt-1">
                Engineered for India’s perishable agri corridors.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-[#F8FAF7] border border-[#D6DCD4] rounded-[6px] p-6 space-y-3">
                <div className="w-10 h-10 rounded bg-[#163832] text-[#FFFFFF] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#163832]">
                  1. Multi-Shipper Consolidation
                </h3>
                <p className="text-xs sm:text-sm text-[#596560] leading-relaxed">
                  Small farmers and berry growers no longer pay for half-empty refrigerated trucks. Karwaan’s cluster engine matches shipments sharing compatible temperature ranges (e.g. 2–4°C) into shared multi-temp reefers and rail wagons.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#5C7A50] font-semibold flex items-center gap-1">
                  <span>Compatible temperature band grouping</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[#F8FAF7] border border-[#D6DCD4] rounded-[6px] p-6 space-y-3">
                <div className="w-10 h-10 rounded bg-[#5C7A50] text-[#FFFFFF] flex items-center justify-center">
                  <ThermometerSnowflake className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#163832]">
                  2. Live Spoilage & Freshness Gauge
                </h3>
                <p className="text-xs sm:text-sm text-[#596560] leading-relaxed">
                  Perishables don’t fail on a calendar date; they fail when temperature curves excursion. Our signature Freshness Gauge models biological decay in real time based on IoT reefer telemetry and ambient exposure.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#163832] font-semibold flex items-center gap-1">
                  <span>Dynamic shelf-life prediction</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[#F8FAF7] border border-[#D6DCD4] rounded-[6px] p-6 space-y-3">
                <div className="w-10 h-10 rounded bg-[#D98E2B] text-[#FFFFFF] flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#163832]">
                  3. Incident-Triggered Re-Routing
                </h3>
                <p className="text-xs sm:text-sm text-[#596560] leading-relaxed">
                  When a delivery agent reports a ghat bottleneck or a compressor glitch, Karwaan recalculates multimodal itineraries immediately, diverting to Kisan Rail wagons or secondary chilling depots before spoilage occurs.
                </p>
                <div className="pt-2 font-mono text-[11px] text-[#D98E2B] font-semibold flex items-center gap-1">
                  <span>Transparent, explainable routing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role Access Gateway Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-[#163832] text-[#FFFFFF] rounded-[6px] p-6 sm:p-8 border border-[#245249] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 text-center md:text-left">
              <span className="font-mono text-xs text-[#5C7A50] uppercase font-bold tracking-widest">
                Interactive Multi-Role Experience
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[#FFFFFF]">
                Experience Karwaan from Your perspective.
              </h3>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Test the Platform's Business Shipper order portal with live telemetry.
              </p>
            </div>

            <Link
              to="/select-role"
              className="px-6 py-3 bg-[#FFFFFF] hover:bg-[#F3F5F2] text-[#163832] font-sans font-bold text-sm rounded transition-colors shadow-sm shrink-0 inline-flex items-center gap-2"
            >
              <span>Launch Simulation</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0F2622] text-white/70 border-t border-[#163832] py-6 px-4 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-[#FFFFFF]">KARWAAN</span>
            <span>• Multimodal Perishable Consolidation System</span>
          </div>
          <div>
            Built with ❤️ by Team Juggernaut🚀
          </div>
        </div>
      </footer>
    </div>
  );
};

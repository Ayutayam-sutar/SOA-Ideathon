import React from 'react';
import { DeliveryRoute, RouteLeg } from '../types';
import { Sparkles, Train, Truck, ThermometerSnowflake, Clock, AlertCircle, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { explanationService } from '../services/explanationService';

interface RouteExplanationPanelProps {
  route: DeliveryRoute;
  onReoptimize?: () => void;
  canReoptimize?: boolean;
}

export const RouteExplanationPanel: React.FC<RouteExplanationPanelProps> = ({
  route,
  onReoptimize,
  canReoptimize = false,
}) => {
  const [aiExplanations, setAiExplanations] = React.useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateAiInsights = async () => {
    setIsGenerating(true);
    try {
      const explained = await explanationService.explainRouteChoice(route);
      setAiExplanations((prev) => ({
        ...prev,
        [route.id]: explained,
      }));
    } catch (e) {
      console.error("Failed to generate AI explanation:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const dynamicExplanation = aiExplanations[route.id] || route.explanation;
  const hasAiInsights = Boolean(aiExplanations[route.id]);
  const explanation = dynamicExplanation;

  return (
    <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] p-5 shadow-sm space-y-5">
      {/* Header with Algorithmic Explainability Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EBE3] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#163832]/10 text-[#163832] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#163832]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base text-[#163832]">
                Route Optimization & Decision Logic
              </h3>
              {isGenerating && (
                <span className="text-xs text-[#5C7A50] animate-pulse">
                  (Generating AI insights...)
                </span>
              )}
              {!isGenerating && hasAiInsights && (
                <span className="text-[10px] font-mono font-bold bg-[#5C7A50]/15 text-[#5C7A50] px-2 py-0.5 rounded border border-[#5C7A50]/20">
                  AI ENHANCED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono mt-0.5">
              <span className="font-bold text-[#163832] bg-[#163832]/10 px-2 py-0.5 rounded">
                🚚 FLEET: {route.vehicleId || 'OD-02-AX-4592 (Tata 14T Reefer)'}
              </span>
              <span className="text-[#596560]">ROUTE: {route.code}</span>
              <span className="text-[#596560]">•</span>
              <span className="font-bold text-[#5C7A50]">STATUS: {route.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateAiInsights}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#163832] hover:bg-[#245249] text-[#FFFFFF] rounded text-xs font-mono font-bold tracking-wide transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : 'text-[#8CE1A6]'}`} />
            {isGenerating
              ? 'Generating AI Insights...'
              : hasAiInsights
              ? 'Regenerate AI Insights'
              : 'Generate AI Insights'}
          </button>

          {route.status === 'incident_reported' && canReoptimize && (
            <button
              type="button"
              onClick={onReoptimize}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B3462C] hover:bg-[#8F341E] text-[#FFFFFF] rounded text-xs font-mono font-bold tracking-wide transition-colors shadow-sm"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Re-optimize affected route
            </button>
          )}
        </div>
      </div>

      {/* Primary Summary Callout */}
      <div className="bg-[#F3F5F2] border-l-4 border-[#163832] p-3.5 rounded-r text-xs leading-relaxed text-[#1A211E]">
        <span className="font-semibold text-[#163832]">System Decision Summary: </span>
        {explanation.summary}
      </div>

      {/* Multimodal vs Road Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Why Multimodal / Mode Choice */}
        <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-3.5 rounded">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#163832] uppercase font-mono mb-2">
            <Train className="w-3.5 h-3.5 text-[#5C7A50]" />
            <span>Multimodal Route Advantage</span>
          </div>
          <p className="text-xs text-[#596560] leading-relaxed">
            {explanation.multimodalAdvantage}
          </p>
        </div>

        {/* Thermal Compatibility Breakdown */}
        <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-3.5 rounded">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#163832] uppercase font-mono mb-2">
            <ThermometerSnowflake className="w-3.5 h-3.5 text-[#5C7A50]" />
            <span>Cold-Chain Thermal Sync</span>
          </div>
          <p className="text-xs text-[#596560] leading-relaxed">
            {explanation.thermalCompatibility}
          </p>
        </div>
      </div>

      {/* Leg-by-Leg Execution Sequence */}
      <div>
        <h4 className="font-mono text-xs font-bold uppercase text-[#596560] mb-2.5 tracking-wider">
          Multimodal Legs & Transit Sequence
        </h4>
        <div className="space-y-2">
          {route.legs.map((leg) => {
            const isRail = leg.mode === 'rail_cold_wagon';
            return (
              <div
                key={leg.id}
                className="flex items-center justify-between p-2.5 bg-[#F8FAF7] border border-[#E5EBE3] rounded text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#163832] text-white">
                    LEG {leg.legNumber}
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-[#1A211E]">
                    {isRail ? (
                      <span className="inline-flex items-center gap-1 text-[#163832] font-semibold">
                        <Train className="w-3.5 h-3.5" /> Indian Railways Kisan Cold Rake
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#5C7A50] font-semibold">
                        <Truck className="w-3.5 h-3.5" /> Road Reefer Feeder
                      </span>
                    )}
                    <span className="text-[#596560]">({leg.distanceKm} km, ~{leg.durationHours}h)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#596560] hidden sm:inline truncate max-w-[220px]">
                    {leg.originName} → {leg.destinationName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      leg.status === 'completed'
                        ? 'bg-[#5C7A50]/15 text-[#5C7A50]'
                        : leg.status === 'delayed'
                        ? 'bg-[#B3462C]/15 text-[#B3462C]'
                        : 'bg-[#D98E2B]/15 text-[#D98E2B]'
                    }`}
                  >
                    {leg.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Dynamic Re-Routing Audit Trail */}
      {explanation.rerouteHistory && explanation.rerouteHistory.length > 0 && (
        <div className="border-t border-[#E5EBE3] pt-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#163832] uppercase mb-3">
            <History className="w-3.5 h-3.5 text-[#5C7A50]" />
            <span>Re-Route Audit History & Freshness Recovery</span>
          </div>

          <div className="space-y-2">
            {explanation.rerouteHistory.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#F8FAF7] border border-[#D6DCD4] p-3 rounded text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-[#B3462C]">{item.trigger}</span>
                  <span className="text-[#596560]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[#1A211E]">{item.actionTaken}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#5C7A50]">
                  <span>ETA adjusted: <span className="line-through text-[#596560]">{item.previousETA}</span> → <strong className="text-[#163832]">{item.newETA}</strong></span>
                  <span>•</span>
                  <span><strong>+{item.savedFreshnessHours}h</strong> freshness preserved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

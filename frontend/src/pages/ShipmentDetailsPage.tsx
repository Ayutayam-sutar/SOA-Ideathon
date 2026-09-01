import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { KarwaanMap } from '../components/KarwaanMap';
import { FreshnessGauge } from '../components/FreshnessGauge';
import { dataService } from '../services/dataService';
import { Shipment } from '../types';
import {
  ThermometerSnowflake,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const ShipmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipment = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // dataService.getShipmentById may or may not exist in the exact backend signature, 
        // but we saw it in dataService.ts
        const data = await dataService.getShipmentById(id);
        if (data) {
          setShipment(data);
        } else {
          // If the endpoint doesn't return exactly what we want, fallback to searching the full list
          const all = await dataService.getShipments();
          const found = all.find(s => s.id === id);
          if (found) setShipment(found);
          else setError("Shipment not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load shipment details.");
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
        <AppHeader user={user} activeRole="business" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5C7A50]" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
        <AppHeader user={user} activeRole="business" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-[#163832] mb-2">{error || "Shipment not found"}</h2>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#163832] text-white rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
      <AppHeader user={user} activeRole="business" />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-[#596560] hover:text-[#163832] transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-[#163832] rounded-3xl shadow-xl overflow-hidden flex flex-col">
          {/* Top Dark Header */}
          <div className="p-8 text-white relative">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck className="w-48 h-48" />
             </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="font-mono text-xs font-bold text-[#D98E2B] uppercase tracking-widest bg-[#D98E2B]/10 px-3 py-1.5 rounded border border-[#D98E2B]/20">
                Cold-Chain Status
              </span>
              <span className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                shipment.status === 'in_transit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                shipment.status === 'disrupted' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                shipment.status === 'delivered' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' : 'bg-[#D98E2B]/20 text-[#D98E2B] border border-[#D98E2B]/30'
              }`}>
                {shipment.status.replace('_', ' ')}
              </span>
            </div>
            
            <h1 className="font-display font-black text-4xl sm:text-5xl mb-2 relative z-10">{shipment.code}</h1>
            <p className="text-white/70 text-lg font-medium relative z-10 flex items-center gap-2">
              {shipment.cargoType} &bull; {shipment.weightKg} kg
            </p>
            
            <div className="mt-10 max-w-2xl relative z-10">
              <FreshnessGauge 
                percentage={shipment.freshnessPercent} 
                remainingHours={shipment.remainingShelfLifeHours} 
                totalHours={shipment.totalShelfLifeHours} 
                size="lg" 
                showLabel 
                predictedRiskLevel={shipment.spoilageRiskLevel} 
              />
            </div>
          </div>

          {/* Bottom Light Section */}
          <div className="bg-white rounded-[24px] p-8 sm:p-10 flex flex-col gap-8 -mt-4 relative z-20">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column in Details */}
              <div className="space-y-8">
                {/* AI Consolidation Insight */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                  <Sparkles className="absolute top-0 right-0 w-32 h-32 text-green-500/5 -translate-y-4 translate-x-4 rotate-12" />
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#5C7A50]" />
                    <span className="font-bold text-[#163832] text-sm uppercase tracking-widest">AI Logistics Value</span>
                  </div>
                  <p className="text-base text-gray-700 leading-relaxed font-medium relative z-10">
                    {shipment.consolidationReason || `Grouped with local shipments on the cold corridor. Eradicated deadhead mileage to save ${shipment.costSavingsPercent}%.`}
                  </p>
                </div>

                {/* Financials */}
                <div className="border border-[#E5EBE3] rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#163832] uppercase tracking-widest mb-6">Cost Analysis</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-[#596560] font-bold uppercase tracking-widest block mb-2">Solo Charter Estimate</span>
                      <span className="font-mono text-2xl text-gray-400 line-through">₹{shipment.estimatedSoloCostINR.toLocaleString()}</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                    <div className="text-right">
                      <span className="font-mono text-xs text-[#5C7A50] font-bold uppercase tracking-widest block mb-2">Karwaan Rate</span>
                      <span className="font-mono text-4xl font-black text-[#5C7A50]">₹{shipment.consolidatedCostINR.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#E5EBE3] flex justify-between items-center text-sm font-medium">
                     <span className="text-gray-600">Total Savings</span>
                     <span className="text-[#5C7A50] font-bold bg-[#5C7A50]/10 px-3 py-1 rounded-full">
                       {shipment.costSavingsPercent}% (₹{(shipment.estimatedSoloCostINR - shipment.consolidatedCostINR).toLocaleString()})
                     </span>
                  </div>
                </div>

                {/* Logistics Info */}
                <div className="border border-[#E5EBE3] rounded-2xl p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-[#163832] uppercase tracking-widest mb-6">Route Details</h3>
                   <div className="space-y-6">
                      <div className="flex items-start gap-4">
                         <div className="bg-emerald-100 p-2.5 rounded-xl mt-1">
                            <MapPin className="w-5 h-5 text-emerald-700" />
                         </div>
                         <div>
                            <span className="block text-xs font-mono font-bold text-[#596560] uppercase tracking-widest mb-1">Origin</span>
                            <span className="font-bold text-[#163832] text-base">{shipment.origin.name}</span>
                         </div>
                      </div>
                      <div className="ml-5 border-l-2 border-dashed border-[#E5EBE3] h-6 -my-4 relative left-[11px]"></div>
                      <div className="flex items-start gap-4">
                         <div className="bg-amber-100 p-2.5 rounded-xl mt-1">
                            <MapPin className="w-5 h-5 text-amber-700" />
                         </div>
                         <div>
                            <span className="block text-xs font-mono font-bold text-[#596560] uppercase tracking-widest mb-1">Destination</span>
                            <span className="font-bold text-[#163832] text-base">{shipment.destination.name}</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column in Details */}
              <div className="space-y-8">
                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-6 rounded-2xl text-center shadow-sm">
                    <ThermometerSnowflake className="w-6 h-6 text-[#163832] mx-auto mb-3 opacity-50" />
                    <span className="block text-xs font-mono font-bold text-[#596560] uppercase tracking-widest mb-2">Ambient Temp</span>
                    <span className="font-bold text-[#163832] text-3xl block truncate max-w-full" title={`${shipment.currentTemp}°C`}>
                      {shipment.currentTemp}°C
                    </span>
                    <span className="block text-[10px] text-gray-500 mt-2 font-medium">Target: {shipment.targetTempRange.min}°C - {shipment.targetTempRange.max}°C</span>
                  </div>
                  <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-6 rounded-2xl text-center shadow-sm flex flex-col justify-center">
                    <ShieldCheck className="w-6 h-6 text-[#5C7A50] mx-auto mb-3 opacity-50" />
                    <span className="block text-xs font-mono font-bold text-[#596560] uppercase tracking-widest mb-2">Security Status</span>
                    <span className="font-bold text-[#5C7A50] text-xl block leading-tight">Secured</span>
                    <span className="block text-[10px] text-gray-500 mt-2 font-medium">Smart Lock Active</span>
                  </div>
                </div>

                {/* Map */}
                <div className="border border-[#E5EBE3] rounded-2xl overflow-hidden shadow-inner h-[400px]">
                  <KarwaanMap 
                    shipments={[shipment]} 
                    selectedShipmentId={shipment.id} 
                    height="100%" 
                    showAllControls={true} 
                    showLegend={true} 
                  />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

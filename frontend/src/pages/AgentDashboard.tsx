import React, { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '../components/AppHeader';
import { FreshnessGauge } from '../components/FreshnessGauge';
import { IncidentModal } from '../components/IncidentModal';
import { KarwaanMap } from '../components/KarwaanMap';
import { MapLegend } from '../components/MapLegend';
import { dataService } from '../services/dataService';
import { DeliveryRoute, Shipment, IncidentReport, User, RouteStop } from '../types';
import {
  Navigation,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ThermometerSnowflake,
  ShieldAlert,
  Phone,
  Truck,
  Check,
  Power,
  EyeOff,
  Navigation2,
  PackageOpen
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  // ----------------------------------------------------------------------
  // 1. DATA & BACKEND STATE (UNTOUCHED)
  // ----------------------------------------------------------------------
  const [user, setUser] = useState<User | null>(null);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const myRouteId = user?.assignedRouteId || 'RT-MAHA-901';
  const myRoute = routes.find((r) => r.id === myRouteId) || routes[0];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const u = await dataService.getActiveUser();
      const r = await dataService.getRoutes();
      const s = await dataService.getShipments();
      const i = await dataService.getIncidents();
      
      if (u) setUser(u);
      setRoutes(r);
      setShipments(s);
      setIncidents(i);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleMarkStopComplete = async (stopId: string) => {
    await dataService.markStopCompleted(myRoute.id, stopId);
    setRoutes(await dataService.getRoutes());
    setShipments(await dataService.getShipments());
  };

  const { nextStop, completedStopsCount, totalStopsCount, progressPercent, activeIncidents } = useMemo(() => {
    if (!myRoute || !myRoute.stops) return { nextStop: null, completedStopsCount: 0, totalStopsCount: 0, progressPercent: 0, activeIncidents: [] };
    
    const next = myRoute.stops.find(s => !s.isCompleted);
    const completed = myRoute.stops.filter(s => s.isCompleted).length;
    const total = myRoute.stops.length;
    const activeInc = incidents.filter(i => i.routeId === myRoute.id && i.status === 'open');
    
    return {
      nextStop: next,
      completedStopsCount: completed,
      totalStopsCount: total,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      activeIncidents: activeInc
    };
  }, [myRoute, incidents]);

  // ----------------------------------------------------------------------
  // 2. LOADING & NO-ROUTE STATES
  // ----------------------------------------------------------------------
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Truck className="w-12 h-12 text-[#5C7A50]" />
          <span className="font-mono text-sm text-[#596560] font-medium tracking-wide">Syncing Route Manifest...</span>
        </div>
      </div>
    );
  }

  if (!myRoute) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex flex-col font-sans">
        <AppHeader user={user} activeRole="agent" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-[#E5EBE3] rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
            <Truck className="w-16 h-16 text-[#D6DCD4] mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-[#163832] mb-2">No Active Route</h2>
            <p className="text-[#596560] text-sm leading-relaxed">You are currently unassigned. Dispatch will notify you when a new consolidation manifest is ready.</p>
          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 3. STANDARD DASHBOARD (PREMIUM UI/UX)
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1A211E] flex flex-col font-sans pb-12">
      <AppHeader user={user} activeRole="agent" />

      {/* Hero Banner */}
      <div className="bg-[#163832] text-white border-b-4 border-[#D98E2B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono font-bold text-xs tracking-wider px-2.5 py-1 bg-[#D98E2B] text-[#163832] rounded-md shadow-sm">
                {myRoute.code}
              </span>
              <span className="text-white/80 text-sm font-medium flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                <Truck className="w-4 h-4"/> 
                {myRoute.vehicleId ? myRoute.vehicleId.split('(')[0] : 'Unknown Vehicle'}
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">{myRoute.name}</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Overview, Map & Telemetry */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status & Progress Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5EBE3]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-lg text-[#163832]">Route Status</h3>
                <span className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${activeIncidents.length > 0 ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-[#F3F5F2] text-[#5C7A50] border border-[#D6DCD4]'}`}>
                  {activeIncidents.length > 0 ? '⚠️ INCIDENT ACTIVE' : 'ON SCHEDULE'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#596560]">Overall Progress</span>
                  <span className="text-[#163832] font-bold">{completedStopsCount} of {totalStopsCount} Stops</span>
                </div>
                <div className="w-full bg-[#F3F5F2] h-4 rounded-full overflow-hidden shadow-inner border border-[#E5EBE3]">
                  <div className="bg-[#5C7A50] h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                  </div>
                </div>
              </div>

              {/* Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2 mt-8 border-t border-[#E5EBE3] pt-6">
                <div className="text-center bg-[#F8FAF7] p-2 rounded-lg border border-[#E5EBE3]">
                  <span className="block text-[10px] font-bold tracking-widest text-[#596560] mb-1">CABIN</span>
                  <span className={`font-mono font-bold text-xl ${activeIncidents.length > 0 ? 'text-red-600' : 'text-[#163832]'}`}>
                    {activeIncidents.length > 0 ? '+5.6°' : '+2.8°'}
                  </span>
                </div>
                <div className="text-center bg-[#F8FAF7] p-2 rounded-lg border border-[#E5EBE3]">
                  <span className="block text-[10px] font-bold tracking-widest text-[#596560] mb-1">TARGET</span>
                  <span className="font-mono font-bold text-xl text-[#596560]">1.5-4°</span>
                </div>
                <div className="text-center bg-[#F8FAF7] p-2 rounded-lg border border-[#E5EBE3]">
                  <span className="block text-[10px] font-bold tracking-widest text-[#596560] mb-1">POWER</span>
                  <span className="font-mono font-bold text-xl text-[#5C7A50]">92%</span>
                </div>
              </div>
            </div>

            {/* Live Map (Now visible on mobile devices too) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E5EBE3]">
              <h3 className="font-display font-bold text-base text-[#163832] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D98E2B]"/> Live Routing Map
              </h3>
              <div className="rounded-xl overflow-hidden border border-[#D6DCD4] shadow-inner">
                <KarwaanMap routes={[myRoute]} selectedRouteId={myRoute.id} height="280px" showAllControls={false} showLegend={false} />
              </div>
            </div>

            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="w-full py-4 bg-white hover:bg-rose-50 border-2 border-[#B3462C] text-[#B3462C] rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" /> Report Issue / Breakdown
            </button>
          </div>

          {/* RIGHT COLUMN: Stop Itinerary */}
          <div className="lg:col-span-8">
            <h2 className="font-display font-bold text-2xl text-[#163832] px-1 mb-6">Manifest & Stop Sequence</h2>
            
            {(!myRoute.stops || myRoute.stops.length === 0) ? (
              <div className="bg-white border border-[#E5EBE3] border-dashed rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center h-[400px]">
                <div className="bg-[#F8FAF7] p-5 rounded-full mb-4">
                  <PackageOpen className="w-12 h-12 text-[#5C7A50]" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#163832] mb-2">No Stops Assigned Yet</h3>
                <p className="text-[#596560] max-w-sm mx-auto text-sm">
                  The consolidation engine has created the route wrapper, but stops have not been successfully injected into the manifest. 
                  Waiting for dispatch...
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {myRoute.stops.map((stop, idx) => {
                  const isCompleted = stop.isCompleted;
                  const isNext = !isCompleted && nextStop?.id === stop.id;
                  const stopShipments = shipments.filter((s) => stop.shipmentIds.includes(s.id));

                  return (
                    <div key={stop.id} className={`bg-white rounded-2xl p-6 transition-all relative overflow-hidden ${
                        isCompleted ? 'border border-[#E5EBE3] opacity-60 bg-[#FAFBF9]' : 
                        isNext ? 'border-2 border-[#D98E2B] shadow-lg transform lg:-translate-x-3 bg-white' : 
                        'border border-[#D6DCD4] shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Active indicator strip */}
                      {isNext && <div className="absolute top-0 left-0 w-2 h-full bg-[#D98E2B]" />}
                      
                      <div className="flex flex-col sm:flex-row gap-5 justify-between">
                        <div className="flex gap-5 flex-1">
                          
                          {/* Sequence Number Bubble */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shrink-0 shadow-sm text-lg ${
                              isCompleted ? 'bg-[#5C7A50] text-white' : 
                              isNext ? 'bg-[#D98E2B] text-[#163832]' : 
                              'bg-[#F3F5F2] text-[#596560]'
                            }`}
                          >
                            {isCompleted ? <Check className="w-6 h-6" /> : stop.sequence}
                          </div>

                          <div className="space-y-1.5 w-full">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#F3F5F2] text-[#163832] border border-[#D6DCD4]">
                                {stop.type.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-mono font-bold text-[#596560] flex items-center gap-1.5 bg-[#F8FAF7] px-2 py-0.5 rounded border border-[#E5EBE3]">
                                <Clock className="w-3.5 h-3.5 text-[#5C7A50]" /> {stop.scheduledTime}
                              </span>
                            </div>
                            <h3 className={`font-display font-black leading-tight mt-2 ${isNext ? 'text-2xl text-[#163832]' : 'text-xl text-[#1A211E]'}`}>
                              {stop.name}
                            </h3>
                            <p className="text-sm text-[#596560] max-w-lg leading-relaxed">{stop.address}</p>
                            
                            {/* Shipments Payload visual */}
                            {stopShipments.length > 0 && (
                              <div className="pt-4 flex flex-wrap gap-2">
                                {stopShipments.map(shp => (
                                  <div key={shp.id} className="bg-white border border-[#D6DCD4] rounded-lg px-3 py-2 flex items-center gap-3 text-xs shadow-sm">
                                    <span className="font-mono font-black text-[#163832] bg-[#F3F5F2] px-1.5 py-0.5 rounded">{shp.code}</span>
                                    <span className="text-[#596560] hidden sm:inline font-medium">{shp.cargoType}</span>
                                    <FreshnessGauge percentage={shp.freshnessPercent} size="mini" predictedRiskLevel={shp.spoilageRiskLevel} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Area for the Stop */}
                        <div className="mt-5 sm:mt-0 sm:ml-4 sm:w-44 flex flex-col justify-center">
                          {!isCompleted ? (
                             <button
                               onClick={() => handleMarkStopComplete(stop.id)}
                               disabled={!isNext}
                               className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 touch-manipulation tracking-wide ${
                                 isNext 
                                 ? 'bg-[#5C7A50] hover:bg-[#435A3A] text-white shadow-md active:scale-95 border border-[#435A3A]' 
                                 : 'bg-[#F3F5F2] text-[#A3ADA8] cursor-not-allowed border border-[#E5EBE3]'
                               }`}
                             >
                               <CheckCircle2 className="w-5 h-5" />
                               {isNext ? 'COMPLETE' : 'LOCKED'}
                             </button>
                          ) : (
                            <div className="w-full py-3 bg-[#F8FAF7] text-[#5C7A50] border border-[#E5EBE3] rounded-xl text-center text-sm font-bold flex flex-col items-center justify-center gap-1.5 shadow-inner">
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="text-[10px] uppercase font-mono tracking-widest opacity-80">Done at {stop.completedTime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <IncidentModal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} routes={routes} shipments={shipments} preselectedRouteId={myRoute.id} />
    </div>
  );
};
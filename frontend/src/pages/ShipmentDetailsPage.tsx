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
  AlertTriangle,
  X,
  Truck,
  Ban
} from 'lucide-react';

export const ShipmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Volume too low for cluster');
  const [vehicleId, setVehicleId] = useState('MH-12-HV-8990 (Reefer)');

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

  const handleApproveShipment = async () => {
    if (!shipment) return;
    try {
      setIsApproving(true);
      await dataService.approveShipment(shipment.id);
      setShipment({ ...shipment, status: 'approved' });
    } catch (err) {
      console.error(err);
      alert('Failed to approve shipment');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectShipment = async () => {
    if (!shipment) return;
    try {
      setIsRejecting(true);
      await dataService.rejectShipment(shipment.id, rejectionReason);
      setShipment({ ...shipment, status: 'rejected', rejectionReason });
      setShowRejectModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to reject shipment');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!shipment) return;
    try {
      setIsAssigning(true);
      await dataService.assignVehicle(shipment.id, vehicleId);
      setShipment({ ...shipment, status: 'in_transit', assignedVehicle: vehicleId });
      setShowAssignModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to assign vehicle');
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
        {user?.role !== 'admin' && <AppHeader user={user} activeRole="business" />}
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5C7A50]" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
        {user?.role !== 'admin' && <AppHeader user={user} activeRole="business" />}
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
    <div className={`bg-[#F8FAF7] flex flex-col ${user?.role === 'admin' ? 'min-h-[calc(100vh-80px)]' : 'min-h-screen'}`}>
      {user?.role !== 'admin' && <AppHeader user={user} activeRole="business" />}
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#596560] hover:text-[#163832] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          {/* Admin Actions */}
          {user?.role === 'admin' && shipment.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Ban className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={handleApproveShipment}
                disabled={isApproving}
                className="px-5 py-2.5 bg-[#D98E2B] hover:bg-[#C27E25] disabled:bg-gray-400 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isApproving ? 'Approving...' : 'Approve Shipment'}
              </button>
            </div>
          )}

          {/* Agent Actions */}
          {user?.role === 'agent' && shipment.status === 'approved' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Ban className="w-4 h-4" /> Reject (No Vehicle)
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-5 py-2.5 bg-[#163832] hover:bg-[#1A423B] text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Truck className="w-4 h-4" /> Assign Vehicle
              </button>
            </div>
          )}
        </div>

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
                shipment.status === 'pending' ? 'bg-[#D98E2B]/20 text-[#D98E2B] border border-[#D98E2B]/30' :
                shipment.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                (shipment.status === 'disrupted' || shipment.status === 'rejected') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
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
            
            {/* Workflow Status Timeline */}
            <div className="border border-[#E5EBE3] rounded-2xl p-6 bg-[#F8FAF7]">
              <h3 className="font-display font-bold text-sm text-[#163832] mb-5 uppercase tracking-widest">Shipment Workflow Status</h3>
              <div className="relative flex justify-between">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#E5EBE3] -translate-y-1/2 rounded-full overflow-hidden">
                  <div className={`h-full bg-[#5C7A50] transition-all duration-500 ${
                    shipment.status === 'delivered' ? 'w-full' :
                    shipment.status === 'in_transit' ? 'w-2/3' :
                    shipment.status === 'approved' ? 'w-1/3' :
                    (shipment.status === 'rejected' || shipment.status === 'disrupted') ? 'w-0 bg-red-400' : 'w-0'
                  }`}></div>
                </div>

                {/* Step 1: Pending */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm ${
                    shipment.status === 'pending' ? 'bg-[#D98E2B] border-[#D98E2B] text-white ring-4 ring-[#D98E2B]/20' : 
                    (shipment.status !== 'rejected') ? 'bg-[#5C7A50] border-[#5C7A50] text-white' : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    1
                  </div>
                  <div className="mt-3 text-center w-24">
                    <span className="block text-xs font-bold text-[#163832]">Pending</span>
                    <span className="block text-[10px] text-gray-500 mt-1">Awaiting AI cluster grouping by Admin.</span>
                  </div>
                </div>

                {/* Step 2: Approved */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm ${
                    shipment.status === 'approved' ? 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-500/20' : 
                    ['in_transit', 'delivered'].includes(shipment.status) ? 'bg-[#5C7A50] border-[#5C7A50] text-white' : 
                    shipment.status === 'rejected' ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-[#D6DCD4] text-gray-400'
                  }`}>
                    {shipment.status === 'rejected' ? <Ban className="w-4 h-4" /> : '2'}
                  </div>
                  <div className="mt-3 text-center w-24">
                    <span className={`block text-xs font-bold ${shipment.status === 'rejected' ? 'text-red-600' : 'text-[#163832]'}`}>
                      {shipment.status === 'rejected' ? 'Rejected' : 'Approved'}
                    </span>
                    <span className="block text-[10px] text-gray-500 mt-1">
                      {shipment.status === 'rejected' ? shipment.rejectionReason : 'Grouped into a cluster. Awaiting dispatch.'}
                    </span>
                  </div>
                </div>

                {/* Step 3: In Transit */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm ${
                    shipment.status === 'in_transit' ? 'bg-[#5C7A50] border-[#5C7A50] text-white ring-4 ring-[#5C7A50]/20' : 
                    shipment.status === 'delivered' ? 'bg-[#5C7A50] border-[#5C7A50] text-white' : 'bg-white border-[#D6DCD4] text-gray-400'
                  }`}>
                    3
                  </div>
                  <div className="mt-3 text-center w-24">
                    <span className="block text-xs font-bold text-[#163832]">In Transit</span>
                    <span className="block text-[10px] text-gray-500 mt-1">Agent dispatched. Multi-stop route active.</span>
                  </div>
                </div>

                {/* Step 4: Delivered */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm ${
                    shipment.status === 'delivered' ? 'bg-[#5C7A50] border-[#5C7A50] text-white ring-4 ring-[#5C7A50]/20' : 'bg-white border-[#D6DCD4] text-gray-400'
                  }`}>
                    4
                  </div>
                  <div className="mt-3 text-center w-24">
                    <span className="block text-xs font-bold text-[#163832]">Delivered</span>
                    <span className="block text-[10px] text-gray-500 mt-1">Safely handed over at destination hub.</span>
                  </div>
                </div>
              </div>
            </div>
            
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163832]/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#E5EBE3] flex justify-between items-center bg-[#F8FAF7]">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-display font-bold text-xl">Reject Shipment</h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#163832] mb-2">Reason for Rejection</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAF7] border border-[#D6DCD4] rounded-lg focus:ring-2 focus:ring-[#5C7A50] focus:border-[#5C7A50] transition-colors"
                >
                  <option value="Volume too low for cluster">Volume too low for cluster</option>
                  <option value="No available reefer vehicles">No available reefer vehicles</option>
                  <option value="Temperature constraints mismatch">Temperature constraints mismatch</option>
                  <option value="Outside serviceable area">Outside serviceable area</option>
                  <option value="Other">Other (Type below)</option>
                </select>
              </div>
              {rejectionReason === 'Other' && (
                <div>
                  <textarea
                    placeholder="Enter rejection reason..."
                    className="w-full px-4 py-3 bg-[#F8FAF7] border border-[#D6DCD4] rounded-lg focus:ring-2 focus:ring-[#5C7A50] focus:border-[#5C7A50] transition-colors"
                    rows={3}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#E5EBE3] flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectShipment}
                disabled={isRejecting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:bg-gray-400"
              >
                {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163832]/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#E5EBE3] flex justify-between items-center bg-[#F8FAF7]">
              <div className="flex items-center gap-3 text-[#163832]">
                <Truck className="w-6 h-6" />
                <h3 className="font-display font-bold text-xl">Assign Vehicle</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#163832] mb-2">Select Available Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAF7] border border-[#D6DCD4] rounded-lg focus:ring-2 focus:ring-[#5C7A50] focus:border-[#5C7A50] transition-colors"
                >
                  <option value="MH-12-HV-8990 (Reefer)">MH-12-HV-8990 (Reefer) - Capacity: 5000kg</option>
                  <option value="DL-01-AB-1234 (Insulated)">DL-01-AB-1234 (Insulated) - Capacity: 3000kg</option>
                  <option value="KA-05-MN-9876 (Multi-temp)">KA-05-MN-9876 (Multi-temp) - Capacity: 7000kg</option>
                </select>
              </div>
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-100 flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-600 flex-shrink-0" />
                 <p className="text-sm">Assigning this vehicle will transition the shipment to <strong>In Transit</strong> and notify the shipper.</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#E5EBE3] flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignVehicle}
                disabled={isAssigning}
                className="px-5 py-2.5 bg-[#163832] hover:bg-[#1A423B] text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:bg-gray-400"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

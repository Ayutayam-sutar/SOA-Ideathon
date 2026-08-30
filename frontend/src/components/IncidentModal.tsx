import React, { useState } from 'react';
import { DeliveryRoute, Shipment, IncidentType, IncidentSeverity, IncidentReport } from '../types';
import { dataService } from '../services/dataService';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, ThermometerSnowflake, Truck, Clock } from 'lucide-react';
import { explanationService } from '../services/explanationService';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: DeliveryRoute[];
  shipments: Shipment[];
  preselectedRouteId?: string;
  preselectedShipmentId?: string;
  onIncidentSubmitted?: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  routes,
  shipments,
  preselectedRouteId,
  preselectedShipmentId,
  onIncidentSubmitted,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState(preselectedRouteId || (routes[0]?.id ?? ''));
  const [selectedShipmentId, setSelectedShipmentId] = useState(preselectedShipmentId || (shipments[0]?.id ?? ''));
  const [type, setType] = useState<IncidentType>('temperature_excursion');
  const [severity, setSeverity] = useState<IncidentSeverity>('high');
  const [locationName, setLocationName] = useState('Khandala Ghat Bypass (NH-48, KM 82)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchExplanation = async () => {
      setIsGenerating(true);
      try {
        const mockIncident: any = {
           type, 
           severity, 
           locationName, 
           spoilageRiskImpactHours: severity === 'critical' ? 24 : severity === 'high' ? 14 : 6,
           suggestedAction: type === 'temperature_excursion'
              ? 'Reroute to nearest auxiliary pre-cooling sub-station and boost cryogenic cooling backup.'
              : type === 'vehicle_breakdown'
              ? 'Dispatch rapid replacement cold-reefer from nearby Pune hub and transfer load.'
              : 'Divert traffic via Mumbai-Pune Express Corridor Toll Way 2 with priority green wave clearance.'
        };
        const explained = await explanationService.explainIncidentRemediation(mockIncident as IncidentReport);
        if (isMounted) setAiExplanation(explained);
      } catch (e) {
         if (isMounted) setAiExplanation('');
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };
    
    // slight debounce for locationName typing
    const timeout = setTimeout(() => {
      fetchExplanation();
    }, 500);
    
    return () => { 
      isMounted = false; 
      clearTimeout(timeout);
    };
  }, [type, severity, locationName]);

  if (!isOpen) return null;

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const currentShipment = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activeUser = await dataService.getActiveUser();

    try {
      await dataService.createIncident({
        routeId: selectedRouteId || currentRoute?.id || 'RT-MAHA-901',
        shipmentId: selectedShipmentId || currentShipment?.id || 'SHP-8828',
        type: type,
        severity: severity,
        locationName: locationName || 'Khandala Ghat Bypass',
        notes: notes || 'Observed temperature excursion during mid-transit hill climb. Reefer secondary cooling unit throttling.',
        agentId: activeUser?.id || 'AGENT-1',
      });

      setIsSubmitting(false);
      setIsSubmittedSuccess(true);

      if (onIncidentSubmitted) {
        onIncidentSubmitted();
      }

      setTimeout(() => {
        setIsSubmittedSuccess(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.error("Failed to submit incident:", e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#B3462C] text-[#FFFFFF] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <div>
              <h3 className="font-display font-bold text-base">Report Mid-Transit Incident</h3>
              <span className="font-mono text-[11px] text-white/80">
                Disruption Logging & Automated Route Re-Optimization
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#5C7A50]/15 text-[#5C7A50] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#163832]">
              Incident Logged Successfully
            </h4>
            <p className="text-xs text-[#596560] max-w-sm mx-auto leading-relaxed">
              Disruption telemetry broadcasted to Central Operations. The affected shipment’s freshness
              decay has been updated and real-time re-routing proposals are now active.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Target Route & Shipment Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Active Route
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#163832]"
                >
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.code} — {route.name.slice(0, 26)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Affected Shipment
                </label>
                <select
                  value={selectedShipmentId}
                  onChange={(e) => setSelectedShipmentId(e.target.value)}
                  className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#163832]"
                >
                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.code}: {shipment.cargoType.slice(0, 24)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Incident Type & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Incident Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IncidentType)}
                  className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#163832]"
                >
                  <option value="temperature_excursion">Temperature Excursion (Thermal Spike)</option>
                  <option value="vehicle_breakdown">Vehicle / Reefer Compressor Breakdown</option>
                  <option value="traffic_delay">Severe Highway Traffic Standstill</option>
                  <option value="road_closure">Road Closure / Landslide Obstruction</option>
                  <option value="other">Other Operational Disruption</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#163832]"
                >
                  <option value="moderate">Moderate (+2-4h delay risk)</option>
                  <option value="high">High (+6-12h delay / temp spike)</option>
                  <option value="critical">Critical (Immediate Spoilage Risk)</option>
                </select>
              </div>
            </div>

            {/* Incident Location */}
            <div>
              <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                Current Disruption Location
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. NH-48 Khandala Ghat Km 82, Lane 2"
                className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#163832]"
                required
              />
            </div>

            {/* Observations / Notes */}
            <div>
              <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                Driver / Agent Operational Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe what happened: e.g. reefer compressor warning light triggered, cabin temperature rose from 2.8°C to 5.6°C due to ghat traffic climb..."
                className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#163832]"
                required
              />
            </div>

            {/* Spoilage Impact Warning Card */}
            <div className="bg-[#FCEBE6] border border-[#B3462C]/30 p-3 rounded flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#B3462C] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#1A211E] leading-relaxed">
                <span className="font-bold text-[#B3462C]">Automated Impact Calculation: </span>
                Submitting will reduce {currentShipment?.code || 'shipment'} remaining shelf-life by{' '}
                <strong className="font-mono">{severity === 'critical' ? '24h' : severity === 'high' ? '12h' : '6h'}</strong>, trigger
                instant alert in the Admin Operations Inbox, and queue an alternative multimodal corridor.
                
                <div className="mt-2.5 p-2 bg-[#FFFFFF]/60 rounded border border-[#B3462C]/20">
                  <span className="font-bold text-[#B3462C] flex items-center gap-1 mb-1">
                    ✨ AI Proposed Remediation
                  </span>
                  {isGenerating ? <span className="animate-pulse">Consulting Gemini reasoning engine...</span> : aiExplanation}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5EBE3]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#F3F5F2] hover:bg-[#E5EBE3] text-[#1A211E] rounded font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#B3462C] hover:bg-[#8F341E] text-[#FFFFFF] rounded font-semibold font-mono tracking-wide transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? 'Transmitting telemetry...' : 'Submit incident report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

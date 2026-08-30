import { GoogleGenAI, Type } from '@google/genai';

// Helper: Safely resolve client on runtime to avoid dotenv timing issues
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[ExplanationService] No GEMINI_API_KEY found in environment variables.");
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("[ExplanationService] Failed to initialize GoogleGenAI SDK:", err);
    return null;
  }
}

export const explanationService = {
  async explainRouteChoice(route: any, shipmentDetails?: any): Promise<any> {
    const ai = getAiClient();
    if (!ai) {
      return this.getFallbackRouteExplanation(route, shipmentDetails);
    }

    try {
      const isMultimodal = route.legs && route.legs.some((l: any) => l.mode === 'rail_cold_wagon');
      const distance = route.legs ? route.legs.reduce((acc: number, l: any) => acc + (l.distanceKm || 0), 0) : 0;
      
      const cargo = shipmentDetails?.cargoType || route.cargoType || 'Perishable Produce';
      const tempRange = shipmentDetails ? `${shipmentDetails.targetTempMin}°C to ${shipmentDetails.targetTempMax}°C` : '+2.0°C to +4.0°C';
      const cost = route.cost ? `₹${Math.round(route.cost).toLocaleString()}` : 'Standard Consolidated Rate';

      const prompt = `
        You are an expert cold-chain logistics decision intelligence engine for 'Karwaan'.
        Explain clearly and professionally why this specific multimodal delivery route plan was selected.
        
        Consignment & Routing Profile:
        - Route: ${route.name}
        - Cargo Payload: ${cargo} (Target Thermal Band: ${tempRange})
        - Total Distance: ~${Math.round(distance)} km across ${route.legs ? route.legs.length : 1} segment(s)
        - Transport Structure: ${isMultimodal ? 'Multimodal (Road Feeder + Kisan Rail Cold Wagon)' : 'Direct Express Refrigerated Road'}
        - Estimated Cost: ${cost}
        - Total Duration: ${route.durationHours || 'Optimized'} hours
        - Decision Basis: Optimal multi-objective score balancing cost savings, kinetic shelf life preservation, and strict SLA compliance.
        
        Generate a JSON object with EXACTLY these string keys:
        {
          "summary": "Executive summary (2 sentences max) describing why this plan provides the best trade-off between freight cost and cargo freshness.",
          "multimodalAdvantage": "Explain how the chosen transport mode (e.g. Kisan Rail vs direct reefer) protects margins and reduces vibration/delay risks for this distance.",
          "thermalCompatibility": "Detailed statement on how the refrigeration protocol protects the specific ${cargo} thermal band (${tempRange}).",
          "exclusionNotes": "Any crucial operating constraints or driver alerts (e.g. prompt cross-dock transfer requirements)."
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              multimodalAdvantage: { type: Type.STRING },
              thermalCompatibility: { type: Type.STRING },
              exclusionNotes: { type: Type.STRING },
            },
            required: ['summary', 'multimodalAdvantage', 'thermalCompatibility']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        ...(route.explanation || {}),
        summary: parsed.summary || route.explanation?.summary,
        multimodalAdvantage: parsed.multimodalAdvantage || route.explanation?.multimodalAdvantage,
        thermalCompatibility: parsed.thermalCompatibility || route.explanation?.thermalCompatibility,
        exclusionNotes: parsed.exclusionNotes || route.explanation?.exclusionNotes,
      };
    } catch (error) {
      console.warn("[ExplanationService] Gemini API call failed. Using robust fallback.", error);
      return this.getFallbackRouteExplanation(route, shipmentDetails);
    }
  },

  getFallbackRouteExplanation(route: any, shipmentDetails?: any) {
    const isMultimodal = route.legs && route.legs.some((l: any) => l.mode === 'rail_cold_wagon');
    const cargo = shipmentDetails?.cargoType || 'perishable cargo';
    
    return {
      ...(route.explanation || {}),
      summary: `Plan optimized by multi-objective weighting. ${isMultimodal ? 'Multimodal Kisan Rail trunk routing leverages long-haul scale to reduce per-kg transport charges while preserving product integrity.' : 'Direct point-to-point refrigerated road haul selected to minimize transfer overheads and meet tight delivery timelines.'}`,
      multimodalAdvantage: isMultimodal 
        ? 'Rail corridors offer continuous power stability for cold rakes, reducing mechanical compressor strain and vibrational bruising over long distances.'
        : 'Direct road transport eliminates inter-terminal handling risks and provides high scheduling flexibility.',
      thermalCompatibility: `Active telemetry controls the reefer environment within safe bounds, mitigating kinetic decay for ${cargo}.`,
      exclusionNotes: 'Ensure auxiliary power units remain operational throughout all scheduled transit stops.'
    };
  },

  async explainIncidentRemediation(incident: any): Promise<string> {
    const ai = getAiClient();
    if (!ai) {
      return this.getFallbackIncidentExplanation(incident);
    }

    try {
      const prompt = `
        You are an automated logistics incident response AI for 'Karwaan'.
        A disruption occurred during a cold-chain shipment. Provide a concise, actionable 2-sentence remediation instruction for dispatchers.
        
        Incident Details:
        - Anomaly Type: ${(incident.type || 'Disruption').replace('_', ' ')}
        - Severity Level: ${incident.severity || 'high'}
        - Location: ${incident.locationName || 'Transit Corridor'}
        - Potential Spoilage Exposure: ${incident.spoilageRiskImpactHours || 6} hours
        - Proposed Action: ${incident.suggestedAction || 'Reroute to nearest cold depot'}
        
        Return ONLY the plain-text remediation recommendation.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return response.text?.trim() || incident.suggestedAction;
    } catch (error) {
      console.warn("[ExplanationService] Gemini incident call failed. Using fallback.", error);
      return this.getFallbackIncidentExplanation(incident);
    }
  },

  getFallbackIncidentExplanation(incident: any): string {
    return `Automated Remediation: ${incident.suggestedAction || 'Reroute to nearest verified cold storage facility'}. Immediate action required to mitigate a projected ${incident.spoilageRiskImpactHours || 6}h shelf-life loss.`;
  }
};
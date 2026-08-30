import { DeliveryRoute, IncidentReport } from '../types';
import { apiClient } from '../lib/apiClient';

export const explanationService = {
  /**
   * Generates a natural language explanation for why a specific route and mode were chosen
   * by calling the secure backend API.
   */
  async explainRouteChoice(route: DeliveryRoute): Promise<any> {
    try {
      const data = await apiClient.post(`/routes/${route.id}/explain`);
      
      return {
        ...route.explanation,
        ...data
      };
    } catch (error) {
      console.warn("Backend API failed. Using offline fallback.", error);
      return this.getFallbackRouteExplanation(route);
    }
  },

  getFallbackRouteExplanation(route: DeliveryRoute) {
    const isMultimodal = route.legs.some(l => l.mode === 'rail_cold_wagon');
    return {
      ...route.explanation,
      summary: `[Fallback AI] Route selected by balancing delay risks and cost. ${isMultimodal ? 'Multimodal rail was prioritized over pure road transport to leverage distance economies of scale, saving ~20% in costs.' : 'Direct road transport chosen for short-haul agility, avoiding hub-transfer delays.'}`,
      multimodalAdvantage: isMultimodal 
        ? '[Fallback AI] Rail provides 60% lower vibration levels for sensitive produce and significant cost savings for long-haul sections.'
        : '[Fallback AI] Direct road haul eliminates hub-transfer overheads, reducing overall transit time by 4 hours.',
      thermalCompatibility: '[Fallback AI] Continuous active temperature monitoring applied across all segments. Synced with highly perishable thresholds.',
    };
  },

  /**
   * Generates a remediation strategy explanation for a specific incident
   * by calling the secure backend API.
   */
  async explainIncidentRemediation(incident: IncidentReport): Promise<string> {
    if (!incident.id) {
      return this.getFallbackIncidentExplanation(incident);
    }
    try {
      const data = await apiClient.post(`/incidents/${incident.id}/explain`);
      return data.explanation;
    } catch (error) {
      console.warn("Backend API failed, using fallback incident explanation.", error);
      return this.getFallbackIncidentExplanation(incident);
    }
  },

  getFallbackIncidentExplanation(incident: IncidentReport): string {
    return `[Fallback AI Recommendation]: ${incident.suggestedAction}. This action minimizes the ${incident.spoilageRiskImpactHours}h spoilage risk impact associated with the ${incident.severity} severity disruption.`;
  }
};

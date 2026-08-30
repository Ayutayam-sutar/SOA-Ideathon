export const maskCommercialData = (userRole: string, data: any) => {
  if (userRole === 'admin') {
    return data; // Admins see everything
  }

  const stripCommercialFields = (item: any) => {
    if (!item) return item;
    
    // Create a shallow copy to avoid mutating references if any
    const masked = { ...item };

    if (userRole === 'agent') {
      // Agents shouldn't see costs or cost savings at all
      delete masked.estimatedSoloCostINR;
      delete masked.consolidatedCostINR;
      delete masked.costSavingsPercent;
      delete masked.co2SavedKg;
      delete masked.totalCost;
      delete masked.cost;
    }

    if (userRole === 'business') {
      // Businesses can see their own costs, but if they view a route/cluster, 
      // they shouldn't see other businesses' specific breakdowns.
      // Hide internal scores
      delete masked.score;
    }

    // Recursively mask nested arrays and objects
    if (masked.shipments && Array.isArray(masked.shipments)) {
      masked.shipments = masked.shipments.map((s: any) => stripCommercialFields(s));
    }
    if (masked.legs && Array.isArray(masked.legs)) {
      masked.legs = masked.legs.map((l: any) => stripCommercialFields(l));
    }
    if (masked.candidateGroups && Array.isArray(masked.candidateGroups)) {
      masked.candidateGroups = masked.candidateGroups.map((c: any) => stripCommercialFields(c));
    }
    if (masked.candidatePlans && Array.isArray(masked.candidatePlans)) {
      masked.candidatePlans = masked.candidatePlans.map((c: any) => stripCommercialFields(c));
    }
    if (masked.recommendedPlan) {
      masked.recommendedPlan = stripCommercialFields(masked.recommendedPlan);
    }

    return masked;
  };

  if (Array.isArray(data)) {
    return data.map(item => stripCommercialFields(item));
  }
  
  return stripCommercialFields(data);
};

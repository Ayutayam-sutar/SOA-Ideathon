// Memory cache for dynamic shipment locations
export const dynamicLocationsCache = new Map<string, {
  origin: { name: string; lat: number; lng: number; address: string };
  destination: { name: string; lat: number; lng: number; address: string };
}>();

export const locationCoordsMap: Record<string, [number, number]> = {
  // Odisha Hubs & Terminals
  "bhubaneswar wholesale terminal": [20.2961, 85.8245],
  "bhubaneswar": [20.2961, 85.8245],
  "cuttack agro-packhouse": [20.4625, 85.8830],
  "cuttack": [20.4625, 85.8830],
  "omfed square": [20.2961, 85.8245],
  "puri": [19.8135, 85.8312],
  "jajpur": [20.8444, 86.3364],
  "jajpur road": [20.8444, 86.3364],
  "bhadrak": [21.0544, 86.4955],
  "baleswar": [21.4934, 86.9135],
  "balasore": [21.4934, 86.9135],
  "baripada": [21.9346, 86.7324],
  "rourkela": [22.2604, 84.8536],
  "koraput": [18.8140, 82.7126],
  "malkangiri": [18.3436, 81.8845],
  "balangir": [20.7107, 83.4866],

  // National Trunk Corridors & Rail Terminals
  "delhi": [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  "delhi ncr logistics hub": [28.6139, 77.2090],
  "kolkata": [22.5726, 88.3639],
  "kolkata wholesale hub": [22.5726, 88.3639],
  "hijli": [22.3168, 87.3183],
  "tatanagar junction": [22.7758, 86.2036],
  "tatanagar": [22.7758, 86.2036],
  "muri junction": [23.3644, 85.8569],
  "bokaro steel city": [23.6339, 86.0963],
  "gomoh junction": [23.8647, 86.1264],
  "koderma junction": [24.4361, 85.5925],
  "gaya junction": [24.8016, 84.9984],
  "pt. deen dayal upadhyaya junction": [25.2818, 83.1232],
  "mughalsarai": [25.2818, 83.1232],
  "prayagraj junction": [25.4484, 81.8284],
  "prayagraj": [25.4484, 81.8284],
  "kanpur central": [26.4542, 80.3503],
  "kanpur": [26.4542, 80.3503],
  "patna": [25.6093, 85.1376],
  "dhanbad": [23.7957, 86.4304],
  "raipur": [21.2514, 81.6296],
  "vizag": [17.6868, 83.2185],
  "visakhapatnam": [17.6868, 83.2185],
  "hyderabad": [17.3850, 78.4867],
  "bengaluru": [12.9716, 77.5946],
  "chennai": [13.0827, 80.2707],

  // Western Corridor Hubs
  "mumbai": [19.0760, 72.8777],
  "vashi apmc": [19.0759, 72.9984],
  "pune": [18.5204, 73.8567],
  "nagpur": [21.1458, 79.0882],
  "nashik": [20.0988, 73.9189],
  "satara": [17.6805, 74.0183],
  "ratnagiri": [16.9902, 73.3120],
  "indore": [22.7196, 75.8577]
};

// Case-insensitive coordinate lookup
export function getLocationCoords(name: string): [number, number] {
  if (!name) return [20.2961, 85.8245]; // Safe default: Bhubaneswar
  const cleanName = name.trim().toLowerCase();

  if (locationCoordsMap[cleanName]) {
    return locationCoordsMap[cleanName];
  }

  // Fuzzy substring matching
  for (const [key, coords] of Object.entries(locationCoordsMap)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coords;
    }
  }

  return [20.2961, 85.8245];
}

// Generate intermediate curvature points for realistic map polyline rendering
export function getRouteLegCoordinates(routeId: string, sequence: number, originName: string, destinationName: string): [number, number][] {
  const orig = getLocationCoords(originName);
  const dest = getLocationCoords(destinationName);

  // Generate 2 natural intermediate spline points to avoid rigid straight lines
  const midLat1 = orig[0] + (dest[0] - orig[0]) * 0.33 + (sequence % 2 === 0 ? 0.05 : -0.05);
  const midLng1 = orig[1] + (dest[1] - orig[1]) * 0.33 + (sequence % 2 === 0 ? -0.05 : 0.05);

  const midLat2 = orig[0] + (dest[0] - orig[0]) * 0.66 + (sequence % 2 === 0 ? -0.03 : 0.03);
  const midLng2 = orig[1] + (dest[1] - orig[1]) * 0.66 + (sequence % 2 === 0 ? 0.03 : -0.03);

  return [
    orig,
    [Number(midLat1.toFixed(4)), Number(midLng1.toFixed(4))],
    [Number(midLat2.toFixed(4)), Number(midLng2.toFixed(4))],
    dest
  ];
}

export function getClusterHubs(clusterId: string) {
  return {
    originHub: { 
      name: 'Bhubaneswar Central Cold Hub', 
      lat: 20.2961, 
      lng: 85.8245, 
      address: 'Industrial Cold Complex, Bhubaneswar, Odisha', 
      hubCode: 'BBS-HUB' 
    },
    destinationHub: { 
      name: 'Regional Delivery & Rail Terminal', 
      lat: 28.6139, 
      lng: 77.2090, 
      address: 'Multimodal Freight Complex', 
      hubCode: 'DST-TRM' 
    }
  };
}

export function getRouteCurrentLocation(routeId: string): { currentLocation: [number, number] | null; currentLocationName: string } {
  return { 
    currentLocation: [20.4625, 85.8830], 
    currentLocationName: 'Cuttack-Bhubaneswar Freight Corridor (NH-16)' 
  };
}

// Dynamically extract real origin & destination from the shipment object
export function getShipmentRouteInfo(shipmentId: string, cargoType?: string, origin?: string, destination?: string) {
  if (dynamicLocationsCache.has(shipmentId)) {
    return dynamicLocationsCache.get(shipmentId)!;
  }

  // Use the actual origin/destination passed in from the database
  const originName = origin && origin.trim() !== '' ? origin : 'Bhubaneswar Wholesale Terminal';
  const destName = destination && destination.trim() !== '' ? destination : 'Delhi NCR Logistics Hub';

  const origCoords = getLocationCoords(originName);
  const destCoords = getLocationCoords(destName);

  return {
    origin: { 
      name: originName, 
      lat: origCoords[0], 
      lng: origCoords[1], 
      address: `${originName}, Cargo Terminal` 
    },
    destination: { 
      name: destName, 
      lat: destCoords[0], 
      lng: destCoords[1], 
      address: `${destName}, Delivery Hub` 
    }
  };
}
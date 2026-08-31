import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shipment, ConsolidationCluster, DeliveryRoute } from '../types';
import { getFreshnessColor } from './FreshnessGauge';

interface KarwaanMapProps {
  shipments?: Shipment[];
  clusters?: ConsolidationCluster[];
  routes?: DeliveryRoute[];
  selectedShipmentId?: string;
  selectedRouteId?: string;
  selectedClusterId?: string;
  onSelectShipment?: (shipmentId: string) => void;
  onSelectRoute?: (routeId: string) => void;
  height?: string;
  showAllControls?: boolean;
  showLegend?: boolean;
  isStatic?: boolean;
}

export const KarwaanMap: React.FC<KarwaanMapProps> = ({
  shipments = [],
  clusters = [],
  routes = [],
  selectedShipmentId,
  selectedRouteId,
  selectedClusterId,
  onSelectShipment,
  onSelectRoute,
  height = '480px',
  showAllControls = true,
  showLegend = true,
  isStatic = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Bounding box for India
    const indiaBounds = L.latLngBounds(
      [6.0, 68.0],  // Southwest corner
      [37.5, 98.0]  // Northeast corner
    );

    // Center on Odisha region (India)
    const map = L.map(mapContainerRef.current, {
      center: [20.5, 84.5],
      zoom: 7,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: indiaBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: !isStatic && showAllControls,
      dragging: !isStatic,
      touchZoom: !isStatic,
      scrollWheelZoom: !isStatic,
      doubleClickZoom: !isStatic,
      boxZoom: !isStatic,
      keyboard: !isStatic,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, [showAllControls, isStatic]);

  // Update Layers when data or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Draw Routes (Road & Rail polylines)
    const routesToDraw = selectedRouteId
      ? routes.filter((r) => r.id === selectedRouteId)
      : routes;

    routesToDraw.forEach((route) => {
      const isRouteSelected = route.id === selectedRouteId || routesToDraw.length === 1;

      route.legs.forEach((leg) => {
        let coords = leg.coordinates;
        if (!coords || !Array.isArray(coords) || coords.length === 0) {
          if (leg.originCoords && leg.destinationCoords) {
            coords = [leg.originCoords, leg.destinationCoords];
          }
        }
        if (!coords || !Array.isArray(coords) || coords.length === 0) return;
        
        const isRail = leg.mode === 'rail_cold_wagon';
        
        const color = isRouteSelected
          ? (isRail ? '#163832' : '#5C7A50')
          : route.status === 'incident_reported'
          ? '#B3462C'
          : isRail
          ? '#245249'
          : '#5C7A50';

        const polyline = L.polyline(coords, {
          color: color,
          weight: isRouteSelected ? 6 : isRail ? 4.5 : 3.5,
          opacity: isRouteSelected ? 0.95 : 0.8,
          dashArray: isRail ? '8, 7' : undefined,
          lineJoin: 'round',
        });

        polyline.on('click', () => {
          if (onSelectRoute) onSelectRoute(route.id);
        });

        polyline.bindTooltip(
          `<div class="font-mono text-xs p-1">
            <strong>${isRail ? '🚂 Rail Cold Rake' : '🚛 Road Reefer'}</strong>: ${leg.distanceKm || ''} km<br/>
            ${leg.originName} → ${leg.destinationName}
           </div>`,
          { sticky: true }
        );

        polyline.addTo(layerGroup);
        coords.forEach((coord) => bounds.extend(coord));
      });
    });

    // 2. Draw Hubs / Clusters
    clusters.forEach((cluster) => {
      // Origin Hub
      const hubIcon = L.divIcon({
        className: 'custom-hub-marker',
        html: `
          <div class="bg-[#163832] text-[#FFFFFF] text-[10px] font-mono px-2 py-0.5 rounded border border-[#FFFFFF] shadow-sm flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-[#5C7A50]"></span>
            <span>HUB: ${cluster.originHub.hubCode || 'HUB'}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const hubMarker = L.marker([cluster.originHub.lat, cluster.originHub.lng], { icon: hubIcon });
      hubMarker.bindPopup(`
        <div style="min-width: 240px; font-family: 'IBM Plex Sans', sans-serif;">
          <div style="background-color: #163832; color: #FFFFFF; padding: 8px 12px; font-weight: 600; font-size: 12px;">
            Consolidation Hub: ${cluster.originHub.name}
          </div>
          <div style="padding: 10px 12px; font-size: 12px;">
            <div style="margin-bottom: 6px;"><strong style="color: #163832;">Cluster:</strong> ${cluster.name}</div>
            <div><strong>Active Load:</strong> ${cluster.totalWeightKg} kg / ${cluster.maxCapacityKg} kg (${cluster.reeferLoadFactorPercent}%)</div>
            <div><strong>Temp Band:</strong> ${cluster.tempBand}</div>
            <div style="margin-top: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5C7A50;">
              Cost Savings: ${cluster.costSavingsPercent}% | CO₂ Saved: ${cluster.co2SavedKg}kg
            </div>
          </div>
        </div>
      `);
      hubMarker.addTo(layerGroup);
      bounds.extend([cluster.originHub.lat, cluster.originHub.lng]);
    });

    // 3. Draw Shipments (Origin & Destination pins)
    const shipmentsToDraw = selectedShipmentId
      ? shipments.filter((s) => s.id === selectedShipmentId)
      : selectedClusterId
      ? shipments.filter((s) => s.clusterId === selectedClusterId)
      : shipments;

    shipmentsToDraw.forEach((shipment) => {
      const isSelected = shipment.id === selectedShipmentId;
      const { stroke, bgRing } = getFreshnessColor(shipment.freshnessPercent);

      // Origin Pin (Freshness Colored Circle)
      const originIcon = L.divIcon({
        className: 'custom-shipment-origin-marker',
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-6 h-6 rounded-full border-2 border-[#FFFFFF] shadow-md flex items-center justify-center font-mono font-bold text-[10px]" style="background-color: ${stroke}; color: #FFFFFF;">
              ${shipment.category === 'berries' ? '🍓' : shipment.category === 'mangoes' ? '🥭' : shipment.category === 'grapes' ? '🍇' : shipment.category === 'dairy' ? '🧀' : '🥬'}
            </div>
            ${isSelected ? '<div class="absolute -inset-1 rounded-full border-2 border-[#163832] animate-ping"></div>' : ''}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const originMarker = L.marker([shipment.origin.lat, shipment.origin.lng], { icon: originIcon });
      
      originMarker.bindPopup(`
        <div style="min-width: 250px; font-family: 'IBM Plex Sans', sans-serif;">
          <div style="background-color: #163832; color: #FFFFFF; padding: 8px 12px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 700;">${shipment.code}</span>
            <span style="background: ${stroke}; color: #FFFFFF; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;">${shipment.freshnessPercent}% Fresh</span>
          </div>
          <div style="padding: 10px 12px; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 600; color: #1A211E; margin-bottom: 2px;">${shipment.cargoType}</div>
            <div style="color: #596560; font-size: 11px; margin-bottom: 6px;">Shipper: ${shipment.businessName}</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #F3F5F2; padding: 6px 8px; border-radius: 4px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; margin-bottom: 6px;">
              <div><strong>Weight:</strong> ${shipment.weightKg} kg</div>
              <div><strong>Temp:</strong> ${shipment.currentTemp}°C</div>
              <div><strong>Shelf-life:</strong> ${shipment.remainingShelfLifeHours}h left</div>
              <div><strong>Savings:</strong> ${shipment.costSavingsPercent}%</div>
            </div>

            <div style="font-size: 11px; color: #596560;">
              <div><strong>Origin:</strong> ${shipment.origin.name}</div>
              <div><strong>Destination:</strong> ${shipment.destination.name}</div>
            </div>
          </div>
        </div>
      `);

      originMarker.on('click', () => {
        if (onSelectShipment) onSelectShipment(shipment.id);
      });

      originMarker.addTo(layerGroup);
      bounds.extend([shipment.origin.lat, shipment.origin.lng]);

      // Destination Pin
      const destIcon = L.divIcon({
        className: 'custom-shipment-dest-marker',
        html: `
          <div class="w-4 h-4 rounded-sm bg-[#163832] border border-[#FFFFFF] shadow-sm flex items-center justify-center text-[9px] text-[#FFFFFF]">
            🏁
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const destMarker = L.marker([shipment.destination.lat, shipment.destination.lng], { icon: destIcon });
      destMarker.addTo(layerGroup);
      bounds.extend([shipment.destination.lat, shipment.destination.lng]);
    });

    // 4. Draw Checkpoints & Visible Destinations
    const visibleStopNames = new Set([
      // Checkpoints
      'Tatanagar Junction', 'Tatanagar',
      'Gaya Junction', 'Gaya',
      'Prayagraj Junction', 'Prayagraj',
      'Kanpur Central', 'Kanpur',
      'Baleswar', 'Balasore',
      'Cuttack',
      'Bhadrak',
      'Jajpur', 'Jajpur Road',
      // Other visible places
      'Baripada',
      'Rourkela',
      'Raipur',
      'Vizag', 'Visakhapatnam',
      'Koraput',
      'Malkangiri', 'Malkanagiri',
      'Diamond Harbour', 'Diamond harbour',
      'Dhanbad',
      'Patna',
    ]);

    const hubNames = new Set([
      'Bhubaneswar Wholesale Terminal', 'Bhubaneswar',
      'Kolkata', 'New Delhi',
    ]);

    const stopsMap = new Map<string, [number, number]>();
    routes.forEach((route) => {
      route.legs.forEach((leg) => {
        if (leg.originName && leg.originCoords) {
          stopsMap.set(leg.originName, leg.originCoords);
        }
        if (leg.destinationName && leg.destinationCoords) {
          stopsMap.set(leg.destinationName, leg.destinationCoords);
        }
      });
    });

    stopsMap.forEach((coords, name) => {
      // Skip hub cities — they get their own hub markers below
      if (hubNames.has(name)) return;

      // Check if this location should be visible
      const isVisible = visibleStopNames.has(name);
      if (!isVisible) return; // Skip intermediate stops entirely (no dots, nothing!)

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `<div class="relative flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-[#163832] border-2 border-[#FFFFFF] shadow-md flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-[#E8F5E9]"></div>
            </div>
          </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const stopMarker = L.marker(coords, { icon: stopIcon });
      
      // Permanent visible label
      stopMarker.bindTooltip(
        `<div class="font-mono text-[10px] font-bold text-[#163832] px-1">${name}</div>`,
        { permanent: true, direction: 'top', offset: [0, -10], className: 'checkpoint-label' }
      );
      
      stopMarker.addTo(layerGroup);
      bounds.extend(coords);
    });

    // 5. Draw Hub Markers (Bhubaneswar, Kolkata, New Delhi)
    const hubs = [
      { name: 'Bhubaneswar', code: 'BBS', coords: [20.2961, 85.8245] as [number, number] },
      { name: 'Kolkata', code: 'KOL', coords: [22.5726, 88.3639] as [number, number] },
      { name: 'New Delhi', code: 'NDLS', coords: [28.6139, 77.2090] as [number, number] },
    ];

    hubs.forEach((hub) => {
      const hubIcon = L.divIcon({
        className: 'custom-hub-marker',
        html: `
          <div class="bg-[#163832] text-[#FFFFFF] text-[10px] font-mono px-2 py-0.5 rounded border border-[#FFFFFF] shadow-sm flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-[#5C7A50]"></span>
            <span>HUB: ${hub.code}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const hubMarker = L.marker(hub.coords, { icon: hubIcon });
      hubMarker.bindPopup(`
        <div style="min-width: 180px; font-family: 'IBM Plex Sans', sans-serif;">
          <div style="background-color: #163832; color: #FFFFFF; padding: 8px 12px; font-weight: 600; font-size: 12px;">
            Hub: ${hub.name}
          </div>
          <div style="padding: 10px 12px; font-size: 12px;">
            <div><strong>Code:</strong> ${hub.code}</div>
            <div><strong>Type:</strong> Multi-Modal Cold Hub</div>
          </div>
        </div>
      `);
      hubMarker.addTo(layerGroup);
      bounds.extend(hub.coords);
    });

    const fitMap = () => {
      map.invalidateSize();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      }
    };

    fitMap();
    const timer1 = setTimeout(fitMap, 100);
    const timer2 = setTimeout(fitMap, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [shipments, clusters, routes, selectedShipmentId, selectedRouteId, selectedClusterId, onSelectShipment, onSelectRoute]);

  return (
    <div 
      className="relative w-full border border-[#D6DCD4] rounded-[6px] overflow-hidden bg-[#FFFFFF] shadow-sm"
      style={{ height, minHeight: height }}
    >
      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute top-3 right-3 z-[1000] bg-[#FFFFFF]/95 backdrop-blur-md border border-[#D6DCD4] rounded px-3 py-2 text-xs shadow-sm flex flex-col gap-1.5 select-none">
          <div className="font-mono text-[10px] uppercase font-bold text-[#163832] tracking-wide border-b border-[#E5EBE3] pb-1">
            Network Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-[#5C7A50] rounded-full inline-block" />
            <span className="text-[#1A211E]">Road Reefer Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 border-b-2 border-dashed border-[#163832] inline-block" />
            <span className="text-[#1A211E]">Rail Cold Wagon Rake</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5C7A50] inline-block" />
            <span className="text-[#1A211E]">Optimal Freshness (70%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D98E2B] inline-block" />
            <span className="text-[#1A211E]">Moderate Risk (36-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B3462C] inline-block" />
            <span className="text-[#1A211E]">Disrupted / Low Freshness</span>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '180px' }} className="w-full h-full z-0" />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Shipment, ConsolidationCluster, DeliveryRoute, Hub } from '../types';
import { DEFAULT_HUBS } from '../services/dataService';

interface KarwaanMapProps {
  hubs?: Hub[];
  routes?: DeliveryRoute[];
  clusters?: ConsolidationCluster[];
  shipments?: Shipment[];
  selectedShipmentId?: string;
  selectedRouteId?: string;
  selectedClusterId?: string;
  selectedHubId?: string;
  onSelectShipment?: (shipmentId: string) => void;
  onSelectRoute?: (routeId: string) => void;
  onSelectHub?: (hubId: string) => void;
  height?: string;
  showAllControls?: boolean;
  showLegend?: boolean;
  isStatic?: boolean;
}

export const KarwaanMap: React.FC<KarwaanMapProps> = ({
  hubs = [],
  routes = [],
  clusters = [],
  shipments = [],
  selectedShipmentId,
  selectedRouteId,
  selectedClusterId,
  selectedHubId,
  onSelectShipment,
  onSelectRoute,
  onSelectHub,
  height = '480px',
  showAllControls = true,
  showLegend = true,
  isStatic = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Bounding box for India region
    const indiaBounds = L.latLngBounds(
      [6.0, 68.0],
      [37.5, 98.0]
    );

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

  // Update Layers whenever hubs or routes data changes
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
          ? '#163832'
          : '#5C7A50';

        const polyline = L.polyline(coords, {
          color: color,
          weight: isRouteSelected ? 5 : isRail ? 3.5 : 3,
          opacity: isRouteSelected ? 0.95 : 0.75,
          dashArray: isRail ? '6, 6' : undefined,
          lineJoin: 'round',
        });

        if (onSelectRoute) {
          polyline.on('click', () => onSelectRoute(route.id));
        }

        polyline.bindTooltip(
          `<div class="font-mono text-xs p-1 font-semibold">
            ${isRail ? '🚂 Rail Cold Rake' : '🚛 Road Reefer'}: ${leg.distanceKm ? leg.distanceKm + ' km' : ''}<br/>
            <span class="text-[#596560] font-normal">${leg.originName} → ${leg.destinationName}</span>
           </div>`,
          { sticky: true }
        );

        polyline.addTo(layerGroup);
        coords.forEach((coord) => bounds.extend(coord));
      });
    });

    // 2. Draw Hubs from CSV / API dataset (only when explicitly provided)
    const hubsToDraw = hubs && hubs.length > 0 ? hubs : [];

    hubsToDraw.forEach((hub) => {
      const isSelected = hub.id === selectedHubId;
      const hubCode = hub.hubCode || hub.city || hub.name.split(' ')[0];

      const hubIcon = L.divIcon({
        className: 'custom-hub-marker',
        html: `
          <div class="bg-[#163832] text-[#FFFFFF] text-[10px] font-mono px-2 py-0.5 rounded border ${isSelected ? 'border-[#EBB05E] ring-2 ring-[#EBB05E]' : 'border-[#FFFFFF]'} shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-[#0F2622] transition-all">
            <span class="w-2 h-2 rounded-full bg-[#5C7A50]"></span>
            <span class="font-bold">HUB: ${hubCode}</span>
          </div>
        `,
        iconSize: [85, 24],
        iconAnchor: [42, 12],
      });

      const hubMarker = L.marker([hub.latitude, hub.longitude], { icon: hubIcon });

      hubMarker.bindPopup(`
        <div style="min-width: 220px; font-family: 'IBM Plex Sans', sans-serif;">
          <div style="background-color: #163832; color: #FFFFFF; padding: 8px 12px; font-weight: 700; font-size: 13px; border-radius: 4px 4px 0 0;">
            ${hub.name}
          </div>
          <div style="padding: 10px 12px; font-size: 12px; line-height: 1.5; color: #1A211E; background: #FFFFFF;">
            <div><strong>City:</strong> ${hub.city}</div>
            <div><strong>Capacity:</strong> ${hub.capacityKg ? hub.capacityKg.toLocaleString() + ' kg' : 'N/A'}</div>
            <div><strong>Connectivity:</strong> ${hub.roadAccess ? '🚛 Road' : ''} ${hub.railAccess ? '🚂 Rail' : ''}</div>
            <div><strong>Cold Storage:</strong> ${hub.coldStorage ? '✅ Active' : '❌ None'}</div>
            <div><strong>Reefer Cross-Dock:</strong> ${hub.reeferCrossDock ? '✅ Supported' : '❌ None'}</div>
          </div>
        </div>
      `);

      if (onSelectHub) {
        hubMarker.on('click', () => onSelectHub(hub.id));
      }

      hubMarker.addTo(layerGroup);
      bounds.extend([hub.latitude, hub.longitude]);
    });

    // 3. Draw Cluster Endpoints if any
    clusters.forEach((cluster) => {
      if (cluster.originHub && cluster.originHub.lat && cluster.originHub.lng) {
        bounds.extend([cluster.originHub.lat, cluster.originHub.lng]);
      }
      if (cluster.destinationHub && cluster.destinationHub.lat && cluster.destinationHub.lng) {
        bounds.extend([cluster.destinationHub.lat, cluster.destinationHub.lng]);
      }
    });

    // 4. Draw simple shipment endpoints if single shipment view
    if (shipments && shipments.length > 0 && (!hubs || hubs.length === 0)) {
      shipments.forEach((s) => {
        if (s.origin && s.origin.lat && s.origin.lng) {
          const originIcon = L.divIcon({
            className: 'custom-origin-dot',
            html: `<div class="w-3.5 h-3.5 rounded-full bg-[#5C7A50] border-2 border-white shadow"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const m1 = L.marker([s.origin.lat, s.origin.lng], { icon: originIcon });
          m1.bindTooltip(`<div class="font-mono text-xs font-semibold">Origin: ${s.origin.name}</div>`);
          m1.addTo(layerGroup);
          bounds.extend([s.origin.lat, s.origin.lng]);
        }
        if (s.destination && s.destination.lat && s.destination.lng) {
          const destIcon = L.divIcon({
            className: 'custom-dest-dot',
            html: `<div class="w-3.5 h-3.5 rounded-full bg-[#163832] border-2 border-white shadow"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const m2 = L.marker([s.destination.lat, s.destination.lng], { icon: destIcon });
          m2.bindTooltip(`<div class="font-mono text-xs font-semibold">Destination: ${s.destination.name}</div>`);
          m2.addTo(layerGroup);
          bounds.extend([s.destination.lat, s.destination.lng]);
        }

        // Draw connecting line between origin and destination
        if (s.origin && s.origin.lat && s.origin.lng && s.destination && s.destination.lat && s.destination.lng) {
          const polyline = L.polyline([
            [s.origin.lat, s.origin.lng],
            [s.destination.lat, s.destination.lng]
          ], {
            color: '#5C7A50',
            weight: 3,
            opacity: 0.6,
            dashArray: '8, 8',
            lineJoin: 'round',
          });
          polyline.addTo(layerGroup);
        }
      });
    }

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
  }, [hubs, routes, clusters, shipments, selectedRouteId, selectedClusterId, selectedHubId, selectedShipmentId, onSelectRoute, onSelectHub, onSelectShipment]);

  return (
    <div 
      className="relative w-full border border-[#D6DCD4] rounded-[6px] overflow-hidden bg-[#FFFFFF] shadow-sm"
      style={{ height, minHeight: height }}
    >
      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute top-3 right-3 z-[1000] bg-[#FFFFFF]/95 backdrop-blur-md border border-[#D6DCD4] rounded px-3 py-2 text-xs shadow-sm flex flex-col gap-1.5 select-none">
          {routes && routes.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-[#5C7A50] rounded-full inline-block" />
                <span className="text-[#1A211E]">Road Reefer Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 border-b-2 border-dashed border-[#163832] inline-block" />
                <span className="text-[#1A211E]">Rail Cold Wagon Rake</span>
              </div>
            </>
          )}
          {hubs && hubs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#163832] border border-[#FFFFFF] inline-block" />
              <span className="text-[#1A211E]">Agri-Logistics Hub</span>
            </div>
          )}
          {shipments && shipments.length > 0 && (!hubs || hubs.length === 0) && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5C7A50] inline-block" />
                <span className="text-[#1A211E]">Origin / Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#163832] inline-block" />
                <span className="text-[#1A211E]">Destination / Delivery</span>
              </div>
            </>
          )}
        </div>
      )}

      <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '180px' }} className="w-full h-full z-0" />
    </div>
  );
};

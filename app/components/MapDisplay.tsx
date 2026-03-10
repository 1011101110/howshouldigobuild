'use client';

import { useEffect, useRef } from 'react';
import { LatLng, TransportMode } from '../types';

interface MapDisplayProps {
  origin: LatLng | null;
  destination: LatLng | null;
  selectedMode: TransportMode | null;
  onRoutesLoaded: (routes: Record<TransportMode, google.maps.DirectionsResult | null>) => void;
  allRoutes: Record<TransportMode, google.maps.DirectionsResult | null>;
}

const WINNER_COLOR = '#2563eb'; // bold blue for selected
const GHOST_COLOR = '#9ca3af';  // medium gray for others

export default function MapDisplay({
  origin,
  destination,
  selectedMode,
  onRoutesLoaded,
  allRoutes,
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const renderers = useRef<Partial<Record<TransportMode, google.maps.DirectionsRenderer>>>({});
  const markers = useRef<google.maps.Marker[]>([]);
  const fetchedForKey = useRef<string>('');

  const MODES: TransportMode[] = ['walking', 'bicycling', 'driving', 'transit'];

  // Init map once
  useEffect(() => {
    const tryInit = () => {
      if (!mapRef.current || mapInstance.current) return;
      if (typeof google === 'undefined' || !google.maps) return;

      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 13,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: lightMapStyles,
      });
    };

    tryInit();
    // Retry after a tick in case Maps hasn't loaded yet
    const t = setTimeout(tryInit, 500);
    return () => clearTimeout(t);
  }, []);

  // Fetch directions when origin/destination change
  useEffect(() => {
    if (!origin || !destination) return;
    const key = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
    if (fetchedForKey.current === key) return;
    fetchedForKey.current = key;

    const waitForMaps = (cb: () => void) => {
      if (typeof google !== 'undefined' && google.maps && mapInstance.current) {
        cb();
      } else {
        setTimeout(() => waitForMaps(cb), 200);
      }
    };

    waitForMaps(() => {
      const svc = new google.maps.DirectionsService();
      const loaded: Record<TransportMode, google.maps.DirectionsResult | null> = {
        walking: null, bicycling: null, driving: null, transit: null,
      };
      let count = 0;

      const gmMode: Record<TransportMode, google.maps.TravelMode> = {
        walking: google.maps.TravelMode.WALKING,
        bicycling: google.maps.TravelMode.BICYCLING,
        driving: google.maps.TravelMode.DRIVING,
        transit: google.maps.TravelMode.TRANSIT,
      };

      MODES.forEach((mode) => {
        svc.route(
          { origin, destination, travelMode: gmMode[mode] },
          (result, status) => {
            count++;
            if (status === google.maps.DirectionsStatus.OK && result) {
              loaded[mode] = result;
            }
            if (count === MODES.length) {
              onRoutesLoaded(loaded);
            }
          }
        );
      });
    });
  }, [origin, destination]);

  // Render/update route polylines
  useEffect(() => {
    if (!mapInstance.current) return;
    if (!origin || !destination) return;

    // Clear old markers
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    MODES.forEach((mode) => {
      const result = allRoutes[mode];
      const isSelected = mode === selectedMode;

      if (!result) {
        renderers.current[mode]?.setMap(null);
        delete renderers.current[mode];
        return;
      }

      if (!renderers.current[mode]) {
        renderers.current[mode] = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          preserveViewport: true,
        });
        renderers.current[mode]!.setMap(mapInstance.current);
      }

      const r = renderers.current[mode]!;
      // Only show selected route; hide others completely unless user has picked one
      if (!isSelected && selectedMode) {
        // Hide non-selected routes entirely — no more blue spaghetti
        r.setMap(null);
        return;
      }

      r.setMap(mapInstance.current);
      r.setOptions({
        polylineOptions: {
          strokeColor: isSelected ? WINNER_COLOR : GHOST_COLOR,
          strokeOpacity: isSelected ? 0.9 : 0.3,
          strokeWeight: isSelected ? 6 : 3,
          zIndex: isSelected ? 20 : 1,
          clickable: !isSelected,
        },
        suppressMarkers: true,
        preserveViewport: !isSelected,
      });
      r.setDirections(result);

      if (isSelected && result.routes[0]?.bounds) {
        mapInstance.current!.fitBounds(result.routes[0].bounds, {
          top: 60, right: 30, bottom: 30, left: 30,
        });
      }
    });

    // Place origin/destination markers for selected route
    if (selectedMode && allRoutes[selectedMode]?.routes[0]?.legs[0]) {
      const leg = allRoutes[selectedMode]!.routes[0].legs[0];

      const mkOrigin = new google.maps.Marker({
        position: leg.start_location,
        map: mapInstance.current,
        title: 'Start',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
          scale: 9,
        },
        zIndex: 100,
      });

      const mkDest = new google.maps.Marker({
        position: leg.end_location,
        map: mapInstance.current,
        title: 'Destination',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
          scale: 9,
        },
        zIndex: 100,
      });

      markers.current = [mkOrigin, mkDest];
    }
  }, [selectedMode, allRoutes, origin, destination]);

  return (
    <div id="map-container" className="relative w-full rounded-none sm:rounded-2xl overflow-hidden border-y sm:border border-gray-200 shadow-sm" style={{ height: 'clamp(320px, 56vh, 620px)' }}>
      <div ref={mapRef} className="w-full h-full" />
      {(!origin || !destination) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-[2px]">
          <div className="text-5xl mb-3 opacity-30">🗺️</div>
          <p className="text-gray-400 text-sm font-medium">Enter a destination above</p>
        </div>
      )}
    </div>
  );
}

// Minimal styling — keep Google Maps' default look, just reduce POI clutter
const lightMapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station.bus', stylers: [{ visibility: 'off' }] },
];

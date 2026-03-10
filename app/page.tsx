'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { TransportMode, WeatherData, RouteResult, TransportScore, LatLng } from './types';
import { scoreTransportModes } from './utils/scoring';
import WeatherDisplay from './components/WeatherDisplay';
import PreferenceSlider from './components/PreferenceSlider';
import TransportCard from './components/TransportCard';
import RecommendationBanner from './components/RecommendationBanner';
import { LocationIcon, SpinnerIcon } from './components/icons';

const MapDisplay = dynamic(() => import('./components/MapDisplay'), { ssr: false });

const MODES: TransportMode[] = ['walking', 'bicycling', 'driving', 'transit'];
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function metersToMiles(m: number) { return m * 0.000621371; }

export default function Home() {
  const [mapsReady, setMapsReady] = useState(false);
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [originLatLng, setOriginLatLng] = useState<LatLng | null>(null);
  const [destLatLng, setDestLatLng] = useState<LatLng | null>(null);
  const [originShortName, setOriginShortName] = useState('');
  const [sliderValue, setSliderValue] = useState(1.5);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [scores, setScores] = useState<TransportScore[]>([]);
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
  const [allGmRoutes, setAllGmRoutes] = useState<Record<TransportMode, google.maps.DirectionsResult | null>>({
    walking: null, bicycling: null, driving: null, transit: null,
  });
  const [routeResults, setRouteResults] = useState<Record<TransportMode, RouteResult | null>>({
    walking: null, bicycling: null, driving: null, transit: null,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const fetchWeather = useCallback(async (loc: LatLng) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${loc.lat}&lng=${loc.lng}`);
      if (!res.ok) throw new Error('Failed');
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch {
      // Weather is best-effort
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const initAutocomplete = useCallback(() => {
    if (!originInputRef.current || !destInputRef.current) return;
    if (typeof google === 'undefined' || !google.maps?.places) return;

    const opts: google.maps.places.AutocompleteOptions = {
      fields: ['geometry', 'formatted_address', 'name'],
    };

    const originAC = new google.maps.places.Autocomplete(originInputRef.current, opts);
    const destAC = new google.maps.places.Autocomplete(destInputRef.current, opts);

    originAC.addListener('place_changed', () => {
      const place = originAC.getPlace();
      if (place.geometry?.location) {
        const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        const name = place.name || place.formatted_address || '';
        setOriginLatLng(loc);
        setOriginText(place.formatted_address || name);
        setOriginShortName(name.split(',')[0]);
        fetchWeather(loc);
      }
    });

    destAC.addListener('place_changed', () => {
      const place = destAC.getPlace();
      if (place.geometry?.location) {
        setDestLatLng({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        setDestText(place.formatted_address || place.name || '');
      }
    });

    setMapsReady(true);
  }, [fetchWeather]);

  // Listen for Maps API ready event
  useEffect(() => {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google.maps?.places) {
        initAutocomplete();
      }
    };
    // If already loaded
    if ((window as unknown as Record<string, unknown>).__mapsReady) {
      tryInit();
    }
    // Listen for future load
    window.addEventListener('maps-ready', tryInit);
    return () => window.removeEventListener('maps-ready', tryInit);
  }, [initAutocomplete]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation not available'); return; }
    setLoadingLocation(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOriginLatLng(loc);
        fetchWeather(loc);

        if (typeof google !== 'undefined' && google.maps) {
          new google.maps.Geocoder().geocode({ location: loc }, (results, status) => {
            const addr = status === 'OK' && results?.[0]?.formatted_address
              ? results[0].formatted_address
              : `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
            setOriginText(addr);
            setOriginShortName(addr.split(',')[0]);
            if (originInputRef.current) originInputRef.current.value = addr;
          });
        }
        setLoadingLocation(false);
      },
      (err) => { setLoadingLocation(false); setError(`Location error: ${err.message}`); },
      { timeout: 10000 }
    );
  }, [fetchWeather]);

  // Parse Google DirectionsResult → RouteResult
  const handleRoutesLoaded = useCallback(
    (gmRoutes: Record<TransportMode, google.maps.DirectionsResult | null>) => {
      setAllGmRoutes(gmRoutes);
      const parsed: Record<TransportMode, RouteResult | null> = {
        walking: null, bicycling: null, driving: null, transit: null,
      };
      MODES.forEach((mode) => {
        const res = gmRoutes[mode];
        if (!res?.routes[0]?.legs[0]) return;
        const leg = res.routes[0].legs[0];
        parsed[mode] = {
          mode,
          durationSeconds: leg.duration?.value ?? 0,
          distanceMeters: leg.distance?.value ?? 0,
          durationText: leg.duration?.text ?? '',
          distanceText: leg.distance?.text ?? '',
          distanceMiles: metersToMiles(leg.distance?.value ?? 0),
          polyline: res.routes[0].overview_polyline,
        };
      });
      setRouteResults(parsed);
    },
    []
  );

  // Score computation
  useEffect(() => {
    if (!weather || !Object.values(routeResults).some(Boolean)) return;
    const computed = scoreTransportModes(routeResults, weather, sliderValue);
    setScores(computed);
  }, [routeResults, weather, sliderValue]);

  // Auto-select winner when scores change
  useEffect(() => {
    if (scores.length > 0 && scores[0].route) {
      setSelectedMode(scores[0].mode);
    }
  }, [scores]);

  const winner = scores[0] ?? null;

  return (
    <>
      {/* Google Maps loader — callback triggers autocomplete init */}
      <Script
        id="maps-shim"
        strategy="beforeInteractive"
      >{`window.__mapsReady=false;window.__initMaps=function(){window.__mapsReady=true;window.dispatchEvent(new Event('maps-ready'));};`}</Script>
      <Script
        id="google-maps"
        strategy="afterInteractive"
        src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=__initMaps`}
      />

      <div className="min-h-screen bg-[#f8f9fb] flex flex-col">

        {/* ── Fixed top input bar ─────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3">
            {/* Brand row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🗺️</span>
              <h1 className="text-base font-black text-gray-900 tracking-tight">HowShouldIGo</h1>
              <span className="text-xs text-gray-400 ml-1 hidden sm:inline">Smart transport recommendations</span>
            </div>

            {/* Input row */}
            <div className="grid sm:grid-cols-2 gap-2">
              {/* From */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase tracking-wide pointer-events-none">
                  From
                </span>
                <input
                  ref={originInputRef}
                  type="text"
                  placeholder="Current location or address"
                  onChange={(e) => setOriginText(e.target.value)}
                  className="w-full pl-14 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                />
                <button
                  onClick={detectLocation}
                  disabled={loadingLocation}
                  title="Use my current location"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 disabled:opacity-40 transition-colors"
                >
                  {loadingLocation
                    ? <SpinnerIcon size={18} className="text-blue-400" />
                    : <LocationIcon size={18} />
                  }
                </button>
              </div>

              {/* To */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase tracking-wide pointer-events-none">
                  To
                </span>
                <input
                  ref={destInputRef}
                  type="text"
                  placeholder="Enter destination"
                  onChange={(e) => setDestText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Preference slider */}
            <div className="mt-3">
              <PreferenceSlider value={sliderValue} onChange={setSliderValue} />
            </div>

            {/* Weather */}
            <div className="mt-2.5 min-h-[24px]">
              <WeatherDisplay weather={weather} loading={weatherLoading} locationName={originShortName} />
            </div>

            {error && (
              <div className="mt-2 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                ⚠️ {error}
              </div>
            )}
          </div>
        </header>

        {/* ── Map — large, 50%+ viewport ──────────────────────────── */}
        <MapDisplay
          origin={originLatLng}
          destination={destLatLng}
          selectedMode={selectedMode}
          onRoutesLoaded={handleRoutesLoaded}
          allRoutes={allGmRoutes}
        />

        {/* ── Content below map ───────────────────────────────────── */}
        <div className="max-w-5xl mx-auto w-full px-4 py-5 space-y-4 flex-1">

          {/* Recommendation banner */}
          <RecommendationBanner
            winner={winner}
            weather={weather}
            originName={originShortName}
            destName={destText.split(',')[0]}
          />

          {/* Comparison cards */}
          {scores.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                All options compared
              </h2>
              {/* 4 columns on desktop, 2×2 on tablet, 1 column on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {scores.map((result, idx) => (
                  <TransportCard
                    key={result.mode}
                    result={result}
                    isWinner={idx === 0}
                    isSelected={selectedMode === result.mode}
                    onClick={() => setSelectedMode(result.mode)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No-results empty state */}
          {scores.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">Scores will appear once you enter a route</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-gray-300 border-t border-gray-100">
          Weather by{' '}
          <a href="https://open-meteo.com" className="underline hover:text-gray-500">Open-Meteo</a>
          {' · '}Routes by Google Maps{' · '}No data stored
        </footer>
      </div>
    </>
  );
}

import { TransportMode, WeatherData, RouteResult, TransportScore } from '../types';

/**
 * Scores all 4 transport modes 0-100 based on distance, weather, travel time, and user preference.
 * sliderValue: 0=Walk, 1=Bike, 2=Transit, 3=Drive
 */
export function scoreTransportModes(
  routes: Record<TransportMode, RouteResult | null>,
  weather: WeatherData,
  sliderValue: number // 0–3 continuous
): TransportScore[] {
  const modes: TransportMode[] = ['walking', 'bicycling', 'driving', 'transit'];
  const drivingSeconds = routes['driving']?.durationSeconds ?? 0;

  const scores = modes.map((mode): TransportScore => {
    const route = routes[mode];
    const reasons: string[] = [];

    if (!route) {
      return { mode, score: 0, reasons: ['Route unavailable'], route: null, weatherSuitability: 'red' };
    }

    let score = 50;
    const distMiles = route.distanceMiles;
    const temp = weather.temperature;
    const wind = weather.windSpeedMph;
    const isRaining = weather.isRaining;
    const isSnowing = weather.isSnowing;

    // ─── Distance scoring ────────────────────────────────────────────────────
    if (mode === 'walking') {
      if (distMiles <= 0.25) { score += 35; reasons.push('Just a short stroll'); }
      else if (distMiles <= 0.75) { score += 22; reasons.push('Easy walk'); }
      else if (distMiles <= 1.5) { score += 10; reasons.push('Manageable walk'); }
      else if (distMiles <= 3.0) { score -= 18; reasons.push(`Long walk (${distMiles.toFixed(1)} mi)`); }
      else { score -= 40; reasons.push(`Too far to walk (${distMiles.toFixed(1)} mi)`); }
    }

    if (mode === 'bicycling') {
      if (distMiles <= 1.5) { score += 28; reasons.push('Perfect bike distance'); }
      else if (distMiles <= 4.0) { score += 18; reasons.push('Great bike ride'); }
      else if (distMiles <= 8.0) { score += 5; reasons.push('Bikeable distance'); }
      else if (distMiles <= 15.0) { score -= 18; reasons.push(`Long ride (${distMiles.toFixed(1)} mi)`); }
      else { score -= 38; reasons.push(`Too far to bike (${distMiles.toFixed(1)} mi)`); }
    }

    if (mode === 'driving') {
      if (distMiles <= 0.4) { score -= 28; reasons.push('Too close to drive'); }
      else if (distMiles <= 1.5) { score -= 8; reasons.push('Short drive'); }
      else if (distMiles <= 10) { score += 12; reasons.push('Good driving distance'); }
      else { score += 22; reasons.push('Long haul — drive makes sense'); }
    }

    if (mode === 'transit') {
      if (distMiles < 0.5) { score -= 18; reasons.push('Too short for transit'); }
      else if (distMiles <= 5) { score += 8; reasons.push('Good transit range'); }
      else { score += 18; reasons.push('Transit handles distance well'); }
    }

    // ─── Weather scoring ─────────────────────────────────────────────────────
    const outdoorMode = mode === 'walking' || mode === 'bicycling';
    const enclosedMode = mode === 'driving' || mode === 'transit';
    const niceWeather = !isRaining && !isSnowing && temp >= 50 && temp <= 80 && wind < 15;
    const badWeather = isRaining || isSnowing || temp < 35 || temp > 95;

    if (outdoorMode) {
      if (isSnowing) { score -= 32; reasons.push('Snowing ❄️'); }
      else if (isRaining) { score -= 26; reasons.push('Raining 🌧️'); }

      if (temp < 25) { score -= 25; reasons.push(`Dangerously cold (${temp}°F)`); }
      else if (temp < 35) { score -= 18; reasons.push(`Very cold (${temp}°F)`); }
      else if (temp > 100) { score -= 25; reasons.push(`Extreme heat (${temp}°F)`); }
      else if (temp > 90) { score -= 14; reasons.push(`Very hot (${temp}°F)`); }
      else if (temp >= 50 && temp <= 80) { score += 10; reasons.push(`Perfect temp (${temp}°F)`); }

      if (niceWeather) { score += 10; reasons.push('Ideal outdoor conditions ☀️'); }
    }

    // Wind: only penalizes biking
    if (mode === 'bicycling') {
      if (wind > 30) { score -= 22; reasons.push(`Dangerous winds (${wind} mph)`); }
      else if (wind > 20) { score -= 13; reasons.push(`Strong winds (${wind} mph)`); }
      else if (wind > 15) { score -= 6; reasons.push(`Windy (${wind} mph)`); }
    }

    if (enclosedMode && badWeather) {
      score += 10;
      reasons.push('Sheltered from bad weather');
    }

    // ─── Travel time vs driving ──────────────────────────────────────────────
    if (mode !== 'driving' && drivingSeconds > 0) {
      const ratio = route.durationSeconds / drivingSeconds;

      if (mode === 'transit') {
        // New: heavy penalty if transit is 3x+ slower than driving
        if (ratio >= 3.0) {
          score -= 30;
          reasons.push(`Very slow transit (${ratio.toFixed(1)}× driving)`);
        } else if (ratio >= 2.0) {
          score -= 14;
          reasons.push(`Slower than driving (${ratio.toFixed(1)}×)`);
        } else if (ratio <= 1.2) {
          score += 14;
          reasons.push('Nearly as fast as driving');
        } else if (ratio <= 1.6) {
          score += 6;
          reasons.push('Reasonably fast');
        }
      }

      if (mode === 'walking' || mode === 'bicycling') {
        if (ratio <= 1.4) { score += 9; reasons.push('Barely slower than driving'); }
        else if (ratio >= 3.5) { score -= 18; reasons.push('Much slower than driving'); }
        else if (ratio >= 5.0) { score -= 28; reasons.push('Far slower than driving'); }
      }
    }

    // ─── User preference slider bias (up to ±25 pts) ────────────────────────
    // modeIndex: walk=0, bike=1, transit=2, drive=3
    const modeIndex: Record<TransportMode, number> = {
      walking: 0, bicycling: 1, transit: 2, driving: 3,
    };
    // Max distance on slider = 3.0, max boost = 25
    const sliderDist = Math.abs(sliderValue - modeIndex[mode]);
    // Linear: 0 dist → +25, dist 3 → -25
    const sliderBias = Math.round(25 * (1 - (sliderDist / 1.5)));
    const clampedBias = Math.max(-25, Math.min(25, sliderBias));
    score += clampedBias;

    if (clampedBias >= 20) reasons.push('Your top preference');
    else if (clampedBias >= 10) reasons.push('Matches your preference');
    else if (clampedBias <= -15) reasons.push('Not your preference');

    // ─── Clamp & weather suitability dot ────────────────────────────────────
    score = Math.max(0, Math.min(100, Math.round(score)));

    let weatherSuitability: 'green' | 'yellow' | 'red';
    if (outdoorMode) {
      if (isSnowing || isRaining || temp < 35 || temp > 95 || wind > 20) weatherSuitability = 'red';
      else if (temp < 45 || temp > 85 || wind > 12) weatherSuitability = 'yellow';
      else weatherSuitability = 'green';
    } else {
      weatherSuitability = badWeather ? 'yellow' : 'green';
    }

    return { mode, score, reasons, route, weatherSuitability };
  });

  return scores.sort((a, b) => b.score - a.score);
}

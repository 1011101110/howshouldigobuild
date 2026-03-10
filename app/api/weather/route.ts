import { NextRequest, NextResponse } from 'next/server';

const WMO_CODES: Record<number, { description: string; icon: string; rain: boolean; snow: boolean }> = {
  0: { description: 'Clear sky', icon: '☀️', rain: false, snow: false },
  1: { description: 'Mainly clear', icon: '🌤️', rain: false, snow: false },
  2: { description: 'Partly cloudy', icon: '⛅', rain: false, snow: false },
  3: { description: 'Overcast', icon: '☁️', rain: false, snow: false },
  45: { description: 'Foggy', icon: '🌫️', rain: false, snow: false },
  48: { description: 'Freezing fog', icon: '🌫️', rain: false, snow: false },
  51: { description: 'Light drizzle', icon: '🌦️', rain: true, snow: false },
  53: { description: 'Drizzle', icon: '🌦️', rain: true, snow: false },
  55: { description: 'Heavy drizzle', icon: '🌧️', rain: true, snow: false },
  61: { description: 'Light rain', icon: '🌧️', rain: true, snow: false },
  63: { description: 'Rain', icon: '🌧️', rain: true, snow: false },
  65: { description: 'Heavy rain', icon: '🌧️', rain: true, snow: false },
  71: { description: 'Light snow', icon: '🌨️', rain: false, snow: true },
  73: { description: 'Snow', icon: '❄️', rain: false, snow: true },
  75: { description: 'Heavy snow', icon: '❄️', rain: false, snow: true },
  77: { description: 'Snow grains', icon: '🌨️', rain: false, snow: true },
  80: { description: 'Light showers', icon: '🌦️', rain: true, snow: false },
  81: { description: 'Showers', icon: '🌧️', rain: true, snow: false },
  82: { description: 'Heavy showers', icon: '⛈️', rain: true, snow: false },
  85: { description: 'Snow showers', icon: '🌨️', rain: false, snow: true },
  86: { description: 'Heavy snow showers', icon: '❄️', rain: false, snow: true },
  95: { description: 'Thunderstorm', icon: '⛈️', rain: true, snow: false },
  96: { description: 'Thunderstorm w/ hail', icon: '⛈️', rain: true, snow: false },
  99: { description: 'Thunderstorm w/ heavy hail', icon: '⛈️', rain: true, snow: false },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,rain,snowfall,wind_speed_10m,weather_code&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=mm`;

    const response = await fetch(url, { next: { revalidate: 300 } }); // Cache 5 min
    if (!response.ok) {
      throw new Error(`Open-Meteo error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    const wmoInfo = WMO_CODES[current.weather_code] ?? {
      description: 'Unknown',
      icon: '🌡️',
      rain: false,
      snow: false,
    };

    return NextResponse.json({
      temperature: Math.round(current.temperature_2m),
      precipitationMm: current.precipitation ?? 0,
      windSpeedMph: Math.round(current.wind_speed_10m ?? 0),
      weatherCode: current.weather_code,
      isRaining: wmoInfo.rain || (current.rain > 0),
      isSnowing: wmoInfo.snow || (current.snowfall > 0),
      description: wmoInfo.description,
      icon: wmoInfo.icon,
    });
  } catch (err) {
    console.error('Weather fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}

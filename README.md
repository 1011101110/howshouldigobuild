# HowShouldIGo 🗺️

**Smart transportation recommendations based on real-time weather, distance, and your personal preferences.**

Enter your origin and destination, and HowShouldIGo scores all 4 transport modes (walk, bike, transit, drive) from 0–100 and recommends the best option.

---

## Features

- **Location Input** — Type addresses with Google Places autocomplete, or tap 📍 to auto-detect your current location
- **Preference Slider** — Bias the algorithm toward your preferred mode (Walk ↔ Bike ↔ Transit ↔ Drive)
- **Live Weather** — Fetches current conditions (temp, rain/snow, wind) from Open-Meteo (free, no key required)
- **Route Calculation** — Google Directions API for all 4 modes; estimated time + distance for each
- **Dark Map** — Full-width Google Maps with the winning route in bold blue and others in faded gray
- **Score Cards** — Visual 0–100 score for each mode with reasons (distance, weather factors, preference bias)
- **Dark mode** — Default dark UI, mobile responsive

## Scoring Algorithm

Each mode starts at 50 and is adjusted by:
- **Distance** — Walking penalized >1.5 mi; biking penalized >8 mi; driving rewarded for long distances
- **Weather** — Rain/snow penalize walk/bike by 25–30 pts; extremes (<35°F or >95°F) penalize 20 pts; perfect weather (50–80°F, clear, calm) boosts walk/bike; wind >20 mph penalizes biking
- **Travel time vs driving** — Modes much slower than driving lose points
- **Slider bias** — Modes near your slider position get a boost (max +18 pts)

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd howshouldigobuild
npm install
```

### 2. Get a Google Maps API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com/google/maps-apis)
2. Create a project and enable these APIs:
   - **Maps JavaScript API**
   - **Directions API**
   - **Places API**
   - **Geocoding API**
3. Create an API key and restrict it to your domain for production

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and add your key:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### 4. Run locally

```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Build for production

```bash
npm run build
npm start
```

---

## Deploy to Vercel

```bash
npx vercel --prod
# Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel project settings
```

## Deploy to Cloud Run

```bash
docker build -t howshouldigobuild .
docker run -p 3000:3000 -e NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key howshouldigobuild
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Maps | Google Maps JavaScript API |
| Routes | Google Directions API |
| Autocomplete | Google Places API |
| Weather | Open-Meteo (free, no key) |
| Deployment | Vercel / Cloud Run |

---

## Project Structure

```
app/
  page.tsx              # Main app page (client component)
  layout.tsx            # Root layout + metadata
  globals.css           # Tailwind + dark mode styles
  types.ts              # TypeScript interfaces
  api/
    weather/route.ts    # Open-Meteo proxy API route
  components/
    WeatherDisplay.tsx  # Weather info bar
    PreferenceSlider.tsx # Walk/Bike/Transit/Drive slider
    TransportCard.tsx   # Score card per transport mode
    MapDisplay.tsx      # Google Maps with route polylines
  utils/
    scoring.ts          # 0-100 scoring engine
```

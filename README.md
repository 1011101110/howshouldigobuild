# HowShouldIGo 🗺️

**Smart transportation recommendations based on real-time weather, distance, and your preferences.**

Enter origin → destination, set your preference slider, and the app scores Walk / Bike / Transit / Drive 0–100 with a clear recommendation banner and comparison cards.

---

## Features

| Feature | Detail |
|---------|--------|
| 📍 Location input | Google Places autocomplete + GPS auto-detect |
| 🌤️ Live weather | Open-Meteo (free, no key) — temp, rain/snow, wind |
| 🗺️ Route display | Google Maps with winner route in bold blue, others faded |
| 🏆 Recommendation banner | Large colored panel — "Bike. 2.3 mi, 72°F and sunny, 12 min." |
| 📊 4 comparison cards | SVG icon, time, distance, weather dot (🟢🟡🔴), score 0-100 |
| 🎛️ Preference slider | Walk ↔ Bike ↔ Transit ↔ Drive — adds up to ±25 pts |
| 📱 Mobile responsive | Horizontal cards on desktop, 2×2 grid on tablet, stacked mobile |

---

## Scoring Algorithm

Each mode starts at 50, adjusted by:

- **Distance** — Walking >3 mi: −40 pts; Biking >15 mi: −38 pts; Short drives: −28 pts
- **Weather** — Rain/snow: −26–32 for walk/bike; extremes (<35°F / >90°F): −14–25 pts
- **Wind** — >20 mph: −13 pts for bike; >30 mph: −22 pts
- **Transit time penalty** — Transit 3×+ slower than driving: −30 pts; 2×+ slower: −14 pts
- **Preference slider** — Up to +25 pts for preferred mode, down to −25 pts away
- **Weather suitability dot** — 🟢 Green / 🟡 Yellow / 🔴 Red per card

---

## Quick Start (Local Dev)

```bash
# 1. Install
cd /tmp/howshouldigobuild
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local → add your Google Maps API key

# 3. Run
npm run dev
# → http://localhost:3000
```

### Required Google Maps APIs

Enable at [console.cloud.google.com](https://console.cloud.google.com/google/maps-apis):

- ✅ Maps JavaScript API
- ✅ Directions API
- ✅ Places API
- ✅ Geocoding API

---

## Deploy to Cloud Run via GitHub Actions

The CI/CD pipeline is already configured in `.github/workflows/deploy.yml`.

### Step 1: Create GCP Service Account

```bash
# Set your project
export PROJECT_ID=aerial-ceremony-484700-b2

# Create service account
gcloud iam service-accounts create github-deploy \
  --project=$PROJECT_ID \
  --display-name="GitHub Deploy"

# Grant required roles
for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="$ROLE"
done

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-deploy@$PROJECT_ID.iam.gserviceaccount.com
```

### Step 2: Create Artifact Registry repo (if not exists)

```bash
gcloud artifacts repositories create docker-images \
  --repository-format=docker \
  --location=us-central1 \
  --project=$PROJECT_ID
```

### Step 3: Add GitHub Secrets

Go to **GitHub → repo → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `GCP_SA_KEY` | Contents of `key.json` (full JSON) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Google Maps API key |

### Step 4: Push to main

```bash
git push origin main
# → GitHub Actions builds Docker image → pushes to Artifact Registry → deploys to Cloud Run
# → Live URL shown at end of Actions run
```

### Manual Deploy (Alternative)

```bash
gcloud run deploy howshouldigobuild \
  --source . \
  --region us-central1 \
  --project aerial-ceremony-484700-b2 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here"
```

---

## Project Structure

```
howshouldigobuild/
├── app/
│   ├── page.tsx                    # Main SPA — fixed top bar, map, cards
│   ├── layout.tsx                  # Root layout + metadata
│   ├── globals.css                 # Light theme + Places autocomplete styles
│   ├── types.ts                    # TypeScript interfaces
│   ├── api/weather/route.ts        # Open-Meteo proxy (5-min cache)
│   ├── utils/scoring.ts            # 0-100 scoring engine
│   └── components/
│       ├── icons.tsx               # SVG icons (walk, bike, transit, drive)
│       ├── WeatherDisplay.tsx      # Temp / rain / wind strip
│       ├── PreferenceSlider.tsx    # Walk ↔ Bike ↔ Transit ↔ Drive
│       ├── RecommendationBanner.tsx # Big colored "Bike. 2.3 mi…" banner
│       ├── TransportCard.tsx       # Score card with dot, bar, reasons
│       └── MapDisplay.tsx          # Google Maps + route polylines
├── .github/workflows/deploy.yml   # Cloud Run CI/CD
├── Dockerfile                      # Multi-stage, non-root, port 8080
├── .dockerignore
├── next.config.ts                  # output: standalone (required for Docker)
└── .env.example
```

---

## Tech Stack

Next.js 16 · TypeScript · Tailwind CSS · Google Maps JS API · Open-Meteo · Cloud Run · GitHub Actions

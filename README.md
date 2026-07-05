# Mitzy - Weather Dashboard

🌤 **Live Demo:** [weather-predictor-mitzy.vercel.app](https://weather-predictor-mitzy.vercel.app)

A dark weather dashboard with real-time data, temperature predictions, and interactive charts.

## Features

- **Geolocation** - Auto-detects your location on first visit
- **Current Weather** - Real-time conditions with animated 3D weather icons
- **7-Day Forecast** - Hourly rain probability chart with animated bars
- **30-Day Historical Analysis** - Temperature trend with smooth line charts
- **14-Day Forecast** - Temperature predictions with accuracy metrics
- **Global City Search** - Search any city worldwide with instant results
- **City Sidebar** - Quick access to major cities with live weather
- **World Map** - Interactive map with weather markers for global conditions
- **Dark UI** - Glass cards, smooth animations, clean spacing

## Tech Stack

- **Backend:** Python, Flask
- **ML:** Scikit-learn (Linear Regression, Polynomial Features)
- **API:** OpenWeatherMap (with mock fallback)
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Design:** Glassmorphism, dark theme, Inter font

## Run Locally

```bash
cd weather-predictor
pip install -r requirements.txt
python app.py
```

Open http://localhost:5001

## API Key

Set your OpenWeatherMap API key as an environment variable:

```bash
export OPENWEATHERMAP_API_KEY=your_key_here
```

Without an API key, the app uses realistic mock data.

## Design

Dark glass dashboard with:
- Rounded glass cards
- Inter font
- Animated weather icons
- Smooth hover effects
- Chart.js charts

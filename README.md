# Mitzy - Weather Dashboard

A premium, glassmorphism-inspired dark weather dashboard with real-time data, ML-powered temperature predictions, and interactive visualizations.

## Features

- **Geolocation** - Auto-detects your location on first visit
- **Current Weather** - Real-time conditions with animated 3D weather icons
- **7-Day Forecast** - Hourly rain probability chart with animated bars
- **30-Day Historical Analysis** - Temperature trend with smooth line charts
- **14-Day ML Prediction** - Polynomial Regression forecast with R²/MAE/RMSE metrics
- **Global City Search** - Search any city worldwide with instant results
- **City Sidebar** - Quick access to major cities with live weather
- **World Map** - Interactive map with weather markers for global conditions
- **Premium Dark UI** - Glassmorphism cards, smooth animations, 8px spacing grid

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

Premium dark glassmorphism dashboard with:
- 28px outer container radius
- 20px card radius
- 8px spacing grid
- Inter font family
- Animated weather icons
- Smooth hover transitions
- Chart.js animated visualizations

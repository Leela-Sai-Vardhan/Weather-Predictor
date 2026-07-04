# SkyCast - Weather Predictor Dashboard

An interactive weather analysis dashboard that fetches real-time weather data, analyzes 30-day historical trends, and predicts future temperatures using Linear Regression with Polynomial Features.

## Features

- **Real-Time Weather** - Current conditions for any city (temperature, humidity, wind, pressure)
- **30-Day Historical Analysis** - Temperature and humidity trends with trend detection (warming/cooling/stable)
- **14-Day Temperature Prediction** - ML-powered forecast with model accuracy metrics (R², MAE, RMSE)
- **5-Day Forecast** - Upcoming weather conditions
- **City Comparison** - Compare weather across multiple cities with bar charts
- **Interactive Charts** - Chart.js powered visualizations (line charts, bar charts, dual-axis)

## Tech Stack

- **Backend:** Python, Flask
- **ML:** Scikit-learn (Linear Regression, Polynomial Features)
- **API:** OpenWeatherMap (with mock data fallback)
- **Frontend:** HTML, CSS, JavaScript, Chart.js

## How It Works

1. **Data Collection:** Fetches historical weather data (30 days) and real-time conditions
2. **Feature Engineering:** Converts dates to numerical day features
3. **Model Training:** Polynomial Regression (degree=2) for temperature prediction
4. **Forecasting:** Projects temperatures 14 days into the future
5. **Visualization:** Interactive charts for historical trends, predictions, and city comparisons

## Run Locally

```bash
cd weather-predictor
pip install -r requirements.txt
python app.py            # Start Flask server on port 5001
```

Open http://localhost:5001 in your browser.

## API Key (Optional)

For real weather data, get a free API key from [OpenWeatherMap](https://openweathermap.org/api) and set it:

```bash
# Windows PowerShell
$env:OPENWEATHERMAP_API_KEY="your_api_key_here"

# Or create a .env file
echo OPENWEATHERMAP_API_KEY=your_api_key_here > .env
```

Without an API key, the app uses realistic mock data for demonstration.

## Model Metrics

| Metric | Description |
|--------|-------------|
| R² Score | How well the model fits (closer to 1.0 is better) |
| MAE | Mean Absolute Error in °C |
| RMSE | Root Mean Squared Error in °C |

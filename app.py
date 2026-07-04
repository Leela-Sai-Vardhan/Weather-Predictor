import os
import json
from flask import Flask, render_template, request, jsonify
from weather_api import get_current_weather, get_forecast, get_historical_data
from predictor import predict_future, get_trend_analysis

app = Flask(__name__)

POPULAR_CITIES = [
    'New York', 'London', 'Tokyo', 'Paris', 'Mumbai',
    'Sydney', 'Dubai', 'Berlin', 'Toronto', 'Singapore',
    'Seoul', 'Bangkok', 'Amsterdam', 'Rome', 'Istanbul',
]


@app.route('/')
def index():
    return render_template('index.html', cities=POPULAR_CITIES)


@app.route('/api/current', methods=['POST'])
def current_weather():
    data = request.get_json()
    city = data.get('city', 'New York').strip()
    weather = get_current_weather(city)
    return jsonify(weather)


@app.route('/api/historical', methods=['POST'])
def historical():
    data = request.get_json()
    city = data.get('city', 'New York').strip()
    days = data.get('days', 30)
    historical_data = get_historical_data(city, days)
    trend = get_trend_analysis(historical_data)
    return jsonify({
        'data': historical_data,
        'trend': trend,
    })


@app.route('/api/forecast', methods=['POST'])
def forecast():
    data = request.get_json()
    city = data.get('city', 'New York').strip()
    forecast_data = get_forecast(city)
    return jsonify(forecast_data)


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    city = data.get('city', 'New York').strip()
    days_ahead = data.get('days_ahead', 14)

    historical = get_historical_data(city, 30)
    predictions, metrics = predict_future(historical, days_ahead)

    return jsonify({
        'historical': historical,
        'predictions': predictions,
        'metrics': metrics,
    })


@app.route('/api/compare', methods=['POST'])
def compare_cities():
    data = request.get_json()
    cities = data.get('cities', ['New York', 'London', 'Tokyo'])
    results = []
    for city in cities[:5]:
        weather = get_current_weather(city)
        historical = get_historical_data(city, 30)
        trend = get_trend_analysis(historical)
        results.append({
            'weather': weather,
            'trend': trend,
        })
    return jsonify(results)


@app.route('/api/cities')
def list_cities():
    return jsonify(POPULAR_CITIES)


if __name__ == '__main__':
    app.run(debug=True, port=5001)

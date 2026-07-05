import os
import sys
import re
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template, request, jsonify, send_from_directory
from weather_api import get_current_weather, get_forecast, get_historical_data, get_current_weather_by_coords
from predictor import predict_future, get_trend_analysis

app = Flask(__name__, static_folder='../static', template_folder='../templates')

POPULAR_CITIES = [
    'New York', 'London', 'Tokyo', 'Paris', 'Mumbai',
    'Sydney', 'Dubai', 'Berlin', 'Toronto', 'Singapore',
    'Seoul', 'Bangkok', 'Amsterdam', 'Rome', 'Istanbul',
    'Barcelona', 'Moscow', 'Cairo', 'Lagos', 'Buenos Aires',
    'Mexico City', 'Los Angeles', 'Chicago', 'San Francisco', 'Miami',
    'Vijayawada', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
]

CITY_REGEX = re.compile(r'^[a-zA-Z\s\-,\.]{1,100}$')


def validate_city(city):
    if not city or not isinstance(city, str):
        return None
    city = city.strip()
    if len(city) > 100:
        return None
    if not CITY_REGEX.match(city):
        return None
    return city


@app.route('/')
def index():
    return render_template('index.html', cities=POPULAR_CITIES)


@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/api/current', methods=['POST'])
def current_weather():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400
    city = validate_city(data.get('city', ''))
    if not city:
        return jsonify({'error': 'Invalid city name'}), 400
    weather = get_current_weather(city)
    return jsonify(weather)


@app.route('/api/current-coords', methods=['POST'])
def current_weather_coords():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400
    try:
        lat = float(data.get('lat', 0))
        lon = float(data.get('lon', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid coordinates'}), 400
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({'error': 'Coordinates out of range'}), 400
    weather = get_current_weather_by_coords(lat, lon)
    return jsonify(weather)


@app.route('/api/historical', methods=['POST'])
def historical():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400
    city = validate_city(data.get('city', ''))
    if not city:
        return jsonify({'error': 'Invalid city name'}), 400
    days = data.get('days', 30)
    try:
        days = int(days)
        days = max(7, min(90, days))
    except (TypeError, ValueError):
        days = 30
    historical_data = get_historical_data(city, days)
    trend = get_trend_analysis(historical_data)
    return jsonify({'data': historical_data, 'trend': trend})


@app.route('/api/forecast', methods=['POST'])
def forecast():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400
    city = validate_city(data.get('city', ''))
    if not city:
        return jsonify({'error': 'Invalid city name'}), 400
    forecast_data = get_forecast(city)
    return jsonify(forecast_data)


@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400
    city = validate_city(data.get('city', ''))
    if not city:
        return jsonify({'error': 'Invalid city name'}), 400
    days_ahead = data.get('days_ahead', 14)
    try:
        days_ahead = int(days_ahead)
        days_ahead = max(3, min(30, days_ahead))
    except (TypeError, ValueError):
        days_ahead = 14
    historical = get_historical_data(city, 30)
    predictions, metrics = predict_future(historical, days_ahead)
    return jsonify({'historical': historical, 'predictions': predictions, 'metrics': metrics})


# For Vercel serverless
handler = app

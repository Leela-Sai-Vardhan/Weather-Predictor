import os
import json
import requests
from datetime import datetime, timedelta

API_KEY = os.environ.get('OPENWEATHERMAP_API_KEY', '')
BASE_URL = 'https://api.openweathermap.org/data/2.5'

BASE_TEMPS = {
    'new york': 22, 'london': 16, 'tokyo': 25, 'paris': 18,
    'mumbai': 30, 'sydney': 20, 'dubai': 35, 'berlin': 17,
    'toronto': 18, 'singapore': 28, 'seoul': 19, 'bangkok': 32,
    'amsterdam': 15, 'rome': 20, 'istanbul': 19, 'barcelona': 21,
    'moscow': 12, 'cairo': 28, 'lagos': 30, 'buenos aires': 19,
    'mexico city': 21, 'los angeles': 23, 'chicago': 19,
    'san francisco': 17, 'miami': 27, 'seattle': 15, 'denver': 16,
    'beijing': 18, 'shanghai': 20, 'hong kong': 26, 'delhi': 31,
    'bangalore': 26, 'jakarta': 28, 'cape town': 18, 'nairobi': 22,
    'rio de janeiro': 26, 'lima': 20, 'bogota': 16, 'santiago': 18,
    'vijayawada': 32, 'kanuru': 32, 'hyderabad': 29, 'chennai': 31,
    'kolkata': 30, 'pune': 27,
}


def get_current_weather(city):
    if not API_KEY:
        return generate_mock_current(city)
    try:
        url = f"{BASE_URL}/weather?q={city}&appid={API_KEY}&units=metric"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return {
            'city': data['name'],
            'country': data['sys']['country'],
            'temp': data['main']['temp'],
            'feels_like': data['main']['feels_like'],
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'wind_speed': data['wind']['speed'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon'],
            'visibility': data.get('visibility', 0) / 1000,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
    except Exception:
        return generate_mock_current(city)


def get_current_weather_by_coords(lat, lon):
    if not API_KEY:
        return _mock_from_coords(lat, lon)
    try:
        url = f"{BASE_URL}/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return {
            'city': data['name'],
            'country': data['sys']['country'],
            'temp': data['main']['temp'],
            'feels_like': data['main']['feels_like'],
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'wind_speed': data['wind']['speed'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon'],
            'visibility': data.get('visibility', 0) / 1000,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
    except Exception:
        return _mock_from_coords(lat, lon)


def _mock_from_coords(lat, lon):
    import random
    temp = 30 - abs(lat) * 0.7 + random.uniform(-3, 3)
    city_name = f"{lat:.2f}, {lon:.2f}"
    return {
        'city': city_name,
        'country': '',
        'temp': round(temp, 1),
        'feels_like': round(temp + random.uniform(-2, 2), 1),
        'humidity': random.randint(40, 85),
        'pressure': random.randint(1005, 1025),
        'wind_speed': round(random.uniform(1, 12), 1),
        'description': random.choice(['clear sky', 'few clouds', 'scattered clouds', 'light rain']),
        'icon': random.choice(['01d', '02d', '03d', '10d']),
        'visibility': round(random.uniform(5, 15), 1),
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    }


def get_forecast(city, days=7):
    if not API_KEY:
        return generate_mock_forecast(city, days)
    try:
        url = f"{BASE_URL}/forecast?q={city}&appid={API_KEY}&units=metric"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        forecasts = []
        for item in data['list'][:days * 8]:
            forecasts.append({
                'datetime': datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d %H:%M'),
                'temp': item['main']['temp'],
                'humidity': item['main']['humidity'],
                'pressure': item['main']['pressure'],
                'wind_speed': item['wind']['speed'],
                'description': item['weather'][0]['description'],
            })
        return forecasts
    except Exception:
        return generate_mock_forecast(city, days)


def get_historical_data(city, days=30):
    """Generate simulated historical data."""
    return generate_mock_historical(city, days)


def generate_mock_current(city):
    import random
    base = BASE_TEMPS.get(city.lower(), 22)
    temp = base + random.uniform(-3, 3)
    return {
        'city': city.title(),
        'country': '',
        'temp': round(temp, 1),
        'feels_like': round(temp + random.uniform(-2, 2), 1),
        'humidity': random.randint(40, 85),
        'pressure': random.randint(1005, 1025),
        'wind_speed': round(random.uniform(1, 12), 1),
        'description': random.choice(['clear sky', 'few clouds', 'scattered clouds', 'light rain']),
        'icon': random.choice(['01d', '02d', '03d', '10d']),
        'visibility': round(random.uniform(5, 15), 1),
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    }


def generate_mock_forecast(city, days):
    import random
    base = BASE_TEMPS.get(city.lower(), 22)
    forecasts = []
    for i in range(days * 8):
        dt = datetime.now() + timedelta(hours=i * 3)
        temp = base + random.uniform(-5, 5)
        forecasts.append({
            'datetime': dt.strftime('%Y-%m-%d %H:%M'),
            'temp': round(temp, 1),
            'humidity': random.randint(40, 85),
            'pressure': random.randint(1005, 1025),
            'wind_speed': round(random.uniform(1, 12), 1),
            'description': random.choice(['clear sky', 'few clouds', 'scattered clouds', 'light rain']),
        })
    return forecasts


def generate_mock_historical(city, days):
    import random
    base = BASE_TEMPS.get(city.lower(), 22)
    data = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=days - i)).strftime('%Y-%m-%d')
        temp = base + random.uniform(-8, 8)
        data.append({
            'date': date,
            'temp': round(temp, 1),
            'humidity': random.randint(35, 90),
            'pressure': random.randint(1000, 1030),
            'wind_speed': round(random.uniform(0.5, 15), 1),
        })
    return data

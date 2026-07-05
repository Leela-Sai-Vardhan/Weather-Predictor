import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error


def prepare_features(data):
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df['day_num'] = (df['date'] - df['date'].min()).dt.days
    return df


def train_forecast_model(data):
    """Train the prediction model."""
    df = prepare_features(data)
    X = df[['day_num']].values
    y = df['temp'].values

    model = make_pipeline(
        PolynomialFeatures(degree=2),
        LinearRegression()
    )
    model.fit(X, y)

    try:
        y_pred = model.predict(X)
        metrics = {
            'r2': round(float(r2_score(y, y_pred)), 4),
            'mae': round(float(mean_absolute_error(y, y_pred)), 2),
            'rmse': round(float(np.sqrt(mean_squared_error(y, y_pred))), 2),
        }
    except Exception:
        metrics = {'r2': 0.0, 'mae': 0.0, 'rmse': 0.0}

    return model, metrics


def predict_future(data, days_ahead=14):
    model, metrics = train_forecast_model(data)
    df = prepare_features(data)
    max_day = df['day_num'].max()

    future_days = np.array([[max_day + i + 1] for i in range(days_ahead)])
    predictions = model.predict(future_days)

    last_date = df['date'].max()
    forecast = []
    for i, temp in enumerate(predictions):
        forecast_date = last_date + timedelta(days=i + 1)
        forecast.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'predicted_temp': round(float(temp), 1),
            'day_label': forecast_date.strftime('%a, %b %d'),
        })

    return forecast, metrics


def get_trend_analysis(data):
    df = prepare_features(data)
    X = df[['day_num']].values
    y = df['temp'].values

    model = LinearRegression()
    model.fit(X, y)

    slope = model.coef_[0]
    avg_temp = round(float(np.mean(y)), 1)
    max_temp = round(float(np.max(y)), 1)
    min_temp = round(float(np.min(y)), 1)
    temp_range = round(max_temp - min_temp, 1)

    if slope > 0.1:
        trend = 'Warming'
        trend_icon = '📈'
    elif slope < -0.1:
        trend = 'Cooling'
        trend_icon = '📉'
    else:
        trend = 'Stable'
        trend_icon = '📊'

    return {
        'trend': trend,
        'trend_icon': trend_icon,
        'slope_per_day': round(slope, 3),
        'avg_temp': avg_temp,
        'max_temp': max_temp,
        'min_temp': min_temp,
        'temp_range': temp_range,
    }

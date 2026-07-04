let historicalChart, predictionChart, comparisonChart;
const chartColors = ['#4fc3f7', '#ffb74d', '#81c784', '#e57373', '#ba68c8'];

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    initCompareChips();
});

function initCompareChips() {
    const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Mumbai', 'Sydney', 'Dubai', 'Berlin'];
    const container = document.getElementById('compareChips');
    container.innerHTML = cities.map(c =>
        `<div class="city-chip ${c === 'New York' ? 'selected' : ''}" data-city="${c}" onclick="toggleCompareChip(this)">${c}</div>`
    ).join('');
}

function toggleCompareChip(el) {
    el.classList.toggle('selected');
}

function selectCity(city) {
    document.getElementById('citySelect').value = city;
    document.querySelectorAll('.quick-cities .chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    loadAllData();
}

async function loadAllData() {
    const city = document.getElementById('citySelect').value;
    const btn = document.getElementById('loadBtn');
    btn.innerHTML = '<span class="loading"></span>';
    btn.disabled = true;

    try {
        await Promise.all([
            loadCurrentWeather(city),
            loadHistoricalData(city),
            loadForecast(city),
            loadPredictions(city),
        ]);
    } catch (err) {
        console.error('Error loading data:', err);
    } finally {
        btn.innerHTML = '<span>🔍</span> Analyze City';
        btn.disabled = false;
    }
}

async function loadCurrentWeather(city) {
    const res = await fetch('/api/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
    });
    const data = await res.json();

    document.getElementById('currentTemp').textContent = `${data.temp}°C`;
    document.getElementById('currentDesc').textContent = data.description;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind_speed} m/s`;
    document.getElementById('feelsLike').textContent = `${data.feels_like}°C`;
    document.getElementById('pressure').textContent = `${data.pressure} hPa`;
}

async function loadHistoricalData(city) {
    const res = await fetch('/api/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, days: 30 })
    });
    const data = await res.json();

    // Trend
    const t = data.trend;
    document.getElementById('trendBig').textContent = `${t.trend_icon} ${t.trend}`;
    document.getElementById('avgTemp').textContent = `${t.avg_temp}°C`;
    document.getElementById('maxTemp').textContent = `${t.max_temp}°C`;
    document.getElementById('minTemp').textContent = `${t.min_temp}°C`;
    document.getElementById('slope').textContent = `${t.slope_per_day > 0 ? '+' : ''}${t.slope_per_day}°C/day`;

    // Chart
    const labels = data.data.map(d => d.date.slice(5));
    const temps = data.data.map(d => d.temp);
    const humids = data.data.map(d => d.humidity);

    if (historicalChart) historicalChart.destroy();
    historicalChart = new Chart(document.getElementById('historicalChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: '#4fc3f7',
                    backgroundColor: 'rgba(79, 195, 247, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                },
                {
                    label: 'Humidity (%)',
                    data: humids,
                    borderColor: '#ba68c8',
                    backgroundColor: 'rgba(186, 104, 200, 0.05)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#8888bb' } } },
            scales: {
                x: { ticks: { color: '#8888bb', maxTicksLimit: 10 }, grid: { color: 'rgba(45,45,90,0.5)' } },
                y: { ticks: { color: '#8888bb' }, grid: { color: 'rgba(45,45,90,0.5)' }, title: { display: true, text: '°C', color: '#8888bb' } },
                y1: { position: 'right', ticks: { color: '#8888bb' }, grid: { drawOnChartArea: false }, title: { display: true, text: '%', color: '#8888bb' } },
            }
        }
    });
}

async function loadForecast(city) {
    const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
    });
    const data = await res.json();

    // Take one per day (every 8 items)
    const daily = data.filter((_, i) => i % 8 === 0).slice(0, 5);
    const container = document.getElementById('forecastGrid');
    container.innerHTML = daily.map(d => {
        const date = new Date(d.datetime);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `<div class="forecast-item">
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-temp">${d.temp}°</div>
            <div class="forecast-desc">${d.description}</div>
        </div>`;
    }).join('');
}

async function loadPredictions(city) {
    const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, days_ahead: 14 })
    });
    const data = await res.json();

    // Metrics
    const m = data.metrics;
    document.getElementById('modelMetrics').innerHTML = `
        <div class="metric">R² Score: <strong>${m.r2}</strong></div>
        <div class="metric">MAE: <strong>${m.mae}°C</strong></div>
        <div class="metric">RMSE: <strong>${m.rmse}°C</strong></div>
    `;

    // Chart
    const histLabels = data.historical.map(d => d.date.slice(5));
    const histTemps = data.historical.map(d => d.temp);
    const predLabels = data.predictions.map(d => d.day_label);
    const predTemps = data.predictions.map(d => d.predicted_temp);

    const allLabels = [...histLabels, ...predLabels];
    const histData = [...histTemps, ...new Array(predLabels.length).fill(null)];
    const predData = [...new Array(histLabels.length - 1).fill(null), histTemps[histTemps.length - 1], ...predTemps];

    if (predictionChart) predictionChart.destroy();
    predictionChart = new Chart(document.getElementById('predictionChart'), {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Historical',
                    data: histData,
                    borderColor: '#4fc3f7',
                    backgroundColor: 'rgba(79, 195, 247, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                },
                {
                    label: 'Predicted',
                    data: predData,
                    borderColor: '#ffb74d',
                    backgroundColor: 'rgba(255, 183, 77, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderDash: [6, 3],
                    pointRadius: 3,
                    pointBackgroundColor: '#ffb74d',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#8888bb' } },
                annotation: {}
            },
            scales: {
                x: { ticks: { color: '#8888bb', maxTicksLimit: 12 }, grid: { color: 'rgba(45,45,90,0.5)' } },
                y: { ticks: { color: '#8888bb' }, grid: { color: 'rgba(45,45,90,0.5)' }, title: { display: true, text: '°C', color: '#8888bb' } },
            }
        }
    });
}

async function compareCities() {
    const selected = Array.from(document.querySelectorAll('.city-chip.selected')).map(c => c.dataset.city);
    if (selected.length < 2) {
        alert('Select at least 2 cities to compare.');
        return;
    }

    const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities: selected })
    });
    const data = await res.json();

    const labels = data.map(d => d.weather.city);
    const temps = data.map(d => d.weather.temp);
    const humids = data.map(d => d.weather.humidity);

    if (comparisonChart) comparisonChart.destroy();
    comparisonChart = new Chart(document.getElementById('comparisonChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temps,
                    backgroundColor: chartColors.slice(0, data.length).map(c => c + '99'),
                    borderColor: chartColors.slice(0, data.length),
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y',
                },
                {
                    label: 'Humidity (%)',
                    data: humids,
                    backgroundColor: chartColors.slice(0, data.length).map(c => c + '44'),
                    borderColor: chartColors.slice(0, data.length),
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#8888bb' } } },
            scales: {
                x: { ticks: { color: '#8888bb' }, grid: { color: 'rgba(45,45,90,0.5)' } },
                y: { ticks: { color: '#8888bb' }, grid: { color: 'rgba(45,45,90,0.5)' }, title: { display: true, text: '°C', color: '#8888bb' } },
                y1: { position: 'right', ticks: { color: '#8888bb' }, grid: { drawOnChartArea: false }, title: { display: true, text: '%', color: '#8888bb' } },
            }
        }
    });
}

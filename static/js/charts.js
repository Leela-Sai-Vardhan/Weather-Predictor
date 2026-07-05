let rainChart, historicalChart, predictionChart;
let currentCity = 'New York';

const CITIES_SEARCH = [
    'New York','London','Tokyo','Paris','Mumbai','Sydney','Dubai','Berlin',
    'Toronto','Singapore','Seoul','Bangkok','Amsterdam','Rome','Istanbul',
    'Barcelona','Moscow','Cairo','Lagos','Buenos Aires','Mexico City',
    'Los Angeles','Chicago','San Francisco','Miami','Seattle','Denver',
    'Beijing','Shanghai','Hong Kong','Delhi','Bangalore','Jakarta',
    'Cape Town','Nairobi','Rio de Janeiro','Lima','Bogota','Santiago',
];

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const WEATHER_ICONS = {
    'clear sky': '☀️', 'few clouds': '🌤', 'scattered clouds': '⛅',
    'broken clouds': '☁️', 'overcast clouds': '☁️', 'light rain': '🌦',
    'moderate rain': '🌧', 'heavy rain': '⛈', 'thunderstorm': '⛈',
    'snow': '❄️', 'mist': '🌫', 'fog': '🌫', 'haze': '🌫',
    'light intensity rain': '🌦', 'drizzle': '🌦',
};

// ===== GEOLOCATION =====
function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latitude + '&lon=' + longitude);
                    const data = await res.json();
                    const city = data.address.city || data.address.town || data.address.state || 'New York';
                    currentCity = city;
                    document.getElementById('cityLabel').textContent = city + ', ' + (data.address.country || '');
                    loadAllData();
                } catch {
                    currentCity = 'New York';
                    document.getElementById('cityLabel').textContent = 'New York, US';
                    loadAllData();
                }
            },
            () => {
                currentCity = 'New York';
                document.getElementById('cityLabel').textContent = 'New York, US';
                loadAllData();
            },
            { timeout: 8000 }
        );
    } else {
        currentCity = 'New York';
        document.getElementById('cityLabel').textContent = 'New York, US';
        loadAllData();
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupToggle();
    setupSearch();
    setupCityCards();
    detectLocation();
    loadCitySidebar();
    updateClock();
    setInterval(updateClock, 30000);
});

function updateClock() {
    const now = new Date();
    document.getElementById('todayDay').textContent = DAYS[now.getDay()];
    document.getElementById('todayTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ===== TABS =====
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadAllData();
        });
    });
}

// ===== TOGGLE =====
function setupToggle() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ===== SEARCH =====
function setupSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { results.classList.remove('active'); return; }
        const matches = CITIES_SEARCH.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
        if (matches.length === 0) { results.classList.remove('active'); return; }
        results.innerHTML = matches.map(c =>
            '<div class="search-result-item" data-city="' + c + '">' + c + '</div>'
        ).join('');
        results.classList.add('active');
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                currentCity = item.dataset.city;
                document.getElementById('cityLabel').textContent = currentCity;
                input.value = '';
                results.classList.remove('active');
                loadAllData();
            });
        });
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = input.value.trim();
            if (q) {
                currentCity = q;
                document.getElementById('cityLabel').textContent = q;
                input.value = '';
                results.classList.remove('active');
                loadAllData();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) results.classList.remove('active');
    });
}

// ===== CITY CARDS =====
function setupCityCards() {
    document.querySelectorAll('.city-card').forEach(card => {
        card.addEventListener('click', () => {
            currentCity = card.dataset.city;
            document.getElementById('cityLabel').textContent = currentCity;
            loadAllData();
        });
    });
}

// ===== LOAD ALL DATA =====
async function loadAllData() {
    await Promise.all([
        loadCurrentWeather(),
        loadForecast(),
        loadHistorical(),
        loadPredictions(),
    ]);
    loadCitySidebar();
}

// ===== CURRENT WEATHER =====
async function loadCurrentWeather() {
    try {
        const res = await fetch('/api/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: currentCity })
        });
        const d = await res.json();

        document.getElementById('todayTemp').textContent = d.temp + '°';
        document.getElementById('todayDesc').textContent = d.description;
        document.getElementById('todayIcon').innerHTML =
            '<div class="weather-icon-3d">' + getIcon(d.description) + '</div>';
        document.getElementById('feelsLike').textContent = d.feels_like + '°';
        document.getElementById('windSpeed').textContent = d.wind_speed + ' km/h';
        document.getElementById('pressure').textContent = d.pressure + ' hPa';
        document.getElementById('humidity').textContent = d.humidity + '%';
        document.getElementById('visibility').textContent = (d.visibility || 10) + ' km';
        document.getElementById('uvIndex').textContent = Math.floor(Math.random() * 8 + 1);

        // Animate in
        const card = document.getElementById('todayCard');
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    } catch (err) {
        console.error('Failed to load current weather:', err);
    }
}

// ===== FORECAST =====
async function loadForecast() {
    try {
        const res = await fetch('/api/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: currentCity })
        });
        const data = await res.json();
        const daily = data.filter((_, i) => i % 8 === 0).slice(0, 7);
        const container = document.getElementById('forecastStrip');

        container.innerHTML = daily.map((d, i) => {
            const date = new Date(d.datetime);
            const dayName = i === 0 ? 'Today' : DAYS_SHORT[date.getDay()];
            return '<div class="forecast-card' + (i === 0 ? ' active' : '') + '" style="animation:fadeInUp 0.4s ' + (i * 0.07) + 's both">' +
                '<span class="fc-day">' + dayName + '</span>' +
                '<span class="fc-icon">' + getIcon(d.description) + '</span>' +
                '<span class="fc-temp">' + d.temp + '°</span>' +
                '<span class="fc-desc">' + d.description + '</span>' +
                '</div>';
        }).join('');

        // Setup rain chart with hourly data
        const hourly = data.slice(0, 8);
        renderRainChart(hourly);

    } catch (err) {
        console.error('Failed to load forecast:', err);
    }
}

function renderRainChart(hourly) {
    const labels = hourly.map(d => {
        const dt = new Date(d.datetime);
        return dt.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    });
    const rainChances = hourly.map(() => Math.floor(Math.random() * 80 + 10));

    if (rainChart) rainChart.destroy();
    rainChart = new Chart(document.getElementById('rainChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: rainChances,
                backgroundColor: rainChances.map(v => v > 60 ? 'rgba(169,215,255,0.7)' : 'rgba(169,215,255,0.3)'),
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#5A5A6E', font: { size: 11 } } },
                y: { display: false, max: 100 },
            },
            animation: { duration: 1200, easing: 'easeOutQuart' }
        }
    });
}

// ===== HISTORICAL =====
async function loadHistorical() {
    try {
        const res = await fetch('/api/historical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: currentCity, days: 30 })
        });
        const data = await res.json();
        const labels = data.data.map(d => d.date.slice(5));
        const temps = data.data.map(d => d.temp);

        if (historicalChart) historicalChart.destroy();
        historicalChart = new Chart(document.getElementById('historicalChart'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: '#A9D7FF',
                    backgroundColor: 'rgba(169,215,255,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#A9D7FF',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5A5A6E', font: { size: 10 }, maxTicksLimit: 8 } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5A5A6E', font: { size: 10 } } },
                },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });
    } catch (err) {
        console.error('Failed to load historical:', err);
    }
}

// ===== PREDICTIONS =====
async function loadPredictions() {
    try {
        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: currentCity, days_ahead: 14 })
        });
        const data = await res.json();

        const m = data.metrics;
        document.getElementById('modelMetrics').innerHTML =
            '<div class="metric">R²: <strong>' + m.r2 + '</strong></div>' +
            '<div class="metric">MAE: <strong>' + m.mae + '°C</strong></div>' +
            '<div class="metric">RMSE: <strong>' + m.rmse + '°C</strong></div>';

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
                        borderColor: '#A9D7FF',
                        backgroundColor: 'rgba(169,215,255,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        borderWidth: 2,
                    },
                    {
                        label: 'Predicted',
                        data: predData,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139,92,246,0.08)',
                        fill: true,
                        tension: 0.4,
                        borderDash: [6, 3],
                        pointRadius: 3,
                        pointBackgroundColor: '#8B5CF6',
                        borderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#8E8EA0', font: { size: 11 } } } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5A5A6E', font: { size: 10 }, maxTicksLimit: 10 } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5A5A6E', font: { size: 10 } } },
                },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });
    } catch (err) {
        console.error('Failed to load predictions:', err);
    }
}

// ===== CITY SIDEBAR =====
async function loadCitySidebar() {
    const sidebarCities = [
        { id: 'nyc', city: 'New York', country: 'US' },
        { id: 'bj', city: 'Beijing', country: 'China' },
        { id: 'tk', city: 'Tokyo', country: 'Japan' },
    ];
    for (const sc of sidebarCities) {
        try {
            const res = await fetch('/api/current', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: sc.city })
            });
            const d = await res.json();
            document.getElementById(sc.id + '-desc').textContent = d.description;
            document.getElementById(sc.id + '-icon').textContent = getIcon(d.description);
            document.getElementById(sc.id + '-temp').textContent = d.temp + '°';
        } catch {}
    }
}

// ===== HELPERS =====
function getIcon(desc) {
    const d = (desc || '').toLowerCase();
    for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
        if (d.includes(key)) return icon;
    }
    if (d.includes('cloud')) return '☁️';
    if (d.includes('rain')) return '🌧';
    if (d.includes('sun') || d.includes('clear')) return '☀️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('fog') || d.includes('mist')) return '🌫';
    return '🌤';
}

// ===== ANIMATIONS CSS INJECTION =====
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);

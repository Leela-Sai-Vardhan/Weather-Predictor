let rainChart, historicalChart, predictionChart;
let currentCity = 'New York';

const CITIES_SEARCH = [
    'New York','London','Tokyo','Paris','Mumbai','Sydney','Dubai','Berlin',
    'Toronto','Singapore','Seoul','Bangkok','Amsterdam','Rome','Istanbul',
    'Barcelona','Moscow','Cairo','Lagos','Buenos Aires','Mexico City',
    'Los Angeles','Chicago','San Francisco','Miami','Seattle','Denver',
    'Beijing','Shanghai','Hong Kong','Delhi','Bangalore','Jakarta',
    'Cape Town','Nairobi','Rio de Janeiro','Lima','Bogota','Santiago',
    'Vijayawada','Kanuru','Hyderabad','Chennai','Kolkata','Pune',
];

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const WEATHER_ICONS = {
    'clear sky': '☀️', 'few clouds': '🌤', 'scattered clouds': '⛅',
    'broken clouds': '☁️', 'overcast clouds': '☁️', 'light rain': '🌦',
    'moderate rain': '🌧', 'heavy rain': '⛈', 'thunderstorm': '⛈',
    'snow': '❄️', 'mist': '🌫', 'fog': '🌫', 'haze': '🌫',
    'light intensity rain': '🌦', 'drizzle': '🌦',
    'smoke': '🌫', 'dust': '🌫', 'sand': '🌫',
    'rain': '🌧', 'shower rain': '🌦',
};

const WIND_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ===== GEOLOCATION =====
function detectLocation() {
    if (!navigator.geolocation) {
        setCity('New York', 'US');
        return;
    }
    const timeoutId = setTimeout(() => { setCity('New York', 'US'); }, 8000);
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            clearTimeout(timeoutId);
            const { latitude, longitude } = pos.coords;
            let resolved = false;
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(
                    'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latitude + '&lon=' + longitude + '&zoom=10&addressdetails=1',
                    { signal: controller.signal, headers: { 'Accept': 'en' } }
                );
                clearTimeout(tid);
                const data = await res.json();
                const addr = data.address || {};
                const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
                const country = addr.country_code ? addr.country_code.toUpperCase() : '';
                if (city && city.length > 1) { setCity(city, country); resolved = true; }
            } catch (e) {}
            if (!resolved) {
                try {
                    const res = await fetch('/api/current-coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lat: latitude, lon: longitude })
                    });
                    const data = await res.json();
                    if (data.city) { setCity(data.city, data.country || ''); resolved = true; }
                } catch (e) {}
            }
            if (!resolved) setCity('New York', 'US');
        },
        () => { clearTimeout(timeoutId); setCity('New York', 'US'); },
        { timeout: 10000, enableHighAccuracy: false }
    );
}

function setCity(city, country) {
    currentCity = city;
    const label = country ? sanitize(city) + ', ' + sanitize(country) : sanitize(city);
    document.getElementById('cityLabel').textContent = label;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupToggle();
    setupSearch();
    setupCityCards();
    setupThemeToggle();
    detectLocation();
    loadAllData();
    updateClock();
    setInterval(updateClock, 30000);
});

function updateClock() {
    const now = new Date();
    const dayEl = document.getElementById('todayDay');
    const timeEl = document.getElementById('todayTime');
    if (dayEl) dayEl.textContent = DAYS[now.getDay()];
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ===== THEME TOGGLE =====
function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('mitzy-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mitzy-theme', next);
        setTimeout(() => {
            if (historicalChart) historicalChart.destroy();
            if (predictionChart) predictionChart.destroy();
            if (rainChart) rainChart.destroy();
            loadHistorical();
            loadPredictions();
        }, 100);
    });
}

function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
        text: isDark ? '#8E8EA0' : '#6B6B80',
        grid: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
        sky: isDark ? '#A9D7FF' : '#3B82F6',
        purple: isDark ? '#8B5CF6' : '#7C3AED',
        skyBg: isDark ? 'rgba(169,215,255,0.1)' : 'rgba(59,130,246,0.08)',
        purpleBg: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(124,58,237,0.08)',
        barActive: isDark ? 'rgba(169,215,255,0.8)' : 'rgba(59,130,246,0.7)',
        barInactive: isDark ? 'rgba(169,215,255,0.35)' : 'rgba(59,130,246,0.3)',
    };
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

// ===== TOGGLE (Forecast / Rain) =====
function setupToggle() {
    const forecastBtn = document.querySelector('.toggle-btn[data-view="forecast"]');
    const rainBtn = document.querySelector('.toggle-btn[data-view="rain"]');
    const rainCard = document.getElementById('rainChartCard');
    const forecastStrip = document.getElementById('forecastStrip');

    if (forecastBtn) {
        forecastBtn.addEventListener('click', () => {
            forecastBtn.classList.add('active');
            rainBtn.classList.remove('active');
            rainCard.classList.add('hidden');
            forecastStrip.style.display = '';
        });
    }
    if (rainBtn) {
        rainBtn.addEventListener('click', () => {
            rainBtn.classList.add('active');
            forecastBtn.classList.remove('active');
            rainCard.classList.remove('hidden');
            forecastStrip.style.display = 'none';
        });
    }
    // Default: show forecast, hide rain
    rainCard.classList.add('hidden');
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
            '<div class="search-result-item" data-city="' + sanitize(c) + '">' + sanitize(c) + '</div>'
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
            if (q) { currentCity = q; document.getElementById('cityLabel').textContent = sanitize(q); input.value = ''; results.classList.remove('active'); loadAllData(); }
        }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search-bar')) results.classList.remove('active'); });
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

// ===== MAP MARKERS =====
document.addEventListener('click', (e) => {
    const marker = e.target.closest('.map-marker');
    if (marker && marker.dataset.city) {
        currentCity = marker.dataset.city;
        document.getElementById('cityLabel').textContent = currentCity;
        loadAllData();
    }
});

// ===== LOAD ALL =====
async function loadAllData() {
    try {
        await Promise.all([
            loadCurrentWeather(),
            loadForecast(),
            loadHistorical(),
            loadPredictions(),
        ]);
    } catch (e) {
        console.error('loadAllData error:', e);
    }
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
        if (!res.ok) throw new Error('API error ' + res.status);
        const d = await res.json();
        if (d.error) throw new Error(d.error);

        document.getElementById('todayTemp').textContent = d.temp + '°';
        document.getElementById('todayDesc').textContent = d.description || 'N/A';
        document.getElementById('todayIcon').innerHTML = '<div class="weather-icon-3d">' + getIcon(d.description) + '</div>';
        document.getElementById('feelsLike').textContent = d.feels_like + '°';
        document.getElementById('windSpeed').textContent = d.wind_speed + ' km/h';
        document.getElementById('pressure').textContent = d.pressure + ' hPa';
        document.getElementById('humidity').textContent = d.humidity + '%';
        document.getElementById('visibility').textContent = (d.visibility || 10) + ' km';
        const dirIdx = Math.floor((d.wind_speed * 7) % 16);
        document.getElementById('windDir').textContent = WIND_DIRS[dirIdx];
        if (d.city) document.getElementById('cityLabel').textContent = d.city + (d.country ? ', ' + d.country : '');

        const card = document.getElementById('todayCard');
        card.style.opacity = '0'; card.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
            card.style.opacity = '1'; card.style.transform = 'translateY(0)';
        });
    } catch (err) {
        console.error('loadCurrentWeather:', err);
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
        if (!res.ok) throw new Error('API error');
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
                '<span class="fc-desc">' + sanitize(d.description) + '</span>' +
                '</div>';
        }).join('');
        const hourly = data.slice(0, 8);
        renderRainChart(hourly);
    } catch (err) {
        console.error('loadForecast:', err);
    }
}

function renderRainChart(hourly) {
    const colors = getThemeColors();
    const labels = hourly.map(d => {
        const dt = new Date(d.datetime);
        return dt.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    });
    const rainChances = hourly.map(() => Math.floor(Math.random() * 80 + 10));
    if (rainChart) rainChart.destroy();
    const canvas = document.getElementById('rainChart');
    if (!canvas) return;
    rainChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: rainChances,
                backgroundColor: rainChances.map(v => v > 60 ? colors.barActive : colors.barInactive),
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 24,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            scales: {
                x: { grid: { display: false }, ticks: { color: colors.text, font: { size: 11 } } },
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
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (!data.data || data.data.length === 0) return;
        const colors = getThemeColors();
        const labels = data.data.map(d => d.date.slice(5));
        const temps = data.data.map(d => d.temp);
        if (historicalChart) historicalChart.destroy();
        const canvas = document.getElementById('historicalChart');
        if (!canvas) return;
        historicalChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: colors.sky,
                    backgroundColor: colors.skyBg,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: colors.sky,
                    pointBorderColor: colors.sky,
                    borderWidth: 2.5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { size: 10 }, maxTicksLimit: 8 } },
                    y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { size: 10 } } },
                },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });
    } catch (err) {
        console.error('loadHistorical:', err);
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
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (!data.historical || !data.predictions) return;
        const colors = getThemeColors();
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
        const canvas = document.getElementById('predictionChart');
        if (!canvas) return;
        predictionChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    {
                        label: 'Historical',
                        data: histData,
                        borderColor: colors.sky,
                        backgroundColor: colors.skyBg,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: colors.sky,
                        borderWidth: 2.5,
                    },
                    {
                        label: 'Predicted',
                        data: predData,
                        borderColor: colors.purple,
                        backgroundColor: colors.purpleBg,
                        fill: true,
                        tension: 0.4,
                        borderDash: [6, 3],
                        pointRadius: 4,
                        pointBackgroundColor: colors.purple,
                        pointBorderColor: colors.purple,
                        borderWidth: 2.5,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: colors.text, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } }
                },
                scales: {
                    x: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { size: 10 }, maxTicksLimit: 12 } },
                    y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { size: 10 } } },
                },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });
    } catch (err) {
        console.error('loadPredictions:', err);
    }
}

// ===== CITY SIDEBAR =====
async function loadCitySidebar() {
    const sidebarCities = [
        { id: 'nyc', city: 'New York' },
        { id: 'bj', city: 'Beijing' },
        { id: 'tk', city: 'Tokyo' },
    ];
    for (const sc of sidebarCities) {
        try {
            const res = await fetch('/api/current', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: sc.city })
            });
            const d = await res.json();
            const descEl = document.getElementById(sc.id + '-desc');
            const iconEl = document.getElementById(sc.id + '-icon');
            const tempEl = document.getElementById(sc.id + '-temp');
            if (descEl) descEl.textContent = d.description || 'N/A';
            if (iconEl) iconEl.textContent = getIcon(d.description);
            if (tempEl) tempEl.textContent = d.temp + '°';
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

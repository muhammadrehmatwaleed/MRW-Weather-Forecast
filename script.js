// Global variables
let currentUnit = 'celsius';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Initialize the app
function initApp() {
    displayRecentSearches();
    
    // Check if there's a last searched city
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        document.getElementById('city').value = lastCity;
        getWeather();
    }
}

// Main weather function
async function getWeather() {
    const city = document.getElementById('city').value.trim();
    
    if (!city) {
        showError("Please enter a city name");
        return;
    }
    
    const apiKey = '5506c4885e4d7a8be321111ae4970897';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    
    // Show loading state
    showLoading(true);
    hideError();
    hideWeather();
    
    try {
        // Fetch current weather
        const currentResponse = await fetch(currentWeatherUrl);
        const currentData = await currentResponse.json();
        
        if (currentData.cod === 200) {
            // Save to recent searches
            addToRecentSearches(city);
            
            // Fetch forecast
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            // Display data
            displayWeather(currentData, forecastData);
            
            // Save last city to localStorage
            localStorage.setItem('lastCity', city);
        } else {
            showError("City not found. Please try again.");
        }
    } catch (error) {
        showError("Error fetching weather data. Please check your connection.");
    } finally {
        showLoading(false);
    }
}

// Get weather by geolocation
function getLocation() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                showLoading(false);
                showError("Unable to retrieve your location.");
            }
        );
    } else {
        showError("Geolocation is not supported by this browser.");
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    const apiKey = '5506c4885e4d7a8be321111ae4970897';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    try {
        // Fetch current weather
        const currentResponse = await fetch(currentWeatherUrl);
        const currentData = await currentResponse.json();
        
        if (currentData.cod === 200) {
            // Set city name in input
            document.getElementById('city').value = currentData.name;
            
            // Fetch forecast
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            // Display data
            displayWeather(currentData, forecastData);
            
            // Save to recent searches
            addToRecentSearches(currentData.name);
            
            // Save last city to localStorage
            localStorage.setItem('lastCity', currentData.name);
        } else {
            showError("Unable to get weather for your location.");
        }
    } catch (error) {
        showError("Error fetching weather data.");
    } finally {
        showLoading(false);
    }
}

// Display weather data
function displayWeather(currentData, forecastData) {
    const { name, sys, weather, main, wind, visibility, dt } = currentData;
    const { description, icon } = weather[0];
    const { temp, humidity, feels_like, pressure } = main;
    const { speed } = wind;
    
    // Update current weather
    document.getElementById('city-name').textContent = `${name}, ${sys.country}`;
    document.getElementById('weather-description').textContent = description;
    document.getElementById('date-time').textContent = formatDateTime(dt);
    document.getElementById('temperature').textContent = `${Math.round(temp)}°`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('wind-speed').textContent = `${speed} m/s`;
    document.getElementById('feels-like').textContent = `${Math.round(feels_like)}°`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;
    
    // Set weather icon
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    document.getElementById('weather-icon').src = iconUrl;
    document.getElementById('weather-icon').alt = description;
    
    // Update sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(sys.sunrise);
    document.getElementById('sunset').textContent = formatTime(sys.sunset);
    
    // Update visibility
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    
    // Display forecast
    displayForecast(forecastData);
    
    // Show all sections
    document.getElementById('current-weather').classList.remove('hidden');
    document.getElementById('forecast-container').classList.remove('hidden');
    document.getElementById('additional-info').classList.remove('hidden');
}

// Display 5-day forecast
function displayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';
    
    // Filter to get one forecast per day (around noon)
    const dailyForecasts = forecastData.list.filter(item => 
        item.dt_txt.includes('12:00:00')
    ).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
        const temp = Math.round(day.main.temp);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img class="forecast-icon" src="${iconUrl}" alt="${day.weather[0].description}">
            <div class="forecast-temp">${temp}°</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Change temperature unit
function changeUnit(unit) {
    if (unit === currentUnit) return;
    
    currentUnit = unit;
    
    // Update button states
    document.getElementById('celsius-btn').classList.toggle('active', unit === 'celsius');
    document.getElementById('fahrenheit-btn').classList.toggle('active', unit === 'fahrenheit');
    
    // Convert temperatures if needed
    const tempElement = document.getElementById('temperature');
    const feelsLikeElement = document.getElementById('feels-like');
    
    if (unit === 'fahrenheit') {
        const currentTemp = parseInt(tempElement.textContent);
        const currentFeelsLike = parseInt(feelsLikeElement.textContent);
        
        tempElement.textContent = `${celsiusToFahrenheit(currentTemp)}°`;
        feelsLikeElement.textContent = `${celsiusToFahrenheit(currentFeelsLike)}°`;
        
        // Update forecast temperatures
        updateForecastUnits(unit);
    } else {
        // If we're switching back to Celsius, we need to reload the data
        // as we don't have the original Celsius values stored
        getWeather();
    }
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(c) {
    return Math.round((c * 9/5) + 32);
}

// Update forecast units
function updateForecastUnits(unit) {
    const forecastItems = document.querySelectorAll('.forecast-item');
    
    forecastItems.forEach(item => {
        const tempElement = item.querySelector('.forecast-temp');
        const currentTemp = parseInt(tempElement.textContent);
        
        if (unit === 'fahrenheit') {
            tempElement.textContent = `${celsiusToFahrenheit(currentTemp)}°`;
        }
    });
}

// Add to recent searches
function addToRecentSearches(city) {
    // Remove if already exists
    recentSearches = recentSearches.filter(item => item !== city);
    
    // Add to beginning of array
    recentSearches.unshift(city);
    
    // Keep only 5 recent searches
    if (recentSearches.length > 5) {
        recentSearches.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    
    // Update UI
    displayRecentSearches();
}

// Display recent searches
function displayRecentSearches() {
    const searchList = document.getElementById('search-list');
    const recentContainer = document.getElementById('recent-searches');
    
    if (recentSearches.length === 0) {
        recentContainer.classList.add('hidden');
        return;
    }
    
    searchList.innerHTML = '';
    recentSearches.forEach(city => {
        const searchItem = document.createElement('div');
        searchItem.className = 'search-item';
        searchItem.textContent = city;
        searchItem.addEventListener('click', () => {
            document.getElementById('city').value = city;
            getWeather();
        });
        
        searchList.appendChild(searchItem);
    });
    
    recentContainer.classList.remove('hidden');
}

// Format date and time
function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// UI helper functions
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.querySelector('p').textContent = message;
    errorElement.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function hideWeather() {
    document.getElementById('current-weather').classList.add('hidden');
    document.getElementById('forecast-container').classList.add('hidden');
    document.getElementById('additional-info').classList.add('hidden');
}

function showLoading(show) {
    if (show) {
        document.getElementById('loading').classList.remove('hidden');
    } else {
        document.getElementById('loading').classList.add('hidden');
    }
}

// Event listeners
document.getElementById('city').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

document.getElementById('city').addEventListener('input', function() {
    hideError();
});

// Initialize the app when the page loads
window.addEventListener('load', initApp);

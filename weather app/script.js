
async function getWeather() {
    const city = document.getElementById('city').value;
    const apiKey = '5506c4885e4d7a8be321111ae4970897'; 
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            document.getElementById('result').innerHTML = `
                <h2>${data.name}</h2>
                <p>Temperature: ${data.main.temp} °C</p>
                <p>Weather: ${data.weather[0].description}</p>
                <p>Humidity: ${data.main.humidity}%</p>
                <p>Wind Speed: ${data.wind.speed} m/s</p>
            `;
        } else {
            document.getElementById('result').innerHTML = `<p>${data.message}</p>`;
        }
    } catch (error) {
        document.getElementById('result').innerHTML = `<p>Error fetching weather data</p>`;
    }
}


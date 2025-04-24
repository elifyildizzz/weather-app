
//Bu, asenkron (beklemeli) bir fonksiyon. fetch() gibi veri çekme işlemleri sırasında bekleme yapılmasını sağlar.
async function getWeather() {
  
  const city = document.getElementById("cityInput").value.trim();
  //HTML'deki <input id="cityInput"> elemanından şehir ismini alır ve boşlukları temizler.
  
  const apiKey = "a17e916811780a2eb1a7be83c912890d";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
  // OpenWeatherMap API’ine gidecek bağlantıyı oluşturur.


  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Şehir bulunamadı!");
    const data = await response.json();

    //API'den veri çekilir. Eğer veri alınamazsa hata fırlatılır.Gelen yanıt JSON formatına dönüştürülür.

    const weather = data.weather[0];
    const main = data.main;
    const wind = data.wind;

    let iconHTML = "";
    if (weather.icon === "01d") {
      iconHTML = `<img src="images/sun.png" alt="güneşli" class="mx-auto mt-2 w-20 h-20">`;
    } else if (weather.icon === "01n") {
      iconHTML = `<img src="images/moon.png" alt="gece açık" class="mx-auto mt-2 w-20 h-20">`;
    } else {
      iconHTML = `<img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="hava durumu" class="mx-auto mt-2">`;
    }//Gündüz/güneşli veya gece ikonları özel olarak yerel görsellerle gösterilir.Diğer durumlarda OpenWeatherMap'in kendi ikon linki kullanılır.

    const resultHTML = `
      <h2 class="text-xl font-semibold text-slate-800">${data.name}</h2>
      <p class="text-lg capitalize">${weather.description}</p>
      <p class="text-lg">🌡️ Sıcaklık: ${main.temp} °C</p>
      <p class="text-md">💧 Nem: ${main.humidity}%</p>
      <p class="text-md">🌬️ Rüzgar: ${wind.speed} m/s</p>
      ${iconHTML}
    `;//Hava durumu bilgileri yazılı ve görsel olarak hazırlanır.

    const resultDiv = document.getElementById("weatherResult");
    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.add("p-4", "bg-white", "bg-opacity-20", "rounded", "backdrop-blur-sm", "text-slate-800");
    //Hazırlanan HTML içeriği #weatherResult div’ine yazılır.Ayrıca bazı stiller de eklenir.

    // 🌍 Leaflet.js Harita
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    const map = L.map('map').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker([lat, lon]).addTo(map).bindPopup(`${data.name}`).openPopup();
    //Gelen konum bilgisine göre Leaflet ile harita oluşturulur.Şehrin üstüne bir işaretçi bırakılır.



    // 📅 Forecast (5 günlük)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();
    //Yeni bir API ile 5 günlük, 3 saat aralıklarla tahmin verisi alınır.


    const dailyData = {};
    forecastData.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      if (!dailyData[date]) dailyData[date] = item;
    });
    //Her günün ilk verisi seçilerek 5 güne bölünür.

    let forecastHTML = "<h3 class='text-lg font-semibold text-slate-700 mb-2'>5 Günlük Tahmin</h3>";
    Object.entries(dailyData).slice(0, 5).forEach(([date, item]) => {
      const dayName = new Date(date).toLocaleDateString("tr-TR", { weekday: 'long' });
      const icon = item.weather[0].icon;
      const description = item.weather[0].description.toLowerCase();
      const temp = Math.round(item.main.temp);
      const minTemp = Math.round(item.main.temp_min || temp - 2);
      const maxTemp = Math.round(item.main.temp_max || temp + 2);
      const humidity = item.main.humidity;
      //5 günlük tahmin için her gün:Gün adı (Pazartesi, Salı vs.),İkon,Açıklama,Sıcaklık aralığı ve Nem oranı.


      forecastHTML += `
        <div class="flex items-center justify-between gap-2 p-2 px-4 bg-white bg-opacity-30 rounded shadow">
          <span class="w-24 font-semibold">${dayName}</span>
          <div class="flex items-center gap-2 w-32">
            ${
              description.includes("açık")
                ? `<img src="images/sun.png" class="w-8 h-8 object-contain" alt="güneşli" />`
                : `<img src="https://openweathermap.org/img/wn/${icon}.png" class="w-8 h-8 object-contain" alt="hava durumu ikonu" />`
            }
            <span class="text-sm text-gray-700">${description}</span>
          </div>
          <div class="flex flex-col text-sm items-end text-slate-800">
            <span>🌡️ ${minTemp}° / ${maxTemp}°</span>
            <span>💧 %${humidity}</span>
          </div>
        </div>
      `;
    });

    document.getElementById("forecastResult").innerHTML = forecastHTML;
    //Tahmin içeriği #forecastResult div’ine yazılır.

  } catch (error) {
    document.getElementById("weatherResult").innerHTML = `
      <p class="text-neutral-700 text-center font-semibold">${error.message}</p>
    `;
    document.getElementById("map").innerHTML = ""; // Hatalıysa haritayı temizle
  }
  //API'den veri çekilemezse kullanıcıya hata mesajı gösterilir.Harita temizlenir.
}

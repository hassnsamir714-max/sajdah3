
const content = document.getElementById("content");

const PRAYER_NAMES = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء"
};

const PRAYER_ORDER = [
  "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"
];

const PRAYER_API = "https://api.aladhan.com/v1";

let countdownTimer = null;

// Navigation
const sections = {
  prayers: {
    title: "مواقيت الصلاة",
    description: "مواقيت الصلاة حسب موقعك."
  },
  quran: {
    title: "القرآن الكريم",
    description: "القرآن الكريم - قريباً سيتم إضافة المصحف كاملاً."
  },
  adhkar: {
    title: "الأذكار",
    description: "أذكار المسلم اليومية."
  },
  qibla: {
    title: "القبلة",
    description: "تحديد اتجاه القبلة حسب موقعك."
  }
};

function setActive(name) {
  document.querySelectorAll(".bottom-nav button").forEach((button, index) => {
    button.classList.remove("active");

    const activeIndex = {
      home: 0,
      quran: 1,
      tasbeeh: 2,
      adhkar: 3,
      qada: 4
    };

    if (activeIndex[name] === index) {
      button.classList.add("active");
    }
  });
}

function goHome() {
  clearInterval(countdownTimer);
  content.innerHTML = `
    <div class="welcome-card">
      <h2>أهلاً بك في سجدة</h2>
      <p>رفيقك اليومي للعبادة والطمأنينة.</p>
    </div>
    <div class="prayer-card">
      <h3>مواقيت الصلاة</h3>
      <p>تابع صلواتك اليومية.</p>
      <button onclick="showSection('prayers')">عرض المواقيت</button>
    </div>
  `;
  setActive("home");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSection(name) {
  clearInterval(countdownTimer);
  setActive(name);

  if (name === "home") return goHome();
  if (name === "tasbeeh") return showTasbeeh();
  if (name === "qada") return showQada();
  if (name === "prayers") return showPrayers();
  if (name === "qibla") return showQibla();

  if (sections[name]) {
    content.innerHTML = `
      <div class="welcome-card">
        <h2>${sections[name].title}</h2>
        <p>${sections[name].description}</p>
      </div>
    `;

    if (name === "adhkar") showAdhkar();
  }
}

// Prayer times
function showPrayers() {
  content.innerHTML = `
    <h2>مواقيت الصلاة</h2>

    <div class="welcome-card">
      <h3>موقعك الجغرافي</h3>
      <p id="location-status">حدد موقعك لجلب مواقيت الصلاة.</p>
      <button onclick="requestPrayerLocation()">تحديد موقعي</button>
    </div>

    <div class="welcome-card">
      <h3>اختيار المدينة يدوياً</h3>
      <input id="city-input" placeholder="اسم المدينة" />
      <input id="country-input" placeholder="الدولة" />
      <button onclick="loadByCity()">عرض المواقيت</button>
    </div>

    <div class="welcome-card">
      <h3>إعدادات الحساب</h3>
      <label>طريقة الحساب</label>
      <select id="method-input">
        <option value="3">رابطة العالم الإسلامي</option>
        <option value="4">أم القرى</option>
        <option value="2">الجمعية الإسلامية لأمريكا الشمالية</option>
        <option value="5">الهيئة المصرية العامة للمساحة</option>
        <option value="1">جامعة العلوم الإسلامية - كراتشي</option>
      </select>

      <label>طريقة حساب العصر</label>
      <select id="school-input">
        <option value="0">شافعي</option>
        <option value="1">حنفي</option>
      </select>

      <button onclick="reloadPrayerSettings()">تطبيق الإعدادات</button>
    </div>

    <div id="prayer-results"></div>
  `;

  document.getElementById("method-input").value =
    localStorage.getItem("sajdah-method") || "3";

  document.getElementById("school-input").value =
    localStorage.getItem("sajdah-school") || "0";

  const lat = localStorage.getItem("sajdah-lat");
  const lon = localStorage.getItem("sajdah-lon");

  if (lat && lon) {
    loadByCoordinates(Number(lat), Number(lon));
  }
}

function requestPrayerLocation() {
  const status = document.getElementById("location-status");

  if (!navigator.geolocation) {
    status.textContent = "المتصفح لا يدعم تحديد الموقع.";
    return;
  }

  status.textContent = "يرجى السماح بالوصول إلى الموقع...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      localStorage.setItem("sajdah-lat", lat);
      localStorage.setItem("sajdah-lon", lon);

      status.textContent = "تم تحديد موقعك بنجاح.";
      loadByCoordinates(lat, lon);
    },
    error => {
      const messages = {
        1: "لم تسمح بالوصول للموقع. اختر مدينتك يدوياً.",
        2: "تعذر تحديد موقعك. حاول مجدداً.",
        3: "انتهت مهلة تحديد الموقع. حاول مجدداً."
      };

      status.textContent =
        messages[error.code] || "حدث خطأ في تحديد الموقع.";
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    }
  );
}

function getPrayerSettings() {
  const method =
    document.getElementById("method-input")?.value ||
    localStorage.getItem("sajdah-method") ||
    "3";

  const school =
    document.getElementById("school-input")?.value ||
    localStorage.getItem("sajdah-school") ||
    "0";

  return { method, school };
}

function reloadPrayerSettings() {
  const { method, school } = getPrayerSettings();

  localStorage.setItem("sajdah-method", method);
  localStorage.setItem("sajdah-school", school);

  const lat = localStorage.getItem("sajdah-lat");
  const lon = localStorage.getItem("sajdah-lon");

  if (lat && lon) {
    loadByCoordinates(Number(lat), Number(lon));
  } else {
    loadByCity();
  }
}

async function loadByCoordinates(lat, lon) {
  const results = document.getElementById("prayer-results");
  if (!results) return;

  results.innerHTML = "<p>جاري تحميل مواقيت الصلاة...</p>";

  const { method, school } = getPrayerSettings();

  try {
    const date = new Date();
    const dateString = [
      date.getDate(),
      date.getMonth() + 1,
      date.getFullYear()
    ].map(String).join("-");

    const url =
      `${PRAYER_API}/timings/${dateString}` +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lon)}` +
      `&method=${method}&school=${school}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("API error");

    const json = await response.json();
    if (json.code !== 200) throw new Error("Prayer data unavailable");

    renderPrayerTimes(json.data.timings);
  } catch (error) {
    results.innerHTML = `
      <div class="welcome-card">
        <p>تعذر جلب المواقيت حالياً.</p>
        <button onclick="loadByCoordinates(${lat},${lon})">
          إعادة المحاولة
        </button>
      </div>
    `;
  }
}

async function loadByCity() {
  const city = document.getElementById("city-input")?.value.trim();
  const country = document.getElementById("country-input")?.value.trim();
  const results = document.getElementById("prayer-results");

  if (!city || !country) {
    if (results) results.innerHTML = "<p>اكتب المدينة والدولة أولاً.</p>";
    return;
  }

  results.innerHTML = "<p>جاري تحميل المواقيت...</p>";

  const { method, school } = getPrayerSettings();

  try {
    const url =
      `${PRAYER_API}/timingsByCity` +
      `?city=${encodeURIComponent(city)}` +
      `&country=${encodeURIComponent(country)}` +
      `&method=${method}&school=${school}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("API error");

    const json = await response.json();
    if (json.code !== 200) throw new Error("City not found");

    renderPrayerTimes(json.data.timings);
  } catch (error) {
    results.innerHTML = `
      <div class="welcome-card">
        <p>تعذر العثور على المدينة أو تحميل المواقيت.</p>
        <button onclick="loadByCity()">إعادة المحاولة</button>
      </div>
    `;
  }
}

function renderPrayerTimes(timings) {
  const results = document.getElementById("prayer-results");
  if (!results) return;

  const names = {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء"
  };

  const now = new Date();

  const prayerTimes = PRAYER_ORDER
    .filter(key => key !== "Sunrise")
    .map(key => ({
      key,
      name: names[key],
      time: timings[key].split(" ")[0]
    }));

  const nextPrayer = prayerTimes.find(prayer => {
    const [hour, minute] = prayer.time.split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(hour, minute, 0, 0);
    return prayerDate > now;
  });

  results.innerHTML = `
    <div class="prayer-card">
      <h3>الصلاة القادمة</h3>
      <h2 id="next-prayer">
        ${nextPrayer ? nextPrayer.name : "الفجر"}
      </h2>
      <p id="countdown">جاري حساب الوقت...</p>
    </div>

    <div class="welcome-card">
      <h3>مواقيت اليوم</h3>
      ${PRAYER_ORDER.map(key => `
        <p style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid var(--border)">
          <strong>${names[key]}</strong>
          <span>${timings[key].split(" ")[0]}</span>
        </p>
      `).join("")}
    </div>
  `;

  startPrayerCountdown(prayerTimes);
}

function startPrayerCountdown(prayerTimes) {
  clearInterval(countdownTimer);

  function update() {
    const now = new Date();

    let next = prayerTimes.find(prayer => {
      const [hour, minute] = prayer.time.split(":").map(Number);
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      return date > now;
    });

    let target = new Date();

    if (next) {
      const [hour, minute] = next.time.split(":").map(Number);
      target.setHours(hour, minute, 0, 0);
    } else {
      target.setDate(target.getDate() + 1);
      const [hour, minute] = prayerTimes[0].time.split(":").map(Number);
      target.setHours(hour, minute, 0, 0);
      next = prayerTimes[0];
    }

    const difference = target - now;

    const hours = Math.floor(difference / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);

    const nextElement = document.getElementById("next-prayer");
    const countdown = document.getElementById("countdown");

    if (nextElement) nextElement.textContent = next.name;

    if (countdown) {
      countdown.textContent =
        `${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;
    }
  }

  update();
  countdownTimer = setInterval(update, 1000);
}

// Tasbeeh
function showTasbeeh() {
  const count = Number(localStorage.getItem("sajdah-tasbeeh") || 0);

  content.innerHTML = `
    <h2>المسبحة الإلكترونية</h2>
    <div class="welcome-card">
      <div class="tasbeeh-count" id="tasbeeh-count">${count}</div>
      <button id="tasbeeh-button" onclick="incrementTasbeeh()">
        سبحان الله
      </button>
      <button id="reset-button" onclick="resetTasbeeh()">
        تصفير العداد
      </button>
    </div>
  `;
}

function incrementTasbeeh() {
  let count = Number(localStorage.getItem("sajdah-tasbeeh") || 0);
  count++;

  localStorage.setItem("sajdah-tasbeeh", count);

  const display = document.getElementById("tasbeeh-count");
  if (display) display.textContent = count;
}

function resetTasbeeh() {
  if (!confirm("هل تريد تصفير العداد؟")) return;

  localStorage.setItem("sajdah-tasbeeh", "0");
  const display = document.getElementById("tasbeeh-count");
  if (display) display.textContent = "0";
}

// Qada tracker
function showQada() {
  const prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

  let data = {};
  try {
    data = JSON.parse(localStorage.getItem("sajdah-qada") || "{}");
  } catch (error) {
    data = {};
  }

  content.innerHTML = `
    <h2>سجل الصلوات المقضية</h2>
    <div class="welcome-card">
      <p>سجل عدد الصلوات التي أتممت قضاءها.</p>
      <h3 id="qada-total">المجموع: ${Object.values(data).reduce((a,b) => a + (Number(b) || 0), 0)}</h3>
    </div>

    ${prayers.map(prayer => `
      <div class="welcome-card">
        <h3>${prayer}</h3>
        <p>العدد المقضي: <strong id="qada-${prayer}">${Number(data[prayer]) || 0}</strong></p>
        <button onclick="incrementQada('${prayer}')">تم القضاء</button>
      </div>
    `).join("")}
  `;
}

function incrementQada(prayer) {
  let data = {};

  try {
    data = JSON.parse(localStorage.getItem("sajdah-qada") || "{}");
  } catch (error) {
    data = {};
  }

  data[prayer] = (Number(data[prayer]) || 0) + 1;
  localStorage.setItem("sajdah-qada", JSON.stringify(data));

  showQada();
}

// Adhkar
function showAdhkar() {
  const adhkar = [
    "سبحان الله وبحمده",
    "أستغفر الله وأتوب إليه",
    "لا إله إلا الله",
    "الحمد لله",
    "الله أكبر",
    "اللهم صل وسلم على نبينا محمد"
  ];

  content.innerHTML += `
    <div class="welcome-card">
      <h3>أذكار يومية</h3>
      ${adhkar.map(item => `<p style="padding:12px;border-bottom:1px solid var(--border)">${item}</p>`).join("")}
    </div>
  `;
}

// Qibla direction
function showQibla() {
  content.innerHTML = `
    <h2>اتجاه القبلة</h2>
    <div class="welcome-card">
      <p id="qibla-status">حدد موقعك لمعرفة اتجاه القبلة.</p>
      <button onclick="calculateQibla()">تحديد اتجاه القبلة</button>
      <h2 id="qibla-result"></h2>
    </div>
  `;
}

function calculateQibla() {
  if (!navigator.geolocation) return;

  const status = document.getElementById("qibla-status");
  const result = document.getElementById("qibla-result");

  status.textContent = "جاري تحديد الموقع...";

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLon = 39.8262 * Math.PI / 180;
    const userLat = lat * Math.PI / 180;
    const userLon = lon * Math.PI / 180;

    const y = Math.sin(kaabaLon - userLon);
    const x =
      Math.cos(userLat) * Math.tan(kaabaLat) -
      Math.sin(userLat) * Math.cos(kaabaLon - userLon);

    const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    status.textContent = "اتجاه القبلة من الشمال باتجاه عقارب الساعة:";
    result.textContent = `${angle.toFixed(1)}°`;
  }, () => {
    status.textContent = "تعذر تحديد موقعك. تحقق من إذن الموقع.";
  });
}

// Initial screen
goHome();
    

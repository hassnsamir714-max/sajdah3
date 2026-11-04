
"use strict";

const content = document.getElementById("content");
const API = "https://api.aladhan.com/v1";

let countdownTimer = null;
let qiblaBearing = null;
let compassStarted = false;

const PRAYERS = [
  ["Fajr", "الفجر"],
  ["Dhuhr", "الظهر"],
  ["Asr", "العصر"],
  ["Maghrib", "المغرب"],
  ["Isha", "العشاء"]
];

const ALL_TIMINGS = [
  ["Fajr", "الفجر"],
  ["Sunrise", "الشروق"],
  ["Dhuhr", "الظهر"],
  ["Asr", "العصر"],
  ["Maghrib", "المغرب"],
  ["Isha", "العشاء"]
];

function dateString() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function setActive(name) {
  const indexes = {
    home: 0,
    quran: 1,
    tasbeeh: 2,
    adhkar: 3,
    qada: 4
  };

  document.querySelectorAll(".bottom-nav button").forEach((button, index) => {
    button.classList.toggle("active", indexes[name] === index);
  });
}

function goHome() {
  clearInterval(countdownTimer);

  content.innerHTML = `
    <div class="welcome-card">
      <h2>أهلاً بك في سجدة</h2>
      <p>رفيقك اليومي للعبادة والطمأنينة.</p>
    </div>
    <div class="welcome-card">
      <h3>خدمات سجدة</h3>
      <p>اختر الخدمة التي تريد استخدامها من القائمة.</p>
      <button onclick="showSection('prayers')">مواقيت الصلاة</button>
    </div>
  `;

  setActive("home");

  const lat = localStorage.getItem("sajdah-lat");
  const lon = localStorage.getItem("sajdah-lon");

  if (lat && lon) {
    loadHomePrayerTimes(Number(lat), Number(lon));
  } else {
    const name = document.getElementById("next-prayer");
    const countdown = document.getElementById("countdown");
    if (name) name.textContent = "حدد موقعك";
    if (countdown) countdown.textContent = "افتح مواقيت الصلاة لتحديد موقعك.";
  }
}

function showSection(name) {
  clearInterval(countdownTimer);
  setActive(name);

  switch (name) {
    case "home": goHome(); break;
    case "prayers": showPrayers(); break;
    case "tasbeeh": showTasbeeh(); break;
    case "qada": showQada(); break;
    case "adhkar": showAdhkar(); break;
    case "quran": showQuran(); break;
    case "qibla": showQibla(); break;
  }
}

// ========================
// Prayer times
// ========================

function showPrayers() {
  content.innerHTML = `
    <h2>مواقيت الصلاة</h2>

    <div class="welcome-card">
      <h3>تحديد الموقع</h3>
      <p id="location-status">حدد موقعك لعرض مواقيت الصلاة في منطقتك.</p>
      <button onclick="requestPrayerLocation()">تحديد موقعي</button>
    </div>

    <div class="welcome-card">
      <h3>اختيار المدينة يدوياً</h3>
      <input id="city-input" placeholder="المدينة مثل Basra">
      <input id="country-input" placeholder="الدولة مثل Iraq">
      <button onclick="loadByCity()">عرض المواقيت</button>
    </div>

    <div class="welcome-card">
      <h3>إعدادات المواقيت</h3>

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

      <button onclick="reloadPrayerSettings()">حفظ الإعدادات</button>
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

      localStorage.setItem("sajdah-lat", String(lat));
      localStorage.setItem("sajdah-lon", String(lon));

      status.textContent = "تم تحديد موقعك بنجاح.";
      loadByCoordinates(lat, lon);
    },
    error => {
      const messages = {
        1: "لم تسمح بإذن الموقع. يمكنك اختيار المدينة يدوياً.",
        2: "تعذر تحديد موقعك. تحقق من إعدادات الموقع.",
        3: "انتهت مهلة تحديد الموقع. حاول مرة أخرى."
      };

      status.textContent =
        messages[error.code] || "حدث خطأ أثناء تحديد الموقع.";
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 300000
    }
  );
}

function getSettings() {
  return {
    method: localStorage.getItem("sajdah-method") || "3",
    school: localStorage.getItem("sajdah-school") || "0"
  };
}

function reloadPrayerSettings() {
  const method = document.getElementById("method-input").value;
  const school = document.getElementById("school-input").value;

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

async function fetchPrayerData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("تعذر الاتصال بخدمة المواقيت.");
  }

  const json = await response.json();

  if (json.code !== 200 || !json.data || !json.data.timings) {
    throw new Error("لم تصل بيانات مواقيت الصلاة.");
  }

  return json.data.timings;
}

async function loadByCoordinates(lat, lon) {
  const results = document.getElementById("prayer-results");
  if (!results) return;

  results.innerHTML = "<p>جاري تحميل مواقيت الصلاة...</p>";

  const { method, school } = getSettings();

  const url =
    `${API}/timings/${dateString()}` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&method=${method}&school=${school}`;

  try {
    const timings = await fetchPrayerData(url);
    renderPrayerTimes(timings);
  } catch (error) {
    results.innerHTML = `
      <div class="welcome-card">
        <p>${error.message}</p>
        <button onclick="loadByCoordinates(${lat}, ${lon})">إعادة المحاولة</button>
      </div>
    `;
  }
}

async function loadByCity() {
  const city = document.getElementById("city-input")?.value.trim();
  const country = document.getElementById("country-input")?.value.trim();
  const results = document.getElementById("prayer-results");

  if (!city || !country) {
    if (results) results.innerHTML = "<p>اكتب اسم المدينة والدولة أولاً.</p>";
    return;
  }

  results.innerHTML = "<p>جاري تحميل مواقيت الصلاة...</p>";

  const { method, school } = getSettings();

  const url =
    `${API}/timingsByCity/${dateString()}` +
    `?city=${encodeURIComponent(city)}` +
    `&country=${encodeURIComponent(country)}` +
    `&method=${method}&school=${school}`;

  try {
    const timings = await fetchPrayerData(url);
    renderPrayerTimes(timings);
  } catch (error) {
    results.innerHTML = `
      <div class="welcome-card">
        <p>${error.message}</p>
        <button onclick="loadByCity()">إعادة المحاولة</button>
      </div>
    `;
  }
}

function cleanTime(value) {
  return String(value || "").split(" ")[0].slice(0, 5);
}

function renderPrayerTimes(timings) {
  const results = document.getElementById("prayer-results");
  if (!results) return;

  const validTimes = PRAYERS.map(([key, name]) => ({
    key,
    name,
    time: cleanTime(timings[key])
  })).filter(item => /^\d{2}:\d{2}$/.test(item.time));

  if (validTimes.length !== 5) {
    results.innerHTML = "<p>بيانات المواقيت غير مكتملة. حاول مجدداً.</p>";
    return;
  }

  results.innerHTML = `
    <div class="prayer-card">
      <h3>الصلاة القادمة</h3>
      <h2 id="prayer-page-next">جاري الحساب...</h2>
      <p id="prayer-page-countdown">جاري الحساب...</p>
    </div>

    <div class="welcome-card">
      <h3>مواقيت اليوم</h3>
      ${ALL_TIMINGS.map(([key, name]) => `
        <p style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid var(--border)">
          <strong>${name}</strong>
          <span>${cleanTime(timings[key])}</span>
        </p>
      `).join("")}
    </div>
  `;

  startPrayerCountdown(validTimes);
  updateMainPrayerCard(validTimes);
}

function getNextPrayer(prayerTimes) {
  const now = new Date();

  for (const prayer of prayerTimes) {
    const [hour, minute] = prayer.time.split(":").map(Number);
    const target = new Date();

    target.setHours(hour, minute, 0, 0);

    if (target > now) {
      return { ...prayer, target };
    }
  }

  const first = prayerTimes[0];
  const [hour, minute] = first.time.split(":").map(Number);
  const target = new Date();

  target.setDate(target.getDate() + 1);
  target.setHours(hour, minute, 0, 0);

  return { ...first, target };
}

function updateCountdown(prayerTimes) {
  const next = getNextPrayer(prayerTimes);
  const difference = Math.max(0, next.target - new Date());

  const hours = Math.floor(difference / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  const nameElement = document.getElementById("prayer-page-next");
  const countdownElement = document.getElementById("prayer-page-countdown");

  if (nameElement) nameElement.textContent = next.name;

  if (countdownElement) {
    countdownElement.textContent =
      `${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;
  }
}

function startPrayerCountdown(prayerTimes) {
  clearInterval(countdownTimer);
  updateCountdown(prayerTimes);

  countdownTimer = setInterval(() => {
    updateCountdown(prayerTimes);
    updateMainPrayerCard(prayerTimes);
  }, 1000);
}

function updateMainPrayerCard(prayerTimes) {
  const next = getNextPrayer(prayerTimes);

  const mainName = document.getElementById("next-prayer");
  const mainCountdown = document.getElementById("countdown");

  if (mainName) mainName.textContent = next.name;

  if (mainCountdown) {
    const difference = Math.max(0, next.target - new Date());
    const hours = Math.floor(difference / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);

    mainCountdown.textContent =
      `متبقي ${hours} ساعة و ${minutes} دقيقة`;
  }
}

async function loadHomePrayerTimes(lat, lon) {
  const { method, school } = getSettings();

  const url =
    `${API}/timings/${dateString()}` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&method=${method}&school=${school}`;

  try {
    const timings = await fetchPrayerData(url);

    const prayerTimes = PRAYERS.map(([key, name]) => ({
      key,
      name,
      time: cleanTime(timings[key])
    }));

    updateMainPrayerCard(prayerTimes);

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      updateMainPrayerCard(prayerTimes);
    }, 1000);
  } catch (error) {
    const name = document.getElementById("next-prayer");
    const countdown = document.getElementById("countdown");

    if (name) name.textContent = "تعذر تحميل المواقيت";
    if (countdown) countdown.textContent = "افتح مواقيت الصلاة وحاول مجدداً.";
  }
}

// ========================
// Tasbeeh
// ========================

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
  const count = Number(localStorage.getItem("sajdah-tasbeeh") || 0) + 1;
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

// ========================
// Qada tracker
// ========================

function readQadaData() {
  try {
    return JSON.parse(localStorage.getItem("sajdah-qada") || "{}");
  } catch {
    return {};
  }
}

function showQada() {
  const prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  const data = readQadaData();

  const total = prayers.reduce(
    (sum, prayer) => sum + (Number(data[prayer]) || 0),
    0
  );

  content.innerHTML = `
    <h2>قضاء الصلوات</h2>

    <div class="welcome-card">
      <p>أدخل عدد الأيام الفائتة، وسيُضاف العدد نفسه لكل صلاة من الصلوات الخمس.</p>
      <label for="qada-days">عدد الأيام</label>
      <input
        id="qada-days"
        type="number"
        min="1"
        step="1"
        inputmode="numeric"
        placeholder="مثلاً: 10"
        style="width:100%;padding:14px;margin:12px 0;border-radius:12px"
      >
      <button onclick="addQadaDays()">إضافة الأيام</button>
      <h3>المجموع المتبقي: ${total} صلاة</h3>
    </div>

    ${prayers.map(prayer => `
      <div class="welcome-card">
        <h3>${prayer}</h3>
        <p>المتبقي: <strong>${Number(data[prayer]) || 0}</strong></p>
        <button onclick="incrementQada('${prayer}')">قضيت صلاة (+1)</button>
        <button onclick="decrementQada('${prayer}')">تراجع (-1)</button>
      </div>
    `).join("")}
  `;
}

function addQadaDays() {
  const input = document.getElementById("qada-days");
  const days = Number(input && input.value);

  if (!Number.isSafeInteger(days) || days < 1) {
    alert("أدخل عدد أيام صحيحاً أكبر من صفر.");
    return;
  }

  const data = readQadaData();

  ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"].forEach(prayer => {
    data[prayer] = (Number(data[prayer]) || 0) + days;
  });

  localStorage.setItem("sajdah-qada", JSON.stringify(data));
  showQada();
}

function incrementQada(prayer) {
  const data = readQadaData();

  data[prayer] = (Number(data[prayer]) || 0) + 1;
  localStorage.setItem("sajdah-qada", JSON.stringify(data));

  showQada();
}

function decrementQada(prayer) {
  const data = readQadaData();

  data[prayer] = Math.max(0, (Number(data[prayer]) || 0) - 1);
  localStorage.setItem("sajdah-qada", JSON.stringify(data));

  showQada();
}

// ========================
// Adhkar
// ========================

function showAdhkar() {
  const adhkar = [
    "سبحان الله وبحمده",
    "أستغفر الله وأتوب إليه",
    "لا إله إلا الله",
    "الحمد لله",
    "الله أكبر",
    "لا حول ولا قوة إلا بالله",
    "سبحان الله العظيم",
    "اللهم صل وسلم على نبينا محمد"
  ];

  content.innerHTML = `
    <h2>الأذكار</h2>
    <div class="welcome-card">
      <h3>أذكار يومية</h3>
      ${adhkar.map(item => `
        <p style="padding:14px;border-bottom:1px solid var(--border)">
          ${item}
        </p>
      `).join("")}
    </div>
  `;
}

// ========================
// Quran
// ========================

function showQuran() {
  content.innerHTML = `
    <h2>القرآن الكريم</h2>
    <div class="welcome-card">
      <h3>القرآن الكريم</h3>
      <p>سيتم إضافة المصحف وقراءة السور في تحديث قادم.</p>
    </div>
  `;
}

// ========================
// Qibla compass
// ========================

function showQibla() {
  content.innerHTML = `
    <h2>بوصلة القبلة</h2>

    <div class="welcome-card" style="text-align:center">
      <p id="qibla-status">اضغط الزر لتحديد موقعك وتشغيل البوصلة.</p>

      <div
        id="qibla-compass"
        style="display:none;width:min(78vw,290px);height:min(78vw,290px);margin:24px auto;border-radius:50%;border:2px solid var(--gold);position:relative;background:radial-gradient(circle,#244b35,#0b1911);overflow:hidden"
      >
        <div
          id="qibla-dial"
          style="position:absolute;inset:0;border-radius:50%;transition:transform .12s linear"
        >
          <b style="position:absolute;top:12px;left:50%;transform:translateX(-50%);color:var(--gold)">شمال N</b>
          <b style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%)">جنوب S</b>
          <b style="position:absolute;left:10px;top:50%;transform:translateY(-50%)">غرب W</b>
          <b style="position:absolute;right:10px;top:50%;transform:translateY(-50%)">شرق E</b>

          <div
            id="qibla-pointer-wrap"
            style="position:absolute;left:50%;top:50%;width:0;height:0"
          ></div>
        </div>

        <div
          style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:var(--gold);border:2px solid white"
        ></div>
      </div>

      <h3 id="qibla-bearing" style="color:var(--gold)"></h3>
      <p>حرّك الجهاز ببطء؛ السهم يوضح اتجاه القبلة.</p>
      <button onclick="startQiblaCompass()">تحديد الموقع وتشغيل البوصلة</button>
    </div>
  `;
}

function getQiblaBearing(latitude, longitude) {
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180;

  const kaabaLat = 21.4225 * Math.PI / 180;
  const kaabaLon = 39.8262 * Math.PI / 180;

  const y = Math.sin(kaabaLon - lon);
  const x =
    Math.cos(lat) * Math.tan(kaabaLat) -
    Math.sin(lat) * Math.cos(kaabaLon - lon);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

async function startQiblaCompass() {
  const status = document.getElementById("qibla-status");
  if (!status) return;

  status.textContent = "جاري تحديد الموقع...";

  try {
    let lat = localStorage.getItem("sajdah-lat");
    let lon = localStorage.getItem("sajdah-lon");

    if (!lat || !lon) {
      if (!navigator.geolocation) {
        throw new Error("المتصفح لا يدعم تحديد الموقع.");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 300000
        });
      });

      lat = position.coords.latitude;
      lon = position.coords.longitude;

      localStorage.setItem("sajdah-lat", String(lat));
      localStorage.setItem("sajdah-lon", String(lon));
    }

    qiblaBearing = getQiblaBearing(Number(lat), Number(lon));

    const compass = document.getElementById("qibla-compass");
    const bearingText = document.getElementById("qibla-bearing");

    if (compass) compass.style.display = "block";
    if (bearingText) {
      bearingText.textContent =
        "اتجاه القبلة: " + qiblaBearing.toFixed(1) + "° من الشمال";
    }

    if (!("DeviceOrientationEvent" in window)) {
      status.textContent =
        "تم حساب الاتجاه، لكن حساس البوصلة غير مدعوم في هذا المتصفح.";
      return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();

      if (permission !== "granted") {
        throw new Error("لم يتم السماح باستخدام حساس اتجاه الجهاز.");
      }
    }

    if (!compassStarted) {
      window.addEventListener(
        "deviceorientationabsolute",
        handleCompassOrientation,
        true
      );

      window.addEventListener(
        "deviceorientation",
        handleCompassOrientation,
        true
      );

      compassStarted = true;
    }

    status.textContent =
      "تم تشغيل البوصلة. إذا لم تتحرك، فقد يحتاج الجهاز إلى معايرة.";
  } catch (error) {
    status.textContent =
      error.message || "تعذر تحديد الموقع أو تشغيل البوصلة.";
  }
}

    

function handleCompassOrientation(event) {
  if (qiblaBearing === null || !event) return;

  let heading = null;

  if (typeof event.webkitCompassHeading === "number") {
    heading = event.webkitCompassHeading;
  } else if (typeof event.alpha === "number") {
    heading = (360 - event.alpha + 360) % 360;
  }

  if (heading === null || !Number.isFinite(heading)) return;

  const dial = document.getElementById("qibla-dial");
  const pointer = document.getElementById("qibla-pointer-wrap");

  if (pointer && !pointer.dataset.ready) {
    pointer.innerHTML = `
      <div style="
        position:absolute;
        left:-9px;
        top:-112px;
        width:18px;
        height:112px;
        transform-origin:50% 100%;
        transform:rotate(${qiblaBearing}deg)
      ">
        <div style="
          width:0;
          height:0;
          margin:auto;
          border-left:9px solid transparent;
          border-right:9px solid transparent;
          border-bottom:85px solid #d9bd78
        "></div>
        <div style="
          width:5px;
          height:27px;
          margin:-1px auto 0;
          background:#f5f5ed;
          border-radius:4px
        "></div>
      </div>
    `;
    pointer.dataset.ready = "1";
  }

  if (dial) {
    dial.style.transform = `rotate(${-heading}deg)`;
  }
}


function showPrayers() {
  content.innerHTML = `
    <h2>مواقيت الصلاة</h2>
    <div class="welcome-card">
      <h3>تحديد موقعك</h3>
      <p id="location-status">نحتاج موقعك حتى نعرض مواقيت الصلاة لمنطقتك بدقة.</p>
      <button onclick="requestPrayerLocation()">تحديد موقعي</button>
    </div>
    <div id="location-result"></div>
  `;
}

function requestPrayerLocation() {
  const status = document.getElementById("location-status");
  const result = document.getElementById("location-result");

  if (!navigator.geolocation) {
    status.textContent = "متصفحك لا يدعم تحديد الموقع.";
    return;
  }

  status.textContent = "جاري تحديد موقعك...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      localStorage.setItem("sajdah-lat", lat);
      localStorage.setItem("sajdah-lon", lon);

      status.textContent = "تم تحديد موقعك بنجاح.";
      result.innerHTML = `
        <div class="welcome-card">
          <h3>موقعك جاهز</h3>
          <p>تم حفظ إحداثيات موقعك.</p>
          <p>سيتم ربطها بمواقيت الصلاة في الخطوة القادمة.</p>
        </div>
      `;
    },
    error => {
      const messages = {
        1: "رفضت إذن الموقع. يمكنك اختيار مدينتك يدوياً لاحقاً.",
        2: "تعذر تحديد موقعك. حاول مرة أخرى.",
        3: "انتهت مهلة تحديد الموقع. حاول مجدداً."
      };

      status.textContent = messages[error.code] || "حدث خطأ أثناء تحديد الموقع.";
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

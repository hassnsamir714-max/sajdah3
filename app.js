
const sections = {
  prayers: ["مواقيت الصلاة", "سيتم ربط المواقيت بحسابات دقيقة."],
  quran: ["القرآن الكريم", "سيتم إضافة القرآن كاملاً."],
  adhkar: ["الأذكار", "أذكار الصباح والمساء وبعد الصلاة."],
  qibla: ["اتجاه القبلة", "سيتم إضافة بوصلة القبلة."]
};

function showSection(name) {
  const content = document.getElementById("content");

  if (name === "tasbeeh") {
    let count = Number(localStorage.getItem("sajdah-tasbeeh") || 0);

    content.innerHTML = `
      <h2>المسبحة الإلكترونية</h2>
      <p>عدد التسبيحات: <strong id="count">${count}</strong></p>
      <button id="tasbeeh-button">سبحان الله</button>
      <button id="reset-button">تصفير العداد</button>
    `;

    document.getElementById("tasbeeh-button").onclick = () => {
      count++;
      localStorage.setItem("sajdah-tasbeeh", count);
      document.getElementById("count").textContent = count;
    };

    document.getElementById("reset-button").onclick = () => {
      count = 0;
      localStorage.setItem("sajdah-tasbeeh", 0);
      document.getElementById("count").textContent = count;
    };
    return;
  }

  if (name === "qada") {
    const prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
    let data = JSON.parse(localStorage.getItem("sajdah-qada") || "{}");

    content.innerHTML = `
      <h2>قضاء الصلوات</h2>
      <p>سجّل عدد الصلوات المتبقية عليك لكل صلاة.</p>
      <div id="qada-list"></div>
      <h3 id="qada-total"></h3>
    `;

    const list = document.getElementById("qada-list");

    prayers.forEach(prayer => {
      const value = Math.max(0, Number(data[prayer] || 0));

      const row = document.createElement("div");
      row.style.cssText = "padding:12px 0;border-bottom:1px solid #355642";

      const title = document.createElement("strong");
      title.textContent = prayer;

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "100000";
      input.value = value;
      input.style.cssText = "width:85px;margin:0 12px;padding:8px;border-radius:8px";

      const done = document.createElement("button");
      done.textContent = "قضيت صلاة";
      done.style.padding = "8px";

      input.onchange = () => {
        data[prayer] = Math.min(100000, Math.max(0, Math.floor(Number(input.value) || 0)));
        input.value = data[prayer];
        save();
      };

      done.onclick = () => {
        data[prayer] = Math.max(0, Number(data[prayer] || 0) - 1);
        input.value = data[prayer];
        save();
      };

      row.append(title, input, done);
      list.appendChild(row);
    });

    function save() {
      localStorage.setItem("sajdah-qada", JSON.stringify(data));
      const total = prayers.reduce((sum, prayer) => sum + Number(data[prayer] || 0), 0);
      document.getElementById("qada-total").textContent = "المجموع المتبقي: " + total;
    }

    save();
    return;
  }

  if (sections[name]) {
    content.innerHTML = `
      <h2>${sections[name][0]}</h2>
      <p>${sections[name][1]}</p>
    `;
  }
}

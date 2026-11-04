
const content = document.getElementById("content");

const sections = {
  prayers: ["🕌 مواقيت الصلاة", "سيتم ربط مواقيت الصلاة بحسابات دقيقة."],
  quran: ["📖 القرآن الكريم", "قريباً: القرآن الكريم مع الفهرس والعلامات المرجعية."],
  adhkar: ["🤲 الأذكار", "قريباً: أذكار الصباح والمساء وبعد الصلاة."],
  qibla: ["🧭 اتجاه القبلة", "سيتم إضافة بوصلة القبلة."],
};

function goHome() {
  content.innerHTML = `
    <h2>أهلاً بك في سجدة</h2>
    <p>اختر الخدمة التي تريدها، واجعل يومك عامراً بالذكر.</p>
  `;
  setActive(null);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setActive(name) {
  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.classList.remove("active");
  });

  const buttons = [...document.querySelectorAll(".bottom-nav button")];
  const index = {
    home: 0,
    quran: 1,
    tasbeeh: 2,
    adhkar: 3,
    qada: 4
  }[name];

  if (index !== undefined && buttons[index]) {
    buttons[index].classList.add("active");
  }
}

function showSection(name) {
  if (name === "home") return goHome();

  setActive(name);

  if (name === "tasbeeh") {
    showTasbeeh();
    return;
  }

  if (name === "qada") {
    showQada();
    return;
  }

  if (sections[name]) {
    content.innerHTML = `
      <h2>${sections[name][0]}</h2>
      <p>${sections[name][1]}</p>
    `;
  }
}

function showTasbeeh() {
  let count = Number(localStorage.getItem("sajdah-tasbeeh") || 0);

  content.innerHTML = `
    <h2>📿 المسبحة الإلكترونية</h2>
    <p>عدد التسبيحات</p>
    <div class="tasbeeh-count" id="count">${count}</div>
    <button id="tasbeeh-button">سبحان الله</button>
    <button id="reset-button">إعادة العداد</button>
  `;

  document.getElementById("tasbeeh-button").onclick = () => {
    count++;
    localStorage.setItem("sajdah-tasbeeh", count);
    document.getElementById("count").textContent = count;
  };

  document.getElementById("reset-button").onclick = () => {
    if (!confirm("هل تريد تصفير العداد؟")) return;
    count = 0;
    localStorage.setItem("sajdah-tasbeeh", count);
    document.getElementById("count").textContent = count;
  };
}

function showQada() {
  const prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

  let data;
  try {
    data = JSON.parse(localStorage.getItem("sajdah-qada") || "{}");
  } catch {
    data = {};
  }

  content.innerHTML = `
    <h2>📋 قضاء الصلوات</h2>
    <p>سجّل الأعداد التي تريد متابعتها.</p>
    <div id="qada-list"></div>
    <h3 id="qada-total"></h3>
  `;

  const list = document.getElementById("qada-list");

  prayers.forEach(prayer => {
    const row = document.createElement("div");
    row.style.cssText = "padding:14px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap";

    const title = document.createElement("strong");
    title.textContent = prayer;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "100000";
    input.value = Math.max(0, Number(data[prayer] || 0));
    input.style.width = "75px";
    input.style.padding = "8px";
    input.style.borderRadius = "8px";

    const done = document.createElement("button");
    done.textContent = "تم القضاء";

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

    const total = prayers.reduce(
      (sum, prayer) => sum + Math.max(0, Number(data[prayer] || 0)),
      0
    );

    document.getElementById("qada-total").textContent =
      `المجموع المتبقي: ${total}`;
  }

  save();
}

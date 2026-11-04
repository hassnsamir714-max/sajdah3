
const sections = {
  prayers: {
    title: "مواقيت الصلاة",
    text: "سيتم ربط مواقيت الصلاة بالحسابات الدقيقة حسب موقعك."
  },
  qada: {
    title: "قضاء الصلوات",
    text: "تابع الصلوات التي تريد قضاءها وسجّل إنجازك."
  },
  quran: {
    title: "القرآن الكريم",
    text: "القرآن الكريم سيكون متاحاً للقراءة والحفظ."
  },
  adhkar: {
    title: "الأذكار",
    text: "أذكار الصباح والمساء وبعد الصلاة."
  },
  tasbeeh: {
    title: "المسبحة الإلكترونية",
    text: "اضغط على الزر للتسبيح."
  },
  qibla: {
    title: "اتجاه القبلة",
    text: "سيتم إضافة بوصلة القبلة في تحديث قادم."
  }
};

function showSection(name) {
  const section = sections[name];
  if (!section) return;

  const content = document.getElementById("content");

  if (name === "tasbeeh") {
    let count = Number(localStorage.getItem("sajdah-tasbeeh") || 0);

    content.innerHTML = `
      <h2>${section.title}</h2>
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

  content.innerHTML = `
    <h2>${section.title}</h2>
    <p>${section.text}</p>
  `;
}

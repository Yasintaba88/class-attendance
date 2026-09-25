const db = supabaseClient;

// ===============================
// تنظیمات
// ===============================

const MAX_STUDENTS = 29;

//
const PASSWORD = "19121912";

let settings = {
  start: "08:00",
  end: "08:30",
  open: true
};

let students = [];

// ===============================
// ابزارها
// ===============================

function today() {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function toMin(time) {
  if (!time) return 0;

  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;
}

function nowMin() {
  const d = new Date();

  return d.getHours() * 60 + d.getMinutes();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toast(message) {
  const element = document.getElementById("toast");

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  element.classList.remove("hidden");

  setTimeout(() => {
    element.classList.add("hidden");
  }, 3000);
}

// ===============================
// لینک دانش‌آموز
// ===============================

function getStudentLink() {
  const url = new URL("student.html", window.location.href);
  return url.href;
}

function renderStudentLink() {
  const element = document.getElementById("studentLink");

  if (!element) return;

  element.textContent = getStudentLink();
}

// ===============================
// دریافت تنظیمات
// ===============================

async function loadSettings() {
  const { data, error } = await db
    .from("attendance_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Settings error:", error);
    toast("خطا در دریافت تنظیمات حضور");
    return;
  }

  if (data) {
    settings.start = data.start_time || "08:00";
    settings.end = data.end_time || "08:30";
    settings.open = data.is_open ?? true;
  }

  renderSettings();
}

// ===============================
// دریافت دانش‌آموزان
// ===============================

async function loadStudents() {
  const { data, error } = await db
    .from("students")
    .select("id,name,student_number")
    .order("student_number", {
      ascending: true
    });

  if (error) {
    console.error("Students error:", error);
    toast("خطا در دریافت اسامی دانش‌آموزان");
    return;
  }

  students = data || [];

  renderNameInputs();
  renderRecordsFromDatabase();
}

// ===============================
// نمایش تنظیمات
// ===============================

function renderSettings() {
  const start = document.getElementById("start");
  const end = document.getElementById("end");
  const switchButton = document.getElementById("switch");
  const liveStatus = document.getElementById("liveStatus");
  const date = document.getElementById("date");

  if (start) {
    start.value = settings.start;
  }

  if (end) {
    end.value = settings.end;
  }

  if (switchButton) {
    switchButton.textContent = settings.open
      ? "بستن حضور"
      : "باز کردن حضور";

    switchButton.className = settings.open
      ? "danger"
      : "secondary";
  }

  const current = nowMin();

  const live =
    settings.open &&
    current >= toMin(settings.start) &&
    current <= toMin(settings.end);

  if (liveStatus) {
    liveStatus.className =
      "status " + (live ? "open" : "closed");

    liveStatus.textContent = live
      ? "🟢 پنجره حضور باز است"
      : "🔴 پنجره حضور بسته است";
  }

  if (date) {
    date.textContent =
      "امروز: " +
      new Date().toLocaleDateString("fa-IR");
  }

  renderStudentLink();
}

// ===============================
// ساخت ۲۹ کادر اسم
// ===============================

function renderNameInputs() {
  const box = document.getElementById("names");

  if (!box) {
    console.error("Element #names not found");
    return;
  }

  box.innerHTML = "";

  for (let i = 1; i <= MAX_STUDENTS; i++) {
    const student = students.find(
      item => Number(item.student_number) === i
    );

    const name = student ? student.name : "";

    const item = document.createElement("div");

    item.className = "name-item";

    item.innerHTML = `
      <span>${i}.</span>

      <input
        type="text"
        data-number="${i}"
        value="${escapeHtml(name)}"
        placeholder="نام دانش‌آموز شماره ${i}"
      >
    `;

    box.appendChild(item);
  }
}

// ===============================
// دریافت گزارش حضور
// ===============================

async function loadRecordsFromDatabase() {
  const { data, error } = await db
    .from("attendance")
    .select(`
      id,
      student_id,
      attendance_time,
      status,
      delay_minutes
    `)
    .eq("attendance_date", today());

  if (error) {
    console.error("Attendance error:", error);
    toast("خطا در دریافت گزارش حضور");
    return [];
  }

  return data || [];
}

// ===============================
// نمایش گزارش حضور
// ===============================

async function renderRecordsFromDatabase() {
  const records = await loadRecordsFromDatabase();

  const list = document.getElementById("list");

  if (!list) return;

  list.innerHTML = "";

  let present = 0;
  let late = 0;

  for (let i = 1; i <= MAX_STUDENTS; i++) {
    const student = students.find(
      item => Number(item.student_number) === i
    );

    const name = student
      ? student.name
      : `دانش‌آموز ${i}`;

    let record = null;

    if (student) {
      record = records.find(
        item =>
          Number(item.student_id) ===
          Number(student.id)
      );
    }

    let className = "notset";
    let text = "ثبت نشده";

    if (record) {
      if (Number(record.delay_minutes) > 0) {
        late++;

        className = "late";

        text =
          `تأخیر ${record.delay_minutes} دقیقه`;
      } else {
        present++;

        className = "present";

        const time =
          new Date(record.attendance_time)
            .toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit"
            });

        text = `حضور • ${time}`;
      }
    }

    const row = document.createElement("div");

    row.className = "student-row";

    row.innerHTML = `
      <b>${escapeHtml(name)}</b>

      <span class="badge ${className}">
        ${escapeHtml(text)}
      </span>
    `;

    list.appendChild(row);
  }

  const count = document.getElementById("count");

  if (count) {
    const registered = present + late;
    const notRegistered =
      MAX_STUDENTS - registered;

    count.textContent =
      `حاضر: ${present} | تأخیر: ${late} | ثبت‌نشده: ${notRegistered}`;
  }
}

// ===============================
// ورود معلم
// ===============================

const loginButton =
  document.getElementById("loginBtn");

if (loginButton) {
  loginButton.addEventListener("click", async () => {
    const entered =
      document.getElementById("pass").value;

    if (entered !== PASSWORD) {
      toast("رمز پنل اشتباه است.");
      return;
    }

    document
      .getElementById("login")
      .classList.add("hidden");

    document
      .getElementById("dashboard")
      .classList.remove("hidden");

    toast("ورود موفق بود.");

    await loadStudents();
    await loadSettings();

    renderNameInputs();
    renderStudentLink();
  });
}

// ===============================
// ذخیره زمان
// ===============================

const saveTimeButton =
  document.getElementById("saveTime");

if (saveTimeButton) {
  saveTimeButton.addEventListener(
    "click",
    async () => {
      const start =
        document.getElementById("start").value;

      const end =
        document.getElementById("end").value;

      if (!start || !end) {
        toast("لطفاً هر دو ساعت را وارد کنید.");
        return;
      }

      if (toMin(end) < toMin(start)) {
        toast("ساعت پایان نمی‌تواند قبل از شروع باشد.");
        return;
      }

      const { error } = await db
        .from("attendance_settings")
        .update({
          start_time: start,
          end_time: end
        })
        .eq("id", 1);

      if (error) {
        console.error(error);
        toast("ذخیره زمان انجام نشد.");
        return;
      }

      settings.start = start;
      settings.end = end;

      renderSettings();

      toast("زمان حضور ذخیره شد.");
    }
  );
}

// ===============================
// باز / بسته کردن حضور
// ===============================

const switchButton =
  document.getElementById("switch");

if (switchButton) {
  switchButton.addEventListener(
    "click",
    async () => {
      const newState = !settings.open;

      const { error } = await db
        .from("attendance_settings")
        .update({
          is_open: newState
        })
        .eq("id", 1);

      if (error) {
        console.error(error);
        toast("تغییر وضعیت انجام نشد.");
        return;
      }

      settings.open = newState;

      renderSettings();

      toast(
        newState
          ? "حضور و غیاب باز شد."
          : "حضور و غیاب بسته شد."
      );
    }
  );
}

// ===============================
// ذخیره ۲۹ اسم
// ===============================

const saveNamesButton =
  document.getElementById("saveNames");

if (saveNamesButton) {
  saveNamesButton.addEventListener(
    "click",
    async () => {
      const inputs =
        document.querySelectorAll(
          "#names input"
        );

      if (inputs.length !== MAX_STUDENTS) {
        renderNameInputs();
        toast("۲۹ کادر نام آماده شد.");
        return;
      }

      saveNamesButton.disabled = true;
      saveNamesButton.textContent = "در حال ذخیره...";

      try {
        const enteredNumbers = [];

        for (const input of inputs) {
          const number =
            Number(input.dataset.number);

          const name =
            input.value.trim();

          if (!name) continue;

          enteredNumbers.push(number);

          const { error } = await db
            .from("students")
            .upsert(
              {
                name: name,
                student_number: number
              },
              {
                onConflict: "student_number"
              }
            );

          if (error) {
            console.error(error);

            toast(
              `خطا در ذخیره دانش‌آموز شماره ${number}`
            );

            return;
          }
        }

        // حذف نام‌هایی که پاک شده‌اند
        for (const student of students) {
          const number =
            Number(student.student_number);

          if (!enteredNumbers.includes(number)) {
            const { error } = await db
              .from("students")
              .delete()
              .eq("id", student.id);

            if (error) {
              console.error(error);
              toast("خطا در حذف نام خالی.");
              return;
            }
          }
        }

        await loadStudents();

        toast("✅ نام دانش‌آموزان ذخیره شد.");
      } finally {
        saveNamesButton.disabled = false;
        saveNamesButton.textContent =
          "ذخیره نام‌ها";
      }
    }
  );
}

// ===============================
// پاک‌سازی حضور امروز
// ===============================

const resetButton =
  document.getElementById("reset");

if (resetButton) {
  resetButton.addEventListener(
    "click",
    async () => {
      const ok = confirm(
        "آیا مطمئن هستید که حضورهای امروز پاک شوند؟"
      );

      if (!ok) return;

      const { error } = await db
        .from("attendance")
        .delete()
        .eq("attendance_date", today());

      if (error) {
        console.error(error);
        toast("پاک‌سازی انجام نشد.");
        return;
      }

      await renderRecordsFromDatabase();

      toast("حضورهای امروز پاک شدند.");
    }
  );
}

// ===============================
// کپی لینک دانش‌آموز
// ===============================

const copyLinkButton =
  document.getElementById("copyLink");

if (copyLinkButton) {
  copyLinkButton.addEventListener(
    "click",
    async () => {
      const link = getStudentLink();

      try {
        await navigator.clipboard.writeText(link);

        toast("✅ لینک دانش‌آموزان کپی شد.");
      } catch (error) {
        console.error(error);

        // روش جایگزین برای گوشی
        const textarea =
          document.createElement("textarea");

        textarea.value = link;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        toast("✅ لینک کپی شد.");
      }
    }
  );
}

// ===============================
// شروع اولیه
// ===============================

renderStudentLink();

// ===============================
// بروزرسانی خودکار
// ===============================

setInterval(async () => {
  if (
    document
      .getElementById("dashboard")
      ?.classList.contains("hidden")
  ) {
    return;
  }

  await loadSettings();
  await loadStudents();
  await renderRecordsFromDatabase();

}, 15000);

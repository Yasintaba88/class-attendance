const db = supabaseClient;

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const toast = (msg) => {
  const e = document.getElementById("toast");
  e.textContent = msg;
  e.classList.remove("hidden");

  setTimeout(() => {
    e.classList.add("hidden");
  }, 2600);
};


// ===============================
// تنظیمات اولیه
// ===============================

let settings = {
  start: "08:00",
  end: "08:30",
  open: true
};

let students = [];

const MAX_STUDENTS = 29;


// ===============================
// دریافت تنظیمات حضور
// ===============================

async function loadSettings() {

  const { data, error } = await db
    .from("attendance_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(error);
    toast("خطا در دریافت تنظیمات حضور");
    return;
  }

  if (data) {
    settings = {
      start: data.start_time || "08:00",
      end: data.end_time || "08:30",
      open: data.is_open ?? true
    };
  }

  render();
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
    console.error(error);
    toast("خطا در دریافت اسامی دانش‌آموزان");
    return;
  }

  students = data || [];

  render();
}


// ===============================
// نمایش پنل
// ===============================

function render() {

  const start = document.getElementById("start");
  const end = document.getElementById("end");

  if (start) start.value = settings.start;
  if (end) end.value = settings.end;


  const switchBtn =
    document.getElementById("switch");

  if (switchBtn) {

    switchBtn.textContent =
      settings.open
        ? "بستن حضور"
        : "باز کردن حضور";

    switchBtn.className =
      settings.open
        ? "danger"
        : "";
  }


  const current = nowMin();

  const live =
    settings.open &&
    current >= toMin(settings.start) &&
    current <= toMin(settings.end);


  const liveStatus =
    document.getElementById("liveStatus");

  if (liveStatus) {

    liveStatus.className =
      "status " + (live ? "open" : "closed");

    liveStatus.textContent =
      live
        ? "🟢 پنجره حضور باز است"
        : "🔴 پنجره حضور بسته است";
  }


  const date =
    document.getElementById("date");

  if (date) {

    date.textContent =
      "امروز: " +
      new Date().toLocaleDateString("fa-IR");
  }


  const link =
    document.getElementById("studentLink");

  if (link) {

    link.textContent =
      location.href
        .replace("teacher.html", "student.html");
  }


  renderNameInputs();
}


// ===============================
// ساخت ۲۹ جای نام
// ===============================

function renderNameInputs() {

  const box =
    document.getElementById("names");

  if (!box) return;

  box.innerHTML = "";

  for (let i = 1; i <= MAX_STUDENTS; i++) {

    const student =
      students.find(
        s => Number(s.student_number) === i
      );

    const name =
      student ? student.name : "";

    const item =
      document.createElement("div");

    item.className = "name-item";

    item.innerHTML = `
      <span>${i}.</span>
      <input
        data-number="${i}"
        value="${escapeHtml(name)}"
        placeholder="نام دانش‌آموز"
      >
    `;

    box.appendChild(item);
  }
}


// جلوگیری از ورود HTML داخل نام
function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ===============================
// گزارش حضور امروز
// ===============================

async function loadRecords() {

  const { data, error } = await db
    .from("attendance")
    .select(`
      id,
      student_id,
      attendance_time,
      status,
      delay_minutes,
      students (
        id,
        name,
        student_number
      )
    `)
    .eq("attendance_date", today());

  if (error) {

    console.error(error);

    toast("خطا در دریافت گزارش حضور");

    return;
  }

  renderRecords(data || []);
}


// ===============================
// نمایش گزارش
// ===============================

function renderRecords(records) {

  const list =
    document.getElementById("list");

  if (!list) return;

  list.innerHTML = "";

  let present = 0;
  let late = 0;


  for (let i = 1; i <= MAX_STUDENTS; i++) {

    const student =
      students.find(
        s => Number(s.student_number) === i
      );

    const name =
      student
        ? student.name
        : `دانش‌آموز ${i}`;


    const record =
      student
        ? records.find(
            r =>
              Number(r.student_id) ===
              Number(student.id)
          )
        : null;


    let cls = "notset";
    let text = "ثبت نشده";


    if (record) {

      if (Number(record.delay_minutes) > 0) {

        late++;

        cls = "late";

        text =
          `تأخیر ${record.delay_minutes} دقیقه`;
      }

      else {

        present++;

        cls = "present";

        const time =
          new Date(record.attendance_time)
            .toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit"
            });

        text =
          `حضور • ${time}`;
      }
    }


    const row =
      document.createElement("div");

    row.className = "student-row";

    row.innerHTML = `
      <b>${escapeHtml(name)}</b>
      <span class="badge ${cls}">
        ${text}
      </span>
    `;

    list.appendChild(row);
  }


  const count =
    document.getElementById("count");

  if (count) {

    const registered =
      present + late;

    const notRegistered =
      MAX_STUDENTS - registered;

    count.textContent =
      `حاضر: ${present} | تأخیر: ${late} | ثبت‌نشده: ${notRegistered}`;
  }
}


// ===============================
// ورود معلم
// ===============================

document
  .getElementById("loginBtn")
  .onclick = () => {

    /*
      رمز فعلی را در کد قبلی خودت نگه داشتی.
      برای امنیت، رمز واقعی را در پاسخ تکرار نمی‌کنم.
      
      مقدار داخل PASSWORD را با همان رمز قبلی خودت
      در نسخه‌ای که در GitHub می‌گذاری قرار بده.
    */

    const PASSWORD = "رمز_قبلی_خودت";

    const entered =
      document.getElementById("pass").value;


    if (entered === PASSWORD) {

      document
        .getElementById("login")
        .classList.add("hidden");

      document
        .getElementById("dashboard")
        .classList.remove("hidden");

      loadStudents();
      loadSettings();
      loadRecords();

    } else {

      toast("رمز پنل اشتباه است.");
    }
  };


// ===============================
// ذخیره زمان حضور
// ===============================

document
  .getElementById("saveTime")
  .onclick = async () => {

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

    render();

    toast("زمان حضور ذخیره شد.");
  };


// ===============================
// باز / بسته کردن حضور
// ===============================

document
  .getElementById("switch")
  .onclick = async () => {

    const newState =
      !settings.open;


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

    render();

    toast(
      newState
        ? "حضور و غیاب باز شد."
        : "حضور و غیاب بسته شد."
    );
  };


// ===============================
// ذخیره نام‌ها
// ===============================

document
  .getElementById("saveNames")
  .onclick = async () => {

    const inputs =
      document.querySelectorAll(
        "#names input"
      );


    const enteredNumbers = [];


    for (const input of inputs) {

      const number =
        Number(input.dataset.number);

      const name =
        input.value.trim();


      if (name) {

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
    }


    // حذف جایگاه‌هایی که نامشان پاک شده است

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
    await loadRecords();

    toast("نام دانش‌آموزان ذخیره شد.");
  };


// ===============================
// پاک‌سازی حضور امروز
// ===============================

document
  .getElementById("reset")
  .onclick = async () => {

    const ok =
      confirm(
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


    await loadRecords();

    toast("حضورهای امروز پاک شدند.");
  };


// ===============================
// کپی لینک دانش‌آموزان
// ===============================

document
  .getElementById("copyLink")
  .onclick = async () => {

    const link =
      location.href
        .replace("teacher.html", "student.html");


    try {

      await navigator.clipboard.writeText(link);

      toast("لینک دانش‌آموزان کپی شد.");

    } catch {

      toast("کپی لینک انجام نشد.");
    }
  };


// ===============================
// به‌روزرسانی خودکار
// ===============================

setInterval(() => {

  loadSettings();
  loadStudents();
  loadRecords();

}, 15000);

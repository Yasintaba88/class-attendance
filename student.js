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

let settings = {
  start: "08:00",
  end: "08:30",
  open: true
};

let students = [];


// ===============================
// نمایش تاریخ و وضعیت حضور
// ===============================

function render() {

  document.getElementById("date").textContent =
    "امروز: " + new Date().toLocaleDateString("fa-IR");

  document.getElementById("window").textContent =
    `${settings.start} تا ${settings.end}`;

  const current = nowMin();

  const isOpen =
    settings.open &&
    current >= toMin(settings.start) &&
    current <= toMin(settings.end);

  const status = document.getElementById("status");

  status.className =
    "status " + (isOpen ? "open" : "closed");

  status.textContent =
    isOpen
      ? "🟢 حضور و غیاب باز است"
      : "🔴 حضور و غیاب بسته است";
}


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
// دریافت نام دانش‌آموزان
// ===============================

async function loadStudents() {

  const { data, error } = await db
    .from("students")
    .select("id,name,student_number")
    .order("student_number", { ascending: true });

  if (error) {
    console.error(error);
    toast("خطا در دریافت اسامی دانش‌آموزان");
    return;
  }

  students = data || [];

  const select = document.getElementById("name");

  select.innerHTML =
    '<option value="">انتخاب نام</option>';

  students.forEach((student) => {

    const option = document.createElement("option");

    option.value = student.id;
    option.textContent = student.name;

    select.appendChild(option);

  });
}


// ===============================
// بررسی حضور ثبت‌شده
// ===============================

async function checkMyAttendance() {

  const studentId =
    document.getElementById("name").value;

  const box =
    document.getElementById("myStatus");

  if (!studentId) {

    box.className = "status notset";
    box.textContent =
      "هنوز حضور شما ثبت نشده است";

    return;
  }

  const { data, error } = await db
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .eq("attendance_date", today())
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) {

    box.className = "status notset";
    box.textContent =
      "هنوز حضور شما ثبت نشده است";

    return;
  }

  if (data.delay_minutes > 0) {

    box.className = "status late";

    box.textContent =
      `🟠 حضور ثبت شد — ${data.delay_minutes} دقیقه تأخیر`;

  } else {

    const time =
      new Date(data.attendance_time)
        .toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit"
        });

    box.className = "status present";

    box.textContent =
      `✅ حضور شما ثبت شد — ${time}`;
  }
}


// ===============================
// انتخاب دانش‌آموز
// ===============================

document.getElementById("name").addEventListener(
  "change",
  checkMyAttendance
);


// ===============================
// ثبت حضور
// ===============================

document.getElementById("submit").onclick =
  async () => {

    const studentId =
      document.getElementById("name").value;

    if (!studentId) {

      toast("لطفاً نام خود را انتخاب کنید.");

      return;
    }

    await loadSettings();

    const current = nowMin();

    const start = toMin(settings.start);
    const end = toMin(settings.end);

    if (
      !settings.open ||
      current < start ||
      current > end
    ) {

      toast(
        "در حال حاضر زمان ثبت حضور باز نیست."
      );

      return;
    }


    // جلوگیری از ثبت دوباره

    const { data: existing, error: checkError } =
      await db
        .from("attendance")
        .select("id")
        .eq("student_id", studentId)
        .eq("attendance_date", today())
        .maybeSingle();

    if (checkError) {

      console.error(checkError);

      toast("خطا در بررسی حضور.");

      return;
    }

    if (existing) {

      toast("حضور شما قبلاً ثبت شده است.");

      await checkMyAttendance();

      return;
    }


    // محاسبه تأخیر

    const delayMinutes =
      Math.max(0, current - start);


    // ثبت در Supabase

    const { error } = await db
      .from("attendance")
      .insert({
        student_id: Number(studentId),
        attendance_date: today(),
        status: delayMinutes > 0
          ? "late"
          : "present",
        delay_minutes: delayMinutes
      });


    if (error) {

      console.error(error);

      toast(
        "ثبت حضور انجام نشد. اتصال دیتابیس را بررسی کنید."
      );

      return;
    }


    toast(
      delayMinutes > 0
        ? `حضور ثبت شد؛ ${delayMinutes} دقیقه تأخیر داشتید.`
        : "حضور شما با موفقیت ثبت شد."
    );

    await checkMyAttendance();
  };


// ===============================
// شروع برنامه
// ===============================

async function startApp() {

  await loadStudents();

  await loadSettings();

  await checkMyAttendance();

  render();
}

startApp();


// به‌روزرسانی وضعیت هر 15 ثانیه

setInterval(() => {

  loadSettings();

  checkMyAttendance();

}, 15000);

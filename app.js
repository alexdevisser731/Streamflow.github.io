// --- State & storage ---

let habits = JSON.parse(localStorage.getItem("streamflow_habits") || "[]");
let completions = JSON.parse(localStorage.getItem("streamflow_completions") || "{}");
// completions[date][habitId] = count

function saveState() {
  localStorage.setItem("streamflow_habits", JSON.stringify(habits));
  localStorage.setItem("streamflow_completions", JSON.stringify(completions));
}

// --- Helpers ---

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function getCompletion(habit, date = new Date()) {
  const key = todayStr(date);
  const dayData = completions[key] || {};
  return dayData[habit.id] || 0;
}

function addCompletion(habit, amount = 1, date = new Date()) {
  const key = todayStr(date);
  if (!completions[key]) completions[key] = {};
  completions[key][habit.id] = (completions[key][habit.id] || 0) + amount;
  saveState();
}

// --- UI references ---

const habitListEl = document.getElementById("habit-list");
const emptyHomeEl = document.getElementById("empty-home");

const overallRateEl = document.getElementById("overall-rate");
const overallRateBigEl = document.getElementById("overall-rate-big");
const bestStreakEl = document.getElementById("best-streak");
const perfectDaysEl = document.getElementById("perfect-days");

const addBtn = document.getElementById("add-btn");
const sheetBackdrop = document.getElementById("sheet-backdrop");
const sheet = document.getElementById("habit-sheet");
const sheetClose = document.getElementById("sheet-close");
const sheetTitle = document.getElementById("sheet-title");
const saveBtn = document.getElementById("habit-save");

// Form fields
const fTitle = document.getElementById("habit-title");
const fDesc = document.getElementById("habit-desc");
const fEmoji = document.getElementById("habit-emoji");
const fColor = document.getElementById("habit-color");
const fCategory = document.getElementById("habit-category");
const fType = document.getElementById("habit-type");
const fPeriod = document.getElementById("habit-period");
const fGoal = document.getElementById("habit-goal");
const fUnit = document.getElementById("habit-unit");
const fGoalPeriodLabel = document.getElementById("habit-goal-period-label");
const weekdayRow = document.getElementById("weekday-row");
const timeRangeRow = document.getElementById("time-range-row");
const fReminder = document.getElementById("habit-reminder");
const fMemo = document.getElementById("habit-memo");
const fStart = document.getElementById("habit-start");
const fEnd = document.getElementById("habit-end");

let editingHabitId = null;

// --- Filters ---

let filterStatus = "all";
let filterTime = "all";
let filterCat = "all";

document.querySelectorAll("[data-status]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-status]").forEach(b => b.classList.remove("chip-active"));
    btn.classList.add("chip-active");
    filterStatus = btn.getAttribute("data-status");
    render();
  });
});

document.querySelectorAll("[data-time]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-time]").forEach(b => b.classList.remove("chip-active"));
    btn.classList.add("chip-active");
    filterTime = btn.getAttribute("data-time");
    render();
  });
});

document.querySelectorAll(".cat-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-chip").forEach(b => b.classList.remove("cat-active"));
    btn.classList.add("cat-active");
    filterCat = btn.getAttribute("data-cat");
    render();
  });
});

// --- Sheet open/close ---

function openSheet(habit = null) {
  document.body.classList.add("sheet-open");
  editingHabitId = habit ? habit.id : null;
  sheetTitle.textContent = habit ? "Habit bewerken" : "Nieuwe habit";

  const today = todayStr();
  fStart.value = today;

  if (habit) {
    fTitle.value = habit.title;
    fDesc.value = habit.desc || "";
    fEmoji.value = habit.emoji || "";
    fColor.value = habit.color || "#2a6df4";
    fCategory.value = habit.category || "other";
    fType.value = habit.type || "build";
    fPeriod.value = habit.period || "daily";
    fGoal.value = habit.goal || 1;
    fUnit.value = habit.unit || "count";
    fReminder.checked = !!habit.reminder;
    fMemo.checked = habit.memo !== false;
    fStart.value = habit.start || today;
    fEnd.value = habit.end || "";

    weekdayRow.querySelectorAll("button").forEach(btn => {
      const d = parseInt(btn.getAttribute("data-day"), 10);
      btn.classList.toggle("active", habit.days?.includes(d));
    });

    timeRangeRow.querySelectorAll("button").forEach(btn => {
      const r = btn.getAttribute("data-range");
      btn.classList.toggle("chip-active", habit.timeRange === r);
    });
  } else {
    fTitle.value = "";
    fDesc.value = "";
    fEmoji.value = "";
    fColor.value = "#2a6df4";
    fCategory.value = "water";
    fType.value = "build";
    fPeriod.value = "daily";
    fGoal.value = 1;
    fUnit.value = "count";
    fReminder.checked = false;
    fMemo.checked = true;
    fStart.value = today;
    fEnd.value = "";

    weekdayRow.querySelectorAll("button").forEach(btn => {
      const d = parseInt(btn.getAttribute("data-day"), 10);
      btn.classList.toggle("active", [1,2,3,4,5].includes(d)); // standaard ma-vr
    });

    timeRangeRow.querySelectorAll("button").forEach(btn => {
      btn.classList.toggle("chip-active", btn.getAttribute("data-range") === "anytime");
    });
  }

  updateGoalPeriodLabel();
}

function closeSheet() {
  document.body.classList.remove("sheet-open");
}

sheetBackdrop.addEventListener("click", closeSheet);
sheetClose.addEventListener("click", closeSheet);
addBtn.addEventListener("click", () => openSheet());

// Weekdays select
weekdayRow.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
  });
});

// Time range select
timeRangeRow.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    timeRangeRow.querySelectorAll("button").forEach(b => b.classList.remove("chip-active"));
    btn.classList.add("chip-active");
  });
});

// Period label
function updateGoalPeriodLabel() {
  const p = fPeriod.value;
  fGoalPeriodLabel.textContent = p === "daily" ? "Day" : p === "weekly" ? "Week" : "Month";
}
fPeriod.addEventListener("change", updateGoalPeriodLabel);

// Save habit
saveBtn.addEventListener("click", () => {
  const title = fTitle.value.trim();
  if (!fStart.value) fStart.value = todayStr();
  if (!title) {
    alert("Geef een titel op.");
    return;
  }
  if (!fStart.value) fStart.value = todayStr();


  const days = [];
  weekdayRow.querySelectorAll("button.active").forEach(btn => {
    days.push(parseInt(btn.getAttribute("data-day"), 10));
  });

  const timeRangeBtn = timeRangeRow.querySelector("button.chip-active");
  const timeRange = timeRangeBtn ? timeRangeBtn.getAttribute("data-range") : "anytime";

  const habitData = {
    id: editingHabitId || Date.now().toString(),
    title,
    desc: fDesc.value.trim(),
    emoji: fEmoji.value || "✅",
    color: fColor.value,
    category: fCategory.value,
    type: fType.value, // build of quit
    period: fPeriod.value,
    goal: parseInt(fGoal.value, 10) || 1,
    unit: fUnit.value,
    days,
    timeRange,
    reminder: fReminder.checked,
    memo: fMemo.checked,
    start: fStart.value ? fStart.value : todayStr(),
    end: fEnd.value || ""
  };

  const idx = habits.findIndex(h => h.id === habitData.id);
  if (idx >= 0) {
    habits[idx] = habitData;
  } else {
    habits.push(habitData);
  }

  saveState();
  closeSheet();
  render();
});

// --- Logic: applies today ---

function habitAppliesToday(habit, date = new Date()) {
  const day = date.getDay();
  if (habit.days && habit.days.length && !habit.days.includes(day)) return false;

  const today = todayStr(date);
  if (habit.start && today < habit.start) return false;
  if (habit.end && today > habit.end) return false;

  return true;
}

// --- Logic: success & percentage (build vs quit) ---

function computeProgress(habit, done) {
  const goal = habit.goal || 1;

  if (habit.type === "build") {
    const pct = Math.min(100, Math.round((done / goal) * 100));
    const met = done >= goal;
    return { pct, met };
  } else {
    // quit: minder is beter, alles <= goal is gehaald
    const capped = Math.min(done, goal);
    const pct = Math.round(((goal - capped) / goal) * 100); // 0 cups = 100%, goal cups = 0%
    const met = done <= goal;
    return { pct, met };
  }
}

// --- Rendering habits (home) ---

function renderHabits() {
  habitListEl.innerHTML = "";

  const today = new Date();

  let totalGoals = 0;
  let totalScore = 0; // voor overall rate

  const visibleHabits = habits.filter(habit => {
    if (!habitAppliesToday(habit, today)) return false;
    if (filterCat !== "all" && habit.category !== filterCat) return false;
    return true;
  });

  if (visibleHabits.length === 0) {
    emptyHomeEl.style.display = "block";
    overallRateEl.textContent = "0%";
    return;
  } else {
    emptyHomeEl.style.display = "none";
  }

  visibleHabits.forEach(habit => {
    const done = getCompletion(habit, today);
    const goal = habit.goal || 1;

    const { pct, met } = computeProgress(habit, done);

    // filters op status
    if (filterStatus === "unmet" && met) return;
    if (filterStatus === "met" && !met) return;

    totalGoals += 1;
    totalScore += pct;

    const card = document.createElement("div");
    card.className = "habit-card";

    const top = document.createElement("div");
    top.className = "habit-top";

    const left = document.createElement("div");
    left.className = "habit-left";

    const icon = document.createElement("div");
    icon.className = "habit-icon";
    icon.style.background = habit.color;
    icon.textContent = habit.emoji;

    const textWrap = document.createElement("div");
    const titleEl = document.createElement("div");
    titleEl.className = "habit-title";
    titleEl.textContent = habit.title;

    const subEl = document.createElement("div");
    subEl.className = "habit-sub";
    const unitLabel = habit.unit === "min" ? "min" : habit.unit === "drink" ? "drink" : "";
    const goalText = habit.type === "quit" ? `max ${goal}` : `${goal}`;
    subEl.textContent = `${done}/${goalText}${unitLabel ? " " + unitLabel : ""}`;

    textWrap.appendChild(titleEl);
    textWrap.appendChild(subEl);

    left.appendChild(icon);
    left.appendChild(textWrap);

    const right = document.createElement("div");
    right.className = "habit-right";

    const progressEl = document.createElement("div");
    progressEl.className = "habit-progress";
    progressEl.textContent = `${pct}%`;

    const streakEl = document.createElement("div");
    streakEl.className = "habit-streak";
    streakEl.textContent = `🔥 ${computeStreak(habit)} Days`;

    right.appendChild(progressEl);
    right.appendChild(streakEl);

    top.appendChild(left);
    top.appendChild(right);

    const bottom = document.createElement("div");
    bottom.className = "habit-bottom";

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = pct + "%";
    bar.appendChild(fill);

    const slider = document.createElement("input");
slider.type = "range";
slider.min = 0;
slider.max = habit.goal;
slider.value = Math.min(done, habit.goal);
slider.className = "habit-slider";

slider.addEventListener("input", () => {
  const newValue = parseInt(slider.value, 10);
  const key = todayStr(today);

  if (!completions[key]) completions[key] = {};
  completions[key][habit.id] = newValue;

  saveState();
  render();
});

bottom.appendChild(slider);


    card.appendChild(top);
    card.appendChild(bottom);

    card.addEventListener("dblclick", () => openSheet(habit));

    habitListEl.appendChild(card);
  });

  const overall = totalGoals ? Math.round(totalScore / totalGoals) : 0;
  overallRateEl.textContent = overall + "%";
}

// --- Streaks & stats (dashboard) ---

function computeStreak(habit) {
  let streak = 0;
  let date = new Date();

  while (true) {
    if (!habitAppliesToday(habit, date)) break;
    const done = getCompletion(habit, date);
    const { met } = computeProgress(habit, done);
    if (met) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function computeGlobalStats() {
  let best = 0;
  habits.forEach(h => {
    const s = computeStreak(h);
    if (s > best) best = s;
  });
  bestStreakEl.textContent = best + " Days";

  // Perfect days: alle actieve habits gehaald
  let perfect = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = todayStr(d);

    const activeHabits = habits.filter(h => habitAppliesToday(h, d));
    if (!activeHabits.length) continue;

    const dayData = completions[key] || {};
    const allMet = activeHabits.every(h => {
      const done = dayData[h.id] || 0;
      const { met } = computeProgress(h, done);
      return met;
    });

    if (allMet) perfect++;
  }
  perfectDaysEl.textContent = perfect + " Days";

  // Overall rate over laatste 7 dagen
  let totalPct = 0;
  let daysCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const activeHabits = habits.filter(h => habitAppliesToday(h, d));
    if (!activeHabits.length) continue;

    let dayScore = 0;
    activeHabits.forEach(h => {
      const done = getCompletion(h, d);
      const { pct } = computeProgress(h, done);
      dayScore += pct;
    });

    totalPct += dayScore / activeHabits.length;
    daysCount++;
  }

  const overall = daysCount ? Math.round(totalPct / daysCount) : 0;
  overallRateBigEl.textContent = overall + "%";
}

// --- Calendar ---

const calendarTitleEl = document.getElementById("calendar-title");
const calendarGridEl = document.getElementById("calendar-grid");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

let calendarMonth = new Date();

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  calendarTitleEl.textContent = `${String(month + 1).padStart(2, "0")}/${year}`;

  calendarGridEl.innerHTML = "";

  const headers = ["S", "M", "T", "W", "T", "F", "S"];
  headers.forEach(h => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-cell-header";
    cell.textContent = h;
    calendarGridEl.appendChild(cell);
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    calendarGridEl.appendChild(cell);
  }

  const todayStrVal = todayStr();

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-day";
    cell.textContent = d;

    const dateObj = new Date(year, month, d);
    const key = todayStr(dateObj);
    const dayData = completions[key] || {};
    const hasAny = Object.keys(dayData).length > 0;

    if (hasAny) cell.classList.add("calendar-day-has");
    if (key === todayStrVal) cell.classList.add("calendar-day-today");

    calendarGridEl.appendChild(cell);
  }
}

prevMonthBtn.addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
});

// --- Navigation between screens ---

const screenHome = document.getElementById("screen-home");
const screenDashboard = document.getElementById("screen-dashboard");
const filtersHome = document.getElementById("filters-home");
const catsHome = document.getElementById("categories-home");
const filtersDashboard = document.getElementById("filters-dashboard");

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("nav-active"));
    btn.classList.add("nav-active");

    const screen = btn.getAttribute("data-screen");

    if (screen === "home") {
      screenHome.style.display = "block";
      screenDashboard.style.display = "none";
      filtersHome.style.display = "block";
      catsHome.style.display = "flex";
      filtersDashboard.style.display = "none";
      render();
    } else if (screen === "dashboard") {
      screenHome.style.display = "none";
      screenDashboard.style.display = "block";
      filtersHome.style.display = "none";
      catsHome.style.display = "none";
      filtersDashboard.style.display = "block";
      computeGlobalStats();
      renderCalendar();
    } else {
      alert("Dit scherm komt in een volgende versie van Streamflow.");
    }
  });
});

// --- Init ---

function initTopDate() {
  const el = document.getElementById("top-date");
  const d = new Date();
  const options = { weekday: "long", day: "numeric", month: "long" };
  el.textContent = d.toLocaleDateString("nl-NL", options);
}

function render() {
  renderHabits();
}

initTopDate();
render();
renderCalendar();
computeGlobalStats();

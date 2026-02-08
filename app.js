// ---------- Utilities ----------
const today = new Date();

function todayStr(d = today) {
  return d.toISOString().slice(0, 10);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- State ----------
let habits = loadJSON("sf_habits", []);
let completions = loadJSON("sf_completions", {});
let editingId = null;

// ---------- DOM ----------
const habitList = document.getElementById("habit-list");
const addBtn = document.getElementById("add-btn");
const resetBtn = document.getElementById("reset-btn");
const summaryLabel = document.getElementById("summary-label");
const todayLabel = document.getElementById("today-label");
const weekRow = document.getElementById("week-row");

const modal = document.getElementById("habit-modal");
const closeModalBtn = document.getElementById("close-modal");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const modalTitle = document.getElementById("modal-title");

const fTitle = document.getElementById("fTitle");
const fEmoji = document.getElementById("fEmoji");
const fGoal = document.getElementById("fGoal");
const fStart = document.getElementById("fStart");
const daysRow = document.getElementById("days-row");
const timeRangeRow = document.getElementById("time-range-row");
const customTimeWrapper = document.getElementById("custom-time-wrapper");
const fReminderTime = document.getElementById("fReminderTime");
const typeRow = document.getElementById("type-row");

const darkToggle = document.getElementById("dark-toggle");

// ---------- Dark mode ----------
(function initDarkMode() {
  const stored = localStorage.getItem("sf_dark");
  if (stored === "true") {
    document.body.classList.add("dark");
  }
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "sf_dark",
      document.body.classList.contains("dark")
    );
  });
})();

// ---------- Week bar ----------
(function renderWeek() {
  const base = new Date(today);
  const day = base.getDay(); // 0-6
  const mondayOffset = (day + 6) % 7;
  base.setDate(base.getDate() - mondayOffset);

  const labels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const btn = document.createElement("button");
    btn.className = "day-pill";
    btn.textContent = labels[i];
    if (todayStr(d) === todayStr()) {
      btn.classList.add("day-pill-active");
    }
    weekRow.appendChild(btn);
  }

  todayLabel.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
})();

// ---------- Helpers ----------
function getSelectedDays() {
  return Array.from(daysRow.querySelectorAll(".chip-active")).map((b) =>
    parseInt(b.dataset.day, 10)
  );
}

function setSelectedDays(days) {
  Array.from(daysRow.querySelectorAll(".chip")).forEach((b) => {
    const d = parseInt(b.dataset.day, 10);
    if (days.includes(d)) b.classList.add("chip-active");
    else b.classList.remove("chip-active");
  });
}

function getSelectedTimeRange() {
  const active = timeRangeRow.querySelector(".chip-active");
  return active ? active.dataset.range : "anytime";
}

function setSelectedTimeRange(range) {
  Array.from(timeRangeRow.querySelectorAll(".chip")).forEach((b) => {
    if (b.dataset.range === range) b.classList.add("chip-active");
    else b.classList.remove("chip-active");
  });
  if (range === "custom") {
    customTimeWrapper.style.display = "block";
  } else {
    customTimeWrapper.style.display = "none";
  }
}

function getSelectedType() {
  const active = typeRow.querySelector(".chip-active");
  return active ? active.dataset.type : "build";
}

function setSelectedType(type) {
  Array.from(typeRow.querySelectorAll(".chip")).forEach((b) => {
    if (b.dataset.type === type) b.classList.add("chip-active");
    else b.classList.remove("chip-active");
  });
}

// ---------- Modal ----------
function openModal(habit = null) {
  modal.classList.remove("hidden");
  if (habit) {
    editingId = habit.id;
    modalTitle.textContent = "Edit habit";
    deleteBtn.classList.remove("hidden");

    fTitle.value = habit.title;
    fEmoji.value = habit.emoji || "";
    fGoal.value = habit.goal;
    fStart.value = habit.start || todayStr();
    setSelectedDays(habit.days || [1, 2, 3, 4, 5, 6, 0]);
    setSelectedTimeRange(habit.reminderRange || "anytime");
    fReminderTime.value = habit.reminderTime || "";
    setSelectedType(habit.type || "build");
  } else {
    editingId = null;
    modalTitle.textContent = "New habit";
    deleteBtn.classList.add("hidden");

    fTitle.value = "";
    fEmoji.value = "";
    fGoal.value = 3;
    fStart.value = todayStr();
    setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
    setSelectedTimeRange("anytime");
    fReminderTime.value = "";
    setSelectedType("build");
  }
}

function closeModal() {
  modal.classList.add("hidden");
}

// ---------- Save / delete ----------
function saveHabit() {
  const title = fTitle.value.trim();
  if (!title) {
    alert("Please enter a title.");
    return;
  }

  if (!fStart.value) {
    fStart.value = todayStr();
  }

  let goal = parseInt(fGoal.value, 10);
  if (!goal || goal < 1) goal = 1;

  let days = getSelectedDays();
  if (days.length === 0) {
    days = [1, 2, 3, 4, 5, 6, 0];
  }

  const reminderRange = getSelectedTimeRange();
  const reminderTime =
    reminderRange === "custom" && fReminderTime.value
      ? fReminderTime.value
      : null;

  const type = getSelectedType();

  if (editingId) {
    const idx = habits.findIndex((h) => h.id === editingId);
    if (idx !== -1) {
      habits[idx] = {
        ...habits[idx],
        title,
        emoji: fEmoji.value || "",
        goal,
        start: fStart.value,
        days,
        reminderRange,
        reminderTime,
        type,
      };
    }
  } else {
    const id = "h_" + Date.now();
    habits.push({
      id,
      title,
      emoji: fEmoji.value || "",
      goal,
      start: fStart.value,
      days,
      reminderRange,
      reminderTime,
      type,
    });
  }

  saveJSON("sf_habits", habits);
  closeModal();
  render();
}

function deleteHabit() {
  if (!editingId) return;
  if (!confirm("Delete this habit?")) return;
  habits = habits.filter((h) => h.id !== editingId);
  saveJSON("sf_habits", habits);
  closeModal();
  render();
}

// ---------- Progress ----------
function getDoneFor(habit, dateKey) {
  const dayData = completions[dateKey] || {};
  return dayData[habit.id] || 0;
}

function setDoneFor(habit, dateKey, value) {
  if (!completions[dateKey]) completions[dateKey] = {};
  completions[dateKey][habit.id] = value;
  saveJSON("sf_completions", completions);
}

function computePercent(habit, done) {
  const goal = habit.goal || 1;
  const ratio = Math.max(0, Math.min(done / goal, 1));
  if (habit.type === "quit") {
    return Math.round((1 - ratio) * 100);
  }
  return Math.round(ratio * 100);
}

// ---------- Render ----------
function render() {
  const key = todayStr();
  habitList.innerHTML = "";

  if (!habits.length) {
    habitList.innerHTML =
      '<p class="empty-state">No habits yet. Tap "Add" to create one.</p>';
    summaryLabel.textContent = "";
    return;
  }

  let doneCount = 0;

  habits.forEach((habit) => {
    const startOk = !habit.start || habit.start <= key;
    const day = new Date(key).getDay();
    const activeToday = (habit.days || []).includes(day);

    if (!startOk || !activeToday) return;

    const done = getDoneFor(habit, key);
    const percent = computePercent(habit, done);

    const card = document.createElement("article");
    card.className = "habit-card";

    const top = document.createElement("div");
    top.className = "habit-top";

    const left = document.createElement("div");
    left.className = "habit-main";

    const titleRow = document.createElement("div");
    titleRow.className = "habit-title-row";

    const emojiSpan = document.createElement("span");
    emojiSpan.className = "habit-emoji";
    emojiSpan.textContent = habit.emoji || "•";

    const titleSpan = document.createElement("span");
    titleSpan.className = "habit-title";
    titleSpan.textContent = habit.title;

    titleRow.appendChild(emojiSpan);
    titleRow.appendChild(titleSpan);

    const meta = document.createElement("div");
    meta.className = "habit-meta";
    meta.textContent = `${done}/${habit.goal}`;

    left.appendChild(titleRow);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "habit-percent";
    right.textContent = percent + "%";

    top.appendChild(left);
    top.appendChild(right);

    const bottom = document.createElement("div");
    bottom.className = "habit-bottom";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = habit.goal;
    slider.value = Math.min(done, habit.goal);
    slider.className = "habit-slider";
    slider.style.width = "100%";

    slider.addEventListener("input", () => {
      const newValue = parseInt(slider.value, 10);
      setDoneFor(habit, key, newValue);
      render();
    });

    bottom.appendChild(slider);

    card.appendChild(top);
    card.appendChild(bottom);

    card.addEventListener("click", (e) => {
      // klik op kaart om te editen, maar niet als je de slider sleept
      if (e.target === slider) return;
      openModal(habit);
    });

    habitList.appendChild(card);
    doneCount++;
  });

  summaryLabel.textContent = `${doneCount} active habits today`;
}

// ---------- Events ----------
addBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
saveBtn.addEventListener("click", saveHabit);
deleteBtn.addEventListener("click", deleteHabit);

timeRangeRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  Array.from(timeRangeRow.querySelectorAll(".chip")).forEach((b) =>
    b.classList.remove("chip-active")
  );
  btn.classList.add("chip-active");
  if (btn.dataset.range === "custom") {
    customTimeWrapper.style.display = "block";
  } else {
    customTimeWrapper.style.display = "none";
    fReminderTime.value = "";
  }
});

daysRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  btn.classList.toggle("chip-active");
});

typeRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  Array.from(typeRow.querySelectorAll(".chip")).forEach((b) =>
    b.classList.remove("chip-active")
  );
  btn.classList.add("chip-active");
});

resetBtn.addEventListener("click", () => {
  if (!confirm("Reset today’s progress?")) return;
  const key = todayStr();
  completions[key] = {};
  saveJSON("sf_completions", completions);
  render();
});

// ---------- Init ----------
render();

const today = new Date();
const todayKey = today.toISOString().slice(0, 10);

let habits = JSON.parse(localStorage.getItem("sf_habits") || "[]");
let completions = JSON.parse(localStorage.getItem("sf_completions") || "{}");

const habitList = document.getElementById("habit-list");
const addBtn = document.getElementById("add-btn");
const resetBtn = document.getElementById("reset-btn");
const summaryLabel = document.getElementById("summary-label");
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

let editingId = null;

if (localStorage.getItem("sf_dark") === "true") {
  document.body.classList.add("dark");
}

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("sf_dark", document.body.classList.contains("dark"));
});

function renderWeek() {
  const labels = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const base = new Date(today);
  const offset = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - offset);

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    const btn = document.createElement("button");
    btn.className = "day-pill";
    btn.textContent = labels[i];

    if (d.toISOString().slice(0,10) === todayKey) {
      btn.classList.add("day-pill-active");
    }

    weekRow.appendChild(btn);
  }
}

renderWeek();

function openModal(habit = null) {
  modal.classList.remove("hidden");

  if (habit) {
    editingId = habit.id;
    modalTitle.textContent = "Edit habit";
    deleteBtn.classList.remove("hidden");

    fTitle.value = habit.title;
    fEmoji.value = habit.emoji;
    fGoal.value = habit.goal;
    fStart.value = habit.start;
    setSelectedDays(habit.days);
    setSelectedTimeRange(habit.reminderRange);
    fReminderTime.value = habit.reminderTime || "";
    setSelectedType(habit.type);
  } else {
    editingId = null;
    modalTitle.textContent = "New habit";
    deleteBtn.classList.add("hidden");

    fTitle.value = "";
    fEmoji.value = "";
    fGoal.value = 3;
    fStart.value = todayKey;
    setSelectedDays([1,2,3,4,5,6,0]);
    setSelectedTimeRange("anytime");
    fReminderTime.value = "";
    setSelectedType("build");
  }
}

function closeModal() {
  modal.classList.add("hidden");
}

function setSelectedDays(days) {
  [...daysRow.children].forEach(btn => {
    const d = parseInt(btn.dataset.day);
    btn.classList.toggle("chip-active", days.includes(d));
  });
}

function getSelectedDays() {
  return [...daysRow.children]
    .filter(btn => btn.classList.contains("chip-active"))
    .map(btn => parseInt(btn.dataset.day));
}

function setSelectedTimeRange(range) {
  [...timeRangeRow.children].forEach(btn => {
    btn.classList.toggle("chip-active", btn.dataset.range === range);
  });

  customTimeWrapper.classList.toggle("hidden", range !== "custom");
}

function getSelectedTimeRange() {
  return [...timeRangeRow.children]
    .find(btn => btn.classList.contains("chip-active"))
    .dataset.range;
}

function setSelectedType(type) {
  [...typeRow.children].forEach(btn => {
    btn.classList.toggle("chip-active", btn.dataset.type === type);
  });
}

function getSelectedType() {
  return [...typeRow.children]
    .find(btn => btn.classList.contains("chip-active"))
    .dataset.type;
}

timeRangeRow.addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  setSelectedTimeRange(btn.dataset.range);
});

daysRow.addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  btn.classList.toggle("chip-active");
});

typeRow.addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  setSelectedType(btn.dataset.type);
});

function saveHabit() {
  const title = fTitle.value.trim();
  if (!title) return alert("Enter a title");

  const habit = {
    id: editingId || "h_" + Date.now(),
    title,
    emoji: fEmoji.value || "",
    goal: parseInt(fGoal.value) || 1,
    start: fStart.value || todayKey,
    days: getSelectedDays(),
    reminderRange: getSelectedTimeRange(),
    reminderTime: getSelectedTimeRange() === "custom" ? fReminderTime.value : null,
    type: getSelectedType()
  };

  if (editingId) {
    const idx = habits.findIndex(h => h.id === editingId);
    habits[idx] = habit;
  } else {
    habits.push(habit);
  }

  localStorage.setItem("sf_habits", JSON.stringify(habits));
  closeModal();
  render();
}

function deleteHabit() {
  if (!editingId) return;
  habits = habits.filter(h => h.id !== editingId);
  localStorage.setItem("sf_habits", JSON.stringify(habits));
  closeModal();
  render();
}

function getDone(habit) {
  return completions[todayKey]?.[habit.id] || 0;
}

function setDone(habit, value) {
  if (!completions[todayKey]) completions[todayKey] = {};
  completions[todayKey][habit.id] = value;
  localStorage.setItem("sf_completions", JSON.stringify(completions));
}

function render() {
  habitList.innerHTML = "";

  let count = 0;

  habits.forEach(habit => {
    if (habit.start > todayKey) return;

    const day = today.getDay();
    if (!habit.days.includes(day)) return;

    const done = getDone(habit);
    const percent = habit.type === "quit"
      ? Math.round((1 - done / habit.goal) * 100)
      : Math.round((done / habit.goal) * 100);

    const card = document.createElement("div");
    card.className = "habit-card";

    card.innerHTML = `
      <div class="habit-top">
        <div class="habit-title-row">
          <span>${habit.emoji}</span>
          <span>${habit.title}</span>
        </div>
        <div>${percent}%</div>
      </div>

      <div class="habit-bottom">
        <input type="range" min="0" max="${habit.goal}" value="${done}"
               class="habit-slider" />
      </div>
    `;

    const slider = card.querySelector(".habit-slider");
    slider.addEventListener("input", () => {
      setDone(habit, parseInt(slider.value));
      render();
    });

    card.addEventListener("click", e => {
      if (e.target === slider) return;
      openModal(habit);
    });

    habitList.appendChild(card);
    count++;
  });

  summaryLabel.textContent = `${count} habits today`;
}

addBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
saveBtn.addEventListener("click", saveHabit);
deleteBtn.addEventListener("click", deleteHabit);

resetBtn.addEventListener("click", () => {
  completions[todayKey] = {};
  localStorage.setItem("sf_completions", JSON.stringify(completions));
  render();
});

render();

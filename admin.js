const adminConfig = {
  firstAvailableDate: "2026-05-25",
  presetSlots: [
    ["10:00", "11:00"],
    ["11:30", "12:30"],
    ["13:00", "14:00"],
    ["14:30", "15:30"],
    ["16:00", "17:00"],
    ["17:30", "18:30"],
    ["19:00", "20:00"],
  ],
};

const weekdays = [
  { key: 0, label: "Mon" },
  { key: 1, label: "Tue" },
  { key: 2, label: "Wed" },
  { key: 3, label: "Thu" },
  { key: 4, label: "Fri" },
  { key: 5, label: "Sat" },
  { key: 6, label: "Sun" },
];

const adminGate = document.getElementById("adminGate");
const adminContent = document.getElementById("adminContent");
const adminPasswordInput = document.getElementById("adminPassword");
const unlockButton = document.getElementById("unlockButton");
const gateStatus = document.getElementById("gateStatus");
const weekStartInput = document.getElementById("weekStart");
const weekRangeLabel = document.getElementById("weekRangeLabel");
const weekdayPicker = document.getElementById("weekdayPicker");
const presetGrid = document.getElementById("presetGrid");
const weekdaysButton = document.getElementById("weekdaysButton");
const allDaysButton = document.getElementById("allDaysButton");
const clearSelectionButton = document.getElementById("clearSelectionButton");
const prevWeekButton = document.getElementById("prevWeekButton");
const todayWeekButton = document.getElementById("todayWeekButton");
const nextWeekButton = document.getElementById("nextWeekButton");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const applyWeekButton = document.getElementById("applyWeekButton");
const clearSelectedButton = document.getElementById("clearSelectedButton");
const clearWeekButton = document.getElementById("clearWeekButton");
const selectedWeekSessions = document.getElementById("selectedWeekSessions");
const weekScheduleList = document.getElementById("weekScheduleList");
const adminStatus = document.getElementById("adminStatus");

let isUnlocked = false;
let selectedWeekdays = new Set([0, 1, 2, 3, 4]);
let adminSessionPasscode = "";

function getFirstAvailableDate() {
  return adminConfig.firstAvailableDate;
}

function formatDateLabel(dateString, options = {}) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: options.includeWeekday === false ? undefined : "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function formatShortDateLabel(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function formatTimeLabel(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function createSessionLabel(start, end) {
  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
}

function getDateKey(date) {
  return date.toISOString().split("T")[0];
}

function getWeekStartDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date;
}

function getWeekDates() {
  const startDate = getWeekStartDate(weekStartInput.value);
  return weekdays.map((weekday) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + weekday.key);
    return {
      key: weekday.key,
      label: weekday.label,
      dateKey: getDateKey(date),
      fullLabel: formatDateLabel(getDateKey(date)),
      shortLabel: formatShortDateLabel(getDateKey(date)),
    };
  });
}

function setWeekFromDate(dateString) {
  weekStartInput.value = getDateKey(getWeekStartDate(dateString));
  renderWeekRangeLabel();
  renderDayPicker();
  void renderSelectedSummary();
  void renderWeekSchedule();
}

function moveWeek(offset) {
  const weekStart = getWeekStartDate(weekStartInput.value);
  weekStart.setDate(weekStart.getDate() + offset * 7);

  const firstDate = new Date(`${getFirstAvailableDate()}T12:00:00`);
  if (weekStart < firstDate) {
    setWeekFromDate(getFirstAvailableDate());
    return;
  }

  setWeekFromDate(getDateKey(weekStart));
}

function renderWeekRangeLabel() {
  const weekDates = getWeekDates();
  weekRangeLabel.textContent = `${formatShortDateLabel(
    weekDates[0].dateKey
  )} - ${formatShortDateLabel(weekDates[6].dateKey)}`;
}

function renderDayPicker() {
  const weekDates = getWeekDates();
  weekdayPicker.innerHTML = "";

  weekDates.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-card${
      selectedWeekdays.has(day.key) ? " selected" : ""
    }`;
    button.innerHTML = `
      <span class="day-card-label">${day.label}</span>
      <strong>${day.shortLabel}</strong>
      <span class="day-card-meta">${
        selectedWeekdays.has(day.key) ? "Selected" : "Tap to select"
      }</span>
    `;
    button.addEventListener("click", () => {
      if (selectedWeekdays.has(day.key)) {
        selectedWeekdays.delete(day.key);
      } else {
        selectedWeekdays.add(day.key);
      }
      renderDayPicker();
      renderSelectedSummary();
    });
    weekdayPicker.appendChild(button);
  });
}

function renderPresetGrid() {
  presetGrid.innerHTML = "";

  adminConfig.presetSlots.forEach(([start, end]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.innerHTML = `
      <span class="preset-title">${createSessionLabel(start, end)}</span>
      <span class="preset-subtitle">Add to selected days</span>
    `;
    button.addEventListener("click", () => {
      void addSessionToSelectedDays({
        start,
        end,
        label: createSessionLabel(start, end),
      });
    });
    presetGrid.appendChild(button);
  });
}

function getSelectedDates() {
  return getWeekDates()
    .filter(({ key }) => selectedWeekdays.has(key))
    .map(({ dateKey }) => dateKey);
}

function renderSelectedSummary() {
  const selectedDates = getSelectedDates();

  if (selectedDates.length === 0) {
    selectedWeekSessions.innerHTML =
      '<div class="empty-state">No days selected. Tap the day cards above to choose where you want to post availability.</div>';
    return;
  }

  selectedWeekSessions.innerHTML = `
    <div class="selection-pill">
      <strong>${selectedDates.length} day${selectedDates.length === 1 ? "" : "s"} selected</strong>
      <span>${selectedDates
        .map((dateKey) => formatDateLabel(dateKey))
        .join(" • ")}</span>
    </div>
  `;
}

async function renderWeekSchedule() {
  const weekDates = getWeekDates();
  const startDate = weekDates[0].dateKey;
  const endDate = weekDates[weekDates.length - 1].dateKey;
  weekScheduleList.innerHTML = "";

  try {
    const schedule = await window.scheduleStore.getSlotsForRange(startDate, endDate);
    const weekHasSessions = weekDates.some(
      ({ dateKey }) => (schedule[dateKey] || []).length > 0
    );

    if (!weekHasSessions) {
      weekScheduleList.innerHTML =
        '<div class="empty-state">Nothing posted for this week yet. Select days on the left and tap one of your quick slots.</div>';
      return;
    }

    weekDates.forEach(({ dateKey, fullLabel }) => {
      const sessions = schedule[dateKey] || [];
      const item = document.createElement("div");
      item.className = "week-day";

      const details = document.createElement("div");
      details.className = "week-day-details";

      const heading = document.createElement("div");
      heading.className = "week-day-heading";
      heading.innerHTML = `<strong>${fullLabel}</strong><span>${
        sessions.length === 0
          ? "No availability posted"
          : `${sessions.length} open slot${sessions.length === 1 ? "" : "s"}`
      }</span>`;
      details.appendChild(heading);

      if (sessions.length > 0) {
        const sessionList = document.createElement("div");
        sessionList.className = "slot-checklist";

        sessions.forEach((session) => {
          const row = document.createElement("div");
          row.className = "slot-check-item";

          const copy = document.createElement("div");
          copy.className = "slot-check-copy";
          copy.innerHTML = `<strong>${session.label}</strong><span>Remove this one time slot only</span>`;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "mini-button slot-remove-button";
          removeButton.textContent = "Remove";
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              await window.scheduleStore.clearSlot(
                dateKey,
                {
                  start: session.start,
                  end: session.end,
                  label: session.label,
                },
                adminSessionPasscode
              );
              adminStatus.textContent = `${session.label} removed from ${fullLabel}.`;

              row.remove();

              const remainingSlots = sessionList.querySelectorAll(".slot-check-item").length;
              heading.querySelector("span").textContent =
                remainingSlots === 0
                  ? "No availability posted"
                  : `${remainingSlots} open slot${remainingSlots === 1 ? "" : "s"}`;

              if (remainingSlots === 0) {
                const empty = document.createElement("p");
                empty.className = "day-empty";
                empty.textContent = "No availability posted.";
                details.appendChild(empty);
                sessionList.remove();
                clearButton.disabled = true;
              }
            } catch (error) {
              removeButton.disabled = false;
              adminStatus.textContent =
                "Could not update that slot. Check your setup and try again.";
            }
          });

          row.appendChild(copy);
          row.appendChild(removeButton);
          sessionList.appendChild(row);
        });

        details.appendChild(sessionList);
      } else {
        const empty = document.createElement("p");
        empty.className = "day-empty";
        empty.textContent = "No availability posted.";
        details.appendChild(empty);
      }

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "mini-button";
      clearButton.textContent = "Clear Day";
      clearButton.disabled = sessions.length === 0;
      clearButton.addEventListener("click", async () => {
        await clearDates([dateKey], `Cleared ${fullLabel}.`);
      });

      item.appendChild(details);
      item.appendChild(clearButton);
      weekScheduleList.appendChild(item);
    });
  } catch (error) {
    weekScheduleList.innerHTML =
      '<div class="empty-state">Could not load this week. Check your setup and try again.</div>';
  }
}

async function addSessionToSelectedDays(session) {
  if (!weekStartInput.value) {
    adminStatus.textContent = "Choose a week first.";
    return;
  }

  const dates = getSelectedDates();

  if (dates.length === 0) {
    adminStatus.textContent = "Select at least one day first.";
    return;
  }

  try {
    await window.scheduleStore.addSlotsToDates(
      dates,
      session,
      adminSessionPasscode
    );
    adminStatus.textContent = `Added ${session.label} to ${dates.length} selected day(s).`;
    await renderWeekSchedule();
  } catch (error) {
    adminStatus.textContent = "Could not save that slot. Check your setup and try again.";
  }
}

async function addCustomSession() {
  const start = startTimeInput.value;
  const end = endTimeInput.value;

  if (!start || !end) {
    adminStatus.textContent = "Choose a start time and end time first.";
    return;
  }

  if (end <= start) {
    adminStatus.textContent = "End time must be later than start time.";
    return;
  }

  await addSessionToSelectedDays({
    start,
    end,
    label: createSessionLabel(start, end),
  });
}

async function clearDates(dates, successMessage) {
  if (dates.length === 0) {
    adminStatus.textContent = "Select at least one day first.";
    return;
  }

  try {
    await Promise.all(
      dates.map((dateKey) =>
        window.scheduleStore.clearDate(dateKey, adminSessionPasscode)
      )
    );
    adminStatus.textContent = successMessage;
    await renderWeekSchedule();
  } catch (error) {
    adminStatus.textContent = "Could not clear that availability. Try again.";
  }
}

async function clearSelectedDays() {
  const selectedDates = getSelectedDates();
  await clearDates(
    selectedDates,
    `Cleared ${selectedDates.length} selected day${
      selectedDates.length === 1 ? "" : "s"
    }.`
  );
}

async function clearSelectedWeek() {
  const weekDates = getWeekDates();
  const startDate = weekDates[0].dateKey;
  const endDate = weekDates[weekDates.length - 1].dateKey;

  try {
    await window.scheduleStore.clearWeek(
      startDate,
      endDate,
      adminSessionPasscode
    );
    adminStatus.textContent = "Cleared the whole week.";
    await renderWeekSchedule();
  } catch (error) {
    adminStatus.textContent = "Could not clear the week. Try again.";
  }
}

function initializeAdmin() {
  weekStartInput.min = getFirstAvailableDate();
  startTimeInput.value = "16:00";
  endTimeInput.value = "17:00";
  renderPresetGrid();
  setWeekFromDate(getFirstAvailableDate());
}

async function unlockAdmin() {
  const enteredPasscode = adminPasswordInput.value.trim();

  if (!enteredPasscode) {
    gateStatus.textContent = "Enter your passcode.";
    return;
  }

  gateStatus.textContent = "Checking passcode...";

  try {
    const result = await window.scheduleStore.validatePasscode(enteredPasscode);
    if (!result || result.success !== true) {
      gateStatus.textContent = "Incorrect passcode.";
      adminPasswordInput.value = "";
      return;
    }
  } catch (error) {
    gateStatus.textContent = "Could not verify passcode. Try again.";
    return;
  }

  if (!isUnlocked) {
    initializeAdmin();
    isUnlocked = true;
  }

  adminSessionPasscode = enteredPasscode;
  gateStatus.textContent = "";
  adminGate.hidden = true;
  adminContent.hidden = false;
}

applyWeekButton.addEventListener("click", () => {
  void addCustomSession();
});
clearSelectedButton.addEventListener("click", () => {
  void clearSelectedDays();
});
clearWeekButton.addEventListener("click", () => {
  void clearSelectedWeek();
});
weekdaysButton.addEventListener("click", () => {
  selectedWeekdays = new Set([0, 1, 2, 3, 4]);
  renderDayPicker();
  renderSelectedSummary();
});
allDaysButton.addEventListener("click", () => {
  selectedWeekdays = new Set(weekdays.map(({ key }) => key));
  renderDayPicker();
  renderSelectedSummary();
});
clearSelectionButton.addEventListener("click", () => {
  selectedWeekdays = new Set();
  renderDayPicker();
  renderSelectedSummary();
});
prevWeekButton.addEventListener("click", () => {
  moveWeek(-1);
});
todayWeekButton.addEventListener("click", () => {
  setWeekFromDate(getFirstAvailableDate());
});
nextWeekButton.addEventListener("click", () => {
  moveWeek(1);
});
weekStartInput.addEventListener("change", () => {
  setWeekFromDate(weekStartInput.value);
});
unlockButton.addEventListener("click", unlockAdmin);
adminPasswordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    void unlockAdmin();
  }
});

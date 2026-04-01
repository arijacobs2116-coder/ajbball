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
const weekdayPicker = document.getElementById("weekdayPicker");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const applyWeekButton = document.getElementById("applyWeekButton");
const copyWeekButton = document.getElementById("copyWeekButton");
const clearWeekButton = document.getElementById("clearWeekButton");
const selectedWeekSessions = document.getElementById("selectedWeekSessions");
const weekScheduleList = document.getElementById("weekScheduleList");
const adminStatus = document.getElementById("adminStatus");

let isUnlocked = false;
let selectedWeekdays = new Set([0, 1, 2, 3, 4]);
let adminSessionPasscode = "";

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
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
    };
  });
}

function renderWeekdayPicker() {
  weekdayPicker.innerHTML = "";

  weekdays.forEach((weekday) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `weekday-button${
      selectedWeekdays.has(weekday.key) ? " selected" : ""
    }`;
    button.textContent = weekday.label;
    button.addEventListener("click", () => {
      if (selectedWeekdays.has(weekday.key)) {
        selectedWeekdays.delete(weekday.key);
      } else {
        selectedWeekdays.add(weekday.key);
      }
      renderWeekdayPicker();
    });
    weekdayPicker.appendChild(button);
  });
}

async function renderSelectedWeekSessions() {
  const weekDates = getWeekDates();
  const startDate = weekDates[0].dateKey;
  const endDate = weekDates[weekDates.length - 1].dateKey;
  selectedWeekSessions.innerHTML = "";

  try {
    const schedule = await window.scheduleStore.getSlotsForRange(startDate, endDate);
    const hasSessions = weekDates.some(
      ({ dateKey }) => (schedule[dateKey] || []).length > 0
    );

    if (!hasSessions) {
      selectedWeekSessions.innerHTML =
        '<div class="empty-state">No sessions posted for this week yet.</div>';
      return;
    }

    weekDates.forEach(({ dateKey, label }) => {
      const sessions = schedule[dateKey] || [];
      if (sessions.length === 0) {
        return;
      }

      const item = document.createElement("div");
      item.className = "session-chip";
      item.innerHTML = `<strong>${label} ${formatDateLabel(dateKey)}</strong><span>${sessions
        .map((session) => session.label)
        .join(", ")}</span>`;
      selectedWeekSessions.appendChild(item);
    });
  } catch (error) {
    selectedWeekSessions.innerHTML =
      '<div class="empty-state">Could not load this week. Check your setup and try again.</div>';
  }
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
        '<div class="empty-state">No availability posted for this week yet.</div>';
      return;
    }

    weekDates.forEach(({ dateKey }) => {
      const sessions = schedule[dateKey] || [];
      if (sessions.length === 0) {
        return;
      }

      const item = document.createElement("div");
      item.className = "week-day";

      const details = document.createElement("div");
      const sessionLabels = sessions.map((session) => session.label).join(", ");
      details.innerHTML = `<strong>${formatDateLabel(dateKey)}</strong><br />${sessionLabels}`;

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "mini-button";
      clearButton.textContent = "Clear";
      clearButton.addEventListener("click", async () => {
        await window.scheduleStore.clearDate(dateKey, adminSessionPasscode);
        adminStatus.textContent = `Cleared ${formatDateLabel(dateKey)}.`;
        await renderSelectedWeekSessions();
        await renderWeekSchedule();
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

async function addSessionToWeek() {
  const start = startTimeInput.value;
  const end = endTimeInput.value;

  if (!weekStartInput.value || !start || !end) {
    adminStatus.textContent = "Choose a week, start time, and end time first.";
    return;
  }

  if (end <= start) {
    adminStatus.textContent = "End time must be later than start time.";
    return;
  }

  if (selectedWeekdays.size === 0) {
    adminStatus.textContent = "Choose at least one weekday.";
    return;
  }

  const session = {
    start,
    end,
    label: createSessionLabel(start, end),
  };
  const dates = getWeekDates()
    .filter(({ key }) => selectedWeekdays.has(key))
    .map(({ dateKey }) => dateKey);

  try {
    await window.scheduleStore.addSlotsToDates(
      dates,
      session,
      adminSessionPasscode
    );
    adminStatus.textContent = `Added ${session.label} to ${dates.length} day(s) this week.`;
    await renderSelectedWeekSessions();
    await renderWeekSchedule();
  } catch (error) {
    adminStatus.textContent = "Could not save the schedule. Check your setup and try again.";
  }
}

async function clearSelectedWeek() {
  if (!weekStartInput.value) {
    adminStatus.textContent = "Choose a week first.";
    return;
  }

  const weekDates = getWeekDates();
  const startDate = weekDates[0].dateKey;
  const endDate = weekDates[weekDates.length - 1].dateKey;

  try {
    await window.scheduleStore.clearWeek(
      startDate,
      endDate,
      adminSessionPasscode
    );
    adminStatus.textContent = "Cleared all availability for this week.";
    await renderSelectedWeekSessions();
    await renderWeekSchedule();
  } catch (error) {
    adminStatus.textContent = "Could not clear the week. Check your setup and try again.";
  }
}

async function loadSampleWeek() {
  const sampleSlots = [
    ["16:00", "17:00"],
    ["17:30", "18:30"],
    ["19:00", "20:00"],
  ];
  const dates = getWeekDates()
    .filter(({ key }) => key < 5)
    .map(({ dateKey }) => dateKey);

  try {
    for (const [start, end] of sampleSlots) {
      await window.scheduleStore.addSlotsToDates(
        dates,
        {
          start,
          end,
          label: createSessionLabel(start, end),
        },
        adminSessionPasscode
      );
    }

    adminStatus.textContent = "Sample week loaded. Edit the week as needed.";
    await renderSelectedWeekSessions();
    await renderWeekSchedule();
  } catch (error) {
    adminStatus.textContent = "Could not load the sample week. Check your setup and try again.";
  }
}

function initializeAdmin() {
  weekStartInput.min = getTomorrowDate();
  weekStartInput.value = getTomorrowDate();
  startTimeInput.value = "16:00";
  endTimeInput.value = "17:00";
  renderWeekdayPicker();
  void renderSelectedWeekSessions();
  void renderWeekSchedule();
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
  void addSessionToWeek();
});
copyWeekButton.addEventListener("click", () => {
  void loadSampleWeek();
});
clearWeekButton.addEventListener("click", () => {
  void clearSelectedWeek();
});
weekStartInput.addEventListener("change", () => {
  void renderSelectedWeekSessions();
  void renderWeekSchedule();
});
unlockButton.addEventListener("click", unlockAdmin);
adminPasswordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    void unlockAdmin();
  }
});

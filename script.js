const businessConfig = {
  businessName: "AJ's Basketball Training",
  phoneNumber: "9732008228",
  firstAvailableDate: "2026-05-25",
};

const sessionDateInput = document.getElementById("sessionDate");
const sessionTypeSelect = document.getElementById("sessionType");
const slotGrid = document.getElementById("slotGrid");
const slotHint = document.getElementById("slotHint");
const bookingForm = document.getElementById("bookingForm");
const bookingSummary = document.getElementById("bookingSummary");
const formNote = document.getElementById("formNote");

let selectedSlot = "";
let lastRenderedDate = "";

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function updateSummary() {
  const dateValue = sessionDateInput.value;
  const sessionType = sessionTypeSelect.value;

  if (!dateValue || !selectedSlot) {
    bookingSummary.textContent = "No slot selected yet.";
    return;
  }

  bookingSummary.innerHTML = `
    <strong>${sessionType}</strong><br />
    ${formatDateLabel(dateValue)} at ${selectedSlot}
  `;
}

async function renderSlots() {
  const dateValue = sessionDateInput.value;
  slotGrid.innerHTML = "";
  selectedSlot = "";
  lastRenderedDate = dateValue;
  updateSummary();

  if (!dateValue) {
    slotHint.textContent = "Pick a date to view available sessions.";
    return;
  }

  let slots = [];

  try {
    slots = await window.scheduleStore.getSlotsForDate(dateValue);
  } catch (error) {
    slotHint.textContent = "Availability could not be loaded.";
    slotGrid.innerHTML =
      '<div class="empty-state">There was a problem loading the schedule. Please try again.</div>';
    return;
  }

  if (slots.length === 0) {
    slotHint.textContent = "No sessions posted for that date.";
    slotGrid.innerHTML =
      '<div class="empty-state">No session times have been posted for this date yet.</div>';
    return;
  }

  slotHint.textContent = `${slots.length} available 60-minute sessions`;

  slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-button";
    button.textContent = slot.label;
    button.addEventListener("click", () => {
      selectedSlot = slot.label;
      document
        .querySelectorAll(".slot-button")
        .forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      updateSummary();
    });
    slotGrid.appendChild(button);
  });
}

function refreshSlotsIfNeeded() {
  if (!sessionDateInput.value) {
    return;
  }

  void renderSlots();
}

function getTomorrowDate() {
  return businessConfig.firstAvailableDate;
}

function initializeDateInput() {
  const minDate = getTomorrowDate();
  sessionDateInput.min = minDate;
  sessionDateInput.value = minDate;
  void renderSlots();
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!selectedSlot) {
    formNote.textContent = "Please choose a time slot before sending.";
    return;
  }

  const formData = new FormData(bookingForm);
  const sessionType = sessionTypeSelect.value;
  const dateLabel = formatDateLabel(sessionDateInput.value);
  const name = formData.get("clientName");
  const phone = formData.get("phone");
  const ageGroup = formData.get("ageGroup");
  const goals = formData.get("goals") || "Not provided";

  const body = encodeURIComponent(
    [
      `Hi, I'd like to request a session with ${businessConfig.businessName}.`,
      `Session Type: ${sessionType}`,
      `Preferred Date: ${dateLabel}`,
      `Preferred Time: ${selectedSlot}`,
      "",
      `Parent/Athlete Name: ${name}`,
      `Phone: ${phone}`,
      `Athlete Age/Grade: ${ageGroup}`,
      `Training Goals: ${goals}`,
    ].join("\n")
  );

  window.location.href = `sms:${businessConfig.phoneNumber}?&body=${body}`;
  formNote.textContent =
    "Your messaging app should open with the booking request filled in.";
});

sessionDateInput.addEventListener("change", () => {
  void renderSlots();
});
sessionTypeSelect.addEventListener("change", updateSummary);
window.addEventListener("focus", refreshSlotsIfNeeded);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshSlotsIfNeeded();
  }
});

initializeDateInput();

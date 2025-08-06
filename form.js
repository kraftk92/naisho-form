import { FORM_CONFIG } from "./config.js";

const honeypotName = "website";      // spam trap
const form = document.getElementById("naisho-form");

// 👉 simple render so Webflow only needs a <div id="naisho-form"></div>
form.innerHTML = `
  <input name="${honeypotName}" type="text" tabindex="-1" style="display:none">
  <input name="name"       placeholder="Name"        required>
  <input name="email"      placeholder="Email"       type="email" required>
  <input name="phone"      placeholder="Phone"       required>
  <input name="date"       type="date" required>

  <label for="reservation_time">Select a Time:</label>
  <select id="reservation_time" name="reservation_time" required>
    <option value="" disabled selected>Select a time</option>
    <option value="4:30 PM">4:30 PM</option>
    <option value="4:45 PM">4:45 PM</option>
    <option value="5:00 PM">5:00 PM</option>
    <option value="5:15 PM">5:15 PM</option>
    <option value="5:30 PM">5:30 PM</option>
    <option value="5:45 PM">5:45 PM</option>
    <option value="6:00 PM">6:00 PM</option>
    <option value="6:15 PM">6:15 PM</option>
    <option value="6:30 PM">6:30 PM</option>
    <option value="6:45 PM">6:45 PM</option>
    <option value="7:00 PM">7:00 PM</option>
    <option value="7:15 PM">7:15 PM</option>
    <option value="7:30 PM">7:30 PM</option>
    <option value="7:45 PM">7:45 PM</option>
    <option value="8:00 PM">8:00 PM</option>
    <option value="8:15 PM">8:15 PM</option>
    <option value="8:30 PM">8:30 PM</option>
    <option value="8:45 PM">8:45 PM</option>
    <option value="9:00 PM">9:00 PM</option>
    <option value="9:15 PM">9:15 PM</option>
    <option value="9:30 PM">9:30 PM</option>
    <option value="9:45 PM">9:45 PM</option>
    <option value="10:00 PM">10:00 PM</option>
    <option value="10:15 PM">10:15 PM</option>
    <option value="10:30 PM">10:30 PM</option>
    <option value="10:45 PM">10:45 PM</option>
    <option value="11:00 PM">11:00 PM</option>
    <option value="11:15 PM">11:15 PM</option>
    <option value="11:30 PM">11:30 PM</option>
    <option value="11:45 PM">11:45 PM</option>
    <option value="12:00 AM">12:00 AM</option>
  </select>

  <select name="party"     required>
    <option value="" disabled selected>Party size</option>
    ${[1,2,3,4,5,6].map(n=>`<option>${n}</option>`).join("")}
  </select>

  <textarea name="notes"   placeholder="Comments"></textarea>
  <label class="opt-in">
  <label class="opt-in">
    <input
      type="checkbox"
      name="marketing_opt_in"
      value="yes"
      checked
    >
    <span>
      Keep me posted about last-minute openings, chef’s dinners & Naisho news
    </span>
  </label>
  <p class="fine-print">
    We’ll email you important reservation updates even if you uncheck the box.
  </p>
  <button type="submit">Request Reservation</button>
`;

const timeSelect = form.querySelector("#reservation_time");
const dateInput = form.querySelector("input[name='date']");

// --- DATE PICKER: disallow Sun–Tue -----------------------------
const today   = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + FORM_CONFIG.maxDaysOut);

/* dateInput.min = today.toISOString().slice(0, 10);
dateInput.max = maxDate.toISOString().slice(0, 10); */

// Flatpickr config
flatpickr(dateInput, {
  altInput: true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate: "today",
  maxDate: new Date(Date.now() + FORM_CONFIG.maxDaysOut * 864e5),
  disable: [
    date => [0,1,2].includes(date.getDay())   // disable Sun (0) Mon (1) Tue (2)
  ],
  onChange: ([selected]) => {
    if (selected) updateTimeOptions(selected.toISOString().slice(0,10));
  }
});

const weekdayTimes = [
  "4:30 PM", "4:45 PM", "5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM",
  "6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM",
  "7:00 PM", "7:15 PM", "7:30 PM", "7:45 PM",
  "8:00 PM", "8:15 PM", "8:30 PM", "8:45 PM",
  "9:00 PM", "9:15 PM", "9:30 PM", "9:45 PM",
  "10:00 PM", "10:15 PM", "10:30 PM"
];

const weekendTimes = [
  "4:30 PM", "4:45 PM", "5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM",
  "6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM",
  "7:00 PM", "7:15 PM", "7:30 PM", "7:45 PM",
  "8:00 PM", "8:15 PM", "8:30 PM", "8:45 PM",
  "9:00 PM", "9:15 PM", "9:30 PM", "9:45 PM",
  "10:00 PM", "10:15 PM", "10:30 PM", "10:45 PM",
  "11:00 PM", "11:15 PM", "11:30 PM", "11:45 PM",
  "12:00 AM"
];

function updateTimeOptions(dateStr) {
  const [y,m,d] = dateStr.split('-');
  const day  = new Date(y, m-1, d).getDay();     // 0=Sun … 6=Sat

  const isFriSat = (day === 5 || day === 6);
  const timeOptions = isFriSat ? weekendTimes : weekdayTimes;

  timeSelect.innerHTML =
    `<option value="" disabled selected>Select a time</option>`;
  timeOptions.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    timeSelect.appendChild(opt);
  });
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  // bot check
  if (data[honeypotName]) return;

  // date limit
  const reqDate = new Date(data.date);
  const maxDate  = new Date();
  maxDate.setDate(maxDate.getDate() + FORM_CONFIG.maxDaysOut);
  if (reqDate > maxDate) {
    alert("Please choose a date within 3 weeks.");
    return;
  }

  try {
    const res = await fetch(FORM_CONFIG.webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Bad response");
    form.innerHTML = `<p class="success">Got it! We’ll email you soon 🔒</p>`;
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Try again.");
  }
});

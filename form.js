// updated 08-07-25 1:14pm

import { FORM_CONFIG } from "./config.js";
import flatpickr   from "https://esm.sh/flatpickr@4.6.13";

const honeypotName = "website";       // spam trap
const form         = document.getElementById("naisho-form");

/* ---------- ⬇️  MARKUP  ⬇️ ---------- */
form.innerHTML = `
  <input name="${honeypotName}" type="text" tabindex="-1" style="display:none">

  <input name="name"  placeholder="Name"  required>

  <input
    name="email"
    placeholder="Email"
    type="email"
    autocapitalize="off"
    spellcheck="false"
    required
  >

  <input
    name="phone"
    placeholder="Phone"
    type="tel"
    inputmode="tel"
    pattern="\\d{10,}"
    required
  >

  <input name="date" type="date" required>

  <label for="reservation_time">Select a Time:</label>
  <select id="reservation_time" name="reservation_time" required>
    <option value="" disabled selected>Select a time</option>
  </select>

  <select name="party" required>
    <option value="" disabled selected>Party size</option>
    ${[1,2,3,4,5,6].map(n=>`<option>${n}</option>`).join("")}
  </select>

  <textarea name="notes" placeholder="Comments"></textarea>

  <!-- Marketing opt-in -->
  <label class="opt-in">
    <input type="checkbox" name="marketing_opt_in" value="yes" checked>
    <span>Keep me posted about last-minute openings, chef’s dinners & Naisho news</span>
  </label>

  <!-- NEW: SMS opt-in -->
  <label class="opt-in">
    <input type="checkbox" name="sms_opt_in" value="yes">
    <span>Text me reservation reminders (standard rates apply)</span>
  </label>

  <p class="fine-print">
    We’ll email you important reservation updates even if you uncheck the boxes.
  </p>

  <button type="submit">Request Reservation</button>
`;

/* ---------- ⬇️  DATE / TIME LOGIC  ⬇️ ---------- */
const timeSelect = form.querySelector("#reservation_time");
const dateInput  = form.querySelector("input[name='date']");

flatpickr(dateInput, {
  altInput : true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate  : "today",
  maxDate  : new Date(Date.now() + FORM_CONFIG.maxDaysOut * 864e5),
  disable  : [ date => [0,1,2].includes(date.getDay()) ],  // Sun–Tue off
  onChange : ([selected]) => selected && updateTimeOptions(selected)
});

const weekdayTimes = [ /* 4:30 PM → 10:30 PM */ ];
const weekendTimes = [ /* 4:30 PM → 12:00 AM */ ];

function updateTimeOptions(dateObj){
  const day        = dateObj.getDay();       // 0 Sun … 6 Sat
  const options    = (day === 5 || day === 6) ? weekendTimes : weekdayTimes;
  timeSelect.innerHTML =
    `<option value="" disabled selected>Select a time</option>` +
    options.map(t=>`<option>${t}</option>`).join("");
}

/* ---------- ⬇️  SUBMIT  ⬇️ ---------- */
form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  // honeypot trip → bye
  if (data[honeypotName]) return;

  /* ---- sanitize & normalize ---- */
  data.email = (data.email || "").trim().toLowerCase();

  // strip non-digits, force US +1—adjust later if you go international
  data.phone = "+1" + (data.phone || "").replace(/\D/g, "").slice(-10);

  // safety guard: date cannot exceed maxDaysOut
  const reqDate = new Date(data.date);
  const maxDate = new Date(Date.now() + FORM_CONFIG.maxDaysOut * 864e5);
  if (reqDate > maxDate){
    alert("Please choose a date within the next three weeks.");
    return;
  }

  try{
    const res = await fetch(FORM_CONFIG.webhookURL, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(data)
    });
    if(!res.ok) throw new Error("Bad response");
    form.innerHTML = `<p class="success">Got it! We’ll email you soon 🔒</p>`;
  }catch(err){
    console.error(err);
    alert("Something went wrong. Try again.");
  }
});

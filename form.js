// v2 – UI polish, inline status, validation, anti‑dupe
// relies on existing FORM_CONFIG: { webhookURL, maxDaysOut }

import { FORM_CONFIG } from "./config.js";
import flatpickr from "https://esm.sh/flatpickr@4.6.13";

const honeypotName = "website"; // spam trap
const shell = document.getElementById("naisho-form");

/* ---------- Markup ---------- */
shell.innerHTML = `
  <form id="naisho-form-inner" novalidate>
    <input name="${honeypotName}" type="text" tabindex="-1" autocomplete="off" style="display:none" />

    <div class="grid">
      <div class="field">
        <label>Name <span class="req">*</span></label>
        <input name="name" placeholder="Your full name" required />
        <div class="error"></div>
      </div>

      <div class="field">
        <label>Email <span class="req">*</span></label>
        <input
          name="email"
          placeholder="you@example.com"
          type="email"
          autocapitalize="off"
          spellcheck="false"
          required
        />
        <div class="error"></div>
      </div>

      <div class="field">
        <label>Phone</label>
        <input
          name="phone"
          placeholder="(555) 555-5555"
          type="tel"
          inputmode="tel"
          pattern="\\(\\d{3}\\) \\d{3}-\\d{4}"
        />
        <div class="help">US numbers only for now</div>
        <div class="error"></div>
      </div>

      <div class="field">
        <label>Date <span class="req">*</span></label>
        <input name="date" type="text" required />
        <div class="error"></div>
      </div>

      <div class="field">
        <label>Time <span class="req">*</span></label>
        <select id="reservation_time" name="reservation_time" required>
          <option value="" disabled selected>Select a time</option>
        </select>
        <div class="error"></div>
      </div>

      <div class="field">
        <label>Party size <span class="req">*</span></label>
        <select name="party" required>
          <option value="" disabled selected>Select</option>
          ${[1,2,3,4,5,6].map(n=>`<option>${n}</option>`).join("")}
        </select>
        <div class="error"></div>
      </div>

      <div class="field span-2">
        <label>Notes</label>
        <textarea name="notes" placeholder="Occasion, dietary notes, anything we should know"></textarea>
      </div>

      <div class="field span-2">
        <label class="opt-in">
          <input type="checkbox" name="marketing_opt_in" value="yes" checked />
          <span>Keep me posted about last‑minute openings, chef dinners and news</span>
        </label>
        <label class="opt-in">
          <input type="checkbox" name="sms_opt_in" value="yes" />
          <span>Text me reservation reminders</span>
        </label>
        <p class="fine-print">We will email critical reservation updates even if these are unchecked.</p>
      </div>
    </div>

    <div class="actions">
      <button type="submit" class="submit">
        <span class="btn-label">Request reservation</span>
        <span class="spinner" aria-hidden="true"></span>
      </button>
      <div class="status" aria-live="polite"></div>
    </div>
  </form>
`;

const form = document.getElementById("naisho-form-inner");
const timeSelect = form.querySelector("#reservation_time");
const dateInput = form.querySelector("input[name='date']");
const statusEl = form.querySelector(".status");
const submitBtn = form.querySelector(".submit");
const labelSpan = form.querySelector(".btn-label");

/* ---------- Datepicker + time options ---------- */
flatpickr(dateInput, {
  altInput: true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate: "today",
  maxDate: new Date(Date.now() + FORM_CONFIG.maxDaysOut * 864e5),
  disable: [d => [0,1,2].includes(d.getDay())], // Sun-Tue closed
  onChange: ([selected]) => selected && updateTimeOptions(selected)
});

const weekdayTimes = [
  "4:30 PM","4:45 PM","5:00 PM","5:15 PM","5:30 PM","5:45 PM",
  "6:00 PM","6:15 PM","6:30 PM","6:45 PM",
  "7:00 PM","7:15 PM","7:30 PM","7:45 PM",
  "8:00 PM","8:15 PM","8:30 PM","8:45 PM",
  "9:00 PM","9:15 PM","9:30 PM","9:45 PM",
  "10:00 PM","10:15 PM","10:30 PM"
];

const weekendTimes = [
  "4:30 PM","4:45 PM","5:00 PM","5:15 PM","5:30 PM","5:45 PM",
  "6:00 PM","6:15 PM","6:30 PM","6:45 PM",
  "7:00 PM","7:15 PM","7:30 PM","7:45 PM",
  "8:00 PM","8:15 PM","8:30 PM","8:45 PM",
  "9:00 PM","9:15 PM","9:30 PM","9:45 PM",
  "10:00 PM","10:15 PM","10:30 PM","10:45 PM",
  "11:00 PM","11:15 PM","11:30 PM","11:45 PM",
  "12:00 AM"
];

function updateTimeOptions(dateObj){
  const day = dateObj.getDay(); // 0 Sun ... 6 Sat
  const opts = (day === 5 || day === 6) ? weekendTimes : weekdayTimes;
  timeSelect.innerHTML = `<option value="" disabled selected>Select a time</option>` +
    opts.map(t => `<option>${t}</option>`).join("");
}

/* ---------- Phone formatting ---------- */
const phoneInput = form.querySelector("input[name='phone']");
if (phoneInput){
  phoneInput.addEventListener('input', () => {
    const digits = phoneInput.value.replace(/\D/g, '').slice(0,10);
    let out = digits;
    if (digits.length >= 7) out = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    else if (digits.length >= 4) out = `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    phoneInput.value = out;
  });
}

/* ---------- Helpers ---------- */
function setLoading(on){
  submitBtn.disabled = on;
  submitBtn.setAttribute('aria-disabled', on ? 'true' : 'false');
  submitBtn.classList.toggle('is-loading', on);
  labelSpan.textContent = on ? 'Processing...' : 'Request reservation';
}

function showStatus(type, msg){
  statusEl.className = `status ${type}`; // success | error | info
  statusEl.textContent = msg;
}

function clearFieldErrors(){
  form.querySelectorAll('.field .error').forEach(el => el.textContent = '');
}

function emailLooksValid(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFormData(){
  const data = Object.fromEntries(new FormData(form));
  // normalize
  data.email = (data.email || '').trim().toLowerCase();
  const rawDigits = (data.phone || '').replace(/\D/g, '').slice(-10);
  data.phone = rawDigits ? `+1${rawDigits}` : ''; // E.164
  return data;
}

function validate(){
  clearFieldErrors();
  const errors = {};
  const data = getFormData();

  if(!data.name) errors.name = 'Required';
  if(!data.email) errors.email = 'Required';
  else if(!emailLooksValid(data.email)) errors.email = 'Invalid email';
  if(!data.date) errors.date = 'Required';
  if(!data.reservation_time) errors.reservation_time = 'Required';
  if(!data.party) errors.party = 'Required';

  Object.entries(errors).forEach(([key,msg]) => {
    const field = form.querySelector(`[name='${key}']`);
    const slot = field?.closest('.field')?.querySelector('.error');
    if (slot){ slot.textContent = msg; }
  });

  if(Object.keys(errors).length){
    const first = form.querySelector('.field .error:not(:empty)');
    first?.closest('.field')?.querySelector('input, select, textarea')?.focus();
    showStatus('error', 'Please fix the highlighted fields.');
    return false;
  }
  showStatus('info', 'Submitting your request...');
  return true;
}

/* ---------- Submit ---------- */
let inFlight = false;

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (inFlight) return; // anti-dupe
  if (!validate()) return;

  // spam trap
  const hp = form.querySelector(`[name='${honeypotName}']`).value;
  if (hp) return;

  const data = getFormData();

  // safety guard: date within maxDaysOut
  const reqDate = new Date(data.date);
  const maxDate = new Date(Date.now() + FORM_CONFIG.maxDaysOut * 864e5);
  if (reqDate > maxDate){
    showStatus('error', `Please choose a date within the next ${FORM_CONFIG.maxDaysOut} days.`);
    dateInput.focus();
    return;
  }

  try{
    inFlight = true;
    setLoading(true);
    const res = await fetch(FORM_CONFIG.webhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok){
      const text = await res.text().catch(()=> '');
      throw new Error(text || 'Request failed');
    }

    // optional: read JSON with any extra info
    // const json = await res.json().catch(()=>null);
    form.reset();
    timeSelect.innerHTML = `<option value="" disabled selected>Select a time</option>`; // reset
    showStatus('success', 'Got it. We will email you shortly.');
  }catch(err){
    console.error(err);
    showStatus('error', 'Something went wrong. Please try again.');
  }finally{
    inFlight = false;
    setLoading(false);
  }
});
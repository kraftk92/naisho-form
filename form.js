// v2 – UI polish, inline status, validation, anti-dupe
// relies on existing FORM_CONFIG: { webhookURL, maxDaysOut }

import { FORM_CONFIG } from "./config.js";
import flatpickr from "https://esm.sh/flatpickr@4.6.13";

const honeypotName = "website"; // spam trap
const shell = document.getElementById("naisho-form");


/* ---------- Markup ---------- */
shell.innerHTML = `
  <form id="naisho-form-inner" novalidate>
    <input name="${honeypotName}" type="text" tabindex="-1" autocomplete="off" style="display:none" />

    <div class="grid two-col">
      <div class="col user">
        <div class="field">
          <label>Name <span class="req">*</span></label>
          <input name="name" placeholder="Your full name" autocomplete="name" required />
          <div class="error"></div>
        </div>

        <div class="field">
          <label>Email <span class="req">*</span></label>
          <input name="email" placeholder="you@example.com" type="email" autocapitalize="off" spellcheck="false" autocomplete="email" required />
          <div class="error"></div>
        </div>

        <div class="field">
          <label>Phone</label>
          <input name="phone" placeholder="(555) 555-5555" type="tel" autocomplete="tel" inputmode="tel" pattern="\\(\\d{3}\\) \\d{3}-\\d{4}" />
          <div class="help">US numbers only</div>
          <div class="error"></div>
        </div>
      </div>

      <div class="col request">
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
      </div>

      <div class="field span-2">
        <label>Notes</label>
        <textarea name="notes" placeholder="Occasion, dietary notes, anything we should know"></textarea>
      </div>

      <div class="field span-2">
        <label class="opt-in">
          <input type="checkbox" name="marketing_opt_in" value="yes" checked />
          <span>Keep me posted about last-minute openings, chef dinners and news</span>
        </label>
        <label class="opt-in">
          <input type="checkbox" name="sms_opt_in" value="yes" />
          <span>Text me reservation reminders</span>
        </label>
        <p class="fine-print">We will email critical reservation updates even if these are unchecked.</p>
        <p class="fine-print">Limit: up to 3 open requests per guest at a time.</p>
      </div>
    </div>

    <div class="actions">
      <button type="submit" class="submit">
        <span class="btn-label">Request reservation</span>
        <span class="spinner" aria-hidden="true"></span>
      </button>
      <div class="status" aria-live="polite"></div>
    </div>
    <div class="details" aria-live="polite"></div>

  </form>
  <div class="form-overlay" aria-hidden="true" hidden>
    <div class="overlay-loader"></div>
    <div class="overlay-text">Submitting…</div>
  </div>
`;

const form = document.getElementById("naisho-form-inner");
const overlay   = shell.querySelector(".form-overlay");
const timeSelect = form.querySelector("#reservation_time");
const dateInput  = form.querySelector("input[name='date']");
const statusEl   = form.querySelector(".status");
const submitBtn  = form.querySelector(".submit");
const labelSpan  = form.querySelector(".btn-label");

/* Optional details panel shim (after form exists) */
function showDetails(html = "") {
  const slot = form.querySelector(".details");
  if (slot) slot.innerHTML = html;
}

/* ---------- Datepicker + time options ---------- */
flatpickr(dateInput, {
  altInput : true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",
  minDate  : "today",
  maxDate  : new Date(Date.now() + FORM_CONFIG.maxDaysOut * 864e5),
  disable  : [d => [0,1,2].includes(d.getDay())], // Sun–Tue closed
  onChange : ([selected]) => selected && updateTimeOptions(selected)
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
  const day  = dateObj.getDay(); // 0 Sun … 6 Sat
  const opts = (day === 5 || day === 6) ? weekendTimes : weekdayTimes;
  timeSelect.innerHTML =
    `<option value="" disabled selected>Select a time</option>` +
    opts.map(t => `<option>${t}</option>`).join("");
}

/* ---------- Phone formatting (handles +1, autofill) ---------- */
const phoneInput = form.querySelector("input[name='phone']");

function formatUSPhoneDisplay(val){
  const digits = val.replace(/\D/g, "");
  const ten = (digits.length === 11 && digits[0] === "1")
    ? digits.slice(1, 11)
    : digits.slice(0, 10);

  if (ten.length >= 7) return `(${ten.slice(0,3)}) ${ten.slice(3,6)}-${ten.slice(6)}`;
  if (ten.length >= 4) return `(${ten.slice(0,3)}) ${ten.slice(3)}`;
  if (ten.length >= 1) return `(${ten.slice(0,3)}`;
  return "";
}

if (phoneInput){
  const sync = () => { phoneInput.value = formatUSPhoneDisplay(phoneInput.value); };
  ["input","change","blur","paste"].forEach(evt =>
    phoneInput.addEventListener(evt, () => setTimeout(sync, 0))
  );
  // normalize browser autofill on load
  requestAnimationFrame(sync);
}

/* ---------- Helpers ---------- */
function setLoading(on){
  submitBtn.disabled = on;
  submitBtn.setAttribute("aria-disabled", on ? "true" : "false");
  submitBtn.classList.toggle("is-loading", on);
  labelSpan.textContent = on ? "Processing..." : "Request reservation";

  form.classList.toggle("is-submitting", on);
  form.setAttribute("aria-busy", on ? "true" : "false");
  if (on) form.setAttribute("inert", ""); else form.removeAttribute("inert");

  // show/hide the overlay
  if (overlay){
    overlay.hidden = !on;
    overlay.setAttribute("aria-hidden", on ? "false" : "true");
  }
}


function showStatus(type, msg){
  statusEl.className = `status ${type}`; // success | error | info
  statusEl.textContent = msg;
}

function clearFieldErrors(){
  form.querySelectorAll(".field").forEach(w=>{
    w.classList.remove("invalid");
    const el = w.querySelector("input,select,textarea");
    el?.removeAttribute("aria-invalid");
    el?.removeAttribute("aria-describedby");
  });
}

function emailLooksValid(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFormData(){
  const data = Object.fromEntries(new FormData(form));
  data.marketing_opt_in = form.querySelector("input[name='marketing_opt_in']")?.checked ?? false;
  data.sms_opt_in       = form.querySelector("input[name='sms_opt_in']")?.checked ?? false;

  // normalize
  data.email = (data.email || "").trim().toLowerCase();
  const rawDigits = (data.phone || "").replace(/\D/g, "").slice(-10);
  data.phone = rawDigits ? `+1${rawDigits}` : ""; // E.164
  return data;
}

/* clear invalid state on input/change and on-load autofill */
function clearInvalid(el){
  const wrap = el.closest(".field");
  if (!wrap) return;
  wrap.classList.remove("invalid");
  const slot = wrap.querySelector(".error");
  if (slot) slot.textContent = "";
  el.removeAttribute("aria-invalid");
  el.removeAttribute("aria-describedby");
}
form.querySelectorAll("input, select, textarea").forEach(el => {
  el.addEventListener("input",  () => clearInvalid(el));
  el.addEventListener("change", () => clearInvalid(el));
  if (el.value) clearInvalid(el); // handles autofill on load
});

function validate(){
  clearFieldErrors();
  const errors = {};
  const data = getFormData();

  if(!data.name) errors.name = "Required";
  if(!data.email) errors.email = "Required";
  else if(!emailLooksValid(data.email)) errors.email = "Invalid email";
  if(!data.date) errors.date = "Required";
  if(!data.reservation_time) errors.reservation_time = "Required";
  if(!data.party) errors.party = "Required";

  Object.entries(errors).forEach(([key,msg]) => {
    const field = form.querySelector(`[name='${key}']`);
    const slot  = field?.closest(".field")?.querySelector(".error");
    if (slot){
      slot.textContent = msg;
      const wrap = field.closest(".field");
      wrap?.classList.add("invalid");
      field.setAttribute("aria-invalid","true");
      field.setAttribute("aria-describedby", slot.id || (slot.id = `${field.name}-err`));
    }
  });

  if(Object.keys(errors).length){
    const first = form.querySelector(".field .error:not(:empty)");
    first?.closest(".field")?.querySelector("input, select, textarea")?.focus();
    showStatus("error", "Please fix the highlighted fields.");
    return false;
  }
  showStatus("info", "Submitting your request...");
  return true;
}

/* ---------- Submit ---------- */
let inFlight = false;

form.addEventListener("submit", async e => {
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
    showStatus("error", `Please choose a date within the next ${FORM_CONFIG.maxDaysOut} days.`);
    dateInput.focus();
    return;
  }

  try {
    inFlight = true;
    setLoading(true);

    // Abort the request if it hangs too long
    const controller  = new AbortController();
    const TIMEOUT_MS  = 15000;
    const timeoutId   = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let cfToken = "";
    if (window.turnstile) {
      try {
        cfToken = await turnstile.execute("cf-box", { action: "reserve" });
      } catch {}
    }
    data.cf_token = cfToken;


    const res = await fetch(FORM_CONFIG.webhookURL, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(data),
      signal : controller.signal,
    }).catch(err => {  // make sure we clear timeout even if fetch throws early
      clearTimeout(timeoutId);
      throw err;
    });

    clearTimeout(timeoutId);

    // Try to parse response as JSON; fall back to text
    const ct = res.headers.get("content-type") || "";
    let payload = null;
    if (ct.includes("application/json")) {
      try { payload = await res.json(); } catch {}
    } else {
      try { payload = await res.text(); } catch {}
    }

    const messageFromPayload = p =>
      !p ? "" :
      (typeof p === "string") ? p :
      (p.message || p.error || p.detail || "");

    // Treat HTTP errors OR { success:false } bodies as failures
    const backendFailed = !res.ok || (payload && typeof payload === "object" && payload.success === false);

    if (backendFailed) {
      const msg = messageFromPayload(payload) || `Request failed (${res.status || "error"})`;

      // Gate: 3 open requests
      if (/3\s*open/i.test(msg) || (payload && payload.code === "LIMIT_REACHED")) {
        showStatus("error", "Looks like you already have 3 open requests.");
        if (typeof showDetails === "function") {
          showDetails(`<span class="fine-print">To modify or cancel a request, please call or email reservations@naishoroom.com.</span>`);
        }
        return;
      }

      if (typeof showDetails === "function") showDetails("");
      showStatus("error", msg || "Something went wrong.");
      return;
    }

    // Success
    form.reset();
    timeSelect.innerHTML = `<option value="" disabled selected>Select a time</option>`;
    if (typeof showDetails === "function") showDetails("");
    showStatus("success", "Got it. We will email you shortly.");
  } catch (err) {
    console.error(err);
    if (err?.name === "AbortError") {
      showStatus("error", "Taking a bit too long—please try again.");
    } else {
      // Only show a generic error if nothing specific was shown already
      if (!statusEl.textContent || statusEl.classList.contains("info")) {
        showStatus("error", "Network error. Please try again.");
      }
      if (typeof showDetails === "function") showDetails("");
    }
  } finally {
    inFlight = false;
    setLoading(false);
  }

});

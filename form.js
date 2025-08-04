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
  <select name="party"     required>
    <option value="" disabled selected>Party size</option>
    ${[1,2,3,4,5,6].map(n=>`<option>${n}</option>`).join("")}
  </select>
  <textarea name="notes"   placeholder="Comments"></textarea>
  <button type="submit">Request Reservation</button>
`;

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

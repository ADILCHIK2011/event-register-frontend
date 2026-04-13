const API = "gracious-motivation-production.up.railway.app";

const ism = document.getElementById("ism");
const familiya = document.getElementById("familiya");
const telefon = document.getElementById("telefon");
const eventSelect = document.getElementById("eventSelect");
const submitBtn = document.getElementById("submitBtn");
const alertBox = document.getElementById("alertBox");

// ─── Alert helper ─────────────────────────────────────────────
function showAlert(message, type = "success") {
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  setTimeout(() => alertBox.classList.add("hidden"), 4000);
}

// ─── Eventlarni yuklash ───────────────────────────────────────
async function loadEvents() {
  try {
    const res = await fetch(`${API}/events/getevents`);
    const events = await res.json();

    eventSelect.innerHTML = '<option disabled selected value="">-- Event tanlang --</option>';

    events.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e._id;
      const vaqt = new Date(e.vaqti).toLocaleDateString("uz-UZ", {
        day: "2-digit", month: "long", year: "numeric",
      });
      opt.textContent = `${e.nomi} — ${vaqt} | ${e.lokatsiya}`;
      eventSelect.appendChild(opt);
    });
  } catch {
    showAlert("Eventlarni yuklab bo'lmadi. Server ishlayaptimi?", "error");
  }
}

// ─── Ro'yxatdan o'tish ────────────────────────────────────────
submitBtn.addEventListener("click", async () => {
  const ismVal = ism.value.trim();
  const familiyaVal = familiya.value.trim();
  const telefonVal = telefon.value.trim();
  const eventId = eventSelect.value;

  if (!ismVal || !familiyaVal || !telefonVal || !eventId) {
    showAlert("Barcha maydonlarni to'ldiring!", "warning");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Yuborilmoqda...";

  try {
    const res = await fetch(`${API}/guests/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ism: ismVal,
        familiya: familiyaVal,
        telefon: telefonVal,
        eventId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      showAlert("Muvaffaqiyatli ro'yxatdan o'tdingiz!", "success");
      ism.value = "";
      familiya.value = "";
      telefon.value = "";
      eventSelect.value = "";
    } else {
      showAlert(data.message || "Xatolik yuz berdi.", "error");
    }
  } catch {
    showAlert("Server bilan bog'lanib bo'lmadi.", "error");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Ro'yxatdan o'tish";
});

loadEvents();
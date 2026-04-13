const API = "https://gracious-motivation-production.up.railway.app";

// ─── Elementlar ───────────────────────────────────────────────
const loginPage     = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn      = document.getElementById("loginBtn");
const loginError    = document.getElementById("loginError");
const logoutBtn     = document.getElementById("logoutBtn");
const adminName     = document.getElementById("adminName");
const eventName     = document.getElementById("eventName");
const eventDate     = document.getElementById("eventDate");
const eventLimit    = document.getElementById("eventLimit");
const eventLocation = document.getElementById("eventLocation");
const senButton     = document.getElementById("senButton");
const allEvents     = document.getElementById("allEvents");
const membersModal  = document.getElementById("membersModal");
const modalBody     = document.getElementById("modalBody");
const modalTitle    = document.getElementById("modalTitle");

// ─── Auth tekshiruvi ──────────────────────────────────────────
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const username   = localStorage.getItem("adminUsername");
  if (isLoggedIn === "true" && username) {
    showDashboard(username);
  } else {
    showLogin();
  }
}

function showLogin() {
  loginPage.classList.remove("hidden");
  dashboardPage.classList.add("hidden");
}

function showDashboard(username) {
  loginPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");
  adminName.textContent = username;
  getEvents();
}

// ─── Login ────────────────────────────────────────────────────
loginBtn.addEventListener("click", async () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  if (!username || !password) {
    showLoginError("Username va parolni kiriting");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Tekshirilmoqda...";

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("adminUsername", data.username);
      loginError.classList.add("hidden");
      showDashboard(data.username);
    } else {
      showLoginError(data.message || "Xatolik yuz berdi");
    }
  } catch {
    showLoginError("Server bilan bog'lanib bo'lmadi");
  }

  loginBtn.disabled = false;
  loginBtn.textContent = "Kirish";
});

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove("hidden");
}

// ─── Logout ───────────────────────────────────────────────────
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("adminUsername");
  showLogin();
});

// ─── Event qo'shish ───────────────────────────────────────────
senButton.addEventListener("click", async () => {
  if (!eventName.value || !eventDate.value || !eventLimit.value || !eventLocation.value) {
    alert("Barcha maydonlarni to'ldiring!");
    return;
  }

  try {
    const res = await fetch(`${API}/events/addevent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomi:      eventName.value,
        vaqti:     eventDate.value,
        limit:     Number(eventLimit.value),
        lokatsiya: eventLocation.value,
      }),
    });
    await res.json();
    eventName.value = "";
    eventDate.value = "";
    eventLimit.value = "";
    eventLocation.value = "";
    getEvents();
  } catch (e) {
    console.error(e);
  }
});

// ─── Eventlarni olish ─────────────────────────────────────────
async function getEvents() {
  try {
    const res = await fetch(`${API}/events/getevents`);
    const events = await res.json();
    renderEvents(events);
  } catch (e) {
    console.error(e);
  }
}

// ─── Eventlarni render qilish ─────────────────────────────────
function renderEvents(events) {
  allEvents.innerHTML = "";

  if (events.length === 0) {
    allEvents.innerHTML = `
      <div class="col-span-2 text-center py-12 text-base-content/40">
        Hali event qo'shilmagan
      </div>`;
    return;
  }

  events.forEach((event) => {
    const vaqt = new Date(event.vaqti).toLocaleDateString("uz-UZ", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const card = document.createElement("div");
    card.innerHTML = `
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-base">${event.nomi}</h2>
          <div class="text-sm text-base-content/60 space-y-1">
            <p>🕐 ${vaqt}</p>
            <p>📍 ${event.lokatsiya}</p>
            <p>👥 Limit: <b>${event.limit}</b> ta</p>
          </div>
          <div id="memberCount-${event._id}" class="badge badge-outline badge-sm mt-1">
            Yuklanmoqda...
          </div>
          <div class="card-actions justify-end mt-2">
            <button class="btn btn-primary btn-soft btn-sm view-btn" data-id="${event._id}" data-nomi="${event.nomi}">
              👁️ Memberlar
            </button>
            <button class="btn btn-error btn-soft btn-sm trash-btn" data-id="${event._id}">
              🗑️ O'chirish
            </button>
          </div>
        </div>
      </div>
    `;
    allEvents.append(card);
    loadMemberCount(event._id);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => viewMembers(btn.dataset.id, btn.dataset.nomi));
  });

  document.querySelectorAll(".trash-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteEvent(btn.dataset.id));
  });
}

// ─── Member sonini yuklash (har karta uchun) ──────────────────
async function loadMemberCount(eventId) {
  try {
    const res = await fetch(`${API}/guests/byevent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const members = await res.json();
    const badge = document.getElementById(`memberCount-${eventId}`);
    if (badge) {
      badge.textContent = `${members.length} ta member yozilgan`;
      badge.className = members.length > 0
        ? "badge badge-primary badge-sm mt-1"
        : "badge badge-outline badge-sm mt-1";
    }
  } catch {
    // silent
  }
}

// ─── Memberlarni modal da ko'rish ─────────────────────────────
async function viewMembers(eventId, eventNomi) {
  modalTitle.textContent = `"${eventNomi}" — memberlar`;
  modalBody.innerHTML = `<div class="flex justify-center py-6"><span class="loading loading-spinner"></span></div>`;
  membersModal.showModal();

  try {
    const res = await fetch(`${API}/guests/byevent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const members = await res.json();

    if (members.length === 0) {
      modalBody.innerHTML = `
        <p class="text-center text-base-content/40 py-8">
          Hali hech kim ro'yxatdan o'tmagan
        </p>`;
      return;
    }

    modalBody.innerHTML = `
      <p class="text-sm text-base-content/50 mb-3">Jami: <b>${members.length}</b> ta member</p>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Ism</th>
              <th>Familiya</th>
              <th>Telefon</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((m, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${m.ism}</td>
                <td>${m.familiya}</td>
                <td>${m.telefon}</td>
                <td class="text-base-content/50 text-xs">
                  ${new Date(m.eventId.vaqti).toLocaleDateString("uz-UZ")}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    modalBody.innerHTML = `<p class="text-center text-error py-4">Ma'lumot yuklanmadi</p>`;
  }
}

// ─── Eventni o'chirish ────────────────────────────────────────
async function deleteEvent(eventId) {
  if (!confirm("Bu eventni o'chirishni xohlaysizmi? Barcha memberlar ham o'chadi!")) return;

  try {
    await fetch(`${API}/events/${eventId}`, { method: "DELETE" });
    getEvents();
  } catch (e) {
    console.error(e);
  }
}

// ─── Sahifa ochilganda auth tekshir ───────────────────────────
checkAuth();

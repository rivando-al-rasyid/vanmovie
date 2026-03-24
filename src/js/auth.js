// ── auth.js — shared session & navbar auth UI ────────────────────────────────
// Import this module on every page that has a navbar.
// It reads the session from localStorage and swaps the Login button with a
// user-initial avatar + dropdown when the user is logged in.

const SESSION_KEY = "moviespace_session";

// ── Session helpers ───────────────────────────────────────────────────────────
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email: user.email, loggedAt: Date.now() }),
  );
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function logout() {
  clearSession();
  window.location.href = "index.html";
}

// ── Derive initials from email ────────────────────────────────────────────────
function getInitials(email = "") {
  // "john.doe@..." → "JD"  |  "alice@..." → "AL"
  const local = email.split("@")[0] || "";
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}


// ── Build the avatar + dropdown HTML element ──────────────────────────────────
function buildAvatar(session) {
  const initials = getInitials(session.email);

  const wrapper = document.createElement("div");
  wrapper.className = "avatar-wrapper";

  const btn = document.createElement("button");
  btn.className = "avatar-btn";
  btn.setAttribute("aria-haspopup", "true");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "User menu");
  btn.textContent = initials;

  const dropdown = document.createElement("div");
  dropdown.className = "avatar-dropdown";
  dropdown.innerHTML = `
    <div class="avatar-dropdown-header">
      <div class="avatar-dropdown-label">${initials}</div>
      <div class="avatar-dropdown-email">${session.email}</div>
    </div>
    <a href="mylist.html" class="avatar-dropdown-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
      </svg>
      My Watchlists
    </a>
    <button class="avatar-dropdown-item danger" id="auth-logout-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
      Sign Out
    </button>
  `;

  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);

  // Toggle dropdown
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("open");
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  // Logout
  dropdown.querySelector("#auth-logout-btn").addEventListener("click", () => {
    logout();
  });

  // Close on outside click
  document.addEventListener("click", closeAllDropdowns);

  return wrapper;
}

function closeAllDropdowns() {
  document.querySelectorAll(".avatar-dropdown.open").forEach((d) => {
    d.classList.remove("open");
    d.previousElementSibling?.setAttribute("aria-expanded", "false");
  });
}

// ── Main: replace Login button with avatar if logged in ───────────────────────
export function initNavAuth() {
  userIcon();
  const session = getSession();

  // Find all <a> elements that link to index.html with text "Login"
  document.querySelectorAll("a.btn-nav").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("index.html") || href === "index.html") {
      if (session) {
        // Replace Login button with avatar
        const avatar = buildAvatar(session);
        link.replaceWith(avatar);
      }
      // If not logged in, leave the Login button as-is
    }
  });
}

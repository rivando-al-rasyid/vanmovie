// ── auth.js — Session management & navbar auth UI ───────────────────────────
// Import on every page that has a navbar.
// Reads the session from localStorage and swaps the Login button with a
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

// ── Initials helper ───────────────────────────────────────────────────────────
// "john.doe@..." → "JD"  |  "alice@..." → "AL"

function getInitials(email = "") {
  const local = email.split("@")[0] || "";
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

// ── Close all open dropdowns ──────────────────────────────────────────────────

function closeAllDropdowns() {
  document.querySelectorAll(".avatar-dropdown.open").forEach((dropdown) => {
    dropdown.classList.remove("open");
    dropdown.previousElementSibling?.setAttribute("aria-expanded", "false");
  });
}

// ── Build avatar + dropdown element ──────────────────────────────────────────

function buildAvatar(session) {
  const initials = getInitials(session.email);

  // Wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "avatar-wrapper";

  // Avatar button
  const btn = document.createElement("button");
  btn.className = "avatar-btn";
  btn.setAttribute("aria-haspopup", "true");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "User menu");
  btn.textContent = initials;

  // Dropdown
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

  // Toggle dropdown on button click
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("open");
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  // Logout button
  dropdown.querySelector("#auth-logout-btn").addEventListener("click", logout);

  // Close dropdown when clicking outside
  document.addEventListener("click", closeAllDropdowns);

  return wrapper;
}

// ── initNavAuth ───────────────────────────────────────────────────────────────
// Call on every page. If the user is logged in, replaces the Login button
// with the avatar widget. Also applies the user icon to the logo.

export function initNavAuth() {
  const session = getSession();

  document.querySelectorAll("a.btn-nav").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("index.html") && session) {
      link.replaceWith(buildAvatar(session));
    }
  });
}

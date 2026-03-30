// ── auth.js — Session, Navbar & Auth utilities ───────────────────────────────
// Single source of truth for session management, navbar injection, and avatar UI.
// login.js and signup.js import from here — no logic is duplicated (DRY).

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const SESSION_KEY  = "moviespace_session";
const REMEMBER_KEY = "moviespace_remember_email";

// Mock users — replace with real API calls in production
export const REGISTERED_USERS = [
  { email: "test@example.com",    password: "test123"  },
  { email: "user@moviespace.com", password: "movie123" },
];

// ══════════════════════════════════════════════════════════════════════════════
// SHARED UTILITIES  (DRY — used by login.js, signup.js, and navbar)
// ══════════════════════════════════════════════════════════════════════════════

/** */
export const AuthUtils = {
  /** Basic email format check */
  /**
   *
   * @param {string} email
   * @returns
   */
  isValidEmail: (email) => /\S+@\S+\.\S+/.test(email),

  /** Derive 2-letter initials from an email address */
  getInitials: (email = "") => {
    const local = email.split("@")[0] || "";
    const parts = local.split(/[.\-_]+/).filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : local.slice(0, 2).toUpperCase();
  },

  /**
   * Show or hide an inline error element.
   * @param {string}  id        — element id
   * @param {string}  message   — error text (empty = clear)
   * @param {boolean} isVisible — true to show
   */
  toggleError: (id, message = "", isVisible = false) => {
    const el = document.querySelector(`#${id}`);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("hidden", !isVisible);
  },

  /** Clear a list of error elements at once */
  /**
   *
   * @param  {...any} ids
   * @returns
   */
  clearErrors: (...ids) => ids.forEach((id) => AuthUtils.toggleError(id)),
};

// ══════════════════════════════════════════════════════════════════════════════
// SESSION
// ══════════════════════════════════════════════════════════════════════════════

export const Session = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  },
/**
 *
 * @param {*} user
 * @returns
 */
  save: (user) =>
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email:    user.email,
      loggedAt: Date.now(),
    })),

  clear: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  },
};

export const createHeader = () => {
  document.body.insertAdjacentHTML("afterbegin", `
    <header class="navbar fixed top-0 left-0 right-0 z-50 backdrop-blur">
      <nav class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="index.html" class="flex items-center gap-2 font-semibold no-underline">
          <img src="./src/asset/icon.svg" alt="Icon">
          <span>MovieSpace</span>
        </a>
        <ul class="flex items-center gap-4 list-none m-0 p-0">
          <li>
            <a href="films.html" class="nav-link text-sm no-underline">
              All Films
            </a>
          </li>
          <li>
            <a href="mylist.html"
               class="nav-link text-sm no-underline">
              My Watchlists
            </a>
          </li>
          <li>
            <a href="index.html"
               class="btn-nav text-sm no-underline">
              Login
            </a>
          </li>
        </ul>
      </nav>
    </header>
  `);
};
// ══════════════════════════════════════════════════════════════════════════════
// AVATAR DROPDOWN  (shown when a session exists)
// ══════════════════════════════════════════════════════════════════════════════

const buildAvatar = (session) => {
  const initials = AuthUtils.getInitials(session.email);
  const wrapper  = document.createElement("div");
  wrapper.className = "avatar-wrapper relative ml-4";

  wrapper.innerHTML = `
    <button class="avatar-btn w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm" aria-haspopup="true" aria-expanded="false">
      ${initials}
    </button>
    <div class="avatar-dropdown hidden absolute right-0 mt-2 w-48 bg-white border
                border-gray-200 rounded-lg shadow-lg py-2 z-50">
      <div class="px-4 py-2 border-b border-gray-100 text-xs text-gray-500 truncate">
        ${session.email}
      </div>
      <a href="mylist.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        My Watchlists
      </a>
      <button id="logout-btn"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
        Sign Out
      </button>
    </div>
  `;

  const btn      = wrapper.querySelector(".avatar-btn");
  const dropdown = wrapper.querySelector(".avatar-dropdown");

  btn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("open");
    document.querySelectorAll(".avatar-dropdown.open")
      .forEach((d) => d.classList.remove("open"));
    if (!isOpen) dropdown.classList.add("open");
    btn.setAttribute("aria-expanded", String(!isOpen));
  };

  wrapper.querySelector("#logout-btn").onclick = Session.clear;
  return wrapper;
};

// ══════════════════════════════════════════════════════════════════════════════
// NAVBAR AUTH — replaces the Login button with the avatar when logged in
// ══════════════════════════════════════════════════════════════════════════════

export const initNavAuth = () => {
  const session = Session.get();
  if (!session) return;
  const loginBtn = document.querySelector(".btn-nav");
  if (loginBtn) loginBtn.replaceWith(buildAvatar(session));
};

// ══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP — inject header then wire up auth UI
// ══════════════════════════════════════════════════════════════════════════════

const boot = () => {
  createHeader();
  initNavAuth();

  // Close all avatar dropdowns on outside click
  document.addEventListener("click", () =>
    document.querySelectorAll(".avatar-dropdown.open")
      .forEach((d) => d.classList.remove("open"))
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

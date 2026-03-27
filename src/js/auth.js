// ── auth.js — Optimized Session & Auth Logic ────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// CONFIG & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const SESSION_KEY = "moviespace_session";
const REMEMBER_KEY = "moviespace_remember_email";

// Mock Data (Replace with API calls in production)
const REGISTERED_USERS = [
  { email: "test@example.com",    password: "test123"  },
  { email: "user@moviespace.com", password: "movie123" },
];

// ══════════════════════════════════════════════════════════════════════════════
// CORE UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

const AuthUtils = {
  isValidEmail: (email) => /\S+@\S+\.\S+/.test(email),

  getInitials: (email = "") => {
    const local = email.split("@")[0] || "";
    const parts = local.split(/[.\-_]+/).filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : local.slice(0, 2).toUpperCase();
  },

  toggleError: (id, message = "", isVisible = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    isVisible ? el.classList.remove("hidden") : el.classList.add("hidden");
  }
};

export const Session = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  },
  save: (user) => localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, loggedAt: Date.now() })),
  clear: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// NAVBAR AUTH UI
// ══════════════════════════════════════════════════════════════════════════════

function buildAvatar(session) {
  const initials = AuthUtils.getInitials(session.email);
  const wrapper = document.createElement("div");
  wrapper.className = "avatar-wrapper relative ml-4";

  wrapper.innerHTML = `
    <button class="avatar-btn w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm" aria-haspopup="true" aria-expanded="false">
      ${initials}
    </button>
    <div class="avatar-dropdown hidden absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
      <div class="px-4 py-2 border-b border-gray-100 text-xs text-gray-500 truncate">${session.email}</div>
      <a href="mylist.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Watchlists</a>
      <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
    </div>
  `;

  const btn = wrapper.querySelector(".avatar-btn");
  const dropdown = wrapper.querySelector(".avatar-dropdown");

  btn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("open");
    document.querySelectorAll(".avatar-dropdown").forEach(d => d.classList.remove("open"));
    if (!isOpen) dropdown.classList.add("open");
    btn.setAttribute("aria-expanded", String(!isOpen));
  };

  wrapper.querySelector("#logout-btn").onclick = Session.clear;
  return wrapper;
}

export function initNavAuth() {
  const session = Session.get();
  if (!session) return;

  // Replace the Login button with the avatar
  const loginBtn = document.querySelector(".btn-nav");
  if (loginBtn) loginBtn.replaceWith(buildAvatar(session));
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE LOGIC
// ══════════════════════════════════════════════════════════════════════════════

function initLoginPage() {
  if (Session.get()) return (window.location.href = "films.html");

  const emailInp  = document.getElementById("login-email");
  const passInp   = document.getElementById("login-password");
  const loginBtn  = document.querySelector(".btn-login");
  const rememberChk = document.getElementById("remember-me");

  // Load remembered email
  const savedEmail = localStorage.getItem(REMEMBER_KEY);
  if (savedEmail && emailInp) {
    emailInp.value = savedEmail;
    if (rememberChk) rememberChk.checked = true;
  }

  const handleLogin = async () => {
    // Reset errors
    ["login-email-error", "login-password-error", "login-general-error"].forEach(id =>
      AuthUtils.toggleError(id)
    );

    const email    = emailInp.value.trim().toLowerCase();
    const password = passInp.value;

    if (!AuthUtils.isValidEmail(email))
      return AuthUtils.toggleError("login-email-error", "Enter a valid email", true);
    if (!password)
      return AuthUtils.toggleError("login-password-error", "Password is required", true);

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    await new Promise(r => setTimeout(r, 600)); // Simulated network delay

    const user = REGISTERED_USERS.find(u => u.email === email && u.password === password);

    if (user) {
      if (rememberChk?.checked) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);

      Session.save(user);
      loginBtn.textContent = "Success! Redirecting...";
      setTimeout(() => (window.location.href = "films.html"), 500);
    } else {
      AuthUtils.toggleError(
        "login-general-error",
        "Invalid credentials. Try test@example.com / test123",
        true
      );
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  };

  loginBtn?.addEventListener("click", handleLogin);

  // Allow Enter key to submit
  [emailInp, passInp].forEach(inp =>
    inp?.addEventListener("keydown", e => e.key === "Enter" && handleLogin())
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP PAGE LOGIC
// ══════════════════════════════════════════════════════════════════════════════

function initSignupPage() {
  const form = document.getElementById("signup-form");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    ["email-error", "password-error", "confirm-error"].forEach(id =>
      AuthUtils.toggleError(id)
    );

    const email   = document.getElementById("email").value.trim();
    const pass    = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (!AuthUtils.isValidEmail(email))
      return AuthUtils.toggleError("email-error", "Valid email required", true);
    if (pass.length < 6)
      return AuthUtils.toggleError("password-error", "Min 6 characters required", true);
    if (pass !== confirm)
      return AuthUtils.toggleError("confirm-error", "Passwords do not match", true);

    alert("Registration successful! (Demo only)");
    window.location.href = "index.html";
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION — wait for header to be injected before replacing Login btn
// ══════════════════════════════════════════════════════════════════════════════

function onReady() {
  initNavAuth();

  if (document.getElementById("login-form")) initLoginPage();
  else if (document.getElementById("signup-form")) initSignupPage();

  // Global click: close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".avatar-dropdown").forEach(d => d.classList.remove("open"));
  });
}

// header.js fires 'headerReady' after injecting the navbar.
// If header.js isn't loaded (e.g. pages with inline navbars), fall back to DOMContentLoaded.
document.addEventListener("headerReady", onReady, { once: true });

document.addEventListener("DOMContentLoaded", () => {
  // Only run if headerReady never fired (no header.js on this page)
  if (!document.querySelector(".navbar")) onReady();
});
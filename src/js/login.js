// ── login.js — Login page logic ──────────────────────────────────────────────
import { getSession, saveSession, initNavAuth } from "./auth.js";

// Simulated user store. In production, replace with a real auth API call.
const REGISTERED_USERS = [
  { email: "test@example.com",      password: "test123"  },
  { email: "user@moviespace.com",   password: "movie123" },
];

// Redirect to films page if already logged in
if (getSession()) {
  window.location.href = "films.html";
}

// ── Error helpers ─────────────────────────────────────────────────────────────

function clearErrors() {
  ["login-email-error", "login-password-error", "login-general-error"].forEach((id) => {
    document.getElementById(id)?.classList.add("hidden");
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (msg) el.textContent = msg;
  el.classList.remove("hidden");
}

// ── Loading state ─────────────────────────────────────────────────────────────

function setLoading(loading) {
  const btn = document.querySelector(".btn-login");
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? "Signing in…" : "Sign In";
}

// ── Login handler ─────────────────────────────────────────────────────────────

async function handleLogin() {
  clearErrors();

  const email    = (document.getElementById("login-email")?.value    || "").trim().toLowerCase();
  const password =  document.getElementById("login-password")?.value || "";
  let hasError   = false;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showError("login-email-error", "Please enter a valid email address.");
    hasError = true;
  }

  if (!password) {
    showError("login-password-error", "Password is required.");
    hasError = true;
  }

  if (hasError) return;

  setLoading(true);
  await new Promise((r) => setTimeout(r, 600)); // simulate network delay

  const user = REGISTERED_USERS.find(
    (u) => u.email === email && u.password === password,
  );

  setLoading(false);

  if (!user) {
    showError("login-general-error", "Invalid email or password. Please try again.");
    return;
  }

  saveSession(user);

  // Brief success flash before redirect
  const btn = document.querySelector(".btn-login");
  if (btn) {
    btn.textContent        = "✓ Success! Redirecting…";
    btn.style.background   = "var(--accent)";
  }

  setTimeout(() => { window.location.href = "films.html"; }, 800);
}

// ── Toggle password visibility ────────────────────────────────────────────────

function bindPasswordToggle() {
  const toggle = document.getElementById("toggle-password");
  const input  = document.getElementById("login-password");
  if (!toggle || !input) return;

  toggle.addEventListener("click", () => {
    const isText   = input.type === "text";
    input.type     = isText ? "password" : "text";
    toggle.textContent = isText ? "👁" : "🙈";
  });
}

// ── Remember me — prefill email if previously saved ───────────────────────────

function bindRememberMe() {
  const checkbox  = document.getElementById("remember-me");
  const emailInput = document.getElementById("login-email");
  const saved      = localStorage.getItem("moviespace_remember_email");

  if (saved && emailInput) {
    emailInput.value = saved;
    if (checkbox) checkbox.checked = true;
  }

  checkbox?.addEventListener("change", () => {
    if (checkbox.checked && emailInput?.value) {
      localStorage.setItem("moviespace_remember_email", emailInput.value.trim().toLowerCase());
    } else {
      localStorage.removeItem("moviespace_remember_email");
    }
  });
}

// ── Enter key support ─────────────────────────────────────────────────────────

function bindEnterKey() {
  ["login-email", "login-password"].forEach((id) => {
    document.getElementById(id)?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initNavAuth();
  document.querySelector(".btn-login")?.addEventListener("click", handleLogin);
  bindPasswordToggle();
  bindRememberMe();
  bindEnterKey();
});

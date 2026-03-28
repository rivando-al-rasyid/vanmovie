// ── login.js — Login page logic ───────────────────────────────────────────────
// Imports all shared utilities from auth.js (DRY — no duplication).

import { Session, AuthUtils, REGISTERED_USERS } from "./auth.js";

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS  (local to login only)
// ══════════════════════════════════════════════════════════════════════════════

const REMEMBER_KEY = "moviespace_remember_email";

const ERROR_IDS = ["login-email-error", "login-password-error", "login-general-error"];

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE INIT
// ══════════════════════════════════════════════════════════════════════════════

function initLoginPage() {
  // Redirect if already logged in
  if (Session.get()) {
    window.location.href = "films.html";
    return;
  }

  const emailInp    = document.getElementById("login-email");
  const passInp     = document.getElementById("login-password");
  const loginBtn    = document.querySelector(".btn-login");
  const rememberChk = document.getElementById("remember-me");

  // Pre-fill remembered email
  const savedEmail = localStorage.getItem(REMEMBER_KEY);
  if (savedEmail && emailInp) {
    emailInp.value = savedEmail;
    if (rememberChk) rememberChk.checked = true;
  }

  // ── Core handler ────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    AuthUtils.clearErrors(...ERROR_IDS);

    const email    = emailInp.value.trim().toLowerCase();
    const password = passInp.value;

    if (!AuthUtils.isValidEmail(email))
      return AuthUtils.toggleError("login-email-error", "Enter a valid email", true);

    if (!password)
      return AuthUtils.toggleError("login-password-error", "Password is required", true);

    // Loading state
    loginBtn.disabled   = true;
    loginBtn.textContent = "Signing in…";

    await new Promise((r) => setTimeout(r, 600)); // simulated network delay

    const user = REGISTERED_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Persist "remember me"
      rememberChk?.checked
        ? localStorage.setItem(REMEMBER_KEY, email)
        : localStorage.removeItem(REMEMBER_KEY);

      Session.save(user);
      loginBtn.textContent = "Success! Redirecting…";
      setTimeout(() => (window.location.href = "films.html"), 500);
    } else {
      AuthUtils.toggleError(
        "login-general-error",
        "Invalid credentials.",
        true
      );
      loginBtn.disabled    = false;
      loginBtn.textContent = "Sign In";
    }
  };

  // ── Event listeners ─────────────────────────────────────────────────────────

  loginBtn?.addEventListener("click", handleLogin);

  [emailInp, passInp].forEach((inp) =>
    inp?.addEventListener("keydown", (e) => e.key === "Enter" && handleLogin())
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ENTRY — run only when the login form exists on this page
// ══════════════════════════════════════════════════════════════════════════════

function onReady() {
  if (document.getElementById("login-form")) initLoginPage();
}

// auth.js fires "headerReady" after injecting the navbar; wait for it.
document.addEventListener("headerReady", onReady, { once: true });

// Fallback: if auth.js bootstraps synchronously the event already fired.
if (document.querySelector(".navbar")) onReady();

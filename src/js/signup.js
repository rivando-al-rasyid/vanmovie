// ── signup.js — Signup page logic ────────────────────────────────────────────
// Imports all shared utilities from auth.js (DRY — no duplication).

import { Session, AuthUtils, REGISTERED_USERS } from "./auth.js";

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS  (local to signup only)
// ══════════════════════════════════════════════════════════════════════════════

const ERROR_IDS = ["email-error", "password-error", "confirm-error"];

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP PAGE INIT
// ══════════════════════════════════════════════════════════════════════════════

function initSignupPage() {
  // Redirect if already logged in
  if (Session.get()) {
    window.location.href = "films.html";
    return;
  }

  const form      = document.getElementById("signup-form");
  const submitBtn = form?.querySelector("[type='submit']");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    AuthUtils.clearErrors(...ERROR_IDS);

    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm  = document.getElementById("confirm").value;

    // ── Validation ───────────────────────────────────────────────────────────

    if (!AuthUtils.isValidEmail(email))
      return AuthUtils.toggleError("email-error", "Valid email required", true);

    if (password.length < 6)
      return AuthUtils.toggleError("password-error", "Minimum 6 characters required", true);

    if (password !== confirm)
      return AuthUtils.toggleError("confirm-error", "Passwords do not match", true);

    // Check for duplicate (mock — in production: POST to API)
    const exists = REGISTERED_USERS.some((u) => u.email === email);
    if (exists)
      return AuthUtils.toggleError(
        "email-error",
        "An account with this email already exists",
        true
      );

    // ── Submit ───────────────────────────────────────────────────────────────

    if (submitBtn) {
      submitBtn.disabled   = true;
      submitBtn.textContent = "Creating account…";
    }

    await new Promise((r) => setTimeout(r, 600)); // simulated network delay

    // In production, register the user via API then auto-login.
    // Demo: push to mock list and auto-login.
    const newUser = { email, password };
    REGISTERED_USERS.push(newUser);
    Session.save(newUser);

    if (submitBtn) submitBtn.textContent = "Account created! Redirecting…";
    setTimeout(() => (window.location.href = "films.html"), 600);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ENTRY — run only when the signup form exists on this page
// ══════════════════════════════════════════════════════════════════════════════

function onReady() {
  if (document.getElementById("signup-form")) initSignupPage();
}

document.addEventListener("headerReady", onReady, { once: true });

if (document.querySelector(".navbar")) onReady();

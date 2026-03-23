import "../css/style.css";

const registeredEmails = ["test@example.com", "user@moviespace.com"];

function clearErrors() {
  ["email-error", "password-error", "confirm-error"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (msg) el.textContent = msg;
  el.classList.remove("hidden");
}

function handleSignup() {
  clearErrors();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;
  let hasError = false;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showError("email-error", "Please enter a valid email.");
    hasError = true;
  } else if (registeredEmails.includes(email.toLowerCase())) {
    showError("email-error", "User already exists!");
    hasError = true;
  }

  if (password.length < 6) {
    showError("password-error", "Password must be at least 6 characters.");
    hasError = true;
  }

  if (!confirm || confirm !== password) {
    showError("confirm-error", "Passwords do not match!");
    hasError = true;
  }

  if (!hasError) {
    alert("Account created! Welcome to MovieSpace 🎬");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(".btn-signup")
    ?.addEventListener("click", handleSignup);
});

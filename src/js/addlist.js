// ── addlist.js — Reusable Watchlist Button Module ────────────────────────────
// Provides getMyList, saveMyList, isInList, createWatchlistBtn, and bindMyListBtn.
// Import and use these helpers everywhere instead of duplicating watchlist logic.

const STORAGE_KEY = "moviespace_mylist";

// ── Storage helpers ───────────────────────────────────────────────────────────
export function getMyList() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveMyList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isInList(id) {
  return getMyList().some((f) => f.id === id);
}

export function toggleInList(filmData) {
  const list = getMyList();
  const idx = list.findIndex((f) => f.id === filmData.id);
  if (idx === -1) {
    list.push(filmData);
  } else {
    list.splice(idx, 1);
  }
  saveMyList(list);
  return idx === -1; // true = was added, false = was removed
}

// ── Button state helpers ──────────────────────────────────────────────────────
function setButtonAdded(btn) {
  btn.textContent = "Remove from Watchlist";
  btn.style.borderColor = "var(--accent)";
  btn.style.color = "var(--accent)";
}

function setButtonRemoved(btn) {
  btn.textContent = "Add to Watchlist";
  btn.style.borderColor = "var(--border-subtle)";
  btn.style.color = "var(--text-muted)";
}

// ── createWatchlistBtn ────────────────────────────────────────────────────────
// Creates and returns a fully wired <button> element for any film card.
//
// Usage:
//   import { createWatchlistBtn } from './addlist.js';
//   const btn = createWatchlistBtn(filmData, 'text-xs px-3 py-1.5 rounded-lg');
//   container.appendChild(btn);
//
export function createWatchlistBtn(filmData, extraClasses = "") {
  const btn = document.createElement("button");
  btn.className = [
    "btn-watchlist",
    "transition-colors",
    "cursor-pointer",
    "bg-transparent",
    extraClasses,
  ]
    .filter(Boolean)
    .join(" ");

  btn.style.border = "1px solid var(--border-subtle)";

  // Set initial state
  if (isInList(filmData.id)) {
    setButtonAdded(btn);
  } else {
    setButtonRemoved(btn);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent card click-through if card has its own handler
    const added = toggleInList(filmData);
    if (added) {
      setButtonAdded(btn);
    } else {
      setButtonRemoved(btn);
    }
    // Dispatch a custom event so other parts of the page can react if needed
    btn.dispatchEvent(
      new CustomEvent("watchlist-change", {
        bubbles: true,
        detail: { filmData, added },
      }),
    );
  });

  return btn;
}

// ── bindMyListBtn ─────────────────────────────────────────────────────────────
// Wires up an existing <button id="btn-mylist"> element (used on detail.html).
//
// Usage:
//   import { bindMyListBtn } from './addlist.js';
//   bindMyListBtn(toFilmData(detail));
//
export function bindMyListBtn(filmData) {
  const btn = document.getElementById("btn-mylist");
  if (!btn) return;

  const update = () => {
    if (isInList(filmData.id)) {
      setButtonAdded(btn);
    } else {
      // detail page uses slightly different default text
      btn.textContent = "Add to Watchlist";
      btn.style.borderColor = "";
      btn.style.color = "";
    }
  };

  btn.dataset.film = JSON.stringify(filmData);
  update();

  btn.addEventListener("click", () => {
    toggleInList(filmData);
    update();
  });
}

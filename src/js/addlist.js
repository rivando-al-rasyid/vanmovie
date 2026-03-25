// ── addlist.js — Watchlist helpers ──────────────────────────────────────────
// Provides getMyList, saveMyList, isInList, createWatchlistBtn, bindMyListBtn.
// Import these helpers everywhere instead of duplicating watchlist logic.

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
  return getMyList().some((film) => film.id === id);
}

export function toggleInList(filmData) {
  const list = getMyList();
  const idx  = list.findIndex((film) => film.id === filmData.id);

  if (idx === -1) {
    list.push(filmData);   // add
  } else {
    list.splice(idx, 1);   // remove
  }

  saveMyList(list);
  return idx === -1; // true = added, false = removed
}

// ── Button state helpers ──────────────────────────────────────────────────────

function setAdded(btn) {
  btn.textContent       = "Remove from Watchlist";
  btn.style.borderColor = "var(--accent)";
  btn.style.color       = "var(--accent)";
}

function setRemoved(btn) {
  btn.textContent       = "Add to Watchlist";
  btn.style.borderColor = "var(--border-subtle)";
  btn.style.color       = "var(--text-muted)";
}

// ── createWatchlistBtn ────────────────────────────────────────────────────────
// Creates and returns a fully wired <button> for any film card.
//
// Usage:
//   const btn = createWatchlistBtn(filmData, "text-xs px-3 py-1.5 rounded-full");
//   container.appendChild(btn);

export function createWatchlistBtn(filmData, extraClasses = "") {
  const btn = document.createElement("button");
  btn.className = ["btn-watchlist", "transition-colors", "cursor-pointer", "bg-transparent", extraClasses]
    .filter(Boolean)
    .join(" ");
  btn.style.border = "1px solid var(--border-subtle)";

  isInList(filmData.id) ? setAdded(btn) : setRemoved(btn);

  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent event bubbling through card
    const added = toggleInList(filmData);
    added ? setAdded(btn) : setRemoved(btn);

    btn.dispatchEvent(new CustomEvent("watchlist-change", {
      bubbles: true,
      detail: { filmData, added },
    }));
  });

  return btn;
}

// ── bindMyListBtn ─────────────────────────────────────────────────────────────
// Wires up the existing <button id="btn-mylist"> on detail.html.
//
// Usage:
//   bindMyListBtn(toFilmData(detail));

export function bindMyListBtn(filmData) {
  const btn = document.getElementById("btn-mylist");
  if (!btn) return;

  const update = () => {
    if (isInList(filmData.id)) {
      setAdded(btn);
    } else {
      btn.textContent       = "Add to Watchlist";
      btn.style.borderColor = "";
      btn.style.color       = "";
    }
  };

  btn.dataset.film = JSON.stringify(filmData);
  update();

  btn.addEventListener("click", () => {
    toggleInList(filmData);
    update();
  });
}

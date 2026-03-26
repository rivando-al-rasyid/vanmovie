// ── movies.js — Films list + Film detail + Watchlist helpers ─────────────────
// Single entry-point for both films.html and detail.html.
// Auto-detects the current page and runs the appropriate logic.

import { fetchMovies, fetchMovieDetail, fetchGenreList, imgUrl, toFilmData } from "./fetchData.js";

// ══════════════════════════════════════════════════════════════════════════════
// WATCHLIST HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "moviespace_mylist";

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

export function createWatchlistBtn(filmData, extraClasses = "") {
  const btn = document.createElement("button");
  btn.className = ["btn-watchlist", "transition-colors", "cursor-pointer", "bg-transparent", extraClasses]
    .filter(Boolean)
    .join(" ");
  btn.style.border = "1px solid var(--border-subtle)";

  isInList(filmData.id) ? setAdded(btn) : setRemoved(btn);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const added = toggleInList(filmData);
    added ? setAdded(btn) : setRemoved(btn);

    btn.dispatchEvent(new CustomEvent("watchlist-change", {
      bubbles: true,
      detail: { filmData, added },
    }));
  });

  return btn;
}

// ── myListBtn ─────────────────────────────────────────────────────────────────

export function myListBtn(filmData) {
  const btn = document.getElementById("btn-mylist");
  if (!btn) return;

  const update = () => (isInList(filmData.id) ? setAdded(btn) : setRemoved(btn));

  btn.dataset.film = JSON.stringify(filmData);
  update();

  btn.addEventListener("click", () => {
    toggleInList(filmData);
    update();
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════


if (document.getElementById("film-list")) {
  initFilmsPage();
} else if (document.getElementById("film-detail")) {
  initDetailPage();
}

// ══════════════════════════════════════════════════════════════════════════════
// FILMS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function initFilmsPage() {

  // ── State ─────────────────────────────────────────────────────────────────────

  let allFilms        = [];
  let genres          = {};
  let activeGenreId   = 0;
  let sortDesc        = true;
  let currentPage     = 1;
  const perPage       = 10;
  let totalTMDBPages  = 1;
  let currentTMDBPage = 1;
  let totalResults    = 0;

  // ── DOM refs ──────────────────────────────────────────────────────────────────

  const filmList  = document.getElementById("film-list");
  const pageTitle = document.getElementById("page-title");
  const paginInfo = document.getElementById("pagination-info");
  const pageBtns  = document.getElementById("page-btns");
  const genreMenu = document.getElementById("genre-menu");
  const genreBtn  = document.getElementById("genre-btn");
  const sortBtn   = document.getElementById("sort-btn");

  // ── Film card builder ─────────────────────────────────────────────────────────

  function createFilmCard(film) {
    const poster     = imgUrl(film.poster_path);
    const rating     = film.vote_average ? film.vote_average.toFixed(1) : "N/A";
    const year       = film.release_date ? film.release_date.split("-")[0] : "";
    const filmGenres = (film.genre_ids || []).map((id) => genres[id]).filter(Boolean);
    const desc       = film.overview || "No description available.";
    const truncDesc  = desc.length > 200 ? desc.slice(0, 200) + "…" : desc;

    const li = document.createElement("li");
    li.dataset.filmId = film.id;
    li.className      = "flex gap-4 rounded-xl p-4 transition-colors";
    li.style.cssText  = "background-color:var(--bg-card);border:1px solid var(--border-subtle)";
    li.addEventListener("mouseover", () => (li.style.borderColor = "var(--border)"));
    li.addEventListener("mouseout",  () => (li.style.borderColor = "var(--border-subtle)"));

    // Poster
    if (poster) {
      const img     = document.createElement("img");
      img.src       = poster;
      img.alt       = film.title;
      img.loading   = "lazy";
      img.className = "w-20 h-28 object-cover rounded-lg shrink-0";
      img.style.backgroundColor = "var(--bg-card)";
      img.addEventListener("error", () => { img.src = ""; });
      li.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1";
      placeholder.style.cssText = "background-color:var(--bg-card);color:var(--text-faint)";
      placeholder.textContent   = "No Poster";
      li.appendChild(placeholder);
    }

    // Info column
    const info = document.createElement("div");
    info.className = "flex flex-col gap-1.5 min-w-0";

    // Title + year
    const titleRow = document.createElement("div");
    titleRow.className = "text-sm font-semibold";
    titleRow.appendChild(document.createTextNode(film.title + " "));
    const yearSpan = document.createElement("span");
    yearSpan.className   = "font-normal text-xs";
    yearSpan.textContent = year;
    titleRow.appendChild(yearSpan);

    // Genre tags
    const tagsRow = document.createElement("div");
    tagsRow.className = "flex flex-wrap gap-1";
    filmGenres.forEach((name) => {
      const tag = document.createElement("span");
      tag.className   = "tag";
      tag.textContent = name;
      tagsRow.appendChild(tag);
    });

    // Rating
    const ratingRow = document.createElement("div");
    ratingRow.className = "flex items-center gap-2 text-xs";
    const badge = document.createElement("span");
    badge.className   = "tmdb-badge";
    badge.textContent = "IMDb";
    const ratingVal = document.createElement("span");
    ratingVal.className   = "font-semibold";
    ratingVal.textContent = `${rating} ★`;
    const votes = document.createElement("span");
    votes.textContent = `(${(film.vote_count || 0).toLocaleString()} votes)`;
    ratingRow.append(badge, ratingVal, votes);

    // Overview
    const overview = document.createElement("p");
    overview.className   = "text-xs leading-relaxed m-0";
    overview.textContent = truncDesc;

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "flex gap-2 mt-1";

    const detailLink = document.createElement("a");
    detailLink.href        = `detail.html?id=${film.id}`;
    detailLink.className   = "btn-primary text-xs px-3 py-1.5 rounded-full no-underline";
    detailLink.textContent = "View Details";

    const watchlistBtn = createWatchlistBtn(toFilmData(film), "text-xs px-3 py-1.5 rounded-full");

    actions.append(detailLink, watchlistBtn);
    info.append(titleRow, tagsRow, ratingRow, overview, actions);
    li.appendChild(info);

    return li;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  function renderFilms() {
    if (!allFilms.length) {
      filmList.replaceChildren(
        Object.assign(document.createElement("p"), {
          className:   "py-8 text-center",
          textContent: "Tidak ada film ditemukan.",
        })
      );
      pageTitle.textContent = "All Films (0)";
      return;
    }

    const start     = (currentPage - 1) * perPage;
    const pageFilms = allFilms.slice(start, start + perPage);
    filmList.replaceChildren(...pageFilms.map(createFilmCard));
  }

  function renderPagination() {
    const localPages = Math.ceil(allFilms.length / perPage);
    const grandTotal = Math.min(totalResults, 5000);

    pageTitle.textContent = `All Films (${grandTotal.toLocaleString()}+)`;

    const startItem = (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
    const endItem   = Math.min(startItem + perPage - 1, grandTotal);
    paginInfo.textContent = `${startItem} – ${endItem} of ${grandTotal.toLocaleString()}`;

    const isFirst = currentPage <= 1 && currentTMDBPage <= 1;
    const isLast  = currentPage >= localPages && currentTMDBPage >= totalTMDBPages;

    const makeArrow = (label, symbol, disabled, onClick) => {
      const btn = document.createElement("button");
      btn.type        = "button";
      btn.ariaLabel   = label;
      btn.textContent = symbol;
      btn.disabled    = disabled;
      btn.className   = "disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg leading-none cursor-pointer bg-transparent border-none p-0";
      btn.style.color = "var(--text-muted)";
      btn.addEventListener("mouseover", () => { if (!disabled) btn.style.color = "var(--text)"; });
      btn.addEventListener("mouseout",  () => {                btn.style.color = "var(--text-muted)"; });
      btn.addEventListener("click", onClick);
      return btn;
    };

    const prevBtn = makeArrow("Previous page", "‹", isFirst, () => {
      if (currentPage > 1) {
        currentPage--;
        renderFilms();
        renderPagination();
      } else if (currentTMDBPage > 1) {
        currentTMDBPage--;
        currentPage = Math.ceil(20 / perPage);
        loadFilms();
      }
      window.scrollTo(0, 0);
    });

    const nextBtn = makeArrow("Next page", "›", isLast, () => {
      if (currentPage < localPages) {
        currentPage++;
        renderFilms();
        renderPagination();
      } else if (currentTMDBPage < totalTMDBPages) {
        currentTMDBPage++;
        currentPage = 1;
        loadFilms();
      }
      window.scrollTo(0, 0);
    });

    pageBtns.replaceChildren(prevBtn, nextBtn);
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  async function loadFilms() {
    try {
      const data = await fetchMovies({
        page:     currentTMDBPage,
        sortDesc,
        genreId:  activeGenreId,
        minVotes: 500,
      });

      totalTMDBPages = Math.min(data.total_pages || 1, 250);
      totalResults   = data.total_results || 0;
      allFilms       = data.results || [];

      renderFilms();
      renderPagination();
    } catch {
      filmList.replaceChildren(
        Object.assign(document.createElement("p"), {
          className:   "py-8 text-center",
          textContent: "Gagal memuat data. Coba refresh halaman.",
        })
      );
    }
  }

  // ── Genre menu ────────────────────────────────────────────────────────────────

  function buildGenreMenu(list) {
    const allItem = document.createElement("li");
    allItem.className       = "dropdown-item px-4 py-2 text-sm cursor-pointer";
    allItem.textContent     = "All Genres";
    allItem.dataset.genreId = "0";

    const items = [allItem, ...list.map((g) => {
      const li = document.createElement("li");
      li.className       = "dropdown-item px-4 py-2 text-sm cursor-pointer";
      li.textContent     = g.name;
      li.dataset.genreId = g.id;
      return li;
    })];

    genreMenu.replaceChildren(...items);

    genreMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".dropdown-item");
      if (!item) return;
      filterByGenre(Number(item.dataset.genreId), item.textContent.trim());
    });
  }

  // ── Controls ──────────────────────────────────────────────────────────────────

  function toggleGenreMenu() {
    genreMenu.classList.toggle("hidden");
    genreMenu.classList.toggle("open");
  }

  function filterByGenre(id, name) {
    activeGenreId   = id;
    currentTMDBPage = 1;
    currentPage     = 1;

    genreMenu.classList.add("hidden");
    genreMenu.classList.remove("open");

    genreBtn.innerHTML = `${name.toUpperCase()} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
    genreBtn.classList.toggle("active-filter", id !== 0);

    loadFilms();
  }

  function toggleSort() {
    sortDesc = !sortDesc;
    sortBtn.innerHTML = `SORT BY IMDb ${sortDesc ? "↓" : "↑"} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;
    currentTMDBPage = 1;
    currentPage     = 1;
    loadFilms();
  }

  // ── Event listeners ───────────────────────────────────────────────────────────

  genreBtn.addEventListener("click", toggleGenreMenu);
  sortBtn.addEventListener("click", toggleSort);

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#genre-btn") && !e.target.closest("#genre-menu")) {
      genreMenu.classList.add("hidden");
      genreMenu.classList.remove("open");
    }
  });

  // ── Init ──────────────────────────────────────────────────────────────────────

  try {
    const genreList = await fetchGenreList();
    genreList.forEach((g) => (genres[g.id] = g.name));
    buildGenreMenu(genreList);
    await loadFilms();
  } catch (err) {
    filmList.replaceChildren(
      Object.assign(document.createElement("p"), {
        className:   "py-8 text-center",
        textContent: err.message.includes("API_KEY")
          ? "⚠️ API Key belum diset. Edit CONFIG di fetchData.js"
          : "Gagal memuat data dari TMDB.",
      })
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

function initDetailPage() {

  // ── DOM refs ──────────────────────────────────────────────────────────────────

  const detailEl     = document.getElementById("film-detail");
  const breadcrumb   = document.getElementById("breadcrumb-title");
  const titleEl      = document.getElementById("detail-title");
  const yearEl       = document.getElementById("detail-year");
  const runtimeEl    = document.getElementById("detail-runtime");
  const languageEl   = document.getElementById("detail-language");
  const taglineEl    = document.getElementById("detail-tagline");
  const overviewEl   = document.getElementById("detail-overview");
  const ratingEl     = document.getElementById("detail-rating");
  const votesEl      = document.getElementById("detail-votes");
  const popularityEl = document.getElementById("detail-popularity");
  const genresEl     = document.getElementById("detail-genres");
  const tmdbBtn      = document.getElementById("btn-tmdb");

  // ── Utilities ─────────────────────────────────────────────────────────────────

  function formatRuntime(minutes) {
    if (!minutes) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }

  function showError(message) {
    detailEl.replaceChildren(
      Object.assign(document.createElement("p"), {
        className:   "py-8 text-center",
        textContent: message,
      })
    );
    detailEl.classList.remove("hidden");
  }

  // ── Load & render ─────────────────────────────────────────────────────────────

  async function loadDetail(movieId) {
    try {
      const detail = await fetchMovieDetail(movieId);

      detailEl.classList.remove("hidden");

      document.title         = `MovieSpace — ${detail.title}`;
      breadcrumb.textContent = detail.title;

      // Poster
      const posterUrl = imgUrl(detail.poster_path);
      const posterEl  = document.getElementById("detail-poster");
      if (posterUrl) {
        posterEl.src = posterUrl;
        posterEl.alt = detail.title;
      } else {
        posterEl.closest("div").style.display = "none";
      }

      // Basic info
      titleEl.textContent    = detail.title;
      yearEl.textContent     = detail.release_date ? detail.release_date.split("-")[0] : "";
      runtimeEl.textContent  = formatRuntime(detail.runtime);
      languageEl.textContent = detail.original_language || "";
      taglineEl.textContent  = detail.tagline  || "";
      overviewEl.textContent = detail.overview || "No description available.";

      // Rating
      const rating = detail.vote_average ? detail.vote_average.toFixed(1) : "N/A";
      ratingEl.textContent     = `${rating} ★`;
      votesEl.textContent      = detail.vote_count  ? `(${detail.vote_count.toLocaleString()} votes)`  : "";
      popularityEl.textContent = detail.popularity  ? `Popularity: ${detail.popularity.toFixed(0)}`    : "";

      // Genre tags
      const tags = (detail.genres || []).map((g) =>
        Object.assign(document.createElement("span"), {
          className:   "tag",
          textContent: g.name,
        })
      );
      genresEl.replaceChildren(...tags);

      // TMDB link
      tmdbBtn.href = `https://www.themoviedb.org/movie/${movieId}`;

      // Watchlist button
      myListBtn(toFilmData(detail));

    } catch (err) {
      console.error(err);
      showError(
        err.message.includes("API_KEY")
          ? "⚠️ API Key belum diset. Edit CONFIG di fetchData.js"
          : "Gagal memuat data. Coba refresh halaman.",
      );
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  const movieId = new URLSearchParams(location.search).get("id");

  if (!movieId) {
    showError("Film tidak ditemukan.");
  } else {
    loadDetail(movieId);
  }
}
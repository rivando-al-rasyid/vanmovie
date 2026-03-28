// ── movies.js — Films list + Film detail + My Watchlist page ─────────────────
// Single module that handles films.html, detail.html, AND mylist.html.
// mylist.js has been merged here (DRY — shared card builder, watchlist helpers).

import { fetchMovies, fetchMovieDetail, fetchGenreList, imgUrl, toFilmData } from "./fetchData.js";

// ══════════════════════════════════════════════════════════════════════════════
// WATCHLIST HELPERS  (shared by films, detail, and mylist sections)
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "moviespace_mylist";

export function getMyList() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function saveMyList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const isInList  = (id)       => getMyList().some((f) => f.id === id);
export const removeFromList = (id)  => saveMyList(getMyList().filter((f) => f.id !== id));

export function toggleInList(filmData) {
  const list = getMyList();
  const idx  = list.findIndex((f) => f.id === filmData.id);
  idx === -1 ? list.push(filmData) : list.splice(idx, 1);
  saveMyList(list);
  return idx === -1; // true = added
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED CARD PRIMITIVES  (DRY — used by film-list card AND mylist card)
// ══════════════════════════════════════════════════════════════════════════════

/** Build the poster <img> or a "No Poster" placeholder */
function buildPoster(film) {
  const poster = imgUrl(film.poster_path);
  if (poster) {
    const img     = document.createElement("img");
    img.src       = poster;
    img.alt       = film.title;
    img.loading   = "lazy";
    img.className = "w-20 h-28 object-cover rounded-lg shrink-0";
    img.style.backgroundColor = "var(--bg-card)";
    img.addEventListener("error", () => { img.src = ""; });
    return img;
  }
  const ph = document.createElement("div");
  ph.className  = "w-20 h-28 shrink-0 rounded-lg flex items-center justify-center text-xs text-center p-1";
  ph.style.cssText = "background-color:var(--bg-card);color:var(--text-faint)";
  ph.textContent   = "No Poster";
  return ph;
}

/** Build the title row: "Title <year>" */
function buildTitleRow(film) {
  const year = film.release_date ? film.release_date.split("-")[0] : "";
  const div  = document.createElement("div");
  div.className = "text-sm font-semibold";
  div.appendChild(document.createTextNode(film.title + " "));
  const yr = document.createElement("span");
  yr.className   = "font-normal text-xs";
  yr.textContent = year;
  div.appendChild(yr);
  return div;
}

/** Build the IMDb rating row */
function buildRatingRow(film) {
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "N/A";
  const row    = document.createElement("div");
  row.className = "flex items-center gap-2 text-xs";
  row.innerHTML = `
    <span class="tmdb-badge">IMDb</span>
    <span class="font-semibold">${rating} ★</span>
    <span>(${(film.vote_count || 0).toLocaleString()} votes)</span>
  `;
  return row;
}

/** Build the overview <p> (truncated to 200 chars) */
function buildOverview(film) {
  const desc = film.overview || "No description available.";
  const p    = document.createElement("p");
  p.className   = "text-xs leading-relaxed m-0";
  p.textContent = desc.length > 200 ? desc.slice(0, 200) + "…" : desc;
  return p;
}

/** Build a styled <li> card shell with hover effect */
function buildCardShell(extraClass = "") {
  const li = document.createElement("li");
  li.className  = `flex gap-4 rounded-xl p-4 transition-colors ${extraClass}`.trim();
  li.style.cssText = "background-color:var(--bg-card);border:1px solid var(--border-subtle)";
  li.addEventListener("mouseover", () => (li.style.borderColor = "var(--border)"));
  li.addEventListener("mouseout",  () => (li.style.borderColor = "var(--border-subtle)"));
  return li;
}

// ── Watchlist button helpers ──────────────────────────────────────────────────

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

export function createWatchlistBtn(filmData, extraClasses = "") {
  const btn = document.createElement("button");
  btn.className = ["btn-watchlist", "transition-colors", "cursor-pointer", "bg-transparent", extraClasses]
    .filter(Boolean).join(" ");
  btn.style.border = "1px solid var(--border-subtle)";

  isInList(filmData.id) ? setAdded(btn) : setRemoved(btn);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const added = toggleInList(filmData);
    added ? setAdded(btn) : setRemoved(btn);
    btn.dispatchEvent(new CustomEvent("watchlist-change", {
      bubbles: true,
      detail:  { filmData, added },
    }));
  });
  return btn;
}

/** Wire up the #btn-mylist button on the detail page */
export function myListBtn(filmData) {
  const btn = document.getElementById("btn-mylist");
  if (!btn) return;
  const update = () => (isInList(filmData.id) ? setAdded(btn) : setRemoved(btn));
  btn.dataset.film = JSON.stringify(filmData);
  update();
  btn.addEventListener("click", () => { toggleInList(filmData); update(); });
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT — auto-detect current page
// ══════════════════════════════════════════════════════════════════════════════

if      (document.getElementById("film-list"))   initFilmsPage();
else if (document.getElementById("film-detail"))  initDetailPage();
else if (document.getElementById("mylist-films")) initMyListPage();

// ══════════════════════════════════════════════════════════════════════════════
// FILMS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function initFilmsPage() {
  let allFilms        = [];
  let genres          = {};
  let activeGenreId   = 0;
  let sortDesc        = true;
  let currentPage     = 1;
  let totalTMDBPages  = 1;
  let currentTMDBPage = 1;
  let totalResults    = 0;
  const perPage       = 10;

  const filmList  = document.getElementById("film-list");
  const pageTitle = document.getElementById("page-title");
  const paginInfo = document.getElementById("pagination-info");
  const pageBtns  = document.getElementById("page-btns");
  const genreMenu = document.getElementById("genre-menu");
  const genreBtn  = document.getElementById("genre-btn");
  const sortBtn   = document.getElementById("sort-btn");

  // ── Film card (films.html) ──────────────────────────────────────────────────

  function createFilmCard(film) {
    const filmGenres = (film.genre_ids || []).map((id) => genres[id]).filter(Boolean);
    const li         = buildCardShell();
    li.dataset.filmId = film.id;

    // Genre tags
    const tagsRow = document.createElement("div");
    tagsRow.className = "flex flex-wrap gap-1";
    filmGenres.forEach((name) => {
      const tag = document.createElement("span");
      tag.className   = "tag";
      tag.textContent = name;
      tagsRow.appendChild(tag);
    });

    // Action buttons
    const actions    = document.createElement("div");
    actions.className = "flex gap-2 mt-1";
    const detailLink = document.createElement("a");
    detailLink.href        = `detail.html?id=${film.id}`;
    detailLink.className   = "btn-primary text-xs px-3 py-1.5 rounded-full no-underline";
    detailLink.textContent = "View Details";
    actions.append(detailLink, createWatchlistBtn(toFilmData(film), "text-xs px-3 py-1.5 rounded-full"));

    const info = document.createElement("div");
    info.className = "flex flex-col gap-1.5 min-w-0";
    info.append(buildTitleRow(film), tagsRow, buildRatingRow(film), buildOverview(film), actions);

    li.append(buildPoster(film), info);
    return li;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
    const start = (currentPage - 1) * perPage;
    filmList.replaceChildren(...allFilms.slice(start, start + perPage).map(createFilmCard));
  }

  function renderPagination() {
    const localPages  = Math.ceil(allFilms.length / perPage);
    const grandTotal  = Math.min(totalResults, 5000);
    pageTitle.textContent = `All Films (${grandTotal.toLocaleString()}+)`;

    const startItem = (currentTMDBPage - 1) * 20 + (currentPage - 1) * perPage + 1;
    const endItem   = Math.min(startItem + perPage - 1, grandTotal);
    paginInfo.textContent = `${startItem} – ${endItem} of ${grandTotal.toLocaleString()}`;

    const isFirst = currentPage <= 1 && currentTMDBPage <= 1;
    const isLast  = currentPage >= localPages && currentTMDBPage >= totalTMDBPages;

    const makeArrow = (label, symbol, disabled, onClick) => {
      const btn = document.createElement("button");
      Object.assign(btn, { type: "button", ariaLabel: label, textContent: symbol, disabled });
      btn.className = "disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg leading-none cursor-pointer bg-transparent border-none p-0";
      btn.style.color = "var(--text-muted)";
      btn.addEventListener("mouseover", () => { if (!disabled) btn.style.color = "var(--text)"; });
      btn.addEventListener("mouseout",  () => {                btn.style.color = "var(--text-muted)"; });
      btn.addEventListener("click", onClick);
      return btn;
    };

    pageBtns.replaceChildren(
      makeArrow("Previous page", "‹", isFirst, () => {
        if (currentPage > 1) { currentPage--; renderFilms(); renderPagination(); }
        else if (currentTMDBPage > 1) { currentTMDBPage--; currentPage = Math.ceil(20 / perPage); loadFilms(); }
        window.scrollTo(0, 0);
      }),
      makeArrow("Next page", "›", isLast, () => {
        if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(); }
        else if (currentTMDBPage < totalTMDBPages) { currentTMDBPage++; currentPage = 1; loadFilms(); }
        window.scrollTo(0, 0);
      })
    );
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  async function loadFilms() {
    try {
      const data     = await fetchMovies({ page: currentTMDBPage, sortDesc, genreId: activeGenreId, minVotes: 500 });
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

  // ── Genre menu ──────────────────────────────────────────────────────────────

  function buildGenreMenu(list) {
    const items = [{ id: 0, name: "All Genres" }, ...list].map((g) => {
      const li = document.createElement("li");
      li.className       = "dropdown-item px-4 py-2 text-sm cursor-pointer";
      li.textContent     = g.name;
      li.dataset.genreId = g.id;
      return li;
    });
    genreMenu.replaceChildren(...items);
    genreMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".dropdown-item");
      if (item) filterByGenre(Number(item.dataset.genreId), item.textContent.trim());
    });
  }

  function filterByGenre(id, name) {
    activeGenreId = id; currentTMDBPage = 1; currentPage = 1;
    genreMenu.classList.add("hidden"); genreMenu.classList.remove("open");
    genreBtn.innerHTML = `${name.toUpperCase()} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
    genreBtn.classList.toggle("active-filter", id !== 0);
    loadFilms();
  }

  // ── Controls ────────────────────────────────────────────────────────────────

  genreBtn.addEventListener("click", () => {
    genreMenu.classList.toggle("hidden");
    genreMenu.classList.toggle("open");
  });

  sortBtn.addEventListener("click", () => {
    sortDesc = !sortDesc;
    sortBtn.innerHTML = `SORT BY IMDb ${sortDesc ? "↓" : "↑"} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;
    currentTMDBPage = 1; currentPage = 1;
    loadFilms();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#genre-btn") && !e.target.closest("#genre-menu")) {
      genreMenu.classList.add("hidden"); genreMenu.classList.remove("open");
    }
  });

  // ── Init ────────────────────────────────────────────────────────────────────

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

  const formatRuntime = (min) => {
    if (!min) return "";
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  const showError = (msg) => {
    detailEl.replaceChildren(
      Object.assign(document.createElement("p"), { className: "py-8 text-center", textContent: msg })
    );
    detailEl.classList.remove("hidden");
  };

  async function loadDetail(movieId) {
    try {
      const detail = await fetchMovieDetail(movieId);
      detailEl.classList.remove("hidden");
      document.title         = `MovieSpace — ${detail.title}`;
      breadcrumb.textContent = detail.title;

      const posterUrl = imgUrl(detail.poster_path);
      const posterEl  = document.getElementById("detail-poster");
      if (posterUrl) { posterEl.src = posterUrl; posterEl.alt = detail.title; }
      else            { posterEl.closest("div").style.display = "none"; }

      titleEl.textContent    = detail.title;
      yearEl.textContent     = detail.release_date ? detail.release_date.split("-")[0] : "";
      runtimeEl.textContent  = formatRuntime(detail.runtime);
      languageEl.textContent = detail.original_language || "";
      taglineEl.textContent  = detail.tagline  || "";
      overviewEl.textContent = detail.overview || "No description available.";

      const rating = detail.vote_average ? detail.vote_average.toFixed(1) : "N/A";
      ratingEl.textContent     = `${rating} ★`;
      votesEl.textContent      = detail.vote_count  ? `(${detail.vote_count.toLocaleString()} votes)`  : "";
      popularityEl.textContent = detail.popularity  ? `Popularity: ${detail.popularity.toFixed(0)}`    : "";

      genresEl.replaceChildren(
        ...(detail.genres || []).map((g) =>
          Object.assign(document.createElement("span"), { className: "tag", textContent: g.name })
        )
      );

      tmdbBtn.href = `https://www.themoviedb.org/movie/${movieId}`;
      myListBtn(toFilmData(detail));
    } catch (err) {
      showError(
        err.message.includes("API_KEY")
          ? "⚠️ API Key belum diset. Edit CONFIG di fetchData.js"
          : "Gagal memuat data. Coba refresh halaman."
      );
    }
  }

  const movieId = new URLSearchParams(location.search).get("id");
  movieId ? loadDetail(movieId) : showError("Film tidak ditemukan.");
}

// ══════════════════════════════════════════════════════════════════════════════
// MY WATCHLIST PAGE  (merged from mylist.js — DRY: reuses buildPoster,
//                    buildTitleRow, buildRatingRow, buildOverview, buildCardShell)
// ══════════════════════════════════════════════════════════════════════════════

function initMyListPage() {
  const listEl  = document.getElementById("mylist-films");
  const emptyEl = document.getElementById("empty-state");
  const countEl = document.getElementById("list-count");

  /** Build a watchlist card (extends shared primitives with a Remove button) */
  function createMyListCard(film) {
    const li = buildCardShell();
    li.dataset.id = film.id;

    // Remove button
    const removeBtn = document.createElement("button");
    Object.assign(removeBtn, { type: "button", textContent: "Remove" });
    removeBtn.className = "btn-remove text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer bg-transparent";
    removeBtn.style.cssText = "border:1px solid var(--border-subtle);color:var(--text-muted)";
    removeBtn.addEventListener("mouseover", () => {
      removeBtn.style.borderColor = "var(--error)";
      removeBtn.style.color       = "var(--error)";
    });
    removeBtn.addEventListener("mouseout", () => {
      removeBtn.style.borderColor = "var(--border-subtle)";
      removeBtn.style.color       = "var(--text-muted)";
    });
    removeBtn.addEventListener("click", () => {
      removeFromList(film.id);
      renderMyList();
    });

    // Detail link
    const detailLink = document.createElement("a");
    detailLink.href        = `detail.html?id=${film.id}`;
    detailLink.className   = "btn-primary text-xs px-3 py-1.5 rounded-full no-underline";
    detailLink.textContent = "View Details";

    const actions = document.createElement("div");
    actions.className = "flex gap-2 mt-1";
    actions.append(detailLink, removeBtn);

    const info = document.createElement("div");
    info.className = "flex flex-col gap-1.5 min-w-0 flex-1";
    info.append(buildTitleRow(film), buildRatingRow(film), buildOverview(film), actions);

    li.append(buildPoster(film), info);
    return li;
  }

  function renderMyList() {
    const list = getMyList();
    countEl.textContent = list.length ? `(${list.length})` : "";

    if (!list.length) {
      listEl.replaceChildren();
      emptyEl.classList.remove("hidden");
      emptyEl.style.display = "flex";
      return;
    }

    emptyEl.classList.add("hidden");
    emptyEl.style.display = "";
    listEl.replaceChildren(...list.map(createMyListCard));
  }

  renderMyList();
}

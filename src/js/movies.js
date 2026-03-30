// ── movies.js — Films list + Film detail + My Watchlist page ─────────────────
// Single module that handles films.html, detail.html, AND mylist.html.
// mylist.js has been merged here (DRY — shared card builder, watchlist helpers).
//
// popularity from TMDB. All filtering and sorting is done in-memory after
// that — no further TMDB page fetches are needed.

import { fetchMovies, fetchMovieDetail, fetchGenreList, imgUrl, toFilmData } from "./fetchData.js";

// ══════════════════════════════════════════════════════════════════════════════
// WATCHLIST HELPERS  (shared by films, detail, and mylist sections)
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "moviespace_mylist";

export const getMyList = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};

export const saveMyList = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const isInList = (id) =>
  getMyList().some((film) => film.id === id);

export const removeFromList = (id) => {
  const filteredList = getMyList().filter((film) => film.id !== id);
  saveMyList(filteredList);
};

export const toggleInList = (filmData) => {
  const list = getMyList();
  const existingIndex = list.findIndex((film) => film.id === filmData.id);

  const isAlreadyInList = existingIndex !== -1;

  if (isAlreadyInList) {
    list.splice(existingIndex, 1);
  } else {
    list.push(filmData);
  }

  saveMyList(list);

  const wasAdded = !isAlreadyInList;
  return wasAdded;
};

// ══════════════════════════════════════════════════════════════════════════════
// SHARED CARD PRIMITIVES  (DRY — used by film-list card AND mylist card)
// ══════════════════════════════════════════════════════════════════════════════

/** Build the poster <img> or a "No Poster" placeholder */
const buildPoster = (film) => {
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
};

/** Build the title row: "Title <year>" */
const buildTitleRow = (film) => {
  const year = film.release_date ? film.release_date.split("-")[0] : "";
  const div  = document.createElement("div");
  div.className = "text-sm font-semibold";
  div.appendChild(document.createTextNode(film.title + " "));
  const yr = document.createElement("span");
  yr.className   = "font-normal text-xs";
  yr.textContent = year;
  div.appendChild(yr);
  return div;
};

/** Build the IMDB rating row */
const buildRatingRow = (film) => {
  const rating = film.vote_average ? film.vote_average.toFixed(1) : "N/A";
  const row    = document.createElement("div");
  row.className = "flex items-center gap-2 text-xs";
  row.innerHTML = `
    <span class="tmdb-badge">IMDB</span>
    <span class="font-semibold">${rating} ★</span>
    <span>(${(film.vote_count || 0).toLocaleString()} votes)</span>
  `;
  return row;
};

/** Build the overview <p> (truncated to 200 chars) */
const buildOverview = (film) => {
  const desc = film.overview || "No description available.";
  const p    = document.createElement("p");
  p.className   = "text-xs leading-relaxed m-0";
  p.textContent = desc.length > 200 ? desc.slice(0, 200) + "…" : desc;
  return p;
};

/** Build a styled <li> card shell with hover effect */
const buildCardShell = (extraClass = "") => {
  const li = document.createElement("li");
  li.className  = `flex gap-4 rounded-xl p-4 transition-colors ${extraClass}`.trim();
  li.style.cssText = "background-color:var(--bg-card);border:1px solid var(--border-subtle)";
  li.addEventListener("mouseover", () => (li.style.borderColor = "var(--border)"));
  li.addEventListener("mouseout",  () => (li.style.borderColor = "var(--border-subtle)"));
  return li;
};

// ── Watchlist button helpers ──────────────────────────────────────────────────

const setAdded = (btn) => {
  btn.textContent       = "Remove from Watchlist";
  btn.style.borderColor = "var(--accent)";
  btn.style.color       = "var(--accent)";
};

const setRemoved = (btn) => {
  btn.textContent       = "Add to Watchlist";
  btn.style.borderColor = "var(--border-subtle)";
  btn.style.color       = "var(--text-muted)";
};

export const createWatchlistBtn = (filmData, extraClasses = "") => {
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
};

/** Wire up the #btn-mylist button on the detail page */
export const myListBtn = (filmData) => {
  const btn = document.querySelector("#btn-mylist");
  if (!btn) return;
  const update = () => (isInList(filmData.id) ? setAdded(btn) : setRemoved(btn));
  btn.dataset.film = JSON.stringify(filmData);
  update();
  btn.addEventListener("click", () => { toggleInList(filmData); update(); });
};

// ══════════════════════════════════════════════════════════════════════════════
// sorting, and pagination happen purely in-memory.
// ══════════════════════════════════════════════════════════════════════════════

const TOP_100_PAGES  = 5;   // 5 × 20 results = 100 films
const TOP_100_TOTAL  = 100;

const initFilmsPage = async () => {
  let top100Films     = [];  // full 100 films fetched once
  let displayedFilms  = [];  // subset after genre filter + sort
  let genres          = {};
  let activeGenreId   = 0;
  let sortDesc        = true;  // true = popularity desc (default), false = asc
  let currentPage     = 1;
  const perPage       = 10;

  const filmList  = document.querySelector("#film-list");
  const pageTitle = document.querySelector("#page-title");
  const paginInfo = document.querySelector("#pagination-info");
  const pageBtns  = document.querySelector("#page-btns");
  const genreMenu = document.querySelector("#genre-menu");
  const genreBtn  = document.querySelector("#genre-btn");
  const sortBtn   = document.querySelector("#sort-btn");

  // ── Film card (films.html) ────────────────────────────────────────────────

  const createFilmCard = (film) => {
    const filmGenres = (film.genre_ids || [])
      .map((id) => genres[id])
      .filter(Boolean);

    const card = buildCardShell();
    card.dataset.filmId = film.id;

    const infoColumn = document.createElement("div");
    infoColumn.className = "flex flex-col gap-1.5 min-w-0";
    infoColumn.append(
      buildTitleRow(film),
      buildGenreTagsRow(filmGenres),
      buildRatingRow(film),
      buildOverview(film),
      buildActionsRow(film),
    );

    card.append(buildPoster(film), infoColumn);
    return card;
  };

  const buildGenreTagsRow = (genreNames) => {
    const row = document.createElement("div");
    row.className = "flex flex-wrap gap-1";
    genreNames.forEach((name) => {
      const tag = document.createElement("span");
      tag.className   = "tag";
      tag.textContent = name;
      row.appendChild(tag);
    });
    return row;
  };

  const buildActionsRow = (film) => {
    const detailLink = document.createElement("a");
    detailLink.href        = `detail.html?id=${film.id}`;
    detailLink.className   = "btn-primary text-xs px-3 py-1.5 rounded-full no-underline";
    detailLink.textContent = "View Details";

    const watchlistBtn = createWatchlistBtn(
      toFilmData(film),
      "text-xs px-3 py-1.5 rounded-full",
    );

    const row = document.createElement("div");
    row.className = "flex gap-2 mt-1";
    row.append(detailLink, watchlistBtn);
    return row;
  };

  // ── In-memory filter + sort ───────────────────────────────────────────────

  /**
   * Applies the active genre filter and popularity sort to top100Films,
   * then stores the result in displayedFilms.
   */
  const applyFilterAndSort = () => {
    let result = activeGenreId === 0
      ? [...top100Films]
      : top100Films.filter((f) => (f.genre_ids || []).includes(activeGenreId));

    // Sort by popularity (vote_average used here as the "IMDB" sort proxy;
    // swap to `f.popularity` if you prefer raw popularity score)
    result.sort((a, b) =>
      sortDesc
        ? (b.popularity || 0) - (a.popularity || 0)
        : (a.popularity || 0) - (b.popularity || 0)
    );

    displayedFilms = result;
    currentPage    = 1;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const renderFilms = () => {
    if (!displayedFilms.length) {
      filmList.replaceChildren(
        Object.assign(document.createElement("p"), {
          className:   "py-8 text-center",
          textContent: "Tidak ada film ditemukan.",
        })
      );
      pageTitle.textContent = "Films (0)";
      return;
    }
    const start = (currentPage - 1) * perPage;
    filmList.replaceChildren(
      ...displayedFilms.slice(start, start + perPage).map(createFilmCard)
    );
  };

  const renderPagination = () => {
    const total      = displayedFilms.length;
    const localPages = Math.ceil(total / perPage);

    pageTitle.textContent = `Films (${total})`;

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem   = Math.min(startItem + perPage - 1, total);
    paginInfo.textContent = total
      ? `${startItem} – ${endItem} of ${total}`
      : "0 results";

    const isFirst = currentPage <= 1;
    const isLast  = currentPage >= localPages;

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
        window.scrollTo(0, 0);
      }),
      makeArrow("Next page", "›", isLast, () => {
        if (currentPage < localPages) { currentPage++; renderFilms(); renderPagination(); }
        window.scrollTo(0, 0);
      })
    );
  };

  // ── Data loading (runs once) ──────────────────────────────────────────────

  /**
   * Fetches TOP_100_PAGES pages from TMDB (sorted by popularity desc) in
   * parallel, deduplicates by id, and trims to TOP_100_TOTAL entries.
   */
  const loadTop100 = async () => {
    const pages = await Promise.all(
      Array.from({ length: TOP_100_PAGES }, (_, i) =>
        fetchMovies({ page: i + 1, sortDesc: true, genreId: 0, minVotes: 500 })
      )
    );

    const seen = new Set();
    const all  = [];
    for (const page of pages) {
      for (const film of (page.results || [])) {
        if (!seen.has(film.id)) { seen.add(film.id); all.push(film); }
        if (all.length >= TOP_100_TOTAL) break;
      }
      if (all.length >= TOP_100_TOTAL) break;
    }

    top100Films = all.slice(0, TOP_100_TOTAL);
  };

  // ── Genre menu ────────────────────────────────────────────────────────────

  const buildGenreMenu = (list) => {
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
  };

  const filterByGenre = (id, name) => {
    activeGenreId = id;
    genreMenu.classList.add("hidden");
    genreMenu.classList.remove("open");
    genreBtn.innerHTML = `${name.toUpperCase()} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`;
    genreBtn.classList.toggle("active-filter", id !== 0);
    applyFilterAndSort();
    renderFilms();
    renderPagination();
  };

  // ── Controls ──────────────────────────────────────────────────────────────

  genreBtn.addEventListener("click", () => {
    genreMenu.classList.toggle("hidden");
    genreMenu.classList.toggle("open");
  });

  sortBtn.addEventListener("click", () => {
    sortDesc = !sortDesc;
    sortBtn.innerHTML = `Sort by IMDB <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`;
    applyFilterAndSort();
    renderFilms();
    renderPagination();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#genre-btn") && !e.target.closest("#genre-menu")) {
      genreMenu.classList.add("hidden");
      genreMenu.classList.remove("open");
    }
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  try {
    const [genreList] = await Promise.all([
      fetchGenreList(),
      loadTop100(),
    ]);
    genreList.forEach((g) => (genres[g.id] = g.name));
    buildGenreMenu(genreList);
    applyFilterAndSort();
    renderFilms();
    renderPagination();
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
};

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

const initDetailPage = () => {
  const detailEl     = document.querySelector("#film-detail");
  const breadcrumb   = document.querySelector("#breadcrumb-title");
  const titleEl      = document.querySelector("#detail-title");
  const yearEl       = document.querySelector("#detail-year");
  const runtimeEl    = document.querySelector("#detail-runtime");
  const languageEl   = document.querySelector("#detail-language");
  const taglineEl    = document.querySelector("#detail-tagline");
  const overviewEl   = document.querySelector("#detail-overview");
  const ratingEl     = document.querySelector("#detail-rating");
  const votesEl      = document.querySelector("#detail-votes");
  const popularityEl = document.querySelector("#detail-popularity");
  const genresEl     = document.querySelector("#detail-genres");
  const tmdbBtn      = document.querySelector("#btn-tmdb");

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

  const loadDetail = async (movieId) => {
    try {
      const detail = await fetchMovieDetail(movieId);
      detailEl.classList.remove("hidden");
      document.title         = `MovieSpace — ${detail.title}`;
      breadcrumb.textContent = detail.title;

      const posterUrl = imgUrl(detail.poster_path);
      const posterEl  = document.querySelector("#detail-poster");
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

      tmdbBtn.href = `https://www.themoviedb.org/movie/${movieId}/videos?language=en-US`;
      myListBtn(toFilmData(detail));
    } catch (err) {
      showError(
        err.message.includes("API_KEY")
          ? "⚠️ API Key belum diset. Edit CONFIG di fetchData.js"
          : "Gagal memuat data. Coba refresh halaman."
      );
    }
  };

  const movieId = new URLSearchParams(location.search).get("id");
  movieId ? loadDetail(movieId) : showError("Film tidak ditemukan.");
};

// ══════════════════════════════════════════════════════════════════════════════
// MY WATCHLIST PAGE  (merged from mylist.js — DRY: reuses buildPoster,
//                    buildTitleRow, buildRatingRow, buildOverview, buildCardShell)
// ══════════════════════════════════════════════════════════════════════════════

const initMyListPage = () => {
  const listEl  = document.querySelector("#mylist-films");
  const emptyEl = document.querySelector("#empty-state");
  const countEl = document.querySelector("#list-count");

  /** Build a watchlist card (extends shared primitives with a Remove button) */
  const createMyListCard = (film) => {
    const li = buildCardShell();
    li.dataset.id = film.id;

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
  };

  const renderMyList = () => {
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
  };

  renderMyList();
};

// ══════════════════════════════════════════════════════════════════════════════
// INIT — auto-detect current page (must be after all function definitions)
// ══════════════════════════════════════════════════════════════════════════════

if      (document.querySelector("#film-list"))   initFilmsPage();
else if (document.querySelector("#film-detail"))  initDetailPage();
else if (document.querySelector("#mylist-films")) initMyListPage();
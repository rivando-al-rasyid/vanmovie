// ── fetchData.js — TMDB API helpers ─────────────────────────────────────────
// Edit the CONFIG values below to match your environment.

const CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY:  "ec38e725ce7ea0d047987183a7fb6597",  // ← your TMDB key
  IMG_BASE: "https://image.tmdb.org/t/p/w500",
  IMG_ORIG: "https://image.tmdb.org/t/p/original",
};

// ── Core fetcher ──────────────────────────────────────────────────────────────
/**
 *
 * @param {string} path
 * @param {object} params
 * @returns
 */
export async function tmdbFetch(path, params = {}) {
  if (!CONFIG.API_KEY) {
    throw new Error("API_KEY is not set. Edit CONFIG in fetchData.js.");
  }

  const url = new URL(CONFIG.BASE_URL + path);
  url.searchParams.set("api_key", CONFIG.API_KEY);
  url.searchParams.set("language", "en-US");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${res.statusText} (${path})`);
  }
  return res.json();
}

// ── Genre helpers ─────────────────────────────────────────────────────────────

export async function fetchGenreList() {
  const data = await tmdbFetch("/genre/movie/list");
  return data.genres || [];
}

// ── Movie helpers ─────────────────────────────────────────────────────────────
/** */
export async function fetchMovies({
  page     = 1,
  sortDesc = true,
  genreId  = 0,
  minVotes = 500,
} = {}) {
  const params = {
    sort_by:          sortDesc ? "vote_average.desc" : "vote_average.asc",
    "vote_count.gte": genreId ? 200 : minVotes,
    page,
  };
  if (genreId) params.with_genres = genreId;

  return tmdbFetch("/discover/movie", params);
}
/**
 *
 * @param {number} movieId
 * @returns
 */
export async function fetchMovieDetail(movieId) {
  if (!movieId) throw new Error("movieId is required.");
  return tmdbFetch(`/movie/${movieId}`);
}

// ── Image URL ─────────────────────────────────────────────────────────────────

export function imgUrl(path, size = "w500") {
  if (!path) return null;
  return (size === "original" ? CONFIG.IMG_ORIG : CONFIG.IMG_BASE) + path;
}

// ── Data normaliser ───────────────────────────────────────────────────────────
// Converts a raw TMDB movie object into a consistent shape used across the app.

export function toFilmData(movie) {
  return {
    id:           movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path  ?? null,
    vote_average: movie.vote_average ?? 0,
    vote_count:   movie.vote_count   ?? 0,
    release_date: movie.release_date ?? "",
    genre_ids:    movie.genre_ids    ?? (movie.genres || []).map((g) => g.id),
    overview:     movie.overview     ?? "",
  };
}

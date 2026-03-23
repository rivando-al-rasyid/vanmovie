/**
 * fetchData.js — Centralized TMDB data-fetching utilities for MovieSpace
 *
 * Usage (import in any page script):
 *   import { tmdbFetch, fetchMovieDetail, fetchPopularMovies, ... } from './fetchData.js';
 */

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY  = import.meta.env.VITE_API_KEY  || '';
export const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'https://image.tmdb.org/t/p/w500';
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// ── Core fetch wrapper ────────────────────────────────────────────────────────

/**
 * Low-level TMDB fetch. Appends api_key + language automatically.
 * @param {string} path  - e.g. '/movie/popular'
 * @param {object} params - extra query params
 * @returns {Promise<object>} Parsed JSON response
 */
export async function tmdbFetch(path, params = {}) {
  if (!API_KEY) throw new Error('VITE_API_KEY is not set. Add it to your .env file.');

  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText} (${path})`);
  return res.json();
}

// ── Genre helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch and return the full genre list as an object { id: name }.
 * @returns {Promise<{ [id: number]: string }>}
 */
export async function fetchGenres() {
  const data = await tmdbFetch('/genre/movie/list');
  const map  = {};
  (data.genres || []).forEach(g => { map[g.id] = g.name; });
  return map;
}

/**
 * Fetch genre list as a raw array [{ id, name }, …] (for building menus).
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function fetchGenreList() {
  const data = await tmdbFetch('/genre/movie/list');
  return data.genres || [];
}

// ── Movie discovery ───────────────────────────────────────────────────────────

/**
 * Fetch popular / top-rated movies with optional sorting and genre filter.
 * @param {object} options
 * @param {number}  [options.page=1]
 * @param {boolean} [options.sortDesc=true]    - sort vote_average desc or asc
 * @param {number}  [options.genreId=0]        - 0 = all genres
 * @param {number}  [options.minVotes=500]     - minimum vote_count threshold
 * @returns {Promise<{ results: object[], total_pages: number, total_results: number }>}
 */
export async function fetchMovies({ page = 1, sortDesc = true, genreId = 0, minVotes = 500 } = {}) {
  const params = {
    sort_by: sortDesc ? 'vote_average.desc' : 'vote_average.asc',
    'vote_count.gte': genreId ? 200 : minVotes,
    page,
  };
  if (genreId) params.with_genres = genreId;

  return tmdbFetch('/discover/movie', params);
}

/**
 * Search movies by query string.
 * @param {string} query
 * @param {number} [page=1]
 * @returns {Promise<{ results: object[], total_pages: number, total_results: number }>}
 */
export async function searchMovies(query, page = 1) {
  if (!query?.trim()) throw new Error('Search query must not be empty.');
  return tmdbFetch('/search/movie', { query: query.trim(), page });
}

// ── Single movie ──────────────────────────────────────────────────────────────

/**
 * Fetch full detail for a single movie.
 * @param {number|string} movieId
 * @returns {Promise<object>} TMDB movie detail object
 */
export async function fetchMovieDetail(movieId) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}`);
}

/**
 * Fetch cast & crew for a movie.
 * @param {number|string} movieId
 * @returns {Promise<{ cast: object[], crew: object[] }>}
 */
export async function fetchMovieCredits(movieId) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/credits`);
}

/**
 * Fetch trailer / video info for a movie.
 * @param {number|string} movieId
 * @returns {Promise<{ results: object[] }>}
 */
export async function fetchMovieVideos(movieId) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/videos`);
}

/**
 * Fetch movies similar to a given movie.
 * @param {number|string} movieId
 * @param {number} [page=1]
 * @returns {Promise<{ results: object[] }>}
 */
export async function fetchSimilarMovies(movieId, page = 1) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/similar`, { page });
}

/**
 * Fetch movie recommendations based on a given movie.
 * @param {number|string} movieId
 * @param {number} [page=1]
 * @returns {Promise<{ results: object[] }>}
 */
export async function fetchMovieRecommendations(movieId, page = 1) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/recommendations`, { page });
}

// ── Trending & featured ───────────────────────────────────────────────────────

/**
 * Fetch trending movies for a given time window.
 * @param {'day'|'week'} [timeWindow='week']
 * @returns {Promise<{ results: object[] }>}
 */
export async function fetchTrending(timeWindow = 'week') {
  return tmdbFetch(`/trending/movie/${timeWindow}`);
}

/**
 * Fetch movies currently in theatres.
 * @param {number} [page=1]
 * @returns {Promise<{ results: object[] }>}
 */
export async function fetchNowPlaying(page = 1) {
  return tmdbFetch('/movie/now_playing', { page });
}

/**
 * Fetch upcoming movies.
 * @param {number} [page=1]
 * @returns {Promise<{ results: object[] }>}
 */
export async function fetchUpcoming(page = 1) {
  return tmdbFetch('/movie/upcoming', { page });
}

// ── Image URL helpers ─────────────────────────────────────────────────────────

/**
 * Build a full TMDB image URL from a poster/backdrop path.
 * @param {string|null} path        - TMDB image path, e.g. '/abc123.jpg'
 * @param {'w500'|'original'} [size='w500']
 * @returns {string|null}
 */
export function imgUrl(path, size = 'w500') {
  if (!path) return null;
  const base = size === 'original' ? IMG_ORIGINAL : IMG_BASE;
  return base + path;
}

// ── Slim film-data shape (for watchlist storage) ──────────────────────────────

/**
 * Extract the minimal fields needed for watchlist / My List storage
 * from a full TMDB movie detail or list-result object.
 * @param {object} movie
 * @returns {object}
 */
export function toFilmData(movie) {
  return {
    id:           movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path  ?? null,
    vote_average: movie.vote_average ?? 0,
    vote_count:   movie.vote_count   ?? 0,
    release_date: movie.release_date ?? '',
    genre_ids:    movie.genre_ids    ?? (movie.genres || []).map(g => g.id),
    overview:     movie.overview     ?? '',
  };
}

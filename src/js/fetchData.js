
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY  = import.meta.env.VITE_API_KEY  || '';
export const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'https://image.tmdb.org/t/p/w500';
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

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

export async function fetchGenres() {
  const data = await tmdbFetch('/genre/movie/list');
  const map  = {};
  (data.genres || []).forEach(g => { map[g.id] = g.name; });
  return map;
}

export async function fetchGenreList() {
  const data = await tmdbFetch('/genre/movie/list');
  return data.genres || [];
}


export async function fetchMovies({ page = 1, sortDesc = true, genreId = 0, minVotes = 500 } = {}) {
  const params = {
    sort_by: sortDesc ? 'vote_average.desc' : 'vote_average.asc',
    'vote_count.gte': genreId ? 200 : minVotes,
    page,
  };
  if (genreId) params.with_genres = genreId;

  return tmdbFetch('/discover/movie', params);
}

export async function searchMovies(query, page = 1) {
  if (!query?.trim()) throw new Error('Search query must not be empty.');
  return tmdbFetch('/search/movie', { query: query.trim(), page });
}

export async function fetchMovieDetail(movieId) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}`);
}

export async function fetchMovieCredits(movieId) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/credits`);
}


export async function fetchMovieVideos(movieId) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/videos`);
}

export async function fetchSimilarMovies(movieId, page = 1) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/similar`, { page });
}
export async function fetchMovieRecommendations(movieId, page = 1) {
  if (!movieId) throw new Error('movieId is required.');
  return tmdbFetch(`/movie/${movieId}/recommendations`, { page });
}

// ── Trending & featured ───────────────────────────────────────────────────────

export async function fetchTrending(timeWindow = 'week') {
  return tmdbFetch(`/trending/movie/${timeWindow}`);
}

export async function fetchNowPlaying(page = 1) {
  return tmdbFetch('/movie/now_playing', { page });
}

export async function fetchUpcoming(page = 1) {
  return tmdbFetch('/movie/upcoming', { page });
}

export function imgUrl(path, size = 'w500') {
  if (!path) return null;
  const base = size === 'original' ? IMG_ORIGINAL : IMG_BASE;
  return base + path;
}

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


# Vanmovie

> **Your Cinema, Your World.**
>
> A cinematic movie database web project designed for an immersive visual experience.

A front-end movie browser powered by the TMDB API. Built with vanilla HTML, CSS, and JavaScript — no build tools or bundlers required.

---

## Preview

* Gold (`#F5C518`) accent on dark grey (`#141414`) background
* Playfair Display for headings, Lato for body text
* Film grain texture and golden light-leak effects
* Responsive poster grid with dynamic film cards

---

## Setup

### 1. Get a TMDB API Key

Sign up at [themoviedb.org](https://www.themoviedb.org/) and copy your API key.

### 2. Set the API Key

Open `src/js/fetchData.js` and update the `CONFIG` block:

```js
const CONFIG = {
  API_KEY: "your_tmdb_api_key_here",  // ← paste here
  BASE_URL: "https://api.themoviedb.org/3",
  IMG_BASE: "https://image.tmdb.org/t/p/w500",
  IMG_ORIG: "https://image.tmdb.org/t/p/original",
};
```

### 3. Serve the Project

Because the project uses ES modules (`import`/`export`), you **must** serve it over HTTP — opening `index.html` directly as a `file://` URL will cause CORS errors.

```bash
# Option A — Node (npx)
npx serve .

# Option B — Python
python -m http.server 3000

# Option C — Node with Express (dependency included)
node -e "require('express')().use(require('express').static('.')).listen(3000)"
```

Then open `http://localhost:3000` in your browser.

---

## Test Accounts

| Email               | Password |
| ------------------- | -------- |
| test@example.com    | test123  |
| user@moviespace.com | movie123 |

> **Note:** Authentication is mock-only (no backend). User data is stored in `localStorage`. In production, replace `REGISTERED_USERS` in `auth.js` with real API calls.

---

## Project Structure

```
vanmovie/
├── index.html          Login page
├── films.html          All films — genre filter + IMDB sort + pagination
├── detail.html         Film detail page
├── mylist.html         Personal watchlist
├── signup.html         Registration page
└── src/
    ├── css/
    │   └── style.css           Cinematic dark theme + component styles
    ├── js/
    │   ├── fetchData.js        TMDB API helpers — edit CONFIG here
    │   ├── auth.js             Session management, navbar injection, avatar UI
    │   ├── movies.js           Films list, film detail, and watchlist logic (merged)
    │   ├── login.js            Login page logic
    │   └── signup.js           Sign-up page logic
    └── asset/
        └── icon.svg
```

---

## Key Features

| Feature                | Description                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Film Browser** | Fetches the top 100 popular films from TMDB (5 pages × 20 results) in parallel |
| **Genre Filter** | Real-time in-memory genre filtering via dropdown                                |
| **Sort by IMDB** | Toggle ascending / descending sort by popularity score                          |
| **Pagination**   | 10 films per page, all filtered/sorted in-memory                                |
| **Film Detail**  | Full detail page — poster, tagline, runtime, language, genres, rating          |
| **Watchlist**    | Add/remove films to a personal list stored in `localStorage`                  |
| **Auth**         | Login with remember-me, registration, session-aware navbar with avatar dropdown |

---

## Architecture & DOM Patterns

This project applies DOM manipulation techniques directly, with no framework:

* **`querySelector` / `querySelectorAll`** — selects film cards and control elements
* **`createElement` + `appendChild`** — dynamically builds film cards from TMDB data
* **`addEventListener`** — handles genre clicks, sort toggle, watchlist button, pagination
* **`innerHTML` / `classList`** — updates UI state and renders genre tags responsively
* **`window` vs `document`** — `window.location` for navigation/redirects; `document` for all DOM operations

### Fetch Usage

```js
// GET — fetch top popular films
const data = await tmdbFetch("/discover/movie", { sort_by: "vote_average.desc", page: 1 });

// Watchlist state is managed client-side via localStorage (no POST to external API)
localStorage.setItem("moviespace_mylist", JSON.stringify(myList));
```

---

## Tech Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Structure  | HTML5                                          |
| Styling    | CSS3 + Tailwind CSS (CDN, browser build)       |
| Logic      | JavaScript ES6+ (ES Modules)                   |
| Data       | [TMDB API](https://developer.themoviedb.org/docs) |
| Typography | Playfair Display, Lato (Google Fonts)          |
| Formatter  | Prettier 3.8.1                                 |

---

## Author

**rivando al rasyid** — [github.com/rivando-al-rasyid/vanmovie](https://github.com/rivando-al-rasyid/vanmovie)

---

*Your Cinema, Your World.*

# MovieSpace

TMDB-powered movie browser — no build tools required.

## Setup

1. **API Key** — open `src/js/fetchData.js` and set your TMDB key in the `CONFIG` block at the top:
   ```js
   const CONFIG = {
     API_KEY: "your_tmdb_api_key_here",
     ...
   };
   ```

2. **Run** — serve the folder with any static server, for example:
   ```bash
   npx serve .
   # or
   python -m http.server 3000
   ```
   Then open `http://localhost:3000` in your browser.

   > **Note:** Because JS modules use `import`, you must serve via HTTP — opening `index.html` directly as a `file://` URL will cause CORS errors.

## Test accounts (login)
| Email | Password |
|---|---|
| test@example.com | test123 |
| user@moviespace.com | movie123 |

## Project structure
```
├── index.html          Login page
├── films.html          All films + filters
├── mylist.html         My watchlists
├── detail.html         Film detail
├── signup.html         Register
└── src/
    ├── css/
    │   └── style.css   Theme + component styles
    ├── js/
    │   ├── fetchData.js  TMDB API helpers (edit CONFIG here)
    │   ├── auth.js       Session management & navbar avatar
    │   ├── addlist.js    Watchlist helpers
    │   ├── login.js      Login page logic
    │   ├── signup.js     Sign-up page logic
    │   ├── films.js      All films page
    │   ├── detail.js     Film detail page
    │   └── mylist.js     My watchlists page
    └── asset/
        └── icon.ico
```

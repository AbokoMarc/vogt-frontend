# Frontend V2 — Netlify deployment

This version:
- does not cache/intercept API requests;
- uses the production API base from `js/config.js`;
- uses a versioned service-worker cache (`vogt-campus-v2`);
- removes old service-worker caches on activation;
- never returns an undefined cache value from `fetch` handling.

After deploying, if an old service worker is still active on your browser, do one hard refresh or unregister it once from DevTools > Application > Service Workers.

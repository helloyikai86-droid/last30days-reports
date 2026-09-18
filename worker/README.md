# GitHub Opportunity Notes Worker

This Worker gives the GitHub Pages catalog a secure write API for project ratings/notes.

## Required secrets

- `GITHUB_TOKEN`: fine-grained GitHub token with Issues read/write access to `helloyikai86-droid/last30days-reports`.
- `NOTES_KEY`: a private passphrase used by the catalog UI.

## Deploy

1. Install Wrangler: `npm i -g wrangler`
2. `wrangler login`
3. From this directory:
   - `wrangler secret put GITHUB_TOKEN`
   - `wrangler secret put NOTES_KEY`
   - `wrangler deploy`
4. Copy the resulting `https://...workers.dev` URL into `docs/config.js`.

The Worker exposes:
- `GET /health`
- `GET /notes`
- `GET /notes/:issue`
- `POST /notes/:issue`

All note endpoints require `X-Notes-Key`.

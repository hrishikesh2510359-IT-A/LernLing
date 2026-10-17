# Lernling

Study streaks with friends. A browser extension measures **real** learning time on Udemy, Coursera and sites you add (a video must actually be playing, or you must be actively working; just visiting a page counts for nothing). A website shows streak maps, a group leaderboard and nudges.

- **Website / dashboard:** https://lernling.vercel.app
- **Friends: install the extension** from the [`extension` branch](../../tree/extension) (it has a step-by-step guide).

## How it fits together

```
Browser extension (WXT, TypeScript)  ─┐
  tracks verified study minutes       ├──►  Supabase (Postgres + Google sign-in + security rules)
Web dashboard (Vite + React)         ─┘          ▲
  streak map, groups, nudges, badges             └── runs in the cloud, nothing to host yourself
```

| Folder | What it is |
|---|---|
| `apps/extension` | Chrome/Edge extension (Manifest V3): content scripts, background worker, popup |
| `apps/web` | The dashboard and invite/join pages (deployed on Vercel) |
| `packages/core` | Shared, tested logic: tracking rules/engine, quiz and URL parsing, mascot stages |
| `supabase/migrations` | The database: tables, security rules, ingest/streak functions (run in order) |
| `docs` | The install guide shown to friends |
| `design` | Exported UI designs |
| `PLAN.md` | The product and build plan |

## What counts as studying

A day counts after **10 active minutes**, or **one finished lesson**, or **one passed quiz**. Speed-watching up to 4x counts; skipping ahead earns no minutes; hidden tabs, locked screens and long idle periods count for nothing. Details: `PLAN.md` section 3 and `packages/core/src`.

## Run it yourself

Requires Node 20+.

```bash
npm install
npm test                                   # unit tests for the shared logic
npm run dev --workspace @lernling/web      # dashboard at http://localhost:5173
npm run build --workspace @lernling/extension   # extension build -> apps/extension/.output/chrome-mv3
```

1. Create a Supabase project and follow [`supabase/README.md`](supabase/README.md).
2. Copy `.env.example` → `.env` in `apps/web` and `apps/extension` and fill in your Supabase URL and **publishable** key (never a `service_role` / `secret` key).
3. Load the extension: open `chrome://extensions`, turn on Developer mode, **Load unpacked**, choose `apps/extension/.output/chrome-mv3`.

## Publishing

- **Dashboard:** `npx vercel --prod` (settings are in `vercel.json`).
- **Extension for friends:** `bash scripts/publish-extension.sh` builds the extension and updates the `extension` branch, which contains only the built files and the friends' guide from `docs/friends-readme.md`.

## Notes

- Mascot art is placeholder SVG (`apps/web/src/components/Mascot.tsx`); replace it in that one file.
- The dev build pins the extension ID with a public `key` in `apps/extension/wxt.config.ts` so the sign-in redirect URL stays stable. Remove it for a Chrome Web Store build.
- Secrets never belong in this repo: no database password, no `service_role` key, no Google client secret.

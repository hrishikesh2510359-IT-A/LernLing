# Supabase setup (one-time, about 10 minutes)

1. Go to https://supabase.com, create a free project named `lernling`. Save the database password **in a password manager, never in this repo**.
2. **Authentication > Providers > Google**: enable it. In Google Cloud Console create an OAuth client (type "Web application"), add the redirect URL shown by Supabase, and paste the client ID and secret into Supabase.
3. **SQL Editor**: run the files in `migrations/` in order: `0001_init.sql`, `0002_ingest.sql`, `0003_dashboard.sql`, `0004_nudge_limit.sql`.
4. **Project Settings > API**: copy the Project URL and the publishable (formerly "anon") key into the `.env` files (see the `.env.example` next to each app). Never use the `service_role` / `secret` key in the extension or web app.
5. **Authentication > URL Configuration**: set the Site URL to your deployed dashboard and add these Redirect URLs:
   - `http://localhost:5173/**`
   - `https://<your-dashboard>/**`
   - `https://<extension-id>.chromiumapp.org/` (the extension ID is printed when you load the extension; the dev build uses a fixed ID, see `apps/extension/wxt.config.ts`).

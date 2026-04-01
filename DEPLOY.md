# Free Publish Setup

This project can be hosted for free with:

- GitHub Pages for the website
- Supabase free tier for shared availability

## 1. Create a Supabase project

1. Create a free project at [Supabase](https://supabase.com/).
2. In the SQL Editor, run the SQL in `supabase/availability_schema.sql`.
3. In Edge Functions, create a function named `manage-availability`.
4. Paste in the code from `supabase/functions/manage-availability/index.ts`.
5. Add an Edge Function secret:
   - `ADMIN_PASSCODE=ari`

## 2. Add your Supabase keys

Edit `config.js` and set:

```js
window.APP_CONFIG = {
  useSupabase: true,
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-KEY",
  manageAvailabilityFunction: "manage-availability",
};
```

Use the public anon key, not the service role key.

## 3. Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload this whole project folder.
3. In GitHub:
   - go to `Settings`
   - open `Pages`
   - under `Build and deployment`, choose `Deploy from a branch`
   - choose your main branch and `/ (root)`
4. Save.

## 4. Use the live site

- Public booking page: your GitHub Pages URL
- Private availability page: `your-site-url/admin.html`
- Admin passcode: `ari`

## Notes

- The public site reads availability from Supabase.
- The admin page writes availability through the Edge Function.
- If `useSupabase` stays `false`, the site falls back to local browser storage for local testing only.

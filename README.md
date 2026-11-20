# Fitluck

Everyone brings one exercise. Everyone climbs together.

Fitluck is a web app for a crew of up to 5 friends. Each person brings one quick exercise (a minute or less a set) and picks a GIF or short clip for it. Everyone does every exercise up to 3 times a day, the GIF plays while they do it, and the crew feed shows who did what.

It is a web app people add to their phone's home screen, so it works on iPhone and Android with no App Store.

## What's built

- Sign in with email. Google sign-in is in the code: switch it on in Supabase, then set `VITE_ENABLE_GOOGLE=true`.
- Profile with name, bio, goals, favorite GIF themes, and public or private toggles
- Crews of up to 5, joined with an invite link; one person can be in several crews
- Bring your exercise: about 30 to pick from or your own, reps or seconds, an optional how-to and modifier, and a required GIF from Giphy or your own clip of up to 15 seconds
- Today: your checklist of every potluck exercise, 3 sets each, and who has moved today
- Do it now: the exercise's GIF plays, with a rep counter or a timer, a how-to, and a modifier toggle
- Crew feed with live updates and emoji reactions

Coming next: points, streaks and streak freezes, the weekly leaderboard, challenges with stakes, badges, chat, and reminders.

## How it's put together

| Piece | What it does |
| --- | --- |
| [React](https://react.dev) + [Vite](https://vite.dev) | The app itself, in `src/` |
| [Supabase](https://supabase.com) | Sign-in, database and clip storage. The tables are in `supabase/migrations/`. |
| [Giphy](https://developers.giphy.com) | GIF search |
| [Vercel](https://vercel.com) | Hosting |

## Setting up a new Supabase project

1. Create a project at supabase.com.
2. Open **SQL Editor → New query**, paste everything in `supabase/migrations/0001_core_loop.sql`, and click **Run**.
3. Under **Authentication → URL Configuration**, set **Site URL** to the app's web address and add it under **Redirect URLs** too.
4. Copy **Project Settings → API → Project URL** and the **anon public** key into the environment variables below.

## Environment variables

Set these in Vercel (**Project → Settings → Environment Variables**), or in a `.env.local` file when running on a computer. `.env.example` lists them.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GIPHY_API_KEY`

## Running it on a computer

```bash
npm install
npm run dev
```

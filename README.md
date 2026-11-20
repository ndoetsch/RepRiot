# RepRascal

**The app that makes moving the most entertaining part of your day.**

RepRascal is a fun, energetic, social fitness app: a playful rebellion against boring workouts. Its mascot is Reppy the Raccoon. You do tiny sets (a minute or less) a few times a day, and they add up. Do it solo or with a squad of friends, and while you rep, pick what's on your screen: the move's animation, a demo video, a lesson on Greek gods, a Spanish phrase, a dad joke, today's headlines, or your team's latest score.

It's a web app people add to their phone's home screen, so it works on iPhone and Android with no App Store. It started as a copy of [Fitluck](https://github.com/ndoetsch/fitluck) and now lives on its own.

## What's in it

- **Solo or squads.** Play alone with up to 5 moves, or start a squad where everyone brings one move to the lineup.
- **Private by default.** Squads are invite-only and hold up to 8. The organizer can make one public, so strangers can find and join it, and set a cap of up to 20.
- **Channels: what's on screen while you move.** Form guide, demo video, Greek gods, Spanish, French, dad jokes, world news, and your team's scores. Lessons move forward one card per set, so you learn a little at a time. Text channels can be read out loud.
- **Challenges with real interaction.**
  - *Gauntlets:* someone proposes one, the squad debates it in the comments, the proposer can change the terms, and it starts once more than half the squad votes yes. Then everyone's in.
  - *Open dares:* someone throws one out there and anyone can opt in.
  - *Points races and squad goals,* carried over from Fitluck.
- Points, streaks and freezes, weekly leaderboard, badges, feed with reactions, squad chat, and phone reminders.

## Built to grow

| To change… | Edit |
| --- | --- |
| App name, mascot name, tagline, what things are called | `src/config/brand.ts`. The page title, home screen name and welcome logo all follow it. |
| Logo and mascot pictures | `public/logo.png`, the PNGs in `public/icons/`, and the welcome animation in `public/mascot/` (the scene, plus Reppy's arm on its own layer) |
| Squad sizes, sets per day, points | `src/config/rules.ts` (and the matching checks in `supabase/migrations/0005_reprascal.sql`) |
| Turn a feature on or off | `src/config/features.ts`, or set `VITE_FEATURES_OFF=chat,publicSquads` for one deployment |
| Add a channel | Write it in `src/channels/` and list it in `src/channels/registry.ts` |
| Add a learning track (history, a language, trivia…) | Write a list of cards in `src/channels/content/` and add one `trackChannel(...)` line in the registry |
| Colors | the top of `src/index.css` |

## How it's put together

| Piece | What it does |
| --- | --- |
| [React](https://react.dev) + [Vite](https://vite.dev) | The app itself, in `src/` |
| [Supabase](https://supabase.com) | Sign-in, database and clip storage. The tables are in `supabase/migrations/`. |
| [Giphy](https://developers.giphy.com) | GIF search |
| [Vercel](https://vercel.com) | Hosting, plus `api/` for reminders and sports updates |
| Free feeds | Wikipedia's "In the news" for headlines, icanhazdadjoke.com for jokes, ESPN's public feed (through `api/sports.ts`) for scores. No keys needed. |

## Setting up a new Supabase project

1. Create a project at supabase.com.
2. Open **SQL Editor → New query**, and run each file in `supabase/migrations/` in order (0001 through 0005). In `0003_reminders.sql`, change `reprascal.vercel.app` to the app's real address first if it's different.
3. Under **Authentication → URL Configuration**, set **Site URL** to the app's web address and add it under **Redirect URLs** too.
4. Copy **Project Settings → API → Project URL** and the **publishable** key (or the older **anon public** key) into the environment variables below.

## Environment variables

Set these in Vercel (**Project → Settings → Environment Variables**), or in a `.env.local` file when running on a computer. `.env.example` lists them.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GIPHY_API_KEY`
- `VITE_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` for reminders
- `VITE_FEATURES_OFF` (optional)

## Running it on a computer

```bash
npm install
npm run dev
npm test
```

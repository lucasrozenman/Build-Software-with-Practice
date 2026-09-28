# MovieWatchlist

A simple movie watchlist web application built for the ED2 "Build Software with AI" assignment.

## Features

- Create an account and log in
- Add movies to a personal watchlist
- Edit movie information
- Delete movies
- Mark movies as Want to Watch, Watching, or Watched
- Give watched movies a 1–5 star rating
- Add notes
- Search and filter the watchlist
- Personal statistics dashboard
- Supabase database with Row Level Security

## Technologies

- React
- Vite
- Supabase Authentication
- Supabase PostgreSQL
- Lucide React icons
- CSS

## Setup

1. Install Node.js.
2. Run `npm install`.
3. Create a Supabase project.
4. In Supabase SQL Editor, run `supabase.sql`.
5. In Supabase Project Settings/API, copy the Project URL and anon/public key.
6. Create a `.env` file using `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

7. Run `npm run dev`.
8. Open the local URL shown by Vite.

## Netlify

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

Add the same two environment variables in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not put a Supabase service-role key in the frontend.

## Database

The `movies` table stores each movie together with the authenticated user's ID. Row Level Security ensures users can only read and modify their own records.

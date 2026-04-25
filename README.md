# Tennis Court — Vierer-Kombinationen

Tennis doubles tournament planner with rotating partners, court assignment, bench rotation, and live leaderboard.

## Quick start

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint (zero warnings) |
| `npm test` | Vitest unit tests |
| `npm run storybook` | Component explorer |

## Tech stack

Vite · React 19 · TypeScript 6 · Tailwind CSS v4 · shadcn/ui · Vitest · Storybook

## Host Europe deployment

The production build is a static Vite app plus a small PHP/MySQL API.

1. Create the MySQL tables from `public/api/sql/schema.sql`.
2. Copy `public/api/private/config.example.php` to `public/api/private/config.php` and enter the database credentials.
3. Insert at least one admin into `admins` with a `password_hash(...)` value.
4. Run `npm run build`.
5. Upload the contents of `dist/` to the domain web root.

Routes:

| URL | Purpose |
|---|---|
| `/` or `/view/clubabend` | Public read-only view |
| `/admin/clubabend` | Admin login and editing |

The API stores the complete tournament state as JSON in `tournaments.state_json`.

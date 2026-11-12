# Whisker Match

A browser-based memory game built around collectible cat artwork, with a retro
pixel-art style and a warm wooden table.

**Status:** Playable local MVP

## Demo

The public demo link will be added here once the first deployment is live.

## Features

- Classic two-card memory rules with mismatch lock, shake feedback, and matched-pair glow.
- Three board sizes: Relaxed (3 pairs), Classic (6 pairs), and Marathon (8 pairs).
- Eight collectible cat cards, with a random subset drawn for every new game.
- Card names shown under each piece of artwork.
- Three selectable card backs: Classic, Black, and Green.
- Background packs with morning, afternoon, evening, and midnight variants.
- `Options > Personalization` for card backs, background packs, and time-of-day previews.
- Time-of-day backgrounds follow the local clock automatically; manual time choices are a
  temporary preview and reset when the game is reopened.
- Move counter, elapsed timer, completion results, and personal records per board size.
- Safe `localStorage` persistence with schema versioning, validation, and v1 migration.
- Continue an unfinished game after reloading the page.
- Responsive layout for desktop, tablet, and mobile.
- Pure, testable game logic with automated rule and persistence tests.

## Stack

- Vite 6
- TypeScript (strict)
- SolidJS
- Biome (lint + format)
- Vitest + jsdom

## Development

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the development server        |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run test`    | Run tests                           |
| `npm run check`   | Run Biome checks                    |
| `npm run format`  | Format code with Biome              |

## Project structure

```
public/
  cards/
    cats/         # Playable cat artwork
    backs/        # Selectable card backs
  backgrounds/
    <pack-id>/    # One image per time period
src/
  content/        # Card, card-back, and background catalogs
  game/           # Pure game logic, board sizes, and rules
  persistence/    # localStorage adapter, schema validation, records
  store/          # Solid signals/store, timers, personalization, session actions
  components/
    screens/      # Menu, options, and game screens
    game/         # Board and card UI
  utils/          # Formatting helpers
  styles/         # Global pixel-art theme and responsive layout
```

## Adding content

### Cats

1. Add a PNG to `public/cards/cats/`.
2. Add an entry to `src/content/cards.ts` with a stable `pairId`, a display name, and the
   image path.
3. Keep the display name aligned with the artwork filename. Pair ids are stored in saved
   games, so avoid changing them once used.

### Card backs

1. Add a PNG to `public/cards/backs/`.
2. Add an entry and its id to `src/content/cardBacks.ts`.
3. Add the id to the `CardBackId` union.

### Background packs

1. Create `public/backgrounds/<pack-id>/` with `morning.png`, `afternoon.png`,
   `evening.png`, and `midnight.png`.
2. Add a pack entry to `src/content/backgrounds.ts` with the same image paths.

The Options screen reads these catalogs automatically; empty selectors and future packs
need no UI changes.

## Local data

Saved data lives under the `whisker-match:save` key in `localStorage`. It contains:

- the selected board size;
- the selected card back and background pack;
- per-board records (games won, best moves, best time);
- an optional unfinished game with its timer.

Version 1 saves are migrated in place. Malformed or incompatible data is discarded and
replaced with safe defaults. The temporary time-of-day preview is intentionally not saved.

## Deployment

Vercel is the recommended first host for this Vite app:

1. Import the GitHub repository into Vercel.
2. Keep the detected framework preset as **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.

`public/` is Vite's standard static-assets directory. Vercel copies its contents into
`dist/` during the build, so **the folder does not need to be renamed**. Any file placed in
`public/` is served from the site root; for example,
`public/cards/cats/Kotaro.png` becomes `/cards/cats/Kotaro.png`.

Netlify and Cloudflare Pages use the same build command and `dist` output. GitHub Pages can
also host the build, but the Vite `base` option must be set to the repository path and the
deployment workflow must publish `dist/`.

## License

License policy is being finalized before the repository becomes public.

# Whisker Match

Browser-based memory matching game with collectible cat artwork in a retro pixel-art style.

**Status:** Local MVP (v1.0 scope)

## Features

- Classic two-card memory rules with mismatch lock and match feedback.
- Relaxed (3 pairs) and Classic (6 pairs) boards.
- Menu and game screens with a responsive pixel-art interface.
- Move counter, elapsed timer, and completion results.
- Local records (best moves and best time) per board size.
- Safe `localStorage` persistence with schema versioning and validation.
- Continue an unfinished game after reloading the page.
- Pure, testable game logic with automated rule tests.

## Stack

- Vite
- TypeScript (strict)
- SolidJS
- Biome (lint + format)
- Vitest + jsdom

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start development server             |
| `npm run build` | Type-check and build for production  |
| `npm run preview` | Preview production build           |
| `npm run test`  | Run tests                            |
| `npm run check` | Run Biome linter                     |
| `npm run format` | Format code with Biome              |

## Project structure

```
src/
  game/           # Pure game logic, catalog, board sizes, rules
  persistence/    # localStorage adapter, schema validation, records
  store/          # Solid signals/store + timers + session actions
  components/     # Menu, game, board, and card UI
  utils/          # Formatting and time-based backgrounds
  styles/         # Global pixel-art theme and responsive layout
```

## Local data

Saved data lives under the `whisker-match:save` key in `localStorage`. It contains
the selected board size, per-difficulty records, and an optional unfinished game.
Malformed or incompatible data is discarded and replaced with safe defaults.

All game rules and persistence operations are designed to be expanded later without
changing the public UI contract.

## License

Private until public release of v1.0.

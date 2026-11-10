# Whisker Match

Browser-based memory matching game with collectible cat artwork in a retro pixel-art style.

**Status:** MVP foundation (v0.1.0)

## Stack

- Vite
- TypeScript (strict)
- SolidJS
- Biome (lint + format)
- Vitest

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run check` | Run Biome linter |
| `npm run format` | Format code with Biome |

## Project structure

```
src/
  game/           # Pure game logic (rules, state machine)
  components/     # UI components
  persistence/    # localStorage adapter
  styles/         # Global and shared styles
```

## License

Private until public release of v1.0.

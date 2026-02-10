# parthchaudhari.github.io

Personal website and games portal for Parth Chaudhari.

## Site Structure

- `index.html`: landing portal with entry points to profile and games.
- `info.html`: main professional profile page.
- `games.html`: screenshot-based games gallery launcher.
- `iq.html`: IQ challenge page.
- `memory-match.html`: standalone Memory Match game page.
- `snake.html`: standalone Snake game page.
- `tic-tac-toe.html`: standalone Tic Tac Toe game page.
- `index1.html`: redirect wrapper for VetStrands.
- `assets/screenshots/`: preview images used by the games gallery.
- `assets/images/profile/`: profile photos used on the info page.
- `docs/`: project documentation and integration guides.
- `archive/`: legacy copies kept for reference and cleanup.
- `dist/`: built VetStrands app served as static assets.
- `src/`: VetStrands source (React + TypeScript + Vite).

## Local Development

Static pages can be opened directly in a browser or served with any local static server.

For VetStrands development:

```bash
npm install
npm run dev
```

Build the VetStrands bundle:

```bash
npm run build
```

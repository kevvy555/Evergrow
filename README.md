# Evergrow

A tiny, tactile world-building game prototype built with PixiJS.

The player has one core action: **tap the world**. Taps create life; placing three matching adjacent objects merges them upward through a simple progression:

`Sprout → Tree → Grove → Village → Town → City → Starport`

The prototype is deliberately small so the feel of the core loop can be tested before adding large systems.

## Run locally

Because the game uses ES modules, serve the folder over HTTP rather than opening `index.html` directly.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

There is no build step and no dependency installation. PixiJS 8 is loaded from jsDelivr.

## Architecture

- `src/core` — application composition and immutable configuration
- `src/model` — serializable game state
- `src/systems` — pure-ish gameplay rules (growth, merging, progression)
- `src/view` — PixiJS presentation and interaction
- `src/services` — persistence and external concerns
- `src/utils` — shared low-level helpers

The gameplay model does not depend on PixiJS. This keeps rendering replaceable and game rules straightforward to test.

## Current prototype goals

- Understand the game within seconds
- Make every tap produce visible feedback
- Create satisfying 3-object merges and chain reactions
- Reveal progression gradually
- Autosave locally
- Work on desktop and touch devices

## Next design milestones

See `docs/ROADMAP.md`.

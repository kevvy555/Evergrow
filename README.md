# Evergrow

A phone-first PixiJS world-building merge game built around one interaction: **tap to grow**.

Current version: **0.4.0**

## Core loop

Tap to create life. Connect three matching objects to evolve them:

`Sprout → Tree → Grove → Village → Town → City → Starport`

The controls stay simple while the board gains depth through Perfect Merges, Flow streaks, World Bloom, Life Sparks, evolution perks, Resonance cascades, Radiant entities and hidden spatial Wonders.

## Run locally

No build step or package install is required.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Test

```bash
npm test
```

## Architecture

Gameplay rules are pure JavaScript systems operating on serializable `WorldState`. PixiJS views consume state and gameplay events but do not own scoring, progression or simulation rules.

See:
- `docs/ARCHITECTURE.md`
- `docs/ENGAGEMENT_DESIGN.md`
- `docs/ROADMAP.md`

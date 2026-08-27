# Evergrow

A phone-first PixiJS world-building merge game built around one interaction: **tap to grow**.

Current version: **0.5.0**

## Core loop

Tap to create life. Connect three matching objects to evolve them:

`Sprout → Tree → Grove → Village → Town → City → Starport`

The controls stay simple while the board gains depth through Perfect Merges, Flow, World Bloom, Life Sparks, evolution perks, Resonance cascades, Radiant entities, hidden Wonders and a living settlement layer.

## v0.5 living world

- Deterministic Rain, Golden Hour and Starlight weather moods.
- Dawn/day/dusk/night presentation cycle.
- Persistent settlement names that survive evolution.
- Contextual settlement wishes generated from the current board.
- Harmony districts created by growing nature beside settlements.
- Community Joy and short Festivals after repeated fulfilled wishes.
- Visible roads, traffic, citizens, weather and celebrations.
- Existing v1-v4 saves remain loadable.

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

Gameplay rules are plain JavaScript systems operating on serializable `WorldState`. PixiJS views consume state and gameplay events but do not own scoring, progression or simulation rules.

See:
- `docs/ARCHITECTURE.md`
- `docs/ENGAGEMENT_DESIGN.md`
- `docs/ROADMAP.md`

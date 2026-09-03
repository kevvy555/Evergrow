# Evergrow

A phone-first PixiJS world-building merge game built around one interaction: **tap to grow**.

Current version: **0.6.0**

## Core rule

Tap an **empty** tile to place a Sprout exactly where you tapped.

Three matching tiles that touch (sides or corners) automatically combine into the next level:

`3 🌱 → 🌳 → 3 🌳 → 🌲 → 3 🌲 → 🏠 → ...`

v0.6 is a playtest-response release focused on making this rule immediately understandable before deeper systems appear.

## v0.6 clarity changes

- Occupied taps no longer create a piece somewhere else.
- A persistent coach explains the current 3-match recipe.
- Connected pairs glow and the HUD explicitly shows **2/3**.
- Advanced systems are progressively revealed instead of appearing during the first few taps.
- After the first Tree, valid taps charge a deterministic **Tap Boost**; at 6/6 the next empty tap plants a Tree.
- Perfect Merge is hidden until the basic Tree rule has been learned.
- Existing living-world systems remain in the game and unlock later.
- v1-v5 saves remain loadable.

## Run locally

```bash
python3 -m http.server 8080
```

## Test

```bash
npm test
```

See `docs/V06_PLAYTEST_RESPONSE.md` for the design reasoning behind this release.

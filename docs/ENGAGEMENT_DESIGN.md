# Engagement design

Evergrow aims for high replayability through intrinsic play rather than punishment, forced waiting, loss aversion or monetized pressure.

## The target feeling

At most points the player should feel at least one of these:

- **I am close** — a primed pair, Bloom charge, next discovery or nearby spatial recipe.
- **I can do this better** — wait for a Perfect Merge, preserve Flow or position higher-level life intentionally.
- **Something surprising could emerge** — Resonance cascade, Radiant birth or hidden Wonder.
- **This world is mine** — permanent evolution choices and a growing Journal reflect how this particular run developed.

## Engagement time scales

### Every tap: responsiveness
Every input changes the board or gives immediate feedback. No dead input is introduced by the new systems.

### Several taps: local tactics
Primed pairs and Perfect Merges encourage deliberate placement. A four-object cluster is materially different from a three-object cluster because overflow becomes Resonance rather than just extra score.

### Dozens of taps: rhythm
Bloom is the recurring climax. v0.4 raises its threshold from 100 to 150 and shortens the active window from six to five turns because simulation showed the new reaction energy would otherwise make the special state too common.

### Mastery milestones
Every second Perfect Merge can create one Radiant entity. This is deterministic and skill-earned, not a hidden loot probability. Radiants become tactical objects because consuming one creates a score/Bloom burst.

### Curiosity and collection
Six hidden Wonders are discovered by putting different evolution levels next to one another. Their recipes are hidden until found, turning board composition into experimentation rather than a checklist presented up front.

## Why v0.4 adds Resonance

Before Resonance, a four-object Perfect Merge was mostly a numeric reward. The player could understand that it was “better,” but the board did not feel fundamentally different.

Now the extra matched pieces are promoted, and those promotions can immediately satisfy another cluster. This gives skilled setup a visible physical consequence and creates cascading moments that can be understood by watching the board.

## Why Radiants are deterministic

Rare visual variants are exciting, but opaque random rewards can make success feel detached from player skill. Evergrow therefore ties Radiant creation to Perfect Merge mastery. The surprise is *where the current board lets the Radiant emerge*, not whether the game happened to roll a winning number.

## Why Wonders are spatial

The base game is a spatial toy. Long-term discovery should therefore reward spatial experimentation rather than asking the player to open another screen and complete unrelated chores. Wonders are adjacency recipes that use the same pieces and the same tap interaction as the core game.

## Simulation checkpoint

A 100-run random-input simulation of the v0.4 systems over 150 taps found roughly:

- first Perfect Merge around tap 29 median;
- first Radiant around tap 45 median;
- first Wonder around tap 55 median;
- all simulated runs encountered those systems within 150 taps.

The original Bloom tuning became too dominant once Resonance/Wonders added energy, which motivated the v0.4 threshold/window adjustment.

This is only a synthetic sanity check. Real playtesting should drive final tuning because deliberate players will create clusters much more efficiently than random input.

## Design guardrails

- No forced ads or pay-to-win mechanics.
- No punishment for leaving the game.
- No expiring streak that destroys earned progress.
- No opaque loot-box probability loop.
- No extra control unless it creates more depth than the complexity it costs.
- Prefer visible cause-and-effect over arbitrary reward numbers.

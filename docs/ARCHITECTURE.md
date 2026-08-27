# Architecture

Evergrow is split by responsibility rather than by screen.

## Dependency direction

`main → GameApp → model/systems/services/views`

Gameplay systems depend on `WorldState`, immutable definitions and small gameplay abstractions. They never import PixiJS. Views render state and plain gameplay events, but do not own scoring or progression rules.

## Core

- `config.js` — tuning values and entity definitions.
- `goalDefinitions.js` — linear launch/mastery goals.
- `evolutionDefinitions.js` — permanent two-choice perks.
- `wonderDefinitions.js` — hidden spatial recipes.
- `weatherDefinitions.js` — weather/day presentation definitions.
- `wishDefinitions.js` — contextual settlement wish catalogue.
- `settlementNames.js` — deterministic identity pool.
- `GameApp.js` — composition root and browser lifecycle.

## Model

`WorldState` is the authoritative serializable state. Save schema v5 extends v4 with living-world state while retaining default-based loading for older saves.

Persistent data includes:
- board entities and their variants;
- score/progression/mastery;
- Bloom, Flow, Radiants and Wonders;
- permanent evolution perks;
- weather schedule;
- settlement wishes/community joy/Festival state;
- Harmony identity and settlement names.

Presentation-only values such as day phase, near-merge hints and moving traffic positions are derived rather than persisted.

## Systems

Each independently testable rule family lives in a focused system:

- `GrowthSystem` — tap placement and environment-adjusted spawning.
- `ClusterFinder` — connected matching-component queries.
- `MergeSystem` — merges, chains, Perfect Merges, Radiant consumption and settlement identity inheritance.
- `ResonanceSystem` — promotes Perfect Merge overflow and resolves resulting cascades.
- `MutationSystem` — deterministic mastery-earned Radiants.
- `WonderSystem` — hidden adjacency recipe discovery.
- `WeatherSystem` — deterministic weather lifecycle and weather modifiers.
- `IdentitySystem` — persistent settlement naming.
- `HarmonySystem` — nature/settlement coexistence becoming persistent district identity.
- `WishSystem` — contextual requests, completion and community Joy.
- `CelebrationSystem` — short Festival windows and merge rewards.
- `FlowSystem` — consecutive successful-turn scoring.
- `BloomSystem` — charge/climax rhythm fed by gameplay events.
- `SparkSystem` — Life Spark scheduling/collection, including Starlight Radiants.
- `PerkSystem` — read-only modifiers from permanent evolution choices.
- `EvolutionSystem` — milestone choice lifecycle.
- `GoalSystem` — launch/mastery goal progression.
- `HintSystem` — derived primed-cluster hints.
- `ProgressionSystem` — presentation-oriented derived values.
- `TurnSystem` — deterministic orchestration boundary for one tap.

## v0.5 turn pipeline

A tap is processed in one place:

1. Stop if a blocking evolution choice is waiting.
2. Increment tap count and snapshot Bloom/weather/Festival state.
3. Consume a Life Spark or apply environment-adjusted growth.
4. Resolve Resonance overflow/cascades.
5. Create mastery-earned Radiants.
6. Detect one new hidden Wonder.
7. Assign names to newly created settlements.
8. Form new Harmony districts.
9. Calculate Flow.
10. Evaluate the current settlement wish.
11. Apply active Festival rewards/decay.
12. Apply active weather rewards/decay or start the next weather mood.
13. Feed all relevant events into Bloom.
14. Offer a new contextual wish if appropriate.
15. Queue evolution choices.
16. Evaluate the current goal.
17. Schedule a Life Spark if due.

Ordering is intentional. Systems communicate through state plus plain events instead of reaching into one another's views.

## Extension rules

1. Do not put economy, scoring, progression or simulation rules inside Pixi display objects.
2. Prefer one small system per independently testable rule family.
3. Persist authoritative state only; derive animation/presentation state.
4. New mechanics should deepen consequences of tapping, not multiply controls.
5. Preserve backward-compatible save loading where practical.
6. Cross-cutting modifiers belong behind a small abstraction rather than scattered conditionals.

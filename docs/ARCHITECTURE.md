# Architecture

Evergrow is split by responsibility rather than by screen.

## Dependency direction

`main → GameApp → model/systems/services/views`

Gameplay systems depend on `WorldState`, configuration and other gameplay abstractions, never PixiJS. Views render state and events but do not own progression rules.

## Layers

### Core
Immutable definitions and application composition:
- `config.js` — global tuning values and entity definitions.
- `goalDefinitions.js` — linear launch goals.
- `evolutionDefinitions.js` — permanent player-choice perks.
- `wonderDefinitions.js` — hidden spatial combination discoveries.
- `GameApp.js` — composition root and browser lifecycle.

### Model
`WorldState` is the authoritative serializable state. Save schema v4 keeps older v1-v3 saves loadable through defaults rather than one-off migration code.

### Systems
Small rule objects transform state and emit plain gameplay events:
- `GrowthSystem` — tap placement and Bloom-level spawning.
- `ClusterFinder` — connected-component queries.
- `MergeSystem` — merges, chains, Perfect Merges and Radiant consumption.
- `ResonanceSystem` — promotes Perfect Merge overflow and resolves resulting cascades.
- `MutationSystem` — mastery-earned Radiant creation.
- `WonderSystem` — hidden adjacency recipe discovery.
- `FlowSystem` — consecutive successful-turn scoring.
- `BloomSystem` — charge/climax rhythm.
- `SparkSystem` — periodic Life Spark opportunity.
- `PerkSystem` — read-only modifiers from permanent evolution choices.
- `EvolutionSystem` — milestone choice lifecycle.
- `GoalSystem` — launch goal progression.
- `HintSystem` — derived near-merge hints.
- `ProgressionSystem` — presentation-oriented derived world values.
- `TurnSystem` — one deterministic orchestration pipeline for a tap.

### Services
Browser/environment boundaries:
- `SaveService` — localStorage persistence.
- `FeedbackService` — optional sound and haptics driven only by gameplay events.

### Views
PixiJS-only presentation:
- `WorldView` — board, world entities and moment-to-moment effects.
- `HudView` — compact status, Bloom meter and controls.
- `JournalView` — collection/mastery history.
- `EvolutionChoiceView` — blocking two-choice milestone presentation.

## Turn pipeline

A tap is processed in one place:

1. Validate blocking evolution choice.
2. Advance tap count and sample Bloom state.
3. Consume a Life Spark or apply normal growth.
4. Resolve Perfect Merge overflow through Resonance.
5. Create any mastery-earned Radiant entity.
6. Detect one new hidden Wonder.
7. Calculate Flow.
8. Charge/consume Bloom.
9. Queue evolution choices.
10. Evaluate the current goal.
11. Schedule the next Life Spark.

This ordering is intentional. New mechanics should normally hook into this pipeline by consuming/emitting plain events rather than reaching into views.

## Extension rules

1. Do not put economy, scoring, progression or simulation logic inside Pixi display objects.
2. Prefer one small system per independently testable rule family.
3. Persist only authoritative state; derive hints and presentation values.
4. New mechanics should deepen consequences of tapping, not multiply controls.
5. Keep save upgrades backward compatible when practical.

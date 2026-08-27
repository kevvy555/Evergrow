# Architecture

Evergrow is intentionally split by responsibility rather than by screen.

## Dependency direction

`main → GameApp → model / systems / services / views`

Gameplay systems depend on the serializable `WorldState` and immutable definitions, not on PixiJS. Views read state and consume gameplay events, but never own progression or scoring rules.

## Layers

### Core
Composition root and immutable configuration/definitions. `GameApp` wires dependencies together and owns application lifecycle.

### Model
`WorldState` is the authoritative serializable state. Versioned loading keeps older saves compatible as systems are added.

### Systems
Small rule objects transform world state and emit plain events:
- `GrowthSystem` interprets normal growth.
- `ClusterFinder` centralises spatial cluster discovery.
- `MergeSystem` resolves merges, chains and Perfect Merges.
- `FlowSystem` rewards consecutive successful turns.
- `BloomSystem` owns the calm-to-climax Bloom rhythm.
- `SparkSystem` owns Life Spark scheduling and collection.
- `EvolutionSystem` owns milestone choices; `PerkSystem` exposes their modifiers to other systems.
- `GoalSystem` evaluates the current lightweight objective.
- `TurnSystem` is the orchestration boundary for one player tap.
- `ProgressionSystem` derives presentation-only progression values.

Systems do not import PixiJS and can be tested in Node.

### View
PixiJS-only presentation. `WorldView` renders the board/effects, `HudView` renders compact status, `EvolutionChoiceView` handles rare milestone decisions, and `JournalView` is an optional collection/mastery overlay.

### Services
Browser/environment concerns such as persistence, sound and vibration. They remain outside gameplay rules.

## Extension strategy

A new mechanic should normally enter as a focused system operating on `WorldState`, emit plain events, and then receive presentation in a view. Cross-cutting modifiers should be resolved through a small abstraction such as `PerkSystem` rather than scattered perk checks. Avoid putting economy, ecology, progression, persistence or simulation rules inside Pixi display objects.

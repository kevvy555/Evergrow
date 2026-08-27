# Architecture

Evergrow is intentionally split by responsibility rather than by screen.

## Dependency direction

`main → GameApp → model/systems/services/views`

Gameplay systems depend on the serializable `WorldState` and configuration, not on PixiJS. Views read state and render it, but do not own progression rules.

## Layers

### Core
Composition root and immutable game configuration. `GameApp` wires dependencies together and owns application lifecycle.

### Model
`WorldState` is the authoritative serializable state. It contains data operations, not rendering behavior.

### Systems
Rules that transform world state:
- `GrowthSystem` interprets a tap.
- `MergeSystem` finds connected matching clusters and recursively resolves cascades.
- `ProgressionSystem` derives stage/population information for presentation.

### View
PixiJS-only code. `WorldView` handles world interaction/effects; `HudView` renders derived status and controls.

### Services
Browser/environment concerns such as localStorage. They are kept outside gameplay systems.

## Extension strategy

New mechanics should normally enter as another system operating on `WorldState`, then expose visual events to the view. Avoid putting economy, ecology, progression, persistence, or simulation rules inside Pixi display objects.

export class TurnSystem {
  constructor(world, systems) {
    this.world = world;
    Object.assign(this, systems);
  }

  tap(x, y) {
    if (this.world.pendingEvolutionChoiceId) {
      return [{ type: 'choiceRequired', choiceId: this.world.pendingEvolutionChoiceId }];
    }

    this.world.incrementTaps();
    const turn = this.bloomSystem.prepareTurn();
    let events = this.sparkSystem.consumeAt(x, y);
    if (!events) events = this.growthSystem.growAt(x, y, { spawnLevel: turn.spawnLevel });

    this.resonanceSystem.apply(events);
    this.mutationSystem.apply(events);
    this.wonderSystem.evaluate(events);
    this.flowSystem.apply(events);
    this.bloomSystem.apply(events, turn.wasActive);
    this.evolutionSystem.evaluate(events);
    this.goalSystem.evaluate(events);
    events.push(...this.sparkSystem.maybeSpawn());
    return events;
  }
}

export class TurnSystem {
  constructor(world, growthSystem, sparkSystem, flowSystem, goalSystem) {
    this.world = world;
    this.growthSystem = growthSystem;
    this.sparkSystem = sparkSystem;
    this.flowSystem = flowSystem;
    this.goalSystem = goalSystem;
  }

  tap(x, y) {
    this.world.incrementTaps();

    let events = this.sparkSystem.consumeAt(x, y);
    if (!events) events = this.growthSystem.growAt(x, y);

    this.flowSystem.apply(events);
    this.goalSystem.evaluate(events);
    events.push(...this.sparkSystem.maybeSpawn());
    return events;
  }
}

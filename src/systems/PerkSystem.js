export class PerkSystem {
  constructor(world) { this.world = world; }
  has(id) { return this.world.hasPerk(id); }
  get flowBonusMultiplier() { return this.has('flow_state') ? 2 : 1; }
  get perfectScoreMultiplier() { return this.has('precision') ? 2 : 1; }
  get perfectBloomMultiplier() { return this.has('deep_roots') ? 1.5 : 1; }
  get sparkIntervalDelta() { return this.has('bright_sparks') ? -3 : 0; }
  get sparkBonus() { return this.has('bright_sparks') ? 30 : 0; }
}

import { GAME_CONFIG, ENTITY_DEFINITIONS } from '../core/config.js';

export class SparkSystem {
  constructor(world, mergeSystem, perkSystem, random = Math.random, weatherSystem = null) {
    this.world = world;
    this.mergeSystem = mergeSystem;
    this.perkSystem = perkSystem;
    this.random = random;
    this.weatherSystem = weatherSystem;
  }

  consumeAt(x, y) {
    const spark = this.world.activeSpark;
    if (!spark || spark.x !== x || spark.y !== y) return null;
    const level = GAME_CONFIG.spark.spawnLevel;
    const definition = ENTITY_DEFINITIONS[level];
    const wasNewDiscovery = level > this.world.discoveredLevel;
    const bonus = GAME_CONFIG.spark.score + this.perkSystem.sparkBonus;
    const variant = this.weatherSystem?.getSparkVariant() ?? null;

    this.world.activeSpark = null;
    this.world.sparksCollected += 1;
    this.world.nextSparkAt = this.world.taps + this.#interval();
    this.world.setCell(x, y, variant ? { level, variant } : { level });
    this.world.addScore(bonus + definition.score);

    const events = [{ type: 'spawn', x, y, level }, { type: 'sparkCollected', x, y, bonus }];
    if (variant === 'radiant') {
      this.world.radiantsCreated += 1;
      events.push({ type: 'radiantBorn', x, y, level, source: 'starlight' });
    }
    if (wasNewDiscovery) {
      this.world.discover(level);
      this.world.addScore(definition.discoveryBonus);
      events.push({ type: 'discovery', x, y, level, bonus: definition.discoveryBonus });
    }
    events.push(...this.mergeSystem.resolveFrom(x, y));
    return events;
  }

  maybeSpawn() {
    if (this.world.activeSpark || this.world.taps < this.world.nextSparkAt) return [];
    const emptyCells = [];
    for (let y = 0; y < this.world.rows; y += 1) {
      for (let x = 0; x < this.world.columns; x += 1) {
        if (!this.world.getCell(x, y)) emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length === 0) { this.world.nextSparkAt = this.world.taps + 3; return []; }
    const index = Math.min(emptyCells.length - 1, Math.floor(this.random() * emptyCells.length));
    this.world.activeSpark = emptyCells[index];
    return [{ type: 'sparkAppeared', ...this.world.activeSpark }];
  }

  #interval() { return Math.max(4, GAME_CONFIG.spark.interval + this.perkSystem.sparkIntervalDelta); }
}

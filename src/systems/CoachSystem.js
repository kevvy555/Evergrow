import { ENTITY_DEFINITIONS, GAME_CONFIG } from '../core/config.js';

export class CoachSystem {
  constructor(world, hintSystem, featureGateSystem) {
    this.world = world;
    this.hints = hintSystem;
    this.features = featureGateSystem;
  }

  getPrimedPrompt() {
    const primed = this.hints.getBestPrimedCluster();
    if (!primed) return null;
    const definition = ENTITY_DEFINITIONS[primed.level];
    return `2/3 ${definition.emoji} — tap EMPTY tile touching the glow`;
  }

  getCorePrompt() {
    const primed = this.getPrimedPrompt();
    if (primed) return primed;
    if (this.world.discoveredLevel === 0) return 'Tap EMPTY tile → 🌱  •  3 touching 🌱 → 🌳  (corners count)';

    const sourceLevel = Math.min(this.world.discoveredLevel, GAME_CONFIG.maxLevel - 1);
    const source = ENTITY_DEFINITIONS[sourceLevel];
    const target = ENTITY_DEFINITIONS[sourceLevel + 1];
    if (this.features.isTraining) return `3 touching ${source.emoji} ${source.name}s → ${target.emoji} ${target.name}`;
    return 'Make groups of 3 matching tiles. Groups of 4+ can create bigger reactions.';
  }

  getBoostText() {
    if (!this.features.isUnlocked('tapBoost')) return '';
    if (this.world.tapCharge >= GAME_CONFIG.tapBoost.threshold) return '⚡ BOOST READY — next empty tap plants 🌳';
    return `⚡ TAP BOOST ${this.world.tapCharge}/${GAME_CONFIG.tapBoost.threshold}`;
  }
}

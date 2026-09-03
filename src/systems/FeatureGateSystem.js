import { GAME_CONFIG } from '../core/config.js';

export class FeatureGateSystem {
  constructor(world) { this.world = world; }
  isUnlocked(featureId) {
    const level = GAME_CONFIG.unlocks[featureId];
    return level === undefined || this.world.discoveredLevel >= level;
  }
  get isTraining() { return this.world.discoveredLevel < GAME_CONFIG.clarity.coreMasteryLevel; }
}

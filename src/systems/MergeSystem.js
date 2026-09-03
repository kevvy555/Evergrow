import { GAME_CONFIG, ENTITY_DEFINITIONS } from '../core/config.js';

export class MergeSystem {
  constructor(world, clusterFinder, perkSystem, featureGateSystem = null) {
    this.world = world;
    this.clusterFinder = clusterFinder;
    this.perkSystem = perkSystem;
    this.featureGateSystem = featureGateSystem;
  }

  resolveFrom(originX, originY) {
    const events = [];
    let chain = 0;
    const cursor = { x: originX, y: originY };

    while (true) {
      const source = this.world.getCell(cursor.x, cursor.y);
      if (!source || source.level >= GAME_CONFIG.maxLevel) break;
      const perfectUnlocked = !this.featureGateSystem || this.featureGateSystem.isUnlocked('perfect');
      const cluster = this.clusterFinder.findConnected(cursor.x, cursor.y, source.level);
      if (cluster.length < GAME_CONFIG.mergeCount) break;

      const consumed = cluster.slice(0, GAME_CONFIG.mergeCount);
      const consumedEntities = consumed.map((cell) => this.world.getCell(cell.x, cell.y)).filter(Boolean);
      const overflow = cluster.slice(GAME_CONFIG.mergeCount).map(({ x, y }) => ({ x, y }));
      for (const cell of consumed) this.world.clearCell(cell.x, cell.y);

      const nextLevel = source.level + 1;
      const wasNewDiscovery = nextLevel > this.world.discoveredLevel;
      const definition = ENTITY_DEFINITIONS[nextLevel];
      const inheritsHarmony = nextLevel >= GAME_CONFIG.wishes.settlementMinLevel
        && consumedEntities.some((entity) => entity.harmony);
      const inheritedName = nextLevel >= GAME_CONFIG.wishes.settlementMinLevel
        ? consumedEntities.find((entity) => entity.settlementName)?.settlementName ?? null
        : null;
      const evolved = { level: nextLevel };
      if (inheritsHarmony) evolved.harmony = true;
      if (inheritedName) evolved.settlementName = inheritedName;
      this.world.setCell(cursor.x, cursor.y, evolved);
      this.world.discover(nextLevel);
      this.world.addScore(definition.score);
      chain += 1;

      events.push({
        type: 'merge', x: cursor.x, y: cursor.y, fromLevel: source.level, toLevel: nextLevel,
        consumed, chain, clusterSize: cluster.length,
      });

      if (inheritsHarmony) events.push({ type: 'harmonyInherited', x: cursor.x, y: cursor.y, level: nextLevel });

      if (cluster.length >= GAME_CONFIG.perfect.minCluster && perfectUnlocked) {
        const bonus = Math.round(
          (GAME_CONFIG.perfect.baseBonus + GAME_CONFIG.perfect.levelBonus * nextLevel)
          * (cluster.length - GAME_CONFIG.mergeCount)
          * this.perkSystem.perfectScoreMultiplier,
        );
        this.world.addScore(bonus);
        this.world.recordPerfectMerge();
        events.push({
          type: 'perfectMerge', x: cursor.x, y: cursor.y, fromLevel: source.level, toLevel: nextLevel,
          clusterSize: cluster.length, overflow, bonus,
        });
      }

      const radiantCount = consumedEntities.filter((entity) => entity.variant === 'radiant').length;
      if (radiantCount > 0) {
        const bonus = radiantCount * (GAME_CONFIG.radiant.mergeBonusBase + GAME_CONFIG.radiant.mergeBonusPerLevel * nextLevel);
        this.world.addScore(bonus);
        this.world.radiantsConsumed += radiantCount;
        events.push({
          type: 'radiantMerge', x: cursor.x, y: cursor.y, level: nextLevel, count: radiantCount, bonus,
          bloomEnergy: GAME_CONFIG.bloom.radiantEnergy * radiantCount,
        });
      }

      if (wasNewDiscovery) {
        this.world.addScore(definition.discoveryBonus);
        events.push({ type: 'discovery', x: cursor.x, y: cursor.y, level: nextLevel, bonus: definition.discoveryBonus });
      }
    }

    if (chain > 0) this.world.recordChain(chain);
    return events;
  }
}

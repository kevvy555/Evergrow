import { GAME_CONFIG } from '../core/config.js';
import { cellKey } from '../utils/grid.js';

export class WorldState {
  constructor(snapshot = null) {
    this.columns = GAME_CONFIG.grid.columns;
    this.rows = GAME_CONFIG.grid.rows;
    this.cells = new Map();
    this.score = 0;
    this.taps = 0;
    this.bestChain = 0;
    this.discoveredLevel = 0;
    this.flow = 0;
    this.bestFlow = 0;
    this.goalIndex = 0;
    this.activeSpark = null;
    this.nextSparkAt = GAME_CONFIG.spark.firstAt;
    this.sparksCollected = 0;
    this.bloomEnergy = 0;
    this.bloomTurns = 0;
    this.bloomsTriggered = 0;
    this.perfectMerges = 0;
    this.perks = [];
    this.pendingEvolutionChoiceId = null;
    this.evolutionChoicesCompleted = [];
    this.resonancePromotions = 0;
    this.discoveredWonders = [];
    this.radiantsCreated = 0;
    this.masteryRadiantsCreated = 0;
    this.radiantsConsumed = 0;

    this.weatherId = null;
    this.weatherTurns = 0;
    this.weatherIndex = 0;
    this.nextWeatherAt = GAME_CONFIG.weather.firstAt;
    this.weatherEventsExperienced = 0;

    this.activeWish = null;
    this.nextWishAt = GAME_CONFIG.wishes.firstAt;
    this.wishesCompleted = 0;
    this.communityJoy = 0;
    this.festivalTurns = 0;
    this.festivalsTriggered = 0;
    this.harmonyDistricts = 0;
    this.settlementNameIndex = 0;

    this.createdAt = Date.now();
    if (snapshot) this.load(snapshot);
  }

  getCell(x, y) { return this.cells.get(cellKey(x, y)) ?? null; }
  setCell(x, y, entity) { this.cells.set(cellKey(x, y), { ...entity, x, y }); }
  clearCell(x, y) { this.cells.delete(cellKey(x, y)); }
  incrementTaps() { this.taps += 1; }
  addScore(points) { this.score += points; }
  recordChain(chain) { this.bestChain = Math.max(this.bestChain, chain); }
  setFlow(flow) { this.flow = flow; this.bestFlow = Math.max(this.bestFlow, flow); }
  discover(level) { this.discoveredLevel = Math.max(this.discoveredLevel, level); }
  recordPerfectMerge() { this.perfectMerges += 1; }
  hasPerk(id) { return this.perks.includes(id); }
  addPerk(id) { if (!this.hasPerk(id)) this.perks.push(id); }
  hasWonder(id) { return this.discoveredWonders.includes(id); }
  discoverWonder(id) { if (!this.hasWonder(id)) this.discoveredWonders.push(id); }

  toJSON() {
    return {
      version: 5,
      columns: this.columns,
      rows: this.rows,
      cells: [...this.cells.values()],
      score: this.score,
      taps: this.taps,
      bestChain: this.bestChain,
      discoveredLevel: this.discoveredLevel,
      flow: this.flow,
      bestFlow: this.bestFlow,
      goalIndex: this.goalIndex,
      activeSpark: this.activeSpark,
      nextSparkAt: this.nextSparkAt,
      sparksCollected: this.sparksCollected,
      bloomEnergy: this.bloomEnergy,
      bloomTurns: this.bloomTurns,
      bloomsTriggered: this.bloomsTriggered,
      perfectMerges: this.perfectMerges,
      perks: this.perks,
      pendingEvolutionChoiceId: this.pendingEvolutionChoiceId,
      evolutionChoicesCompleted: this.evolutionChoicesCompleted,
      resonancePromotions: this.resonancePromotions,
      discoveredWonders: this.discoveredWonders,
      radiantsCreated: this.radiantsCreated,
      masteryRadiantsCreated: this.masteryRadiantsCreated,
      radiantsConsumed: this.radiantsConsumed,
      weatherId: this.weatherId,
      weatherTurns: this.weatherTurns,
      weatherIndex: this.weatherIndex,
      nextWeatherAt: this.nextWeatherAt,
      weatherEventsExperienced: this.weatherEventsExperienced,
      activeWish: this.activeWish,
      nextWishAt: this.nextWishAt,
      wishesCompleted: this.wishesCompleted,
      communityJoy: this.communityJoy,
      festivalTurns: this.festivalTurns,
      festivalsTriggered: this.festivalsTriggered,
      harmonyDistricts: this.harmonyDistricts,
      settlementNameIndex: this.settlementNameIndex,
      createdAt: this.createdAt,
    };
  }

  load(snapshot) {
    this.score = snapshot.score ?? 0;
    this.taps = snapshot.taps ?? 0;
    this.bestChain = snapshot.bestChain ?? 0;
    this.discoveredLevel = snapshot.discoveredLevel ?? 0;
    this.flow = snapshot.flow ?? 0;
    this.bestFlow = snapshot.bestFlow ?? 0;
    this.goalIndex = snapshot.goalIndex ?? 0;
    this.activeSpark = snapshot.activeSpark ?? null;
    this.nextSparkAt = snapshot.nextSparkAt ?? Math.max(GAME_CONFIG.spark.firstAt, this.taps + 3);
    this.sparksCollected = snapshot.sparksCollected ?? 0;
    this.bloomEnergy = snapshot.bloomEnergy ?? 0;
    this.bloomTurns = snapshot.bloomTurns ?? 0;
    this.bloomsTriggered = snapshot.bloomsTriggered ?? 0;
    this.perfectMerges = snapshot.perfectMerges ?? 0;
    this.perks = [...(snapshot.perks ?? [])];
    this.pendingEvolutionChoiceId = snapshot.pendingEvolutionChoiceId ?? null;
    this.evolutionChoicesCompleted = [...(snapshot.evolutionChoicesCompleted ?? [])];
    this.resonancePromotions = snapshot.resonancePromotions ?? 0;
    this.discoveredWonders = [...(snapshot.discoveredWonders ?? [])];
    this.radiantsCreated = snapshot.radiantsCreated ?? 0;
    this.masteryRadiantsCreated = snapshot.masteryRadiantsCreated
      ?? Math.min(this.radiantsCreated, Math.floor(this.perfectMerges / GAME_CONFIG.radiant.everyPerfectMerges));
    this.radiantsConsumed = snapshot.radiantsConsumed ?? 0;

    this.weatherId = snapshot.weatherId ?? null;
    this.weatherTurns = snapshot.weatherTurns ?? 0;
    this.weatherIndex = snapshot.weatherIndex ?? 0;
    this.nextWeatherAt = snapshot.nextWeatherAt ?? Math.max(GAME_CONFIG.weather.firstAt, this.taps + 5);
    this.weatherEventsExperienced = snapshot.weatherEventsExperienced ?? 0;

    this.activeWish = snapshot.activeWish ? { ...snapshot.activeWish } : null;
    this.nextWishAt = snapshot.nextWishAt ?? Math.max(GAME_CONFIG.wishes.firstAt, this.taps + 3);
    this.wishesCompleted = snapshot.wishesCompleted ?? 0;
    this.communityJoy = snapshot.communityJoy ?? 0;
    this.festivalTurns = snapshot.festivalTurns ?? 0;
    this.festivalsTriggered = snapshot.festivalsTriggered ?? 0;
    this.harmonyDistricts = snapshot.harmonyDistricts ?? 0;
    this.settlementNameIndex = snapshot.settlementNameIndex ?? 0;

    this.createdAt = snapshot.createdAt ?? Date.now();
    this.cells.clear();
    for (const cell of snapshot.cells ?? []) {
      if (cell.x < this.columns && cell.y < this.rows) this.setCell(cell.x, cell.y, cell);
    }
  }
}

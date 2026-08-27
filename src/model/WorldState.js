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
    this.createdAt = Date.now();

    if (snapshot) this.load(snapshot);
  }

  getCell(x, y) {
    return this.cells.get(cellKey(x, y)) ?? null;
  }

  setCell(x, y, entity) {
    this.cells.set(cellKey(x, y), { ...entity, x, y });
  }

  clearCell(x, y) {
    this.cells.delete(cellKey(x, y));
  }

  incrementTaps() {
    this.taps += 1;
  }

  addScore(points) {
    this.score += points;
  }

  recordChain(chain) {
    this.bestChain = Math.max(this.bestChain, chain);
  }

  setFlow(flow) {
    this.flow = flow;
    this.bestFlow = Math.max(this.bestFlow, flow);
  }

  discover(level) {
    this.discoveredLevel = Math.max(this.discoveredLevel, level);
  }

  toJSON() {
    return {
      version: 2,
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
    this.createdAt = snapshot.createdAt ?? Date.now();
    this.cells.clear();
    for (const cell of snapshot.cells ?? []) {
      if (cell.x < this.columns && cell.y < this.rows) this.setCell(cell.x, cell.y, cell);
    }
  }
}

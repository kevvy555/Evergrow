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

  discover(level) {
    this.discoveredLevel = Math.max(this.discoveredLevel, level);
  }

  toJSON() {
    return {
      version: 1,
      columns: this.columns,
      rows: this.rows,
      cells: [...this.cells.values()],
      score: this.score,
      taps: this.taps,
      bestChain: this.bestChain,
      discoveredLevel: this.discoveredLevel,
      createdAt: this.createdAt,
    };
  }

  load(snapshot) {
    this.score = snapshot.score ?? 0;
    this.taps = snapshot.taps ?? 0;
    this.bestChain = snapshot.bestChain ?? 0;
    this.discoveredLevel = snapshot.discoveredLevel ?? 0;
    this.createdAt = snapshot.createdAt ?? Date.now();
    this.cells.clear();
    for (const cell of snapshot.cells ?? []) this.setCell(cell.x, cell.y, cell);
  }
}

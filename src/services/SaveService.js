import { GAME_CONFIG } from '../core/config.js';

export class SaveService {
  load() {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.saveKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Could not load save', error);
      return null;
    }
  }

  save(world) {
    try {
      localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(world.toJSON()));
    } catch (error) {
      console.warn('Could not save game', error);
    }
  }

  clear() {
    localStorage.removeItem(GAME_CONFIG.saveKey);
  }
}

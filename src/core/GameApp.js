import { Application } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { GAME_CONFIG } from './config.js';
import { WorldState } from '../model/WorldState.js';
import { MergeSystem } from '../systems/MergeSystem.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { SaveService } from '../services/SaveService.js';
import { WorldView } from '../view/WorldView.js';
import { HudView } from '../view/HudView.js';

export class GameApp {
  constructor(host) {
    this.host = host;
    this.pixi = new Application();
    this.saveService = new SaveService();
    this.world = null;
    this.worldView = null;
    this.hud = null;
    this.autosaveHandle = null;
  }

  async start() {
    await this.pixi.init({
      resizeTo: this.host,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(devicePixelRatio || 1, 2),
      backgroundAlpha: 0,
    });
    this.host.appendChild(this.pixi.canvas);
    this.#buildWorld(this.saveService.load());
    this.pixi.renderer.on('resize', () => this.#layout());
    this.#layout();
    this.autosaveHandle = window.setInterval(() => this.saveService.save(this.world), GAME_CONFIG.autosaveMs);
  }

  #buildWorld(snapshot) {
    this.pixi.stage.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.world = new WorldState(snapshot);
    const mergeSystem = new MergeSystem(this.world);
    const growthSystem = new GrowthSystem(this.world, mergeSystem);
    const progressionSystem = new ProgressionSystem(this.world);

    this.worldView = new WorldView(this.world, (x, y) => {
      const events = growthSystem.tap(x, y);
      this.worldView.play(events);
      this.hud.render();
      this.saveService.save(this.world);
    });
    this.worldView.on('effect', (tick) => {
      this.pixi.ticker.add(tick);
      this.worldView.removeTicker = (fn) => this.pixi.ticker.remove(fn);
    });

    this.hud = new HudView(this.world, progressionSystem, () => this.#reset());
    this.pixi.stage.addChild(this.worldView, this.hud);
  }

  #reset() {
    if (!window.confirm('Start a completely new world?')) return;
    this.saveService.clear();
    this.#buildWorld(null);
    this.#layout();
  }

  #layout() {
    // renderer.screen is already expressed in logical CSS pixels. Dividing the
    // renderer dimensions by resolution again shrinks the game on high-DPI devices.
    const { width, height } = this.pixi.renderer.screen;
    const hudHeight = this.hud.resize(width, height);
    this.worldView.resize(width, height, hudHeight);
  }
}

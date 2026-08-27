import { Application } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { GAME_CONFIG } from './config.js';
import { WorldState } from '../model/WorldState.js';
import { ClusterFinder } from '../systems/ClusterFinder.js';
import { MergeSystem } from '../systems/MergeSystem.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';
import { FlowSystem } from '../systems/FlowSystem.js';
import { SparkSystem } from '../systems/SparkSystem.js';
import { GoalSystem } from '../systems/GoalSystem.js';
import { HintSystem } from '../systems/HintSystem.js';
import { TurnSystem } from '../systems/TurnSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { SaveService } from '../services/SaveService.js';
import { FeedbackService } from '../services/FeedbackService.js';
import { WorldView } from '../view/WorldView.js';
import { HudView } from '../view/HudView.js';

export class GameApp {
  constructor(host) {
    this.host = host;
    this.pixi = new Application();
    this.saveService = new SaveService();
    this.feedbackService = new FeedbackService();
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
    this.autosaveHandle = window.setInterval(
      () => this.saveService.save(this.world),
      GAME_CONFIG.autosaveMs,
    );
  }

  #buildWorld(snapshot) {
    this.pixi.stage.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.world = new WorldState(snapshot);

    const clusterFinder = new ClusterFinder(this.world);
    const mergeSystem = new MergeSystem(this.world, clusterFinder);
    const growthSystem = new GrowthSystem(this.world, mergeSystem);
    const flowSystem = new FlowSystem(this.world);
    const sparkSystem = new SparkSystem(this.world, mergeSystem);
    const goalSystem = new GoalSystem(this.world);
    const hintSystem = new HintSystem(this.world, clusterFinder);
    const progressionSystem = new ProgressionSystem(this.world);
    const turnSystem = new TurnSystem(
      this.world,
      growthSystem,
      sparkSystem,
      flowSystem,
      goalSystem,
    );

    this.worldView = new WorldView(this.world, hintSystem, (x, y) => {
      const events = turnSystem.tap(x, y);
      this.worldView.play(events);
      this.hud.render();
      this.feedbackService.handle(events);
      this.saveService.save(this.world);
    });
    this.worldView.on('effect', (tick) => {
      this.pixi.ticker.add(tick);
      this.worldView.removeTicker = (fn) => this.pixi.ticker.remove(fn);
    });

    this.hud = new HudView(
      this.world,
      progressionSystem,
      goalSystem,
      () => this.#reset(),
      () => this.feedbackService.toggle(),
      () => this.feedbackService.enabled,
    );
    this.pixi.stage.addChild(this.worldView, this.hud);
  }

  #reset() {
    if (!window.confirm('Start a completely new world?')) return;
    this.saveService.clear();
    this.#buildWorld(null);
    this.#layout();
  }

  #layout() {
    const { width, height } = this.pixi.renderer.screen;
    const hudHeight = this.hud.resize(width, height);
    this.worldView.resize(width, height, hudHeight);
  }
}

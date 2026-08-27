import { Application } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { GAME_CONFIG } from './config.js';
import { WorldState } from '../model/WorldState.js';
import { ClusterFinder } from '../systems/ClusterFinder.js';
import { PerkSystem } from '../systems/PerkSystem.js';
import { MergeSystem } from '../systems/MergeSystem.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';
import { FlowSystem } from '../systems/FlowSystem.js';
import { BloomSystem } from '../systems/BloomSystem.js';
import { SparkSystem } from '../systems/SparkSystem.js';
import { ResonanceSystem } from '../systems/ResonanceSystem.js';
import { MutationSystem } from '../systems/MutationSystem.js';
import { WonderSystem } from '../systems/WonderSystem.js';
import { EvolutionSystem } from '../systems/EvolutionSystem.js';
import { GoalSystem } from '../systems/GoalSystem.js';
import { HintSystem } from '../systems/HintSystem.js';
import { TurnSystem } from '../systems/TurnSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { SaveService } from '../services/SaveService.js';
import { FeedbackService } from '../services/FeedbackService.js';
import { WorldView } from '../view/WorldView.js';
import { HudView } from '../view/HudView.js';
import { EvolutionChoiceView } from '../view/EvolutionChoiceView.js';
import { JournalView } from '../view/JournalView.js';

export class GameApp {
  constructor(host) {
    this.host = host;
    this.pixi = new Application();
    this.saveService = new SaveService();
    this.feedbackService = new FeedbackService();
    this.world = null;
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

    const clusters = new ClusterFinder(this.world);
    const perks = new PerkSystem(this.world);
    const merge = new MergeSystem(this.world, clusters, perks);
    const growth = new GrowthSystem(this.world, merge);
    const flow = new FlowSystem(this.world, perks);
    const bloom = new BloomSystem(this.world, perks);
    const spark = new SparkSystem(this.world, merge, perks);
    const resonance = new ResonanceSystem(this.world, merge);
    const mutation = new MutationSystem(this.world);
    const wonder = new WonderSystem(this.world);
    const evolution = new EvolutionSystem(this.world);
    const goals = new GoalSystem(this.world);
    const hints = new HintSystem(this.world, clusters);
    const progression = new ProgressionSystem(this.world);
    const turns = new TurnSystem(this.world, {
      growthSystem: growth,
      sparkSystem: spark,
      resonanceSystem: resonance,
      mutationSystem: mutation,
      wonderSystem: wonder,
      flowSystem: flow,
      bloomSystem: bloom,
      evolutionSystem: evolution,
      goalSystem: goals,
    });

    this.evolutionSystem = evolution;
    this.worldView = new WorldView(this.world, hints, (x, y) => this.#takeTurn(turns, x, y));
    this.worldView.on('effect', (tick) => {
      this.pixi.ticker.add(tick);
      this.worldView.removeTicker = (fn) => this.pixi.ticker.remove(fn);
    });
    this.journalView = new JournalView(this.world, () => this.journalView.hide());
    this.choiceView = new EvolutionChoiceView((optionId) => this.#chooseEvolution(optionId));
    this.hud = new HudView(this.world, progression, goals, {
      reset: () => this.#reset(),
      toggleFeedback: () => this.feedbackService.toggle(),
      feedbackEnabled: () => this.feedbackService.enabled,
      openJournal: () => this.journalView.toggle(),
    });
    this.pixi.stage.addChild(this.worldView, this.hud, this.journalView, this.choiceView);
  }

  #takeTurn(turns, x, y) {
    const events = turns.tap(x, y);
    this.worldView.play(events);
    this.hud.render();
    this.journalView.refresh();
    this.feedbackService.handle(events);
    this.#syncChoice();
    this.saveService.save(this.world);
  }

  #chooseEvolution(optionId) {
    const events = this.evolutionSystem.choose(optionId);
    this.choiceView.hide();
    this.worldView.play(events);
    this.hud.render();
    this.journalView.refresh();
    this.feedbackService.handle(events);
    this.saveService.save(this.world);
  }

  #syncChoice() {
    const choice = this.evolutionSystem.getPendingChoice();
    if (choice) this.choiceView.show(choice);
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
    this.journalView.resize(width, height);
    this.choiceView.resize(width, height);
    this.#syncChoice();
  }
}

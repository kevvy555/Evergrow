import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS, GAME_CONFIG } from '../core/config.js';

export class HudView extends Container {
  constructor(world, progression, goalSystem, onReset, onToggleFeedback, isFeedbackEnabled) {
    super();
    this.world = world;
    this.progression = progression;
    this.goalSystem = goalSystem;
    this.isFeedbackEnabled = isFeedbackEnabled;

    this.background = new Graphics();
    this.title = this.#text('EVERGROW', 20, 900);
    this.version = this.#text(`v${GAME_CONFIG.version}`, 10, 700, 0x91a9c2);
    this.stage = this.#text('', 11, 700);
    this.flow = this.#text('', 11, 800, 0xffcf66);
    this.score = this.#text('', 12, 800);
    this.population = this.#text('', 11, 650);
    this.goal = this.#text('', 11, 650, 0xdbeafe);
    this.feedback = this.#makeButton('🔊', () => {
      onToggleFeedback();
      this.render();
    }, 30);
    this.reset = this.#makeButton('New world', onReset, 82);

    this.flow.anchor.set(0.5, 0);
    this.score.anchor.set(0.5, 0);
    this.population.anchor.set(1, 0);

    this.addChild(
      this.background,
      this.title,
      this.version,
      this.stage,
      this.flow,
      this.score,
      this.population,
      this.goal,
      this.feedback,
      this.reset,
    );
  }

  resize(width) {
    const panelX = 6;
    const panelY = 6;
    const panelHeight = 87;
    const hudHeight = 98;

    this.background
      .clear()
      .roundRect(panelX, panelY, Math.max(1, width - panelX * 2), panelHeight, 18)
      .fill({ color: 0x07111f, alpha: 0.8 })
      .stroke({ color: 0xffffff, alpha: 0.08, width: 1 });

    this.title.position.set(16, 11);
    this.version.position.set(120, 17);
    this.feedback.position.set(Math.max(202, width - 126), 10);
    this.reset.position.set(Math.max(238, width - 90), 10);

    this.stage.position.set(16, 41);
    this.flow.position.set(width * 0.42, 41);
    this.score.position.set(width * 0.66, 41);
    this.population.position.set(width - 16, 41);
    this.goal.position.set(16, 65);

    this.render();
    return hudHeight;
  }

  render() {
    const current = ENTITY_DEFINITIONS[this.world.discoveredLevel];
    const goal = this.goalSystem.getCurrentGoal();
    this.stage.text = `${current?.emoji ?? '🌱'} ${this.progression.getCurrentStage()} · chain ${this.world.bestChain}×`;
    this.flow.text = this.world.flow > 0 ? `🔥 ${this.world.flow}× FLOW` : '🔥 —';
    this.score.text = `✨ ${this.world.score.toLocaleString()}`;
    this.population.text = `👥 ${this.progression.getPopulation().toLocaleString()}`;
    this.goal.text = goal ? `🎯 ${goal.label} · +${goal.reward.toLocaleString()}` : '🎯 All launch goals complete';
    this.feedback.setLabel(this.isFeedbackEnabled() ? '🔊' : '🔇');
  }

  #text(text, size, weight, fill = 0xf8fbff) {
    return new Text({
      text,
      style: new TextStyle({ fontSize: size, fontWeight: weight, fill }),
    });
  }

  #makeButton(label, action, width) {
    const root = new Container();
    const bg = new Graphics().roundRect(0, 0, width, 30, 15).fill({ color: 0xffffff, alpha: 0.1 });
    const text = new Text({
      text: label,
      style: new TextStyle({ fontSize: 10, fontWeight: '700', fill: 0xffffff }),
      anchor: 0.5,
    });
    text.position.set(width / 2, 15);
    root.addChild(bg, text);
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', action);
    root.setLabel = (value) => { text.text = value; };
    return root;
  }
}

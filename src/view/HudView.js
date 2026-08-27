import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS, GAME_CONFIG } from '../core/config.js';

export class HudView extends Container {
  constructor(world, progression, onReset) {
    super();
    this.world = world;
    this.progression = progression;
    this.onReset = onReset;

    this.background = new Graphics();
    this.title = this.#text('EVERGROW', 21, 900);
    this.version = this.#text(`v${GAME_CONFIG.version}`, 10, 700, 0x91a9c2);
    this.stage = this.#text('', 11, 700);
    this.score = this.#text('', 13, 800);
    this.population = this.#text('', 11, 650);
    this.reset = this.#makeButton('New world', onReset);

    this.score.anchor.set(0.5, 0);
    this.population.anchor.set(1, 0);

    this.addChild(
      this.background,
      this.title,
      this.version,
      this.stage,
      this.score,
      this.population,
      this.reset,
    );
  }

  resize(width) {
    const panelX = 6;
    const panelY = 6;
    const panelHeight = 68;
    const hudHeight = 78;

    this.background
      .clear()
      .roundRect(panelX, panelY, Math.max(1, width - panelX * 2), panelHeight, 18)
      .fill({ color: 0x07111f, alpha: 0.78 })
      .stroke({ color: 0xffffff, alpha: 0.08, width: 1 });

    // Row 1: branding/version left, reset right.
    this.title.position.set(16, 12);
    this.version.position.set(124, 18);
    this.reset.position.set(Math.max(218, width - 98), 10);

    // Row 2: three deliberately separated columns. Anchors prevent long values
    // growing into their neighbours from the wrong direction.
    this.stage.position.set(16, 43);
    this.score.position.set(width * 0.56, 43);
    this.population.position.set(width - 16, 44);

    this.render();
    return hudHeight;
  }

  render() {
    const current = ENTITY_DEFINITIONS[this.world.discoveredLevel];
    this.stage.text = `${current?.emoji ?? '🌱'} ${this.progression.getCurrentStage()} · ${this.world.bestChain}×`;
    this.score.text = `✨ ${this.world.score.toLocaleString()}`;
    this.population.text = `👥 ${this.progression.getPopulation().toLocaleString()}`;
  }

  #text(text, size, weight, fill = 0xf8fbff) {
    return new Text({
      text,
      style: new TextStyle({ fontSize: size, fontWeight: weight, fill }),
    });
  }

  #makeButton(label, action) {
    const root = new Container();
    const bg = new Graphics().roundRect(0, 0, 86, 30, 15).fill({ color: 0xffffff, alpha: 0.1 });
    const text = new Text({
      text: label,
      style: new TextStyle({ fontSize: 10, fontWeight: '700', fill: 0xffffff }),
      anchor: 0.5,
    });
    text.position.set(43, 15);
    root.addChild(bg, text);
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', action);
    return root;
  }
}

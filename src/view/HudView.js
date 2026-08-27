import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS } from '../core/config.js';

export class HudView extends Container {
  constructor(world, progression, onReset) {
    super();
    this.world = world;
    this.progression = progression;
    this.onReset = onReset;
    this.background = new Graphics();
    this.title = this.#text('EVERGROW', 23, 900);
    this.stage = this.#text('', 12, 700);
    this.score = this.#text('', 15, 800);
    this.population = this.#text('', 12, 600);
    this.next = this.#text('', 12, 600);
    this.hint = this.#text('Tap empty land · connect 3 matching things', 11, 500);
    this.reset = this.#makeButton('New world', onReset);
    this.addChild(this.background, this.title, this.stage, this.score, this.population, this.next, this.hint, this.reset);
  }

  resize(width, height) {
    const compact = height < 620 || width > height;
    const hudHeight = compact ? 78 : 96;
    const panelHeight = compact ? 66 : 84;

    this.background
      .clear()
      .roundRect(8, 8, width - 16, panelHeight, 20)
      .fill({ color: 0x07111f, alpha: 0.74 })
      .stroke({ color: 0xffffff, alpha: 0.08, width: 1 });

    this.title.position.set(20, 15);
    this.stage.position.set(20, compact ? 43 : 44);
    this.score.position.set(Math.max(150, width * 0.42), 18);
    this.population.position.set(Math.max(150, width * 0.42), compact ? 45 : 46);
    this.next.position.set(20, compact ? 0 : 66);
    this.next.visible = !compact;
    this.hint.position.set(Math.max(285, width * 0.62), compact ? 45 : 66);
    this.hint.visible = width >= 620;
    this.reset.position.set(width - 108, 14);
    this.render();
    return hudHeight;
  }

  render() {
    const current = ENTITY_DEFINITIONS[this.world.discoveredLevel];
    this.stage.text = `${current?.emoji ?? '🌱'} ${this.progression.getCurrentStage()} · Chain ${this.world.bestChain}×`;
    this.score.text = `✨ ${this.world.score.toLocaleString()}`;
    this.population.text = `👥 ${this.progression.getPopulation().toLocaleString()}`;
    this.next.text = `Next: ${this.progression.getNextDiscovery()}`;
  }

  #text(text, size, weight) {
    return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill: 0xf8fbff }) });
  }

  #makeButton(label, action) {
    const root = new Container();
    const bg = new Graphics().roundRect(0, 0, 88, 32, 16).fill({ color: 0xffffff, alpha: 0.1 });
    const text = new Text({ text: label, style: new TextStyle({ fontSize: 11, fontWeight: '700', fill: 0xffffff }), anchor: 0.5 });
    text.position.set(44, 16);
    root.addChild(bg, text);
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', action);
    return root;
  }
}

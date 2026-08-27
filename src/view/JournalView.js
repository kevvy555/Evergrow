import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS } from '../core/config.js';
import { WONDER_DEFINITIONS } from '../core/wonderDefinitions.js';

export class JournalView extends Container {
  constructor(world, onClose) {
    super();
    this.world = world;
    this.onClose = onClose;
    this.screenSize = { width: 360, height: 720 };
    this.visible = false;
    this.eventMode = 'none';
  }

  show() { this.visible = true; this.eventMode = 'static'; this.#render(); }
  hide() { this.visible = false; this.eventMode = 'none'; this.removeChildren().forEach((child) => child.destroy({ children: true })); }
  toggle() { this.visible ? this.hide() : this.show(); }
  resize(width, height) { this.screenSize = { width, height }; if (this.visible) this.#render(); }
  refresh() { if (this.visible) this.#render(); }

  #render() {
    this.removeChildren().forEach((child) => child.destroy({ children: true }));
    const { width, height } = this.screenSize;
    const landscape = width > height;
    const panelWidth = Math.min(landscape ? 720 : 430, width - 20);
    const panelHeight = Math.min(landscape ? height - 16 : 620, height - 22);
    const x = (width - panelWidth) / 2;
    const y = (height - panelHeight) / 2;

    const shade = new Graphics().rect(0, 0, width, height).fill({ color: 0x020711, alpha: 0.8 });
    shade.eventMode = 'static';
    const panel = new Graphics()
      .roundRect(x, y, panelWidth, panelHeight, 24)
      .fill({ color: 0x0b1930, alpha: 0.99 })
      .stroke({ color: 0x5ea6d8, alpha: 0.35, width: 1 });
    const title = this.#text('DISCOVERY JOURNAL', 18, 900); title.position.set(x + 18, y + 14);
    const count = this.#text(
      `${this.world.discoveredLevel + 1}/${ENTITY_DEFINITIONS.length} life · ${this.world.discoveredWonders.length}/${WONDER_DEFINITIONS.length} wonders`,
      10,
      700,
      0x91a9c2,
    );
    count.position.set(x + 19, y + 42);
    const close = this.#button('×', x + panelWidth - 44, y + 11, this.onClose);
    this.addChild(shade, panel, title, count, close);

    if (landscape) this.#renderLandscape(x, y, panelWidth, panelHeight);
    else this.#renderPortrait(x, y, panelWidth, panelHeight);
  }

  #renderPortrait(x, y, panelWidth, panelHeight) {
    this.#sectionLabel('LIFE', x + 20, y + 63, 0x91a9c2);
    const discoveryStart = y + 78;
    this.#renderDiscoveries(x + 20, discoveryStart, panelWidth - 40, 30);

    const wonderHeaderY = discoveryStart + ENTITY_DEFINITIONS.length * 30 + 5;
    this.#sectionLabel('HIDDEN WONDERS', x + 20, wonderHeaderY, 0xd4b6ff);
    this.#renderWonders(x + 20, wonderHeaderY + 18, panelWidth - 40, 27);
    this.#renderStats(x + 20, y + panelHeight - 88);
  }

  #renderLandscape(x, y, panelWidth, panelHeight) {
    const columnGap = 22;
    const columnWidth = (panelWidth - 54 - columnGap) / 2;
    const leftX = x + 20;
    const rightX = leftX + columnWidth + columnGap;
    const top = y + 67;

    this.#sectionLabel('LIFE', leftX, top, 0x91a9c2);
    const discoveryRow = Math.max(24, Math.min(31, (panelHeight - 105) / ENTITY_DEFINITIONS.length));
    this.#renderDiscoveries(leftX, top + 17, columnWidth, discoveryRow);

    this.#sectionLabel('HIDDEN WONDERS', rightX, top, 0xd4b6ff);
    const wonderRow = Math.max(25, Math.min(31, (panelHeight - 145) / WONDER_DEFINITIONS.length));
    this.#renderWonders(rightX, top + 17, columnWidth, wonderRow);
    this.#renderStats(rightX, y + panelHeight - 88);
  }

  #renderDiscoveries(x, startY, width, rowHeight) {
    ENTITY_DEFINITIONS.forEach((definition, index) => {
      const unlocked = index <= this.world.discoveredLevel;
      const rowY = startY + index * rowHeight;
      const icon = this.#text(unlocked ? definition.emoji : '?', Math.max(15, rowHeight * 0.58), 800, unlocked ? 0xffffff : 0x62758a);
      icon.position.set(x, rowY);
      const name = this.#text(unlocked ? definition.name : 'Unknown discovery', 10, 800, unlocked ? 0xf8fbff : 0x62758a);
      name.position.set(x + 30, rowY + 2);
      const stage = this.#text(unlocked ? definition.stage : 'Keep growing…', 9, 600, unlocked ? 0x91a9c2 : 0x526375);
      stage.anchor.set(1, 0);
      stage.position.set(x + width, rowY + 3);
      this.addChild(icon, name, stage);
    });
  }

  #renderWonders(x, startY, width, rowHeight) {
    WONDER_DEFINITIONS.forEach((wonder, index) => {
      const unlocked = this.world.hasWonder(wonder.id);
      const rowY = startY + index * rowHeight;
      const icon = this.#text(unlocked ? wonder.icon : '◇', 15, 800, unlocked ? 0xffe49a : 0x56677a);
      icon.position.set(x, rowY);
      const name = this.#text(unlocked ? wonder.name : 'Undiscovered wonder', 10, 750, unlocked ? 0xf8fbff : 0x56677a);
      name.position.set(x + 28, rowY + 1);
      this.addChild(icon, name);
    });
  }

  #renderStats(x, y) {
    const perks = this.world.perks.length > 0 ? this.world.perks.map((perk) => perk.replaceAll('_', ' ')).join(' · ') : 'none yet';
    const places = [...this.world.cells.values()]
      .filter((entity) => entity.level >= 3 && entity.settlementName)
      .sort((a, b) => (b.level - a.level) || (a.y - b.y) || (a.x - b.x))
      .slice(0, 2)
      .map((entity) => entity.settlementName)
      .join(' · ');
    const stats = this.#text(
      `🏡 ${places || 'No named settlements yet'}\n♥ ${this.world.harmonyDistricts}   😊 ${this.world.wishesCompleted}   🎉 ${this.world.festivalsTriggered}   🌦 ${this.world.weatherEventsExperienced}\n💎 ${this.world.perfectMerges}   ⚡ ${this.world.resonancePromotions}   ✦ ${this.world.radiantsCreated}   🌸 ${this.world.bloomsTriggered}\n🧬 ${perks}`,
      9,
      700,
      0xdbeafe,
    );
    stats.position.set(x, y);
    stats.style.lineHeight = 17;
    this.addChild(stats);
  }

  #sectionLabel(text, x, y, fill) {
    const label = this.#text(text, 10, 900, fill);
    label.position.set(x, y);
    this.addChild(label);
  }

  #button(label, x, y, action) {
    const root = new Container(); root.position.set(x, y);
    const bg = new Graphics().circle(15, 15, 15).fill({ color: 0xffffff, alpha: 0.09 });
    const text = this.#text(label, 18, 700); text.anchor.set(0.5); text.position.set(15, 14);
    root.addChild(bg, text); root.eventMode = 'static'; root.cursor = 'pointer'; root.on('pointertap', action); return root;
  }

  #text(text, size, weight, fill = 0xffffff) {
    return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill }) });
  }
}

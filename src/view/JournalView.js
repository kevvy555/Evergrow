import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS } from '../core/config.js';

export class JournalView extends Container {
  constructor(world, onClose) { super(); this.world = world; this.onClose = onClose; this.screenSize = { width: 360, height: 720 }; this.visible = false; this.eventMode = 'none'; }
  show() { this.visible = true; this.eventMode = 'static'; this.#render(); }
  hide() { this.visible = false; this.eventMode = 'none'; this.removeChildren().forEach((child) => child.destroy({ children: true })); }
  toggle() { this.visible ? this.hide() : this.show(); }
  resize(width, height) { this.screenSize = { width, height }; if (this.visible) this.#render(); }
  refresh() { if (this.visible) this.#render(); }
  #render() {
    this.removeChildren().forEach((child) => child.destroy({ children: true }));
    const { width, height } = this.screenSize, panelWidth = Math.min(430, width - 20), panelHeight = Math.min(610, height - 26), x = (width - panelWidth) / 2, y = (height - panelHeight) / 2;
    const shade = new Graphics().rect(0, 0, width, height).fill({ color: 0x020711, alpha: 0.78 }); shade.eventMode = 'static';
    const panel = new Graphics().roundRect(x, y, panelWidth, panelHeight, 24).fill({ color: 0x0b1930, alpha: 0.99 }).stroke({ color: 0x5ea6d8, alpha: 0.35, width: 1 });
    const title = this.#text('DISCOVERY JOURNAL', 18, 900); title.position.set(x + 18, y + 16);
    const count = this.#text(`${this.world.discoveredLevel + 1}/${ENTITY_DEFINITIONS.length} discovered`, 11, 700, 0x91a9c2); count.position.set(x + 19, y + 43);
    const close = this.#button('×', x + panelWidth - 44, y + 13, this.onClose); this.addChild(shade, panel, title, count, close);
    const startY = y + 70, rowHeight = Math.min(54, (panelHeight - 175) / ENTITY_DEFINITIONS.length);
    ENTITY_DEFINITIONS.forEach((definition, index) => {
      const unlocked = index <= this.world.discoveredLevel, rowY = startY + index * rowHeight;
      const icon = this.#text(unlocked ? definition.emoji : '?', Math.max(18, rowHeight * 0.52), 800, unlocked ? 0xffffff : 0x62758a); icon.position.set(x + 20, rowY + 5);
      const name = this.#text(unlocked ? definition.name : 'Unknown discovery', 12, 800, unlocked ? 0xf8fbff : 0x62758a); name.position.set(x + 58, rowY + 8);
      const stage = this.#text(unlocked ? definition.stage : 'Keep growing…', 10, 600, unlocked ? 0x91a9c2 : 0x526375); stage.position.set(x + 58, rowY + 26);
      this.addChild(icon, name, stage);
    });
    const stats = this.#text(`💎 Perfect ${this.world.perfectMerges}   🌸 Blooms ${this.world.bloomsTriggered}\n🔥 Best Flow ${this.world.bestFlow}×   ⚡ Best Chain ${this.world.bestChain}×   ✦ Sparks ${this.world.sparksCollected}`, 11, 700, 0xdbeafe); stats.position.set(x + 20, y + panelHeight - 87); stats.style.lineHeight = 21; this.addChild(stats);
  }
  #button(label, x, y, action) { const root = new Container(); root.position.set(x, y); const bg = new Graphics().circle(15, 15, 15).fill({ color: 0xffffff, alpha: 0.09 }); const text = this.#text(label, 18, 700); text.anchor.set(0.5); text.position.set(15, 14); root.addChild(bg, text); root.eventMode = 'static'; root.cursor = 'pointer'; root.on('pointertap', action); return root; }
  #text(text, size, weight, fill = 0xffffff) { return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill }) }); }
}

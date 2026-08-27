import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';

export class EvolutionChoiceView extends Container {
  constructor(onChoose) { super(); this.onChoose = onChoose; this.choice = null; this.screenSize = { width: 360, height: 720 }; this.visible = false; this.eventMode = 'none'; }
  show(choice) { this.choice = choice; this.visible = Boolean(choice); this.eventMode = choice ? 'static' : 'none'; this.#render(); }
  hide() { this.choice = null; this.visible = false; this.eventMode = 'none'; this.removeChildren().forEach((child) => child.destroy({ children: true })); }
  resize(width, height) { this.screenSize = { width, height }; if (this.visible) this.#render(); }
  #render() {
    this.removeChildren().forEach((child) => child.destroy({ children: true }));
    if (!this.choice) return;
    const { width, height } = this.screenSize, panelWidth = Math.min(430, width - 24), panelHeight = 330, x = (width - panelWidth) / 2, y = Math.max(18, (height - panelHeight) / 2);
    const shade = new Graphics().rect(0, 0, width, height).fill({ color: 0x020711, alpha: 0.78 }); shade.eventMode = 'static';
    const panel = new Graphics().roundRect(x, y, panelWidth, panelHeight, 24).fill({ color: 0x0b1930, alpha: 0.98 }).stroke({ color: 0xb58cff, alpha: 0.55, width: 2 });
    const title = this.#text(this.choice.title.toUpperCase(), 18, 900); title.anchor.set(0.5, 0); title.position.set(width / 2, y + 22);
    const subtitle = this.#text('Choose one permanent evolution', 12, 600, 0xaec3da); subtitle.anchor.set(0.5, 0); subtitle.position.set(width / 2, y + 52);
    this.addChild(shade, panel, title, subtitle);
    this.choice.options.forEach((option, index) => {
      const cardY = y + 85 + index * 112, card = new Container(); card.position.set(x + 16, cardY);
      const bg = new Graphics().roundRect(0, 0, panelWidth - 32, 96, 18).fill({ color: 0xffffff, alpha: 0.07 }).stroke({ color: 0xffffff, alpha: 0.1, width: 1 });
      const icon = this.#text(option.icon, 29, 700); icon.position.set(16, 13);
      const name = this.#text(option.name, 15, 900); name.position.set(58, 13);
      const desc = this.#text(option.description, 11, 600, 0xc9d8e8); desc.position.set(58, 40); desc.style.wordWrap = true; desc.style.wordWrapWidth = panelWidth - 122;
      const choose = this.#button('CHOOSE', panelWidth - 124, 56, () => this.onChoose(option.id));
      card.addChild(bg, icon, name, desc, choose); this.addChild(card);
    });
  }
  #button(label, x, y, action) { const root = new Container(); root.position.set(x, y); const bg = new Graphics().roundRect(0, 0, 76, 28, 14).fill({ color: 0x8b6cff, alpha: 0.9 }); const text = this.#text(label, 9, 900); text.anchor.set(0.5); text.position.set(38, 14); root.addChild(bg, text); root.eventMode = 'static'; root.cursor = 'pointer'; root.on('pointertap', action); return root; }
  #text(text, size, weight, fill = 0xffffff) { return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill }) }); }
}

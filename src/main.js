import { GameApp } from './core/GameApp.js';

const host = document.querySelector('#app');
const game = new GameApp(host);

game.start().catch((error) => {
  console.error(error);
  host.innerHTML = `<div style="padding:24px;color:white;font-family:system-ui"><h1>Evergrow couldn't start</h1><p>${error.message}</p></div>`;
});

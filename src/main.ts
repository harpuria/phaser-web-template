import Phaser from 'phaser';
import { App } from './app';
import { gameConfig } from './config/game';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene, MenuScene } from './game/scenes';
import { Shell } from './ui/Shell';
import './style.css';

document.title = gameConfig.title;
const app = new App();
const shell = new Shell(app);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: gameConfig.width,
  height: gameConfig.height,
  backgroundColor: gameConfig.background,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  input: {
    activePointers: 2,
    keyboard: { target: document.getElementById('game')! },
  },
  scene: [
    new BootScene(app),
    new PreloadScene(app),
    new MenuScene(app),
    new GameScene(app),
  ],
});

// Keep hot module replacement from accumulating canvases, timers and DOM listeners.
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    shell.destroy();
    app.destroy();
    game.destroy(true);
  });

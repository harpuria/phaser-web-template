import Phaser from 'phaser';
import { App } from './app';
import { gameConfig } from './config/game';
import { watchUncaughtErrors } from './core/errors';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene, MenuScene } from './game/scenes';
import { Shell } from './ui/Shell';
import './style.css';

document.title = gameConfig.title;
const app = new App();
const shell = new Shell(app);
const stopWatchingErrors = watchUncaughtErrors((message) => {
  app.fatalError = message;
  app.onState();
});
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // 렌더 배율만큼 크게 그리고, 각 장면의 카메라가 같은 배율로 zoom한다(core/viewport.ts).
  width: gameConfig.width * app.renderScale,
  height: gameConfig.height * app.renderScale,
  backgroundColor: gameConfig.background,
  pixelArt: gameConfig.pixelArt,
  scale: {
    // EXPAND: 화면 비율이 달라도 기본 해상도 영역을 모두 보이고 남는 공간은 배경으로 채운다.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'stage',
  },
  physics: { default: 'arcade', arcade: { debug: app.debug } },
  input: {
    activePointers: 2,
    gamepad: true,
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
    stopWatchingErrors();
    shell.destroy();
    app.destroy();
    game.destroy(true);
  });

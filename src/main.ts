import Phaser from 'phaser';
import { App } from './app';
import { gameConfig } from './config/game';
import { watchUncaughtErrors } from './core/errors';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene, MenuScene } from './game/scenes';
import { Shell } from './ui/Shell';
import { createPlatform } from './services/bootstrap';
import './style.css';

document.title = gameConfig.title;
let disposed = false;
let teardown = () => {};
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    disposed = true;
    teardown();
  });

async function start() {
  const context = await createPlatform({
    ...gameConfig.services,
    development: import.meta.env.DEV,
  });
  if (disposed) {
    context.platform.destroy();
    return;
  }
  const app = new App(context);
  const shell = new Shell(app);
  const stopWatchingErrors = watchUncaughtErrors((message) => {
    app.fail(message);
  });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: gameConfig.width * app.renderScale,
    height: gameConfig.height * app.renderScale,
    backgroundColor: gameConfig.background,
    pixelArt: gameConfig.pixelArt,
    scale: {
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
  teardown = () => {
    stopWatchingErrors();
    shell.destroy();
    app.destroy();
    game.destroy(true);
  };
}

void start().catch((error: unknown) => {
  if (disposed) return;
  console.error('[Startup]', error);
  const root = document.getElementById('app')!;
  root.textContent =
    '게임을 시작하지 못했습니다. 새로고침해 다시 시도해 주세요.';
  root.setAttribute('role', 'alert');
});

import Phaser from 'phaser';
import { gameConfig } from '../config/game';
import { centerSafeArea } from '../core/viewport';
import { queueAssets } from '../game/assets';
import type { App } from '../app';

export class PreloadScene extends Phaser.Scene {
  private failed = false;
  constructor(private app: App) {
    super('Preload');
  }
  preload() {
    this.app.platform.loadingStart();
    const { width, height } = gameConfig;
    centerSafeArea(this, width, height);
    const text = this.app.text.system;
    const label = this.add
      .text(width / 2, height / 2, text.loadingProgress(0), {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#e2e8f0',
        align: 'center',
      })
      .setOrigin(0.5);
    this.load.on('progress', (value: number) => {
      if (!this.failed)
        label.setText(text.loadingProgress(Math.round(value * 100)));
    });
    this.failed = false;
    this.load.on('loaderror', () => {
      this.failed = true;
      this.app.loadingError = text.loadFailed;
      this.app.onState();
      label.setText(text.loadFailed).setWordWrapWidth(width * 0.8);
    });
    queueAssets(this.load, this.app.renderScale);
  }
  create() {
    if (this.failed) return;
    this.app.platform.loadingStop();
    this.app.ready = true;
    this.app.onState();
    this.scene.start(gameConfig.startScene);
  }
}

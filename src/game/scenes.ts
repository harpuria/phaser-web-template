import Phaser from 'phaser';
import type { App } from '../app';
import { gameConfig } from '../config/game';
import { MoveInput } from '../core/input';
import { transition } from '../core/navigation';
import { centerSafeArea } from '../core/viewport';
import { assetKeys } from './assets';
import { roundMs } from './session';

/** 안전 영역(기본 해상도) 크기. 장면은 이 좌표로 배치한다. */
const { width: W, height: H } = gameConfig;

/** 격자는 안전 영역 바깥까지 그려 EXPAND로 늘어난 가장자리도 배경으로 채운다. */
function background(scene: Phaser.Scene) {
  centerSafeArea(scene, W, H);
  const grid = scene.add.graphics().lineStyle(1, 0x263448, 0.65);
  for (let x = -W; x < 2 * W; x += 48) grid.lineBetween(x, -H, x, 2 * H);
  for (let y = -H; y < 2 * H; y += 48) grid.lineBetween(-W, y, 2 * W, y);
  grid.lineStyle(2, 0x344458).strokeRoundedRect(26, 26, W - 52, H - 52, 20);
}

export class MenuScene extends Phaser.Scene {
  constructor(private app: App) {
    super('Menu');
  }
  create() {
    const cx = W / 2;
    this.app.session.mode = 'menu';
    this.app.onState();
    background(this);
    this.add
      .text(cx, 140, 'YOUR NEXT GAME', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#a3e635',
        letterSpacing: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 202, '작은 시작, 새로운 세계', {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 258, '별을 모으는 짧은 게임으로 템플릿을 둘러보세요.', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    // 텍스처는 렌더 배율(k)만큼 크게 불러왔으므로 1/k로 줄여 원래 크기에 맞춘다.
    const k = this.app.renderScale;
    const player = this.add.image(cx, 363, assetKeys.player).setScale(1.7 / k);
    [cx - 120, cx + 120].forEach((x) =>
      this.add.image(x, 363, assetKeys.star).setScale(1 / k),
    );
    if (!this.app.settings.data.reducedMotion)
      this.tweens.add({
        targets: player,
        y: 350,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    this.cameras.main.fadeIn(this.app.transitionMs);
  }
  startGame() {
    transition(this, 'Game', this.app.transitionMs);
  }
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private star!: Phaser.Physics.Arcade.Image;
  private controls!: MoveInput;
  private label!: Phaser.GameObjects.Text;
  private remaining = 0;
  private ended = false;

  constructor(private app: App) {
    super('Game');
  }
  create() {
    this.ended = false;
    this.remaining = roundMs();
    this.app.session.score = 0;
    this.app.session.mode = 'playing';
    this.app.onState();
    background(this);
    const k = this.app.renderScale;
    this.physics.world.setBounds(46, 82, W - 92, H - 134);
    this.player = this.physics.add
      .image(W / 2, 300, assetKeys.player)
      .setScale(1 / k)
      .setCircle(23 * k, 3 * k, 3 * k) // 원 크기는 텍스처 화소 기준
      .setCollideWorldBounds(true);
    this.star = this.physics.add
      .image(650, 300, assetKeys.star)
      .setScale(1 / k)
      .setCircle(17 * k, k, k)
      .setImmovable(true);
    this.physics.add.overlap(this.player, this.star, () => this.collect());
    this.label = this.add.text(52, 44, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#e2e8f0',
    });
    this.controls = new MoveInput(this);
    this.app.audio?.playMusic(assetKeys.music);
    this.cameras.main.fadeIn(this.app.transitionMs);
    if (this.app.pause.paused) this.scene.pause();
  }
  private collect() {
    if (this.ended) return;
    const bounds = this.physics.world.bounds;
    this.app.session.score++;
    this.star.setPosition(
      Phaser.Math.Between(bounds.left + 44, bounds.right - 44),
      Phaser.Math.Between(bounds.top + 38, bounds.bottom - 43),
    );
    this.app.audio?.sfx(assetKeys.collect);
    this.app.onState();
  }
  update(_time: number, delta: number) {
    if (this.ended) return;
    const direction = this.controls.move(this.player).scale(290);
    this.player.setVelocity(direction.x, direction.y);
    this.remaining = Math.max(0, this.remaining - delta);
    this.label.setText(
      `STARS  ${String(this.app.session.score).padStart(2, '0')}                         TIME  ${Math.ceil(this.remaining / 1000)}s`,
    );
    if (this.remaining === 0) this.finish();
  }
  finish() {
    if (this.ended) return;
    const score = this.app.session.score;
    this.ended = true;
    this.player.setVelocity(0, 0);
    this.app.save.update((data) => ({
      best: Math.max(data.best, score),
      rounds: data.rounds + 1,
    }));
    this.app.flush();
    this.app.platform.track('round_completed');
    this.app.session.mode = 'result';
    this.app.onState();
    this.add
      // 늘어난 가장자리까지 덮도록 안전 영역보다 크게 그린다.
      .rectangle(W / 2, H / 2, W * 3, H * 3, 0x101827, 0.92)
      .setDepth(10);
    this.add
      .text(W / 2, 230, `${score}개의 별을 모았어요`, {
        fontFamily: 'sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#a3e635',
      })
      .setOrigin(0.5)
      .setDepth(11);
    const message =
      this.app.save.status === 'ready'
        ? '기록을 저장했습니다. 다시 도전해 보세요!'
        : '기록을 저장하지 못했습니다. 저장 상태를 확인해 주세요.';
    this.add
      .text(W / 2, 300, message, {
        fontFamily: 'sans-serif',
        fontSize: '21px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)
      .setDepth(11);
  }
  goHome() {
    transition(this, 'Menu', this.app.transitionMs);
  }
}

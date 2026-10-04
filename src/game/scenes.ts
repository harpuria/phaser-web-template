import Phaser from 'phaser';
import type { App } from '../app';
import { transition } from '../core/navigation';

function background(scene: Phaser.Scene) {
  const grid = scene.add.graphics().lineStyle(1, 0x263448, 0.65);
  for (let x = 0; x < 960; x += 48) grid.lineBetween(x, 0, x, 540);
  for (let y = 0; y < 540; y += 48) grid.lineBetween(0, y, 960, y);
  grid.lineStyle(2, 0x344458).strokeRoundedRect(26, 26, 908, 488, 20);
}

export class MenuScene extends Phaser.Scene {
  constructor(private app: App) {
    super('Menu');
  }
  create() {
    this.app.ready = true;
    this.app.mode = 'menu';
    this.app.onState();
    background(this);
    this.add
      .text(480, 140, 'YOUR NEXT GAME', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#a3e635',
        letterSpacing: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(480, 202, '작은 시작, 새로운 세계', {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.add
      .text(480, 258, '별을 모으는 짧은 게임으로 템플릿을 둘러보세요.', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    const player = this.add.image(480, 363, 'player').setScale(1.7);
    [360, 600].forEach((x) => this.add.image(x, 363, 'star'));
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
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private label!: Phaser.GameObjects.Text;
  private remaining = 30_000;
  private ended = false;

  constructor(private app: App) {
    super('Game');
  }
  create() {
    this.ended = false;
    this.remaining = 30_000;
    this.app.score = 0;
    this.app.mode = 'playing';
    this.app.onState();
    background(this);
    this.physics.world.setBounds(46, 82, 868, 406);
    this.player = this.physics.add
      .image(480, 300, 'player')
      .setCircle(23, 3, 3)
      .setCollideWorldBounds(true);
    this.star = this.physics.add
      .image(650, 300, 'star')
      .setCircle(17, 1, 1)
      .setImmovable(true);
    this.physics.add.overlap(this.player, this.star, () => this.collect());
    this.label = this.add.text(52, 44, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#e2e8f0',
    });
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as typeof this.wasd;
    this.app.audio?.playMusic();
    this.cameras.main.fadeIn(this.app.transitionMs);
    if (this.app.pause.paused) this.scene.pause();
  }
  private collect() {
    if (this.ended) return;
    this.app.score++;
    this.star.setPosition(
      Phaser.Math.Between(90, 870),
      Phaser.Math.Between(120, 445),
    );
    this.app.audio?.sfx();
    this.app.onState();
  }
  update(_time: number, delta: number) {
    if (this.ended) return;
    const direction = new Phaser.Math.Vector2();
    const focusOnControl =
      document.activeElement instanceof HTMLElement &&
      ['INPUT', 'BUTTON', 'SELECT'].includes(document.activeElement.tagName);
    if (!focusOnControl) {
      if (this.cursors?.left.isDown || this.wasd?.A?.isDown) direction.x--;
      if (this.cursors?.right.isDown || this.wasd?.D?.isDown) direction.x++;
      if (this.cursors?.up.isDown || this.wasd?.W?.isDown) direction.y--;
      if (this.cursors?.down.isDown || this.wasd?.S?.isDown) direction.y++;
    }
    const pointer = this.input.activePointer;
    if (pointer.isDown && pointer.downElement === this.game.canvas) {
      direction.set(
        pointer.worldX - this.player.x,
        pointer.worldY - this.player.y,
      );
      if (direction.length() < 8) direction.set(0, 0);
    }
    direction.normalize().scale(290);
    this.player.setVelocity(direction.x, direction.y);
    this.remaining = Math.max(0, this.remaining - delta);
    this.label.setText(
      `STARS  ${String(this.app.score).padStart(2, '0')}                         TIME  ${Math.ceil(this.remaining / 1000)}s`,
    );
    if (this.remaining === 0) this.finish();
  }
  finish() {
    if (this.ended) return;
    this.ended = true;
    this.player.setVelocity(0, 0);
    this.app.save.update((data) => ({
      best: Math.max(data.best, this.app.score),
      rounds: data.rounds + 1,
    }));
    this.app.flush();
    this.app.platform.track('round_completed');
    this.app.mode = 'result';
    this.app.onState();
    const shade = this.add.rectangle(480, 270, 960, 540, 0x101827, 0.92);
    shade.setDepth(10);
    this.add
      .text(480, 230, `${this.app.score}개의 별을 모았어요`, {
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
      .text(480, 300, message, {
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

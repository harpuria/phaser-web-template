import Phaser from 'phaser';
import type { Settings } from './settings';

export class AudioService {
  private music?: Phaser.Sound.BaseSound;
  private settings?: Readonly<Settings>;
  private suspended = false;
  private musicRequested = false;
  constructor(private sound: Phaser.Sound.BaseSoundManager) {}

  apply(settings: Readonly<Settings>) {
    this.settings = settings;
    this.sound.mute = settings.muted || this.suspended;
    this.sound.volume = settings.master;
    if (this.music && 'setVolume' in this.music) {
      (this.music as Phaser.Sound.WebAudioSound).setVolume(settings.music);
    }
  }
  playMusic() {
    this.musicRequested = true;
    this.music ??= this.sound.add('music', {
      loop: true,
      volume: this.settings?.music ?? 0.35,
    });
    if (!this.suspended && !this.music.isPlaying) this.music.play();
  }
  sfx() {
    if (!this.suspended && this.sound.game.cache.audio.has('collect'))
      this.sound.play('collect', { volume: this.settings?.sfx ?? 0.6 });
  }
  suspend(value: boolean) {
    this.suspended = value;
    if (this.settings) this.apply(this.settings);
    if (value) this.music?.pause();
    else if (this.musicRequested && this.music) {
      if (this.music.isPaused) this.music.resume();
      else if (!this.music.isPlaying) this.music.play();
    }
  }
  destroy() {
    this.music?.destroy();
  }
}

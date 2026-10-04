import type Phaser from 'phaser';

/** Queue game-specific assets here. Paths stay relative to Vite's deployment base. */
export function queueAssets(load: Phaser.Loader.LoaderPlugin) {
  load.setPath(`${import.meta.env.BASE_URL}assets/demo/`);
  load.svg('player', 'player.svg', { width: 52, height: 52 });
  load.svg('star', 'star.svg', { width: 36, height: 36 });
  load.audio('collect', 'collect.wav');
  load.audio('music', 'music.wav');
}

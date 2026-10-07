import type Phaser from 'phaser';

/** asset 키를 한곳에 모아 장면·UI에서 문자열을 반복하지 않는다. */
export const assetKeys = {
  player: 'player',
  star: 'star',
  music: 'music',
  collect: 'collect',
} as const;

/**
 * Queue game-specific assets here. Paths stay relative to Vite's deployment base.
 * SVG는 렌더 배율(k)만큼 크게 래스터화하고, 장면에서 `setScale(1 / k)`로 원래 크기에 맞춘다.
 * PNG라면 k배(@2x 등) 원본을 준비해 같은 방식으로 쓴다.
 */
export function queueAssets(load: Phaser.Loader.LoaderPlugin, k = 1) {
  load.setPath(`${import.meta.env.BASE_URL}assets/demo/`);
  load.svg(assetKeys.player, 'player.svg', { width: 52 * k, height: 52 * k });
  load.svg(assetKeys.star, 'star.svg', { width: 36 * k, height: 36 * k });
  load.audio(assetKeys.collect, 'collect.wav');
  load.audio(assetKeys.music, 'music.wav');
}

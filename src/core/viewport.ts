import Phaser from 'phaser';

/**
 * `Scale.EXPAND`에서 화면 비율이 기본 해상도와 다르면 게임 크기가 늘어난다.
 * 이 함수는 기본 해상도 영역(안전 영역)을 화면 중앙에 두도록 카메라를 맞춘다.
 * 장면은 안전 영역 좌표(0..width, 0..height)로 배치하고, 바깥은 배경으로만 채운다.
 */
export function centerSafeArea(
  scene: Phaser.Scene,
  width: number,
  height: number,
) {
  const camera = scene.cameras.main;
  const center = () => camera.centerOn(width / 2, height / 2);
  center();
  scene.scale.on(Phaser.Scale.Events.RESIZE, center);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
    scene.scale.off(Phaser.Scale.Events.RESIZE, center),
  );
}

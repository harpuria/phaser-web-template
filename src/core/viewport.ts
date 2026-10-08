import Phaser from 'phaser';

/**
 * `Scale.EXPAND`에서 화면 비율이 기본 해상도와 다르면 게임 크기가 늘어난다.
 * 이 함수는 카메라를 렌더 배율로 zoom하고 안전 영역을 화면 중앙에 맞춘다.
 * 이후 장면에 추가되는 Text도 같은 배율로 그려 확대돼도 흐려지지 않게 한다.
 * 장면은 안전 영역 좌표(0..width, 0..height)로 배치하고, 바깥은 배경으로만 채운다.
 * `create()`(Preload는 `preload()`) 맨 앞에서 호출한다.
 */
export function centerSafeArea(
  scene: Phaser.Scene,
  width: number,
  height: number,
) {
  const camera = scene.cameras.main;
  // 게임 설정 폭 = 안전 영역 폭 × 렌더 배율
  const zoom = Number(scene.game.config.width) / width;
  camera.setZoom(zoom);
  const center = () => camera.centerOn(width / 2, height / 2);
  center();
  const sharpenText = (object: Phaser.GameObjects.GameObject) => {
    if (object instanceof Phaser.GameObjects.Text) object.setResolution(zoom);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, center);
  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, sharpenText);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, center);
    scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, sharpenText);
  });
}

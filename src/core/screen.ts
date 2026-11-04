import type Phaser from 'phaser';

/** `Phaser.Scale.Events.LEAVE_FULLSCREEN`. 값만 써서 단위 검사에서 Phaser를 불러오지 않는다. */
const LEAVE_FULLSCREEN = 'leavefullscreen';

type LockableOrientation = ScreenOrientation & {
  lock?: (value: string) => Promise<void>;
};

/** 전체화면 전환. 진입 시 방향 고정을 시도하며 실패해도 무시한다(iOS 등 미지원). */
export function toggleFullscreen(
  game: Phaser.Game,
  orientation: 'landscape' | 'portrait',
) {
  const scale = game.scale;
  if (scale.isFullscreen) {
    scale.stopFullscreen();
    return;
  }
  scale.startFullscreen();
  const target = screen.orientation as LockableOrientation | undefined;
  target?.lock?.call(target, orientation).catch(() => {});
}

/**
 * 전체화면을 어떤 방법(버튼, Esc, 시스템 뒤로 가기)으로 나가도 방향 고정을 푼다.
 * 풀지 않으면 일부 Android 브라우저는 전체화면 종료 후에도 고정한 방향을 유지한다.
 */
export function releaseOrientationOnExit(
  scale: Pick<Phaser.Scale.ScaleManager, 'on' | 'off'>,
  orientation: Pick<ScreenOrientation, 'unlock'> | undefined = globalThis.screen
    ?.orientation,
): () => void {
  const unlock = () => {
    try {
      orientation?.unlock?.();
    } catch {
      // 방향 고정을 지원하지 않거나 고정하지 않은 상태
    }
  };
  scale.on(LEAVE_FULLSCREEN, unlock);
  return () => scale.off(LEAVE_FULLSCREEN, unlock);
}

/** Fullscreen API가 있고, iframe이라면 부모 페이지가 전체화면을 허용한 경우에만 true. */
export function fullscreenAvailable(game: Phaser.Game) {
  return (
    game.device.fullscreen.available && document.fullscreenEnabled !== false
  );
}

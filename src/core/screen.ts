import type Phaser from 'phaser';

type PreferredOrientation = 'landscape' | 'portrait';
type LockableOrientation = Pick<ScreenOrientation, 'unlock'> & {
  lock?: (value: PreferredOrientation) => Promise<void>;
};

/** Phaser가 게임의 전체화면 진입을 확인하면 방향을 고정하고, 종료 시 고정을 푼다. */
export function bindFullscreenOrientation(
  scale: Pick<Phaser.Scale.ScaleManager, 'on' | 'off' | 'fullscreenTarget'>,
  preferred: PreferredOrientation,
  orientation: LockableOrientation | undefined = globalThis.screen?.orientation,
): () => void {
  let active = false;
  const lock = async () => {
    if (active || document.fullscreenElement !== scale.fullscreenTarget) return;
    active = true;
    try {
      await orientation?.lock?.(preferred);
    } catch {
      // 브라우저에서 방향 고정을 허용하지 않아도 전체화면은 유지한다.
    }
  };
  const unlock = () => {
    if (!active) return;
    active = false;
    try {
      orientation?.unlock?.();
    } catch {
      // 방향 고정을 지원하지 않거나 고정하지 않은 상태
    }
  };
  scale.on('enterfullscreen', lock);
  scale.on('leavefullscreen', unlock);
  return () => {
    scale.off('enterfullscreen', lock);
    scale.off('leavefullscreen', unlock);
    unlock();
  };
}

/** Fullscreen API가 있고, iframe이라면 부모 페이지가 전체화면을 허용한 경우에만 true. */
export function fullscreenAvailable(game: Phaser.Game) {
  return (
    game.device.fullscreen.available && document.fullscreenEnabled !== false
  );
}

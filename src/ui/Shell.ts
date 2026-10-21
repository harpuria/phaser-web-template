import type { App } from '../app';
import { gameConfig } from '../config/game';
import { fullscreenAvailable, toggleFullscreen } from '../core/screen';
import { assetKeys } from '../game/assets';
import { GameScene, MenuScene } from '../game/scenes';
import { MockAdapter } from '../services/platform';

export class Shell {
  private controller = new AbortController();
  private root: HTMLElement;
  private debugTimer?: number;
  constructor(private app: App) {
    this.root = document.querySelector<HTMLElement>('#app')!;
    this.root.innerHTML = `
      <header class="header"><a class="brand" href="./"><span class="brand-icon">ϟ</span> PHASER <span class="muted">/ WEB TEMPLATE</span></a><span class="version">v${gameConfig.version} <span class="dot"></span> READY TO BUILD</span></header>
      <section class="intro"><p class="eyebrow">THE FIRST FRAME OF YOUR NEXT IDEA</p><h1>여기서, 게임을 시작하세요<span>.</span></h1><p class="subtitle">게임에 집중할 수 있도록, 반복되는 준비는 미리 해두었습니다.</p></section>
      <div class="workspace"><section class="stage-card" aria-label="게임 데모">
        <div class="stage-heading"><span><span class="dot"></span> STAR COLLECTOR <small>플레이 가능한 예제</small></span><span id="mode-label">MENU</span></div>
        <div class="canvas-wrap" id="stage" data-orientation="${gameConfig.orientation}"><div id="game" tabindex="0" aria-label="별 모으기 게임. 방향키, WASD, 게임패드로 이동하거나 화면을 누르세요."></div><div id="pause-overlay" class="overlay" hidden>잠시 쉬어가는 중<span>계속하기를 누르면 다시 시작합니다.</span></div><div id="rotate-hint" class="overlay">기기를 ${gameConfig.orientation === 'landscape' ? '가로' : '세로'}로 돌려 주세요<span>전체화면에서 권장 방향으로 플레이합니다.</span></div><span id="debug-info" hidden></span><button id="exit-fullscreen" class="secondary" aria-label="전체화면 나가기">✕</button><div id="error-overlay" class="overlay" role="alert" hidden>문제가 발생했습니다<span id="error-message"></span><button id="reload" class="primary">새로고침</button></div></div>
        <div class="game-toolbar"><p><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> 이동 <span class="touch-hint">· 화면을 눌러 이동</span><span class="rotate-tip">기기를 ${gameConfig.orientation === 'landscape' ? '가로' : '세로'}로 돌리면 더 크게 플레이할 수 있어요.</span></p><div><button id="fullscreen" class="secondary" hidden>전체화면</button><button id="pause" class="secondary" hidden>일시정지</button><button id="home" class="secondary" hidden>메뉴</button><button id="play" class="primary">플레이 시작 <span>↗</span></button></div></div>
      </section>
      <aside class="sidebar"><section class="panel"><div class="panel-title"><h2>내 플레이 기록</h2><span class="tag" id="storage-kind">LOCAL SAVE</span></div><div class="stats"><div><strong id="best">0</strong><span>최고 기록</span></div><div><strong id="rounds">0</strong><span>플레이 횟수</span></div></div><p id="storage-status" class="caption"></p><button id="settings" class="wide secondary">설정 열기 <span>⚙</span></button></section>
      <section class="panel"><div class="panel-title"><h2>기본 기능</h2><span class="tag green">INCLUDED</span></div><ul class="features"><li>버전 관리가 있는 로컬 저장</li><li>음량 · 효과음 · 배경음 설정</li><li>화면 전환 · 자동 일시정지</li><li>키보드 · 마우스 · 터치 · 게임패드 입력</li><li>전체화면 · 오류 안내 화면</li><li>광고 · 결제 서비스 연결 지점</li></ul></section></aside></div>
      <section class="toolbox"><div><p class="eyebrow">SERVICE PLAYGROUND</p><h2>연결하기 전에, 가볍게 테스트</h2><p class="caption" id="service-mode"></p></div><div class="service-actions"><label class="check" id="consent-label"><input id="consent" type="checkbox" /> Mock 분석·광고 동의</label><select id="outcome" aria-label="Mock 결과"><option value="completed">성공</option><option value="cancelled">취소</option><option value="error">오류</option></select><button id="reward" class="secondary">보상형 광고 테스트</button><button id="purchase" class="secondary">구매 테스트</button><button id="sound" class="secondary">효과음 듣기</button></div><p id="notice" role="status" aria-live="polite">준비되었습니다. 플레이를 시작해 보세요.</p></section>
      <footer><span>PHASER 4.2.1 · TYPESCRIPT · VITE</span><span>당신의 게임은 <code>src/game/</code>에서 시작됩니다.</span></footer>
      <dialog id="settings-dialog" aria-labelledby="settings-title"><form method="dialog"><div class="panel-title"><h2 id="settings-title">게임 설정</h2><button class="icon-button" aria-label="설정 닫기">✕</button></div><p class="caption" id="settings-storage"></p><label class="check"><input id="muted" type="checkbox" /> 전체 음소거</label><label class="range-label">전체 음량<input id="master" type="range" min="0" max="1" step="0.05" /></label><label class="range-label">배경음<input id="music" type="range" min="0" max="1" step="0.05" /></label><label class="range-label">효과음<input id="sfx" type="range" min="0" max="1" step="0.05" /></label><label class="check"><input id="reducedMotion" type="checkbox" /> 화면 움직임 줄이기</label><hr /><p class="caption">플레이 기록 초기화는 설정을 유지합니다.</p><button id="reset" type="button" class="danger wide">플레이 기록 초기화</button><button id="reset-settings" type="button" class="secondary wide">설정 초기화 / 저장 오류 복구</button><button class="primary wide">완료</button></form></dialog>`;
    this.root.dataset.orientation = gameConfig.orientation;
    this.root.style.setProperty('--game-w', String(gameConfig.width));
    this.root.style.setProperty('--game-h', String(gameConfig.height));
    this.element('game').dataset.renderScale = String(app.renderScale);
    if (app.debug) this.showDebugInfo();
    this.bind();
    app.onState = () => this.render();
    this.render();
  }
  private element<T extends HTMLElement = HTMLElement>(id: string) {
    return this.root.querySelector<T>(`#${id}`)!;
  }
  private on(id: string, event: string, handler: () => void) {
    this.element(id).addEventListener(event, handler, {
      signal: this.controller.signal,
    });
  }
  /** `?debug`: 렌더 배율과 실제 FPS를 게임 화면 왼쪽 위에 표시한다(저가 기기 확인용). */
  private showDebugInfo() {
    const info = this.element('debug-info');
    info.hidden = false;
    this.debugTimer = window.setInterval(() => {
      const fps = this.app.game?.loop.actualFps ?? 0;
      info.textContent = `render ×${this.app.renderScale} · ${Math.round(fps)} fps`;
    }, 500);
  }
  private notify(message: string) {
    this.element('notice').textContent = message;
  }
  private bind() {
    const app = this.app;
    this.on('game', 'pointerdown', () => this.element('game').focus());
    this.on('game', 'blur', () => {
      for (const scene of app.game?.scene.getScenes(false) ?? [])
        scene.input?.keyboard?.resetKeys();
    });
    this.on('play', 'click', () => {
      const mode = app.session.mode;
      if (!app.game?.scene.isActive('Menu') && mode !== 'result') return;
      if (mode === 'menu')
        (app.game!.scene.getScene('Menu') as MenuScene).startGame();
      else app.game!.scene.getScene('Game').scene.restart();
      // 플레이 중에는 게임 카드 전체(캔버스 + 버튼 줄)가 화면 안에 오도록 스크롤한다.
      this.element('stage')
        .closest('.stage-card')
        ?.scrollIntoView({ block: 'nearest' });
      this.element('game').focus({ preventScroll: true });
    });
    this.on('pause', 'click', () => {
      app.pause.set('manual', !app.pause.has('manual'));
      this.element('game').focus();
    });
    this.on('home', 'click', () => {
      app.pause.set('manual', false);
      (app.game?.scene.getScene('Game') as GameScene).goHome();
    });
    this.on('fullscreen', 'click', () => {
      if (app.game) toggleFullscreen(app.game, gameConfig.orientation);
    });
    this.on('reload', 'click', () => location.reload());
    this.on('exit-fullscreen', 'click', () => {
      if (app.game?.scale.isFullscreen) app.game.scale.stopFullscreen();
    });
    this.on('settings', 'click', () => {
      for (const [key, value] of Object.entries(app.settings.data)) {
        const input = this.element<HTMLInputElement>(key);
        if (typeof value === 'boolean') input.checked = value;
        else input.value = String(value);
      }
      app.pause.set('settings', true);
      this.element<HTMLDialogElement>('settings-dialog').showModal();
    });
    this.on('settings-dialog', 'close', () => {
      app.pause.set('settings', false);
      app.flush();
    });
    for (const key of [
      'master',
      'music',
      'sfx',
      'muted',
      'reducedMotion',
    ] as const) {
      this.on(key, 'input', () => {
        const input = this.element<HTMLInputElement>(key);
        app.settings.update((settings) => ({
          ...settings,
          [key]:
            input.type === 'checkbox' ? input.checked : Number(input.value),
        }));
        app.audio?.apply(app.settings.data);
        app.settings.flush();
        this.render();
      });
    }
    this.on('reset', 'click', () => {
      if (!confirm('플레이 기록을 지울까요? 이 작업은 되돌릴 수 없습니다.'))
        return;
      this.notify(
        app.save.reset()
          ? '플레이 기록을 초기화했습니다.'
          : '저장 공간에 접근할 수 없습니다.',
      );
      this.render();
    });
    this.on('reset-settings', 'click', () => {
      if (!confirm('저장된 설정을 초기화할까요?')) return;
      this.notify(
        app.settings.reset()
          ? '설정을 초기화했습니다.'
          : '저장 공간에 접근할 수 없습니다.',
      );
      app.audio?.apply(app.settings.data);
      this.element<HTMLDialogElement>('settings-dialog').close();
      this.render();
    });
    this.on('consent', 'change', () => {
      app.platform.consent = this.element<HTMLInputElement>('consent').checked;
    });
    this.on('outcome', 'change', () => {
      if (app.platform.adapter instanceof MockAdapter)
        app.platform.adapter.outcome = this.element<HTMLSelectElement>(
          'outcome',
        ).value as MockAdapter['outcome'];
    });
    const request = async (type: 'reward' | 'purchase') => {
      if (app.pause.has('service')) return;
      this.notify('요청 처리 중…');
      const result = await (type === 'reward'
        ? app.platform.rewarded()
        : app.platform.purchase('demo-product'));
      this.notify(
        `${type === 'reward' ? '보상형 광고' : '구매'}: ${result.status}${result.status === 'completed' && result.mock ? ' (Mock · 실제 보상/결제 없음)' : ''}`,
      );
    };
    this.on('reward', 'click', () => {
      void request('reward');
    });
    this.on('purchase', 'click', () => {
      void request('purchase');
    });
    this.on('sound', 'click', () => {
      app.audio?.sfx(assetKeys.collect);
      this.notify('효과음을 재생했습니다. 음소거와 볼륨 설정을 확인해 주세요.');
    });
    document.addEventListener(
      'keydown',
      (event) => {
        if (
          app.fatalError ||
          event.code !== 'Escape' ||
          this.element<HTMLDialogElement>('settings-dialog').open ||
          app.session.mode !== 'playing'
        )
          return;
        app.pause.set('manual', !app.pause.has('manual'));
      },
      { signal: this.controller.signal },
    );
  }
  render() {
    const app = this.app;
    const mode = app.session.mode;
    const adPending = app.pause.has('service');
    for (const id of [
      'play',
      'sound',
      'pause',
      'home',
      'settings',
      'reward',
      'purchase',
    ])
      this.element<HTMLButtonElement>(id).disabled = !app.ready || adPending;
    this.element<HTMLButtonElement>('reward').disabled ||= mode === 'playing';
    if (app.fatalError) {
      for (const control of this.root.querySelectorAll<
        HTMLButtonElement | HTMLInputElement | HTMLSelectElement
      >('button, input, select')) {
        if (!['reload', 'exit-fullscreen'].includes(control.id))
          control.disabled = true;
      }
      this.element('game').inert = true;
      const dialog = this.element<HTMLDialogElement>('settings-dialog');
      if (dialog.open) dialog.close();
    }
    if (app.loadingError) this.notify(app.loadingError);
    this.element('best').textContent = String(app.save.data.best);
    this.element('rounds').textContent = String(app.save.data.rounds);
    const ready =
      app.save.status === 'ready' && app.settings.status === 'ready';
    const storageMessage =
      app.platform.environment === 'local'
        ? '이 브라우저에 SDK 데모 기록이 저장됩니다.'
        : app.storageKind === 'crazygames'
          ? 'CrazyGames에 자동으로 저장됩니다. 로그인하면 기기 간 동기화됩니다.'
          : '이 브라우저에 자동으로 저장됩니다.';
    this.element('storage-kind').textContent =
      app.platform.environment === 'local'
        ? 'SDK LOCAL SAVE'
        : app.storageKind === 'crazygames'
          ? 'CRAZYGAMES SAVE'
          : app.storageKind === 'local'
            ? 'LOCAL SAVE'
            : 'SAVE UNAVAILABLE';
    this.element('settings-storage').textContent = ready
      ? storageMessage
      : '설정을 저장하지 못했습니다. 저장 상태를 확인해 주세요.';
    this.element('storage-status').textContent =
      app.platformWarning ||
      (ready
        ? storageMessage
        : `저장 보호 모드 · 기록: ${app.save.status}, 설정: ${app.settings.status}. 설정에서 초기화할 수 있습니다.`);
    this.element('mode-label').textContent = app.pause.paused
      ? 'PAUSED'
      : mode.toUpperCase();
    this.element('pause-overlay').hidden =
      !app.pause.paused || mode !== 'playing';
    this.element('pause').hidden = mode !== 'playing';
    this.element('pause').textContent = app.pause.has('manual')
      ? '계속하기'
      : '일시정지';
    this.element('home').hidden = mode === 'menu';
    this.element('play').hidden = mode === 'playing';
    this.element('fullscreen').hidden = !(
      app.ready &&
      app.game &&
      fullscreenAvailable(app.game)
    );
    this.element('error-overlay').hidden = !app.fatalError;
    this.element('error-message').textContent = app.fatalError;
    this.element('play').textContent =
      mode === 'result' ? '다시 플레이 ↗' : '플레이 시작 ↗';
    const localSdk = app.platform.environment === 'local';
    this.element('consent-label').hidden =
      !app.platform.isMock && app.platform.environment !== 'disabled';
    this.element('outcome').hidden =
      !app.platform.isMock && app.platform.environment !== 'disabled';
    this.element('reward').hidden = !(
      app.platform.isMock ||
      localSdk ||
      app.platform.environment === 'disabled'
    );
    this.element('purchase').hidden =
      !app.platform.isMock && app.platform.environment !== 'disabled';
    this.element('service-mode').textContent = app.platform.isMock
      ? '개발용 Mock입니다. 외부 서비스로 데이터를 보내거나 실제 결제하지 않습니다.'
      : localSdk
        ? 'CrazyGames SDK 로컬 환경입니다. 광고는 데모이며 실제 보상/결제는 없습니다.'
        : app.platform.environment === 'crazygames'
          ? 'CrazyGames에 연결되었습니다.'
          : app.platformWarning ||
            '이 환경에서는 광고와 결제를 사용할 수 없습니다.';
  }
  destroy() {
    clearInterval(this.debugTimer);
    this.controller.abort();
    this.app.onState = () => {};
  }
}

import type { App } from '../app';
import { gameConfig } from '../config/game';

export interface SystemUiOptions {
  /** 캔버스를 감싼 요소. 일시정지·회전·오류 안내와 전체화면 나가기 버튼을 이 안에 붙인다. */
  container: HTMLElement;
  /** Phaser `parent` 요소. 오류 상태에서 inert로 바꿔 입력을 막는다. */
  gameElement: HTMLElement;
  /** 오류 상태에서 조작을 막을 범위. 보통 HTML UI 전체의 root. */
  scope: HTMLElement;
}

/**
 * 템플릿 공통 HTML 계약. 데모 UI(`Shell.ts`)를 교체해도 이 모듈은 그대로 사용한다.
 *
 * - `container`에 일시정지·회전 안내·오류 안내(새로고침), 전체화면 나가기, `?debug` 표시를 붙인다.
 * - `[data-game-control]` 요소는 준비 전·광고 요청 중·오류 상태에서 비활성화한다.
 * - 오류 상태에서는 `scope` 안의 모든 버튼·입력(`[data-recovery]` 제외)을 막고,
 *   캔버스를 inert로 바꾸고, 열린 dialog를 닫는다.
 *
 * UI는 상태가 바뀔 때(`app.onState`) 자기 표시를 갱신한 뒤 `render()`를 호출한다.
 * 추가로 막을 조건은 `render()` 이후 `disabled ||= ...`로만 더한다(오류 잠금을 풀지 않도록).
 */
export class SystemUi {
  private controller = new AbortController();
  private debugTimer?: number;

  constructor(
    private app: App,
    private options: SystemUiOptions,
  ) {
    const text = app.text.system;
    const orientation = gameConfig.orientation;
    options.container.insertAdjacentHTML(
      'beforeend',
      `<div id="pause-overlay" class="overlay" hidden>${escape(text.pausedTitle)}<span>${escape(text.pausedHint)}</span></div>` +
        `<div id="rotate-hint" class="overlay">${escape(text.rotateTitle(orientation))}<span>${escape(text.rotateHint)}</span></div>` +
        `<span id="debug-info" hidden></span>` +
        `<button id="exit-fullscreen" class="secondary" data-recovery aria-label="${escape(text.exitFullscreen)}">✕</button>` +
        `<div id="error-overlay" class="overlay" role="alert" hidden>${escape(text.errorTitle)}<span id="error-message"></span><button id="reload" class="primary" data-recovery>${escape(text.reload)}</button></div>`,
    );
    options.gameElement.dataset.renderScale = String(app.renderScale);
    const signal = this.controller.signal;
    this.element('reload').addEventListener('click', () => location.reload(), {
      signal,
    });
    this.element('exit-fullscreen').addEventListener(
      'click',
      () => {
        if (app.game?.scale.isFullscreen) app.game.scale.stopFullscreen();
      },
      { signal },
    );
    if (app.debug) this.showDebugInfo();
  }

  /** 준비 전, 광고 요청·재생 중, 오류 상태에서는 게임 조작을 받지 않는다. */
  get blocked() {
    const app = this.app;
    return !app.ready || app.pause.has('service') || !!app.fatalError;
  }

  render() {
    const app = this.app;
    const { scope, gameElement } = this.options;
    const blocked = this.blocked;
    for (const control of scope.querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLSelectElement
    >('[data-game-control]'))
      control.disabled = blocked;
    this.element('pause-overlay').hidden =
      !app.pause.paused || !app.gameplayActive;
    const error = app.fatalError || app.loadingError;
    this.element('error-overlay').hidden = !error;
    this.element('error-message').textContent = error;
    if (!error) return;
    for (const control of scope.querySelectorAll<
      | HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >('button, input, select, textarea')) {
      if (!control.hasAttribute('data-recovery')) control.disabled = true;
    }
    gameElement.inert = true;
    for (const dialog of scope.querySelectorAll<HTMLDialogElement>(
      'dialog[open]',
    ))
      dialog.close();
  }

  destroy() {
    clearInterval(this.debugTimer);
    this.controller.abort();
  }

  private element(id: string) {
    return this.options.container.querySelector<HTMLElement>(`#${id}`)!;
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
}

/** 문구를 HTML에 넣을 때 사용한다. */
export function escape(value: string | number): string {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
}

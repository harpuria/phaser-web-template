import Phaser from 'phaser';
import type { App } from '../app';
import { gameConfig } from '../config/game';
import { isFramed, resolveLayout, type Layout } from '../core/layout';
import { fullscreenAvailable } from '../core/screen';
import { assetKeys } from '../game/assets';
import { GameScene, MenuScene } from '../game/scenes';
import { MockAdapter } from '../services/platform';
import { escape as e, SystemUi } from './system';

/**
 * 예제 HTML UI(메뉴 버튼, 기록, 설정, 서비스 시험). 파생 게임에 맞게 교체한다.
 * 교체할 때도 `SystemUi`(오류·광고 중 조작 차단, 일시정지·회전 안내)는 그대로 연결한다.
 *
 * - `page`: 템플릿 소개 페이지. 단독 페이지로 열 때의 기본값.
 * - `embed`: 게임 카드가 창 전체를 채우고 페이지 스크롤이 없다. iframe(CrazyGames, itch.io)의 기본값.
 *
 * 두 배치는 같은 id를 쓰므로 검사와 이벤트 연결은 하나다. 배치에 따라 없는 요소는 `optional()`로 다룬다.
 */
export class Shell {
  readonly layout: Layout;
  private controller = new AbortController();
  private root: HTMLElement;
  private system: SystemUi;
  private noticeTimer?: number;

  constructor(private app: App) {
    this.root = document.querySelector<HTMLElement>('#app')!;
    this.layout = resolveLayout(gameConfig.layout, location.search, isFramed());
    document.documentElement.dataset.layout = this.layout;
    this.root.dataset.layout = this.layout;
    this.root.dataset.orientation = gameConfig.orientation;
    this.root.style.setProperty('--game-w', String(gameConfig.width));
    this.root.style.setProperty('--game-h', String(gameConfig.height));
    this.root.innerHTML =
      this.layout === 'embed' ? this.embedMarkup() : this.pageMarkup();
    this.system = new SystemUi(app, {
      container: this.root.querySelector<HTMLElement>('.canvas-wrap')!,
      gameElement: this.element('game'),
      scope: this.root,
    });
    this.bind();
    app.onState = () => this.render();
    this.render();
  }

  private get text() {
    return this.app.text.shell;
  }

  private stageMarkup() {
    const t = this.text;
    const embed = this.layout === 'embed';
    const orientation = gameConfig.orientation;
    return `<section class="stage-card" id="stage" data-orientation="${orientation}" aria-label="${e(t.stageLabel)}">
        <div class="stage-heading"><span><span class="dot"></span> STAR COLLECTOR <small>${e(t.stageTag)}</small></span>${embed ? '<span id="compact-stats"></span>' : ''}<span id="mode-label">MENU</span></div>
        <div class="canvas-wrap"><div id="game" tabindex="0" aria-label="${e(t.gameLabel)}"></div>${embed ? '<p id="notice" class="toast" role="status" aria-live="polite" hidden></p>' : ''}</div>
        <div class="game-toolbar"><p><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> ${e(t.moveHint)} <span class="touch-hint">${e(t.touchHint)}</span><span class="rotate-tip">${e(t.rotateTip(orientation))}</span></p><div>
          <button id="fullscreen" class="secondary" data-game-control hidden>${e(t.fullscreen)}</button>
          <button id="pause" class="secondary" data-game-control hidden>${e(t.pause)}</button>
          <button id="home" class="secondary" data-game-control hidden>${e(t.home)}</button>
          ${embed ? this.settingsButton() + this.retryButton() : ''}
          <button id="play" class="primary" data-game-control>${e(t.play)} <span>↗</span></button>
        </div></div>
      </section>`;
  }

  private settingsButton() {
    const wide = this.layout === 'page' ? ' wide' : '';
    return `<button id="settings" class="secondary${wide}" data-game-control>${e(this.text.settings)} <span>⚙</span></button>`;
  }

  private retryButton() {
    const wide = this.layout === 'page' ? ' wide' : '';
    return `<button id="retry-save" class="secondary${wide}" data-game-control hidden>${e(this.text.retrySave)}</button>`;
  }

  private pageMarkup() {
    const t = this.text;
    return `
      <header class="header"><span class="brand"><span class="brand-icon">ϟ</span> PHASER <span class="muted">/ WEB TEMPLATE</span></span><span class="version">v${e(gameConfig.version)} <span class="dot"></span> READY TO BUILD</span></header>
      <section class="intro"><p class="eyebrow">THE FIRST FRAME OF YOUR NEXT IDEA</p><h1>${e(t.heroTitle)}<span>.</span></h1><p class="subtitle">${e(t.heroSubtitle)}</p></section>
      <div class="workspace">${this.stageMarkup()}
      <aside class="sidebar"><section class="panel"><div class="panel-title"><h2>${e(t.records)}</h2><span class="tag" id="storage-kind">LOCAL SAVE</span></div><div class="stats"><div><strong id="best">0</strong><span>${e(t.best)}</span></div><div><strong id="rounds">0</strong><span>${e(t.rounds)}</span></div></div><p id="storage-status" class="caption"></p>${this.retryButton()}${this.settingsButton()}</section>
      <section class="panel"><div class="panel-title"><h2>${e(t.featuresTitle)}</h2><span class="tag green">INCLUDED</span></div><ul class="features">${t.features.map((item) => `<li>${e(item)}</li>`).join('')}</ul></section></aside></div>
      <section class="toolbox"><div><p class="eyebrow">SERVICE PLAYGROUND</p><h2>${e(t.playgroundTitle)}</h2><p class="caption" id="service-mode"></p></div><div class="service-actions"><label class="check" id="consent-label"><input id="consent" type="checkbox" /> ${e(t.consent)}</label><select id="outcome" aria-label="${e(t.outcomeLabel)}">${(['completed', 'cancelled', 'error'] as const).map((value) => `<option value="${value}">${e(t.outcomes[value])}</option>`).join('')}</select><button id="reward" class="secondary" data-game-control>${e(t.reward)}</button><button id="purchase" class="secondary" data-game-control>${e(t.purchase)}</button><button id="sound" class="secondary" data-game-control>${e(t.sound)}</button></div><p id="notice" role="status" aria-live="polite">${e(t.ready)}</p></section>
      <footer><span>PHASER ${e(Phaser.VERSION)} · TYPESCRIPT · VITE</span><span>${e(t.footerStart)} <code>src/game/</code></span></footer>
      ${this.dialogMarkup()}`;
  }

  private embedMarkup() {
    return this.stageMarkup() + this.dialogMarkup();
  }

  private dialogMarkup() {
    const t = this.text;
    const embed = this.layout === 'embed';
    const range = (id: 'master' | 'music' | 'sfx') =>
      `<label class="range-label">${e(t[id])}<input id="${id}" type="range" min="0" max="1" step="0.05" /></label>`;
    return `<dialog id="settings-dialog" aria-labelledby="settings-title"><form method="dialog"><div class="panel-title"><h2 id="settings-title">${e(t.settingsTitle)}</h2>${embed ? '<span class="tag" id="storage-kind">LOCAL SAVE</span>' : ''}<button id="settings-close" class="icon-button" aria-label="${e(t.closeSettings)}">✕</button></div>
      <p class="caption" id="${embed ? 'storage-status' : 'settings-storage'}"></p>
      ${embed ? '<p class="caption" id="compact-stats-detail"></p>' : ''}
      <label class="check"><input id="muted" type="checkbox" /> ${e(t.muted)}</label>${range('master')}${range('music')}${range('sfx')}<label class="check"><input id="reducedMotion" type="checkbox" /> ${e(t.reducedMotion)}</label><hr /><p class="caption">${e(t.resetNote)}</p><button id="reset" type="button" class="danger wide">${e(t.reset)}</button><button id="reset-settings" type="button" class="secondary wide">${e(t.resetSettings)}</button><button id="settings-done" class="primary wide">${e(t.done)}</button></form></dialog>`;
  }

  private element<T extends HTMLElement = HTMLElement>(id: string) {
    return this.root.querySelector<T>(`#${id}`)!;
  }
  /** 배치에 따라 없을 수 있는 요소(page 전용 사이드바·서비스 시험 등). */
  private optional<T extends HTMLElement = HTMLElement>(id: string) {
    return this.root.querySelector<T>(`#${id}`) ?? undefined;
  }
  private on(id: string, event: string, handler: () => void) {
    this.optional(id)?.addEventListener(event, handler, {
      signal: this.controller.signal,
    });
  }
  private notify(message: string, kind: 'info' | 'loading-error' = 'info') {
    const notice = this.element('notice');
    notice.textContent = message;
    notice.dataset.kind = kind;
    if (this.layout !== 'embed') return;
    // embed에서는 일반 알림을 게임 화면 위에 잠깐 표시한다.
    notice.hidden = false;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => (notice.hidden = true), 4000);
  }
  private bind() {
    const app = this.app;
    const t = this.text;
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
      if (this.layout === 'page')
        this.element('stage').scrollIntoView({ block: 'nearest' });
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
      app.game?.scale.toggleFullscreen();
    });
    const settingFields = [
      'master',
      'music',
      'sfx',
      'muted',
      'reducedMotion',
    ] as const;
    this.on('settings', 'click', () => {
      const settings = app.settings.data;
      for (const key of settingFields) {
        const value = settings[key];
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
    for (const key of settingFields) {
      this.on(key, 'input', () => {
        const input = this.element<HTMLInputElement>(key);
        app.settings.update((settings) => ({
          ...settings,
          [key]:
            input.type === 'checkbox' ? input.checked : Number(input.value),
        }));
        app.applySettings();
        app.settings.flush();
        this.render();
      });
    }
    this.on('retry-save', 'click', () => {
      app.flush();
      this.notify(
        app.save.status === 'ready' && app.settings.status === 'ready'
          ? t.notices.savedAll
          : t.notices.notSavedYet,
      );
    });
    this.on('reset', 'click', () => {
      if (!confirm(t.confirmReset)) return;
      this.notify(
        app.save.reset() ? t.notices.resetDone : t.notices.storageInaccessible,
      );
      this.render();
    });
    this.on('reset-settings', 'click', () => {
      if (!confirm(t.confirmResetSettings)) return;
      this.notify(
        app.settings.reset()
          ? t.notices.settingsReset
          : t.notices.storageInaccessible,
      );
      app.applySettings();
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
      this.notify(t.notices.requesting);
      const result = await (type === 'reward'
        ? app.platform.rewarded()
        : app.platform.purchase('demo-product'));
      const label =
        type === 'reward' ? t.notices.rewardLabel : t.notices.purchaseLabel;
      // 결과 코드(completed, unavailable 등)는 언어와 관계없이 그대로 표시한다.
      this.notify(
        `${label}: ${result.status}${result.status === 'completed' && result.mock ? t.notices.mockNote : ''}`,
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
      this.notify(t.notices.soundPlayed);
    });
    document.addEventListener(
      'keydown',
      (event) => {
        if (
          app.fatalError ||
          event.code !== 'Escape' ||
          event.repeat ||
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
    const t = this.text;
    this.root.dataset.reducedMotion = String(app.settings.data.reducedMotion);
    const mode = app.session.mode;
    const { best, rounds } = app.save.data;
    const set = (id: string, value: string) => {
      const element = this.optional(id);
      if (element) element.textContent = value;
    };
    set('best', String(best));
    set('rounds', String(rounds));
    const sessionOnly =
      app.storageKind === 'local' &&
      [app.save, app.settings].every(
        (store) => store.status === 'unavailable' && !store.canRetry,
      );
    set(
      'compact-stats',
      sessionOnly ? t.storage.sessionOnlyLabel : t.compactStats(best, rounds),
    );
    set('compact-stats-detail', `${t.best} ${best} · ${t.rounds} ${rounds}`);
    if (this.layout === 'page' && app.loadingError)
      this.notify(app.loadingError, 'loading-error');

    const ready =
      app.save.status === 'ready' && app.settings.status === 'ready';
    const localSdk = app.platform.environment === 'local';
    const storageMessage = localSdk
      ? t.storage.sdkLocal
      : app.storageKind === 'crazygames'
        ? t.storage.crazygames
        : t.storage.local;
    set(
      'storage-kind',
      localSdk
        ? 'SDK LOCAL SAVE'
        : app.storageKind === 'crazygames'
          ? 'CRAZYGAMES SAVE'
          : app.storageKind === 'local' && !sessionOnly
            ? 'LOCAL SAVE'
            : 'SAVE UNAVAILABLE',
    );
    const canRetry = app.save.canRetry || app.settings.canRetry;
    this.element('retry-save').hidden = !canRetry;
    set(
      'settings-storage',
      sessionOnly
        ? t.storage.sessionOnly
        : app.settings.status === 'ready'
          ? storageMessage
          : t.storage.settingsFailed,
    );
    // data-state는 문구와 관계없이 저장 상태를 나타낸다(검사·다른 UI에서 사용).
    const storageState =
      app.platformWarning ||
      (sessionOnly
        ? 'session-only'
        : ready
          ? 'ready'
          : canRetry
            ? 'retrying'
            : 'protected');
    const storageStatus = this.element('storage-status');
    storageStatus.dataset.state = storageState;
    storageStatus.textContent = {
      'platform-unavailable': app.text.system.platformUnavailable,
      'session-only': t.storage.sessionOnly,
      ready: storageMessage,
      retrying: t.storage.retrying,
      protected: t.storage.protectedMode(app.save.status, app.settings.status),
    }[storageState];
    this.element('settings').dataset.alert = String(storageState !== 'ready');
    this.element<HTMLButtonElement>('reset').disabled = sessionOnly;
    this.element<HTMLButtonElement>('reset-settings').disabled = sessionOnly;

    this.element('mode-label').textContent = app.pause.paused
      ? 'PAUSED'
      : mode.toUpperCase();
    this.element('pause').hidden = mode !== 'playing';
    const manual = app.pause.has('manual');
    this.element('pause').textContent = manual ? t.resume : t.pause;
    this.element('pause').setAttribute('aria-pressed', String(manual));
    this.element('home').hidden = mode === 'menu';
    this.element('play').hidden = mode === 'playing';
    this.element('play').innerHTML =
      `${e(mode === 'result' ? t.replay : t.play)} <span>↗</span>`;
    this.element('fullscreen').hidden = !(
      app.ready &&
      app.game &&
      fullscreenAvailable(app.game)
    );
    this.renderServices();

    // 공통 계약(준비·광고·오류 상태의 조작 차단, 오버레이)을 마지막에 적용한다.
    this.system.render();
    const reward = this.optional<HTMLButtonElement>('reward');
    if (reward) reward.disabled ||= mode === 'playing';
  }
  private renderServices() {
    const app = this.app;
    const t = this.text;
    const mock = app.platform.isMock;
    const localSdk = app.platform.environment === 'local';
    const disabled = app.platform.environment === 'disabled';
    const hide = (id: string, hidden: boolean) => {
      const element = this.optional(id);
      if (element) element.hidden = hidden;
    };
    hide('consent-label', !mock && !disabled);
    hide('outcome', !mock && !disabled);
    hide('reward', !(mock || localSdk || disabled));
    hide('purchase', !mock && !disabled);
    const serviceMode = this.optional('service-mode');
    if (serviceMode)
      serviceMode.textContent = mock
        ? t.serviceMode.mock
        : localSdk
          ? t.serviceMode.local
          : app.platform.environment === 'crazygames'
            ? t.serviceMode.crazygames
            : app.platformWarning
              ? app.text.system.platformUnavailable
              : t.serviceMode.unavailable;
  }
  destroy() {
    clearTimeout(this.noticeTimer);
    this.system.destroy();
    this.controller.abort();
    this.app.onState = () => {};
  }
}

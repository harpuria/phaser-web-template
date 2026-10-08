export type ServiceResult =
  | { status: 'completed'; mock: boolean }
  | {
      status:
        'unavailable' | 'consent-required' | 'busy' | 'cancelled' | 'error';
    };

export type AdState = 'idle' | 'requesting' | 'playing';
export type PlatformEnvironment = 'mock' | 'disabled' | 'local' | 'crazygames';

export interface PlatformAdapter {
  readonly environment: PlatformEnvironment;
  readonly capabilities: { ads: boolean; billing: boolean; analytics: boolean };
  rewarded(onStarted: () => void): Promise<ServiceResult>;
  midgame(onStarted: () => void): Promise<ServiceResult>;
  purchase(product: string): Promise<ServiceResult>;
  track(event: string): void;
  loadingStart?(): void;
  loadingStop?(): void;
  setGameplay?(active: boolean): void;
  listenMute?(listener: (muted: boolean) => void): () => void;
  destroy?(): void;
}

export class UnavailableAdapter implements PlatformAdapter {
  readonly environment = 'disabled';
  readonly capabilities = { ads: false, billing: false, analytics: false };
  async rewarded(): Promise<ServiceResult> {
    return { status: 'unavailable' };
  }
  async midgame(): Promise<ServiceResult> {
    return { status: 'unavailable' };
  }
  async purchase(): Promise<ServiceResult> {
    return { status: 'unavailable' };
  }
  track() {}
}

export class MockAdapter implements PlatformAdapter {
  readonly environment = 'mock';
  readonly capabilities = { ads: true, billing: true, analytics: true };
  outcome: 'completed' | 'cancelled' | 'error' = 'completed';
  private async result(): Promise<ServiceResult> {
    const outcome = this.outcome;
    await new Promise((resolve) => setTimeout(resolve, 350));
    return outcome === 'completed'
      ? { status: outcome, mock: true }
      : { status: outcome };
  }
  rewarded(onStarted: () => void) {
    onStarted();
    return this.result();
  }
  midgame(onStarted: () => void) {
    onStarted();
    return this.result();
  }
  purchase() {
    return this.result();
  }
  track(event: string) {
    console.info('[Mock analytics]', event);
  }
}

export interface ServiceOptions {
  development: boolean;
  mock: boolean;
  ads: boolean;
  billing: boolean;
  analytics: boolean;
}

export class PlatformServices {
  private busy = false;
  private destroyed = false;
  private gameplay = false;
  private adState: AdState = 'idle';
  consent = false;
  onAdState: (state: AdState) => void = () => {};
  readonly adapter: PlatformAdapter;

  constructor(
    private options: ServiceOptions,
    adapter?: PlatformAdapter,
  ) {
    this.adapter =
      adapter ??
      (options.development && options.mock
        ? new MockAdapter()
        : new UnavailableAdapter());
  }
  get isMock() {
    return this.adapter.environment === 'mock';
  }
  get environment() {
    return this.adapter.environment;
  }
  get adsAvailable() {
    return !this.destroyed && this.options.ads && this.adapter.capabilities.ads;
  }

  private async request(
    enabled: boolean,
    needsConsent: boolean,
    action: () => Promise<ServiceResult>,
    ad = false,
  ): Promise<ServiceResult> {
    if (this.destroyed || !enabled) return { status: 'unavailable' };
    if (needsConsent && !this.consent) return { status: 'consent-required' };
    if (this.busy) return { status: 'busy' };
    this.busy = true;
    try {
      if (ad) this.setAdState('requesting');
      return await action();
    } catch {
      return { status: 'error' };
    } finally {
      if (ad && !this.destroyed) this.setAdState('idle');
      this.busy = false;
    }
  }
  private setAdState(state: AdState) {
    this.adState = state;
    this.adapter.setGameplay?.(this.gameplay && state === 'idle');
    this.onAdState(state);
  }
  private adStarted = () => {
    if (!this.destroyed) this.setAdState('playing');
  };
  /** Call only after the player explicitly chooses a clearly described reward. */
  rewarded() {
    return this.request(
      this.adsAvailable,
      this.isMock,
      () => this.adapter.rewarded(this.adStarted),
      true,
    );
  }
  /** Call at a natural break, such as the end of a round. */
  midgame() {
    return this.request(
      this.adsAvailable,
      this.isMock,
      () => this.adapter.midgame(this.adStarted),
      true,
    );
  }
  purchase(product: string) {
    return this.request(
      this.options.billing && this.adapter.capabilities.billing,
      false,
      () => this.adapter.purchase(product),
    );
  }
  track(event: string): boolean {
    if (
      this.destroyed ||
      !this.options.analytics ||
      !this.adapter.capabilities.analytics ||
      !this.consent
    )
      return false;
    this.adapter.track(event);
    return true;
  }
  loadingStart() {
    if (!this.destroyed) this.adapter.loadingStart?.();
  }
  loadingStop() {
    if (!this.destroyed) this.adapter.loadingStop?.();
  }
  setGameplay(active: boolean) {
    this.gameplay = active;
    if (!this.destroyed)
      this.adapter.setGameplay?.(active && this.adState === 'idle');
  }
  listenMute(listener: (muted: boolean) => void) {
    return this.adapter.listenMute?.(listener) ?? (() => {});
  }
  destroy() {
    this.destroyed = true;
    this.adapter.setGameplay?.(false);
    this.adapter.destroy?.();
    this.onAdState = () => {};
  }
}

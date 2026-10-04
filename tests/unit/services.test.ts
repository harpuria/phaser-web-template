import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockAdapter, PlatformServices } from '../../src/services/platform';
import { PauseState } from '../../src/core/pause';
import { settingsSchema } from '../../src/core/settings';

const options = {
  development: true,
  mock: true,
  ads: true,
  billing: true,
  analytics: true,
};
afterEach(() => vi.useRealTimers());
describe('platform gates', () => {
  it('never returns mock success in production', async () => {
    const services = new PlatformServices({ ...options, development: false });
    services.consent = true;
    expect(await services.rewarded()).toEqual({ status: 'unavailable' });
    expect(await services.purchase('demo')).toEqual({ status: 'unavailable' });
    expect(services.track('event')).toBe(false);
  });
  it('requires consent, and honours revocation and disabled features', async () => {
    const services = new PlatformServices(options);
    expect(await services.rewarded()).toEqual({ status: 'consent-required' });
    expect(services.track('event')).toBe(false);
    services.consent = true;
    services.consent = false;
    expect(await services.rewarded()).toEqual({ status: 'consent-required' });
    const disabled = new PlatformServices({
      ...options,
      ads: false,
      billing: false,
    });
    expect(await disabled.rewarded()).toEqual({ status: 'unavailable' });
    expect(await disabled.purchase('demo')).toEqual({ status: 'unavailable' });
  });
  it.each(['completed', 'cancelled', 'error'] as const)(
    'serializes requests and reports %s',
    async (outcome) => {
      vi.useFakeTimers();
      const services = new PlatformServices(options);
      services.consent = true;
      (services.adapter as MockAdapter).outcome = outcome;
      const pending = services.rewarded();
      expect(await services.purchase('demo')).toEqual({ status: 'busy' });
      await vi.runAllTimersAsync();
      expect((await pending).status).toBe(outcome);
      const second = services.purchase('demo');
      await vi.runAllTimersAsync();
      expect((await second).status).toBe(outcome);
    },
  );
});

it('does not resume manual pause when tab visibility or a dialog recovers', () => {
  const changes: boolean[] = [];
  const pause = new PauseState((state) => changes.push(state));
  pause.set('manual', true);
  pause.set('settings', true);
  pause.set('hidden', true);
  pause.set('hidden', false);
  pause.set('settings', false);
  expect(pause.paused).toBe(true);
  expect(changes).toEqual([true]);
  pause.set('manual', false);
  expect(changes).toEqual([true, false]);
});

it('rejects malformed settings, including nonfinite and out-of-range audio', () => {
  const schema = settingsSchema();
  expect(schema.validate(schema.defaults())).toBe(true);
  for (const volume of [-1, 2, NaN, Infinity, '0.5'])
    expect(schema.validate({ ...schema.defaults(), master: volume })).toBe(
      false,
    );
});

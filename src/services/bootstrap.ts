import { browserStorage, type StoragePort } from '../core/store';
import { CrazyGamesAdapter } from './crazygames';
import { initializeCrazyGames } from './crazygames-sdk';
import {
  PlatformServices,
  UnavailableAdapter,
  type ServiceOptions,
} from './platform';

export interface PlatformContext {
  platform: PlatformServices;
  storage: StoragePort | undefined;
  storageKind: 'local' | 'crazygames' | 'unavailable';
  /** 사용자에게 알릴 플랫폼 문제. 문구는 UI가 정한다(`'platform-unavailable'`: SDK 연결 실패로 저장 불가). */
  warning: '' | 'platform-unavailable';
}

/** Initialize before constructing stores: the SDK preloads cloud progress in init(). */
export async function createPlatform(
  options: ServiceOptions & {
    crazyGames: { enabled: boolean; launch: 'basic' | 'full' };
  },
  initialize = initializeCrazyGames,
): Promise<PlatformContext> {
  const standalone = (): PlatformContext => ({
    platform: new PlatformServices(options),
    storage: browserStorage(),
    storageKind: 'local',
    warning: '',
  });
  if (!options.crazyGames.enabled) return standalone();
  try {
    const sdk = await initialize();
    if (sdk.environment === 'disabled') return standalone();
    const adapter = new CrazyGamesAdapter(sdk, options.crazyGames.launch);
    return {
      platform: new PlatformServices(options, adapter),
      storage: adapter.storage,
      storageKind: 'crazygames',
      warning: '',
    };
  } catch (error) {
    console.warn('[CrazyGames initialization]', error);
    return {
      platform: new PlatformServices(options, new UnavailableAdapter()),
      storage: undefined,
      storageKind: 'unavailable',
      warning: 'platform-unavailable',
    };
  }
}

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
  warning: string;
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
      warning:
        '플랫폼에 연결하지 못해 기록을 저장할 수 없습니다. 새로고침해 다시 시도해 주세요.',
    };
  }
}

import { pickLocale } from '../core/locale';

/**
 * 사용자에게 보이는 문구. 새 언어는 `ko`와 같은 모양의 객체를 추가하고 `locales`에 등록한다.
 * `system`은 템플릿 공통 UI(오류·일시정지·저장 상태), `shell`은 데모 HTML UI, `game`은 예제 장면 문구다.
 */
const ko = {
  system: {
    loadingProgress: (percent: number) => `준비 중… ${percent}%`,
    loadFailed: '파일을 불러오지 못했습니다. 새로고침해 다시 시도해 주세요.',
    startupFailed: '게임을 시작하지 못했습니다. 새로고침해 다시 시도해 주세요.',
    unknownError: '알 수 없는 오류',
    errorTitle: '문제가 발생했습니다',
    reload: '새로고침',
    pausedTitle: '잠시 쉬어가는 중',
    pausedHint: '계속하기를 누르면 다시 시작합니다.',
    rotateTitle: (orientation: 'landscape' | 'portrait') =>
      `기기를 ${orientation === 'landscape' ? '가로' : '세로'}로 돌려 주세요`,
    rotateHint: '권장 방향으로 돌리면 더 크게 플레이할 수 있습니다.',
    exitFullscreen: '전체화면 나가기',
    platformUnavailable:
      '플랫폼에 연결하지 못해 기록을 저장할 수 없습니다. 새로고침해 다시 시도해 주세요.',
  },
  shell: {
    heroTitle: '여기서, 게임을 시작하세요',
    heroSubtitle: '게임에 집중할 수 있도록, 반복되는 준비는 미리 해두었습니다.',
    stageLabel: '게임 데모',
    stageTag: '플레이 가능한 예제',
    gameLabel:
      '별 모으기 게임. 방향키, WASD, 게임패드로 이동하거나 화면을 누르세요.',
    moveHint: '이동',
    touchHint: '· 화면을 눌러 이동',
    rotateTip: (orientation: 'landscape' | 'portrait') =>
      `기기를 ${orientation === 'landscape' ? '가로' : '세로'}로 돌리면 더 크게 플레이할 수 있어요.`,
    fullscreen: '전체화면',
    pause: '일시정지',
    resume: '계속하기',
    home: '메뉴',
    play: '플레이 시작',
    replay: '다시 플레이',
    settings: '설정 열기',
    records: '내 플레이 기록',
    best: '최고 기록',
    rounds: '플레이 횟수',
    compactStats: (best: number, rounds: number) =>
      `최고 ${best} · ${rounds}판`,
    retrySave: '저장 다시 시도',
    storage: {
      sdkLocal: '이 브라우저에 SDK 데모 기록이 저장됩니다.',
      crazygames:
        'CrazyGames에 자동으로 저장됩니다. 로그인하면 기기 간 동기화됩니다.',
      local: '이 브라우저에 자동으로 저장됩니다.',
      sessionOnlyLabel: '저장 불가',
      sessionOnly:
        '이 화면에서는 브라우저 저장소에 접근할 수 없습니다. 계속 플레이할 수 있지만 새로고침하면 이번 플레이 기록과 설정 변경이 사라집니다.',
      retrying:
        '저장하지 못했습니다. 진행 상태를 유지하며 자동으로 다시 시도합니다. 저장 다시 시도 버튼으로 즉시 저장할 수도 있습니다.',
      protectedMode: (save: string, settings: string) =>
        `저장 보호 모드 · 기록: ${save}, 설정: ${settings}. 설정에서 초기화할 수 있습니다.`,
      settingsFailed: '설정을 저장하지 못했습니다. 저장 상태를 확인해 주세요.',
    },
    featuresTitle: '기본 기능',
    features: [
      '버전 관리가 있는 저장',
      '음량 · 효과음 · 배경음 설정',
      '화면 전환 · 자동 일시정지',
      '키보드 · 마우스 · 터치 · 게임패드 입력',
      '전체화면 · 오류 안내 화면',
      '광고 · 결제 서비스 연결 지점',
    ],
    playgroundTitle: '연결하기 전에, 가볍게 테스트',
    consent: 'Mock 분석·광고 동의',
    outcomeLabel: 'Mock 결과',
    outcomes: { completed: '성공', cancelled: '취소', error: '오류' },
    reward: '보상형 광고 테스트',
    purchase: '구매 테스트',
    sound: '효과음 듣기',
    ready: '준비되었습니다. 플레이를 시작해 보세요.',
    serviceMode: {
      mock: '개발용 Mock입니다. 외부 서비스로 데이터를 보내거나 실제 결제하지 않습니다.',
      local:
        'CrazyGames SDK 로컬 환경입니다. 광고는 데모이며 실제 보상/결제는 없습니다.',
      crazygames: 'CrazyGames에 연결되었습니다.',
      unavailable: '이 환경에서는 광고와 결제를 사용할 수 없습니다.',
    },
    footerStart: '당신의 게임은 다음 위치에서 시작됩니다:',
    settingsTitle: '게임 설정',
    closeSettings: '설정 닫기',
    muted: '전체 음소거',
    master: '전체 음량',
    music: '배경음',
    sfx: '효과음',
    reducedMotion: '화면 움직임 줄이기',
    resetNote: '플레이 기록 초기화는 설정을 유지합니다.',
    reset: '플레이 기록 초기화',
    resetSettings: '설정 초기화 / 저장 오류 복구',
    done: '완료',
    confirmReset: '플레이 기록을 지울까요? 이 작업은 되돌릴 수 없습니다.',
    confirmResetSettings: '저장된 설정을 초기화할까요?',
    notices: {
      savedAll: '진행 상태와 설정을 저장했습니다.',
      notSavedYet: '아직 저장하지 못했습니다. 진행 상태는 유지됩니다.',
      resetDone: '플레이 기록을 초기화했습니다.',
      settingsReset: '설정을 초기화했습니다.',
      storageInaccessible: '저장 공간에 접근할 수 없습니다.',
      requesting: '요청 처리 중…',
      rewardLabel: '보상형 광고',
      purchaseLabel: '구매',
      mockNote: ' (Mock · 실제 보상/결제 없음)',
      soundPlayed: '효과음을 재생했습니다. 음소거와 볼륨 설정을 확인해 주세요.',
    },
  },
  game: {
    menuTitle: '작은 시작, 새로운 세계',
    menuSubtitle: '별을 모으는 짧은 게임으로 템플릿을 둘러보세요.',
    result: (stars: number) => `${stars}개의 별을 모았어요`,
    saved: '기록을 저장했습니다. 다시 도전해 보세요!',
    saveFailed: '기록을 저장하지 못했습니다. 저장 상태를 확인해 주세요.',
  },
};

export type Strings = typeof ko;

const en: Strings = {
  system: {
    loadingProgress: (percent) => `Loading… ${percent}%`,
    loadFailed: 'Some files could not be loaded. Please reload to try again.',
    startupFailed: 'The game could not start. Please reload to try again.',
    unknownError: 'Unknown error',
    errorTitle: 'Something went wrong',
    reload: 'Reload',
    pausedTitle: 'Paused',
    pausedHint: 'Press Resume to continue.',
    rotateTitle: (orientation) => `Please rotate your device to ${orientation}`,
    rotateHint: 'The game plays larger in the recommended orientation.',
    exitFullscreen: 'Exit fullscreen',
    platformUnavailable:
      'Could not connect to the platform, so progress cannot be saved. Please reload to try again.',
  },
  shell: {
    heroTitle: 'Start your game here',
    heroSubtitle:
      'The repetitive setup is done, so you can focus on the game itself.',
    stageLabel: 'Game demo',
    stageTag: 'Playable example',
    gameLabel:
      'Star collecting game. Move with the arrow keys, WASD or a gamepad, or press and hold the screen.',
    moveHint: 'Move',
    touchHint: '· Hold the screen to move',
    rotateTip: (orientation) =>
      `Rotate your device to ${orientation} for a larger view.`,
    fullscreen: 'Fullscreen',
    pause: 'Pause',
    resume: 'Resume',
    home: 'Menu',
    play: 'Play',
    replay: 'Play again',
    settings: 'Settings',
    records: 'My records',
    best: 'Best',
    rounds: 'Rounds',
    compactStats: (best, rounds) => `Best ${best} · ${rounds} rounds`,
    retrySave: 'Retry saving',
    storage: {
      sdkLocal: 'SDK demo progress is saved in this browser.',
      crazygames:
        'Progress is saved to CrazyGames automatically and syncs across devices when you log in.',
      local: 'Progress is saved in this browser automatically.',
      sessionOnlyLabel: 'Saving unavailable',
      sessionOnly:
        'Browser storage is unavailable here. You can keep playing, but reloading will discard progress and settings changes from this session.',
      retrying:
        'Saving failed. Your progress is kept and saving will be retried automatically. You can also press Retry saving.',
      protectedMode: (save, settings) =>
        `Save protection mode · progress: ${save}, settings: ${settings}. You can reset it in Settings.`,
      settingsFailed:
        'Settings could not be saved. Please check the storage status.',
    },
    featuresTitle: 'Included',
    features: [
      'Versioned saves',
      'Master, music and sound effect volume',
      'Scene transitions and automatic pause',
      'Keyboard, mouse, touch and gamepad input',
      'Fullscreen and error recovery screens',
      'Ad and payment service connection points',
    ],
    playgroundTitle: 'Try the services before connecting them',
    consent: 'Mock analytics and ads consent',
    outcomeLabel: 'Mock result',
    outcomes: { completed: 'Success', cancelled: 'Cancelled', error: 'Error' },
    reward: 'Test rewarded ad',
    purchase: 'Test purchase',
    sound: 'Play sound effect',
    ready: 'Ready. Start playing.',
    serviceMode: {
      mock: 'Development mock. No data is sent to external services and nothing is charged.',
      local:
        'CrazyGames SDK local environment. Ads are demos with no real reward or payment.',
      crazygames: 'Connected to CrazyGames.',
      unavailable: 'Ads and payments are not available in this environment.',
    },
    footerStart: 'Your game starts in',
    settingsTitle: 'Settings',
    closeSettings: 'Close settings',
    muted: 'Mute all',
    master: 'Master volume',
    music: 'Music',
    sfx: 'Sound effects',
    reducedMotion: 'Reduce motion',
    resetNote: 'Resetting records keeps your settings.',
    reset: 'Reset records',
    resetSettings: 'Reset settings / recover from save errors',
    done: 'Done',
    confirmReset: 'Delete your records? This cannot be undone.',
    confirmResetSettings: 'Reset saved settings?',
    notices: {
      savedAll: 'Progress and settings saved.',
      notSavedYet: 'Not saved yet. Your progress is kept.',
      resetDone: 'Records reset.',
      settingsReset: 'Settings reset.',
      storageInaccessible: 'Storage is not accessible.',
      requesting: 'Processing request…',
      rewardLabel: 'Rewarded ad',
      purchaseLabel: 'Purchase',
      mockNote: ' (Mock · no real reward or payment)',
      soundPlayed: 'Sound effect played. Check mute and volume settings.',
    },
  },
  game: {
    menuTitle: 'A small start, a new world',
    menuSubtitle: 'Collect stars in a short round to explore the template.',
    result: (stars) => `You collected ${stars} star${stars === 1 ? '' : 's'}`,
    saved: 'Record saved. Try again!',
    saveFailed: 'Your record could not be saved. Please check the save status.',
  },
};

export const locales = { ko, en } satisfies Record<string, Strings>;
export type Locale = keyof typeof locales;

/** `setting`이 'auto'면 브라우저 언어에서 지원하는 첫 언어를, 없으면 `fallback`을 고른다. */
export function resolveStrings(
  setting: 'auto' | Locale,
  fallback: Locale,
  preferred: readonly string[] = browserLanguages(),
): { locale: Locale; text: Strings } {
  const locale =
    setting === 'auto'
      ? pickLocale(Object.keys(locales) as Locale[], preferred, fallback)
      : setting;
  return { locale, text: locales[locale] };
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
}

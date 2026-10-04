# 개발 안내

## 새 장면 만들기

게임 코드는 `src/game/`, asset은 `public/assets/`에 둡니다.
예를 들어 `src/game/MyGame.ts`를 만듭니다.

```ts
import Phaser from 'phaser';

export class MyGame extends Phaser.Scene {
  constructor() {
    super('MyGame');
  }
  create() {
    this.add.text(80, 80, 'Hello, my game!', { fontSize: '32px' });
  }
}
```

`src/main.ts`의 scene 목록에 `new MyGame()`을 등록하고 `src/config/game.ts`의 `startScene`을 `MyGame`으로 바꿉니다.
Boot/Preload는 유지합니다. 예제 전용 `Shell`과 `MenuScene`/`GameScene`은 교체하거나 제거합니다.
Shell을 제거하더라도 Phaser의 parent인 `<div id="game">`과 크기를 가진 컨테이너는 만들어야 합니다.
앱의 pause 대상은 기본 `'Game'`이므로 이름 변경 시 `src/app.ts`도 맞춥니다.

기본 해상도는 960×540입니다. 세로 게임으로 바꿀 때 `gameConfig`뿐 아니라 게임의 좌표/화면 배치도 함께 수정합니다.
`Shell`과 예제 장면은 완성된 범용 UI 프레임워크가 아니라 교체할 수 있는 사용 예입니다.

## asset 추가

`src/game/assets.ts`의 `queueAssets`에서 Phaser loader를 사용합니다.
`import.meta.env.BASE_URL`을 기준으로 URL을 만들면 호스팅 하위 경로에서도 동작합니다.
예제 audio 키는 `music`, `collect`입니다. 다른 게임은 음원을 교체하거나 AudioService에 필요한 키/API를 추가합니다.
이름·음원·데모 장면을 제거했다면 예제 전용 E2E도 함께 바꾸고 공통 단위 검사는 유지합니다.

## 저장 데이터와 migration

`src/game/save.ts`가 게임 schema의 원본입니다. 구조를 바꿀 때 version을 올리고 이전 버전에서 한 단계씩 변환합니다.
예를 들어 v1 `{ best, rounds }`에 v2 `coins`를 추가할 때:

```ts
const migrations = {
  1: (old: unknown) => {
    // 실제 코드에서는 v1 schema로 검증한 후 변환합니다.
    if (!isV1Progress(old)) throw new Error('Invalid v1 save');
    return { ...old, coins: 0 };
  },
};
```

새 validate 함수는 모든 필드의 타입·범위를 검사해야 합니다. 최종 validate가 실패하면 원본 저장을 보호합니다.
schema 변경에는 실제 구버전 fixture를 사용한 migration 검사를 추가합니다.

게임에서 서비스가 필요한 경우 생성자로 App을 전달합니다.

```ts
app.save.update((data) => ({ ...data, best: Math.max(data.best, score) }));
const persisted = app.save.flush();
// persisted가 false면 저장 성공으로 표시하지 않습니다.
app.audio?.sfx();
app.pause.set('inventory', true); // 닫을 때 같은 이유를 false로 해제
```

매 프레임 localStorage에 쓰지 말고 중요한 진행 완료 시 flush합니다.
손상 데이터 복구 UI는 확인 후 `app.save.reset()`을 호출합니다.
`reset()`은 원본을 삭제하므로 자동으로 호출하지 않습니다.

## 검증

`npm run check`는 린트, 포맷, 단위 검사, 타입 검사, 배포 빌드를 실행합니다.
`npm run test:e2e`는 Chromium desktop/Pixel 7 크기에서 실제 게임과 HTML UI를 조작합니다.
`E2E_PREVIEW=1 npm run test:e2e`는 이미 만들어진 dist를 검사합니다. 빌드 후 실행합니다.
검사 서버는 4173 포트입니다. 같은 포트에 다른 앱이 있으면 종료한 뒤 실행합니다.
CI는 두 E2E 모드를 모두 실행하고 실패 시 trace/screenshot을 보관합니다.
Safari/Firefox/실기기는 별도로 확인해야 합니다. 모바일 에뮬레이션은 실기기 검증이 아닙니다.

## 정적 배포

```bash
npm ci
npm run check
npm run preview
```

`dist/`의 내용을 정적 서버에 복사합니다. 기본 Vite base가 `./`이므로 서브디렉터리도 지원합니다.
라우터가 없어 SPA rewrite 설정은 필요 없습니다. `assets/`의 음원까지 업로드해야 합니다.
해시가 붙은 JS/CSS는 장기 캐시할 수 있으나 index.html과 고정 이름 음원은 업데이트 시 재검증/캐시 무효화가 필요합니다.
`VITE_*` 환경 변수는 브라우저 번들에 공개되므로 비밀키를 넣지 않습니다.
기본값에는 서비스워커가 없어 이전 버전 캐시가 새 배포를 가로막지 않습니다.

## 문제 해결

| 증상                           | 확인                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| 빈 화면/로딩 실패              | 개발자 도구 Network에서 asset 404, JS 오류 확인. HTTP 서버로 실행            |
| 소리 없음                      | 플레이 버튼 클릭, 브라우저/OS 음소거, 게임 볼륨 확인                         |
| 저장 보호 모드                 | 저장 상태 확인. 기존 데이터가 필요하면 개발자 도구에서 백업한 뒤 UI로 초기화 |
| 폰에서 접속 불가               | 같은 Wi-Fi, PC 방화벽, Network 주소 확인                                     |
| 방향키로 이동 안 됨            | 게임 화면을 눌러 포커스. 설정 창/일시정지 상태 확인                          |
| 배포에서 광고/결제 unavailable | 정상. 실제 Adapter를 연결하기 전의 기본 동작                                 |

글꼴은 시스템 폰트이며 외부 CDN이나 계정 없이 실행할 수 있습니다.

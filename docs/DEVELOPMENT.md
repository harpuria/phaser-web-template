# 개발 안내

## 데모를 내 게임으로 바꾸기

별 모으기 예제는 사용법 데모다. 아래 순서대로 작업하면 공통 기능을 유지한 채 내 게임으로 교체할 수 있다.

| 순서 | 파일                         | 할 일                                                                                                                                      |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | `docs/game/README.md`        | 게임 개요·조작·저장 항목·배포 대상과 템플릿 출처(버전·commit)를 기록한다                                                                   |
| 1    | `src/config/game.ts`         | `title`, `storagePrefix`, 해상도, `pixelArt`, `orientation`, `maxRenderScale`, `startScene`, `pausableScenes`, `locale`, `layout`을 맞춘다 |
| 2    | `package.json`, `index.html` | 패키지 이름·`version`(게임 버전으로 사용), `<title>`·`description`·`theme-color`, `public/favicon.svg`를 수정한다                          |
| 3    | `src/game/assets.ts`         | `assetKeys`·`queueAssets`를 내 게임 asset으로 교체하고 `public/assets/demo/`를 삭제한다                                                    |
| 4    | `src/game/save.ts`           | 저장 schema를 정의한다(새 게임이면 `version: 1`부터 시작)                                                                                  |
| 5    | `src/game/session.ts`        | 저장하지 않는 진행 상태(`Mode`, 점수 등)와 게임 규칙 값을 정의한다                                                                         |
| 6    | `src/game/strings.ts`        | 지원 언어의 게임·UI 문구를 채우고 쓰지 않는 언어는 `locales`에서 뺀다                                                                      |
| 7    | `src/game/scenes.ts`         | 내 게임 장면으로 교체한다(장면별 파일 분리 가능)                                                                                           |
| 8    | `src/main.ts`                | `scene` 목록에 내 장면을 등록한다(`Boot`, `Preload`는 맨 앞 유지)                                                                          |
| 9    | `src/ui/Shell.ts`            | HTML 메뉴·HUD를 교체하거나 삭제한다(아래 참고). `src/ui/system.ts`는 유지한다                                                              |
| 10   | `tests/e2e/`                 | `demo.spec.ts`와 `ui.ts`(ID·asset 경로·저장 키)를 새 게임에 맞추고 `contract`·`crazygames`·`embed` 테스트는 유지한다                       |

**Shell을 교체·삭제할 때**:

- `<div id="game">`과 크기를 가진 부모 요소를 만들고, 전체화면을 쓰면 `main.ts`의 `fullscreenTarget`(기본 `'stage'`)을 그 부모 ID에 맞춘다.
- 캔버스 컨테이너에 `SystemUi`를 연결하고 `app.onState`에서 `system.render()`를 호출한다. 조작 버튼에 `data-game-control`을 붙이면 조작 차단과 오류·일시정지·회전 안내가 그대로 동작한다([구조와 계약](ARCHITECTURE.md#html-ui-계약)).
- iframe 전용 배포(CrazyGames 등)라면 `gameConfig.layout`을 `'embed'`로 고정하고 `page` 배치를 제거해도 된다.

## 새 장면 만들기

공통 서비스가 필요한 장면은 생성자로 `App`을 받는다.

```ts
// src/game/MyGame.ts
import Phaser from 'phaser';
import type { App } from '../app';
import { gameConfig } from '../config/game';
import { MoveInput } from '../core/input';
import { centerSafeArea } from '../core/viewport';
import { assetKeys } from './assets';

export class MyGame extends Phaser.Scene {
  private controls!: MoveInput;
  private player!: Phaser.Physics.Arcade.Image;

  constructor(private app: App) {
    super('MyGame'); // gameConfig.startScene / pausableScenes 와 같은 이름
  }
  create() {
    centerSafeArea(this, gameConfig.width, gameConfig.height); // 화면 크기와 전체화면 참고
    this.player = this.physics.add
      .image(100, 100, assetKeys.player)
      .setScale(1 / this.app.renderScale); // 렌더 배율만큼 크게 불러온 텍스처
    this.controls = new MoveInput(this);
    this.app.audio?.playMusic(assetKeys.music);
    if (this.app.pause.paused) this.scene.pause(); // 일시정지 중에 시작된 경우
  }
  update() {
    const v = this.controls.move(this.player).scale(200);
    this.player.setVelocity(v.x, v.y);
  }
}
```

장면 전환은 `transition(this, 'Result', this.app.transitionMs)`를 쓴다. 중복 전환을 막고, 움직임 줄이기 설정 시 페이드를 생략한다.

## 입력

`MoveInput`은 키보드(방향키·WASD), 게임패드(D-pad·왼쪽 스틱), 캔버스 터치/클릭 방향을 하나의 이동 벡터로 합친다.
기본 키 변경은 두 번째 인자로 `MoveBindings`를 넘기며, HTML 버튼·슬라이더에 포커스가 있는 동안 키보드 입력은 무시된다.
점프·확인 같은 버튼 입력은 `scene.input.keyboard.addKey()`와 게임패드 버튼(`pad1.A` 등)을 묶어 별도로 추가한다.

## asset 추가

`src/game/assets.ts`의 `queueAssets`에서 Phaser loader를 사용하고 키는 `assetKeys`에 모은다.
`load.setPath`에 `import.meta.env.BASE_URL`이 붙어 있어 하위 경로 배포에서도 그대로 동작한다.

```ts
load.spritesheet('hero', 'hero.png', { frameWidth: 32, frameHeight: 32 });
load.atlas('ui', 'ui.png', 'ui.json'); // TexturePacker 등에서 만든 atlas
load.bitmapFont('pixel', 'pixel.png', 'pixel.xml');
```

- **렌더 배율(k)**: 고해상도 선명도를 위해 게임을 `k`배로 그린다(아래 [렌더 배율](#렌더-배율)). SVG는 크기에 `k`를 곱해 불러오고, PNG는 `@2x` 원본을 쓴 뒤 장면에서 `setScale(1 / k)`로 줄인다. 물리 충돌 크기는 텍스처 픽셀 기준이므로 `setCircle(r * k)`처럼 `k`를 곱한다.
- 도트 그래픽은 `gameConfig.pixelArt = true`로 설정해 확대 시 흐림을 막는다.
- 웹 글꼴을 Phaser 텍스트에 쓰면 로드 전에 그려질 수 있다. `document.fonts.load('16px MyFont')` 완료 후 장면을 시작하거나 bitmap font를 쓴다.
- 필수 asset 중 하나라도 불러오지 못하면 `Preload`가 다음 장면으로 넘어가지 않고 오류 안내를 띄운다.

## 저장 데이터와 migration

`src/game/save.ts`가 저장 schema 원본이다. 구조를 바꿀 때는 `version`을 올리고 이전 버전별 migration 함수를 추가한다.
예: v1 `{ best, rounds }`에 v2 `coins`를 추가할 때

```ts
import { isRecord, type Schema } from '../core/store';

export interface Progress {
  best: number;
  rounds: number;
  coins: number;
}
const isCount = (n: unknown) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const isV1 = (v: unknown): v is { best: number; rounds: number } =>
  isRecord(v) && isCount(v.best) && isCount(v.rounds);

export const progressSchema: Schema<Progress> = {
  version: 2,
  defaults: () => ({ best: 0, rounds: 0, coins: 0 }),
  validate: (v): v is Progress => isV1(v) && isCount((v as Progress).coins),
  migrations: {
    // 키는 "변환 전 버전". 실패하면 throw → 원본은 그대로 보호된다.
    1: (old) => {
      if (!isV1(old)) throw new Error('Invalid v1 save');
      return { ...old, coins: 0 };
    },
  },
};
```

schema를 바꿀 때마다 구버전 데이터를 fixture로 넣은 단위 테스트를 `tests/unit/`에 추가한다.

```ts
it('migrates a v1 save', () => {
  const storage = new MemoryStorage();
  storage.setItem('save', '{"version":1,"data":{"best":7,"rounds":3}}');
  const store = new Store(storage, 'save', progressSchema);
  expect(store.status).toBe('ready');
  expect(store.data).toEqual({ best: 7, rounds: 3, coins: 0 });
});
```

게임 코드에서는 다음과 같이 사용한다.

```ts
this.app.save.update((data) => ({ ...data, best: Math.max(data.best, score) }));
const persisted = this.app.save.flush(); // false면 "저장됨"이라고 표시하지 않는다
```

- 매 프레임 저장하지 말고 판 종료 같은 중요 시점에만 `flush()`한다. 그 외 변경은 주기적 저장·탭 숨김 시 자동 저장된다.
- 정상 읽기 후 일시적인 쓰기 실패는 `canRetry === true`가 되며, 다음 자동 저장이나 "저장 다시 시도"로 복구한다. 초기 읽기 실패·손상·미래 버전은 원본 보호를 위해 재시도하지 않는다.
- `reset()`은 원본을 삭제하므로 사용자가 명시적으로 확인한 경우에만 호출한다.
- CrazyGames에서는 SDK Data에 저장된다. 제출 시 Progress Save에서 SDK Data 사용을 켜야 한다([CrazyGames 안내](CRAZYGAMES.md)).

## 오디오와 일시정지

- `app.audio?.playMusic(key)`, `sfx(key)`, `stopMusic()`을 사용한다. 설정 UI의 음량·음소거 변경은 즉시 반영된다.
- 커스텀 설정 UI는 `app.settings.update()` / `reset()` 뒤 `app.applySettings()`를 호출한다.
- `app.listenSettings(listener)`는 현재 설정을 즉시 전달하고 변경 시 다시 호출된다. 반환된 해제 함수를 장면 `shutdown`에 연결하며, 메뉴 tween·CSS 전환도 움직임 줄이기 설정을 즉시 따른다.
- 브라우저 자동재생 정책상 첫 소리는 클릭·터치 이후 재생된다. 메뉴 버튼 동작에서 배경음악을 시작한다.
- 인벤토리 등 게임 UI로 멈출 때는 `app.pause.set('inventory', true)`, 닫을 때 `false`를 넘긴다. 모든 이유가 해제되어야 재개되므로 탭 전환이 수동 일시정지를 풀지 않는다.
- 조작 가능한 장면 시작 시 `app.setGameplay(true)`, 결과·메뉴·`shutdown` 시 `app.setGameplay(false)`를 호출한다. 수동 정지와 광고 일시정지는 `App`이 자동 반영한다.

## 화면 크기와 전체화면

Phaser `Scale.EXPAND` 모드를 쓴다. `gameConfig`의 `width`×`height`(기본 960×540)가 **안전 영역**이며, 화면 비율에 따라 남는 영역까지 캔버스가 확장된다.

- 장면 `create()`에서 `centerSafeArea(this, gameConfig.width, gameConfig.height)`를 호출하면 안전 영역이 중앙에 온다(예제는 `background()` 내부 호출).
- 점수·버튼·플레이 영역 등 필수 요소는 안전 영역 좌표(`0..width`, `0..height`) 안에 두고, 배경과 반투명 오버레이는 바깥까지 넉넉히 그린다(예제 결과 화면은 3배 크기).

HTML 레이아웃(`Shell`, `src/style.css`) 전환 기준:

| 화면 조건                               | 레이아웃                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------ |
| 폭 1025px 이상                          | 게임 화면 + 오른쪽 사이드바                                              |
| 폭 1024px 이하                          | 사이드바를 게임 아래로 이동                                              |
| 가로 화면이면서 높이 500px 이하(휴대폰) | 헤더·소개 숨김, 게임이 화면 높이를 모두 채우고 버튼은 오른쪽에 세로 배치 |
| 터치 기기에서 권장 방향이 아닐 때       | 버튼 줄에 회전 안내 문구 표시                                            |

- 게임 카드(제목 줄 + 캔버스 + 버튼 줄)는 화면 높이를 넘지 않게 줄어들며(`--stage-chrome`), 플레이 시작 시 카드 전체가 보이도록 스크롤한다.
- 세로 게임은 `width: 540, height: 960, orientation: 'portrait'`로 바꾼다. 안내 문구와 전체화면 회전 안내도 이 값을 따른다.
- 전체화면 버튼은 지원 브라우저에서만 보인다. `#stage`에 조작 버튼이 포함되어 전체화면을 유지한 채 시작·일시정지·재시작·메뉴 이동이 가능하며, 권장 방향이 아니면 회전 안내가 뜬다.

### 화면 배치: page와 embed

| 배치    | 적용 조건                                  | 표시 방식                                                                |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `page`  | 단독 페이지로 열 때(`layout: 'auto'` 기본) | 소개·사이드바·서비스 테스트 패널이 포함된 템플릿 데모 페이지             |
| `embed` | iframe 안(CrazyGames, itch.io)             | 게임 카드가 창 전체를 채움. 기록은 제목 줄에, 저장 상태는 설정 창에 표시 |

- `?layout=embed` 또는 `?layout=page`로 미리 볼 수 있다. iframe 전용 배포라면 `gameConfig.layout`을 `'embed'`로 고정한다.
- `embed`에서는 문서가 스크롤되지 않는다. 알림은 게임 화면 위에 잠깐 뜨고, 저장 문제가 있으면 설정 버튼에 표시점이 붙는다.
- 브라우저가 iframe의 로컬 저장소를 차단하면 제목 줄에 "저장 불가"가 뜬다. 이번 세션 기록은 설정 창에서 볼 수 있지만 새로고침하면 설정 변경과 함께 사라진다.
- 휴대폰 세로 화면에서 가로 게임을 열면 전체화면이 아니어도 회전 안내가 화면을 덮는다.

### 렌더 배율

고해상도 화면에서 흐려지지 않도록 `안전 영역 × k` 픽셀로 렌더링하고 카메라를 `k`배 zoom한다. 장면 좌표계는 그대로 960×540 단위다.

- `k`는 시작 시 한 번 계산한다(`devicePixelRatio × 안전 영역 배율`을 0.25 단위로 반올림, `1..maxRenderScale`, `src/core/renderScale.ts`).
- 기본 상한은 PC 2, 터치 기기 1.5다. GPU 픽셀 수는 `k²`(1.5배 → 2.25배, 2배 → 4배)로 늘어난다.
- `centerSafeArea`를 호출한 장면에서는 이후 추가되는 `Text`가 자동으로 `k`배 해상도로 그려진다(`Graphics`는 기본 선명).
- 저사양 폰에서 프레임이 떨어지면 `maxRenderScale.mobile`을 1.25나 1로 낮춘다. 같은 Wi-Fi 휴대폰에서 Network 주소에 `?debug`를 붙이면 왼쪽 위 `render ×k · fps`로 확인할 수 있다.
- `k`는 전체화면 기준이므로 페이지 안의 작은 캔버스에서는 실제 표시 크기보다 크게 렌더링될 수 있다(예: PC 1920×1080에서 `k=2`, 표시 폭 약 1062px).

## 문구와 언어

사용자 문구는 `src/game/strings.ts`에 언어별로 정리하고, 장면·UI는 `this.app.text`에서 읽는다.

```ts
// strings.ts의 ko·en 객체에 같은 키를 추가한 뒤
this.add.text(x, y, this.app.text.game.menuTitle, style);
```

- `gameConfig.locale: 'auto'`는 `navigator.languages`에서 지원 언어를 고르고 없으면 `fallbackLocale`(기본 `en`)을 쓴다. 고정하려면 `'ko'`처럼 지정한다.
- 새 언어는 `ko`와 같은 구조로 `locales`에 추가한다. 타입 검사와 `tests/unit/presentation.test.ts`가 누락된 키를 검출한다.
- HTML에 문구를 넣을 때는 `escape()`(`src/ui/system.ts`)를 쓴다. 웹 글꼴을 쓸 때는 위의 [asset 추가](#asset-추가) 글꼴 로드 방식을 따른다.
- E2E 테스트는 문구 대신 요소 ID와 `data-state`를 보므로 문구나 언어를 바꿔도 깨지지 않는다.

## 디버그와 오류

- 개발 서버에서 `?debug`를 붙이면 Arcade 물리 충돌 영역과 렌더 배율·FPS가 보인다(배포 빌드에서는 무시).
- `?round=5`로 예제 판 길이를 5초로 줄일 수 있다(E2E용). 보상·랭킹에 영향을 주는 조정값은 `import.meta.env.DEV`일 때만 읽게 제한한다.
- 예기치 않은 예외와 Promise 거부는 `app.fail(message)`로 처리한다. 첫 오류를 유지한 채 플레이·오디오·SDK gameplay·입력·자동 저장을 멈추고 새로고침 안내를 띄운다.
- 광고·SDK·브라우저 확장 등 다른 origin 스크립트 오류는 콘솔 경고(`[External error ignored]`)만 남기고 게임을 멈추지 않는다([구조와 계약](ARCHITECTURE.md#시작과-정리)).

## 검증

| 명령                             | 내용                                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| `npm run check`                  | 린트, 포맷, 단위 테스트, 타입 검사, CrazyGames·standalone 빌드 확인 |
| `npm run test:e2e`               | 개발 서버 기준 Chromium·Firefox·WebKit 및 Pixel 7 Chromium E2E      |
| `E2E_PREVIEW=1 npm run test:e2e` | CrazyGames 배포 빌드 기준 E2E (`dist/` 보존)                        |
| `npm run test:e2e:standalone`    | 자체 호스팅용 배포 빌드에서 SDK 미요청·로컬 저장·복원 테스트        |
| `npm run test:sdk`               | 공식 CDN SDK local의 초기화·음소거·광고·저장 복원 테스트            |

**테스트 실행 구조**:

- **빌드·포트 분리**: 테스트 빌드는 `dist/` 대신 `test-results/builds/`에 생성하며 기존 서버를 재사용하지 않는다(포트: 개발 E2E `4273`, 배포 E2E `4274`, standalone `4175`, 공식 SDK `4176`).
- **결과 및 워커**: 결과는 `test-results/` 하위(`e2e/dev/`, `e2e/preview/`, `standalone/`, `sdk/`)에 저장한다. CPU·GPU 경합을 줄이기 위해 기본 worker는 1개다.
- **CI**: `check`, 개발·배포 E2E, `standalone` 테스트를 자동 실행하며 실패 시 trace·스크린샷을 보관한다. 공식 CDN 테스트는 `workflow_dispatch`의 `sdk_smoke`로 수동 실행한다([SDK 안내](CRAZYGAMES.md#검증-범위와-공식-문서)).
- **테스트 파일**: `contract`(저장 보호·asset 실패·오류 정지·전체화면), `crazygames`(SDK 경계), `embed`(iframe), `responsive`(page), `demo`(예제 흐름·언어)로 나뉘며 요소는 `ui.ts` ID로 찾는다.
- **브라우저 한계**: 공통 흐름은 Chromium·Firefox·WebKit에서 돌리고, CDP 터치(`tests/e2e/touch.ts`)는 Pixel 7 전용이다. WebKit·모바일 에뮬레이션은 실제 Safari·실기기 검증을 대체하지 못한다.

실제 iPhone·Android에서는 아래 항목을 직접 확인하고 기기·OS·브라우저·결과를 기록한다.

- 터치 이동, 전체화면 지원 여부, 전체화면 내 일시정지·재시작
- 세로/가로 회전, 주소창 높이 변화, 노치와 버튼 가림 여부
- 첫 터치 후 오디오 시작, 백그라운드 복귀·광고 종료 후 오디오 재개
- 10분 이상 플레이 중 FPS·발열·메모리·입력 반응, 저장 복원

## 정적 배포

```bash
npm ci
npm run check
npm run build:standalone # 자체 호스팅용 최종 빌드 (CrazyGames 제출은 build:crazygames)
npm run preview          # 배포 전 dist 로컬 확인
```

배포 대상(`--mode` 또는 `VITE_PLATFORM`) 없이 `npm run build`를 실행하면 중단된다. 자체 호스팅에 CrazyGames 빌드를 올리면 광고 차단기 등으로 SDK가 막힐 때 저장이 실패하기 때문이다.

- `dist/` 전체(음원 포함)를 정적 서버에 올린다. `base: './'` 설정으로 하위 경로(`/my-game/`)와 itch.io(zip)에도 그대로 배포되며, iframe 환경은 자동으로 `embed` 배치가 적용된다.
- CrazyGames 제출은 [CrazyGames 안내](CRAZYGAMES.md)를 따른다(기본 Basic Launch, Full Launch 승인 후 광고 활성화).
- `.env.local`의 `VITE_PLATFORM`으로 기본 대상을 정할 수 있다. 잘못된 값이거나 전용 명령의 `--mode`와 충돌하면 빌드가 중단되며, [Vite mode 규칙](https://vite.dev/guide/env-and-mode)상 `preview` 시점에 대상이 바뀌지는 않는다.
- 클라이언트 라우터가 없어 SPA rewrite 설정은 불필요하다. `index.html`을 파일로 직접 열지 말고 HTTP 서버로 연다.
- 해시가 붙은 JS·CSS는 장기 캐시해도 된다. `index.html`과 고정 이름 음원은 업데이트 시 캐시를 갱신한다.
- 환경 변수는 `.env.example`을 참고한다. `VITE_*` 값은 번들에 노출되므로 비밀키를 넣지 않는다.

## 문제 해결

| 증상                                    | 확인 사항                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| 빈 화면 또는 로딩 실패                  | 개발자 도구 Network 탭에서 asset 404·JS 오류 확인, HTTP 서버 실행 여부 확인             |
| 소리가 나지 않음                        | 플레이 버튼 클릭(사용자 상호작용) 여부, 브라우저·OS 음소거, 게임 음량 확인              |
| "저장 보호 모드" 표시                   | 손상 또는 미래 버전 데이터다. 필요하면 개발자 도구에서 백업 후 설정에서 초기화          |
| 휴대폰에서 접속 불가                    | 같은 Wi-Fi 연결, PC 방화벽, 터미널의 Network 주소 확인                                  |
| 방향키로 이동되지 않음                  | 게임 화면 클릭으로 포커스 부여, 설정 창·일시정지 상태 확인                              |
| 게임패드가 인식되지 않음                | 연결 후 버튼을 한 번 눌러야 브라우저가 게임패드를 인식한다                              |
| 배포 환경에서 광고·결제가 `unavailable` | CrazyGames Basic Launch, 광고 차단·빈 광고, 미지원 결제 확인([SDK 안내](CRAZYGAMES.md)) |
| `npm run dev`에서 "저장 불가" 표시      | 외부 네트워크 차단으로 SDK 로드 실패. `npm run dev:standalone`으로 실행                 |
| `npm run build`가 중단됨                | 배포 대상 명령(`build:crazygames` 또는 `build:standalone`) 사용                         |
| 문구가 예상과 다른 언어로 표시됨        | 브라우저 언어를 자동 감지한다. `gameConfig.locale`로 특정 언어에 고정 가능              |

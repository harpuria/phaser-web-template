# 개발 안내

## 데모를 내 게임으로 바꾸기

예제(별 모으기)는 사용법을 보여주기 위한 것입니다. 아래 순서로 바꾸면 공통 기능을 그대로 쓰면서 데모를 걷어낼 수 있습니다.

| 순서 | 파일                         | 할 일                                                                                                         |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1    | `src/config/game.ts`         | `title`, `storagePrefix`, 해상도, `pixelArt`, `orientation`, `maxRenderScale`, `startScene`, `pausableScenes` |
| 2    | `package.json`, `index.html` | package 이름, `<title>`·description·`theme-color`, `public/favicon.svg`                                       |
| 3    | `src/game/assets.ts`         | `assetKeys`와 `queueAssets`를 내 asset으로 교체, `public/assets/demo/` 삭제                                   |
| 4    | `src/game/save.ts`           | 저장 schema(처음이면 version 1부터)                                                                           |
| 5    | `src/game/session.ts`        | 저장하지 않는 진행 상태(`Mode`, 점수 등)와 규칙 값                                                            |
| 6    | `src/game/scenes.ts`         | 내 장면으로 교체. 파일을 나눠도 됩니다                                                                        |
| 7    | `src/main.ts`                | `scene` 목록에 내 장면 등록(Boot, Preload는 맨 앞에 유지)                                                     |
| 8    | `src/ui/Shell.ts`            | HTML 메뉴/HUD를 게임에 맞게 교체하거나 삭제(아래 참고)                                                        |
| 9    | `tests/e2e/`                 | 데모 흐름 검사를 내 게임 흐름으로 교체. `tests/unit/`의 공통 검사는 유지                                      |

**Shell을 삭제할 때**: Phaser가 들어갈 `<div id="game">`과 크기를 가진 부모를 `index.html`에 직접 만들고,
전체화면을 쓰면 `main.ts`의 `fullscreenTarget`(기본 `'stage'`)도 그 요소 id로 맞춥니다.
`app.onState`는 상태가 바뀔 때 호출되는 콜백이므로 HUD가 없으면 비워 둬도 됩니다.

## 새 장면 만들기

공통 서비스가 필요한 장면은 생성자로 `App`을 받습니다.

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

장면 전환은 `transition(this, 'Result', this.app.transitionMs)`를 씁니다. 중복 전환을 막고, 움직임 줄이기 설정이면 페이드를 생략합니다.

## 입력

`MoveInput`은 키보드(방향키·WASD), 게임패드(D-pad·왼쪽 스틱), 캔버스를 누른 지점 방향을 하나의 이동 벡터로 합칩니다.
키를 바꾸려면 두 번째 인자로 `MoveBindings`를 넘깁니다. HTML 버튼·슬라이더에 포커스가 있는 동안에는 키보드 입력을 무시합니다.
점프·확인 같은 버튼 입력은 같은 방식으로 `scene.input.keyboard.addKey()`와 `pad1.A` 등을 묶어 추가합니다.

## asset 추가

`src/game/assets.ts`의 `queueAssets`에서 Phaser loader를 사용하고, 키는 `assetKeys`에 모읍니다.
`load.setPath`에 `import.meta.env.BASE_URL`을 붙여 두었으므로 하위 경로 배포에서도 동작합니다.

```ts
load.spritesheet('hero', 'hero.png', { frameWidth: 32, frameHeight: 32 });
load.atlas('ui', 'ui.png', 'ui.json'); // TexturePacker 등에서 만든 atlas
load.bitmapFont('pixel', 'pixel.png', 'pixel.xml');
```

- **렌더 배율(k)**: 고해상도 화면에서는 게임을 k배로 그립니다(아래 '렌더 배율'). 선명하게 보이려면 텍스처도 k배로 준비합니다. SVG는 `queueAssets`처럼 크기에 `k`를 곱해 불러오고, PNG는 @2x 원본을 쓴 뒤 장면에서 `setScale(1 / k)`로 줄입니다. 물리 원/사각형 크기는 텍스처 화소 기준이므로 `setCircle(r * k)`처럼 k를 곱합니다.
- 도트 그래픽이면 `gameConfig.pixelArt`를 `true`로 둡니다. 확대해도 흐려지지 않습니다.
- 웹 글꼴을 Phaser 텍스트에 쓰면 글꼴이 로드되기 전에 그려질 수 있습니다. `document.fonts.load('16px MyFont')`를 기다린 뒤 장면을 시작하거나 bitmap font를 씁니다.
- 필수 asset 하나라도 실패하면 Preload가 다음 장면으로 넘어가지 않고 안내를 띄웁니다.

## 저장 데이터와 migration

`src/game/save.ts`가 저장 schema의 원본입니다. 구조를 바꿀 때는 version을 올리고 이전 버전에서 한 단계씩 변환하는 migration을 추가합니다.
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
    // 키는 "변환 전 버전". 실패하면 throw → 원본은 그대로 보호됩니다.
    1: (old) => {
      if (!isV1(old)) throw new Error('Invalid v1 save');
      return { ...old, coins: 0 };
    },
  },
};
```

schema를 바꿀 때마다 실제 구버전 데이터를 fixture로 넣은 검사를 `tests/unit/`에 추가합니다.

```ts
it('migrates a v1 save', () => {
  const storage = new MemoryStorage();
  storage.setItem('save', '{"version":1,"data":{"best":7,"rounds":3}}');
  const store = new Store(storage, 'save', progressSchema);
  expect(store.status).toBe('ready');
  expect(store.data).toEqual({ best: 7, rounds: 3, coins: 0 });
});
```

게임 코드에서는 이렇게 씁니다.

```ts
this.app.save.update((data) => ({ ...data, best: Math.max(data.best, score) }));
const persisted = this.app.save.flush(); // false면 "저장됨"이라고 표시하지 않습니다
```

- 매 프레임 쓰지 말고 판 종료처럼 중요한 순간에 `flush()`합니다. 나머지는 주기·탭 숨김 때 자동으로 저장됩니다.
- `reset()`은 원본을 지웁니다. 사용자가 확인한 경우에만 호출합니다.
- CrazyGames 환경은 SDK Data에 저장됩니다. 제출 시 Progress Save에서 SDK Data 사용을 켭니다. 설정과 보호 정책은 [CrazyGames 안내](CRAZYGAMES.md)를 봅니다.

## 오디오와 일시정지

- `app.audio?.playMusic(key)` / `sfx(key)` / `stopMusic()`. 음량·음소거 설정은 자동으로 적용됩니다.
- 브라우저 자동재생 제한 때문에 첫 소리는 사용자 클릭·터치 이후에 납니다. 메뉴의 버튼 동작에서 음악을 시작하세요.
- 인벤토리 같은 내 UI로 게임을 멈추려면 `app.pause.set('inventory', true)`, 닫을 때 같은 이유로 `false`를 넘깁니다.
  모든 이유가 풀려야 재개되므로 탭 전환이 수동 일시정지를 풀지 않습니다.
- 조작 가능한 장면 시작 시 `app.setGameplay(true)`, 결과·메뉴·shutdown 시 `app.setGameplay(false)`를 호출합니다. 수동 정지와 광고 중단은 App이 반영합니다.

## 화면 크기와 전체화면

Phaser `Scale.EXPAND`를 씁니다. `gameConfig`의 `width`×`height`(기본 960×540)가 **안전 영역**이고, 화면 비율이 다르면 게임 크기가 늘어나 남는 공간이 보입니다.

- 장면 `create()`에서 `centerSafeArea(this, gameConfig.width, gameConfig.height)`를 호출하면 안전 영역이 화면 중앙에 옵니다(예제는 `background()` 안에서 호출).
- 점수·버튼·플레이 영역처럼 꼭 보여야 하는 것은 안전 영역 좌표(0..width, 0..height) 안에 둡니다. 배경은 바깥까지 넉넉히 그립니다.
- 화면을 덮는 반투명 판 등은 안전 영역보다 크게 그립니다(예제의 결과 화면은 3배 크기).

HTML 배치(`Shell`, `style.css`)는 화면에 따라 이렇게 바뀝니다.

| 화면                                    | 배치                                                               |
| --------------------------------------- | ------------------------------------------------------------------ |
| 폭 1025px 이상                          | 게임 + 오른쪽 사이드바                                             |
| 폭 1024px 이하                          | 사이드바를 게임 아래로                                             |
| 가로이면서 높이 500px 이하(휴대폰 가로) | 헤더·소개 숨김, 게임이 화면 높이를 모두 쓰고 버튼은 오른쪽 세로 줄 |
| 터치 기기에서 권장 방향이 아닐 때       | 버튼 줄에 "기기를 가로로 돌리면 더 크게…" 안내                     |

- 게임 카드(제목 줄 + 캔버스 + 버튼 줄)는 화면 높이를 넘지 않게 줄어들고(`--stage-chrome`), 플레이를 시작하면 카드 전체가 보이도록 스크롤합니다.
- 세로 게임은 `width: 540, height: 960, orientation: 'portrait'`로 바꿉니다. 안내 문구와 전체화면 회전 안내도 이 값을 따릅니다.
- 전체화면 버튼은 지원 브라우저에서만 보입니다(iPhone Safari는 미지원). 전체화면에서는 게임이 화면 전체로 늘어나고, 권장 방향이 아니면 회전 안내가 뜹니다.

### 렌더 배율

고해상도(레티나·휴대폰) 화면에서 흐려지지 않도록, 게임은 `안전 영역 × k` 화소로 그리고 카메라를 k배 zoom합니다. 장면 좌표는 그대로 960×540 단위입니다.

- k는 시작할 때 한 번 정합니다: `devicePixelRatio × 화면에 안전 영역이 들어가는 배율`을 0.25 단위로 반올림, 1 이상 `gameConfig.maxRenderScale` 이하(`src/core/renderScale.ts`).
- 기본 상한은 PC 2, 터치 기기 1.5입니다. GPU가 칠하는 화소는 k의 제곱(1.5면 2.25배, 2면 4배)으로 늘어납니다.
- `centerSafeArea`를 부른 장면에서는 이후 추가되는 Text가 자동으로 k배 해상도로 그려집니다. Graphics(선·도형)는 원래 선명합니다.
- 저가 휴대폰에서 프레임이 떨어지면 `maxRenderScale.mobile`을 1.25나 1로 낮춥니다. 개발 서버에서 `?debug`를 붙이면 게임 화면 왼쪽 위에 `render ×k · fps`가 표시됩니다. 같은 Wi-Fi의 휴대폰에서 Network 주소에 `?debug`를 붙여 확인하세요.
- k는 전체화면 크기를 기준으로 정하므로, 페이지 안의 작은 게임 화면에서는 실제 표시보다 크게 그리기도 합니다(예: PC 1920×1080에서 k=2, 표시 폭 약 1062px).

## 디버그와 오류

- 개발 서버 주소에 `?debug`를 붙이면 Arcade 물리 충돌 영역과 렌더 배율·FPS가 보입니다. 배포 빌드에서는 무시됩니다.
- `?round=5`처럼 붙이면 예제 한 판을 5초로 줄입니다(E2E에서 사용). 실제 게임의 조정값이 보상·랭킹에 영향을 준다면 `import.meta.env.DEV`일 때만 읽도록 합니다.
- 처리되지 않은 오류와 Promise 거부는 게임 화면 위에 안내와 새로고침 버튼으로 표시됩니다. 콘솔 출력은 그대로 남습니다.

## 검증

| 명령                             | 내용                                                      |
| -------------------------------- | --------------------------------------------------------- |
| `npm run check`                  | 린트, 포맷, 단위 검사, 타입 검사, 배포 빌드               |
| `npm run test:e2e`               | 개발 서버에서 Chromium desktop / Pixel 7 크기로 실제 조작 |
| `E2E_PREVIEW=1 npm run test:e2e` | 이미 빌드한 `dist/`를 검사. `npm run build` 후 실행       |

검사 서버는 4173 포트를 씁니다. CI는 두 E2E 모드를 모두 실행하고 실패 시 trace/screenshot을 보관합니다.
Safari/Firefox/실기기는 따로 확인해야 합니다. 모바일 에뮬레이션은 실기기 검증이 아닙니다.

## 정적 배포

```bash
npm ci
npm run check   # 배포 빌드까지 생성
npm run preview # 올리기 전에 dist 확인
```

- `dist/` 내용 전체(음원 포함)를 정적 서버에 올립니다. `base: './'`이므로 `/my-game/` 같은 하위 경로, itch.io(zip 업로드)도 됩니다.
- CrazyGames 제출은 [SDK·제출 안내](CRAZYGAMES.md)를 따릅니다. Basic Launch가 기본이며 Full Launch 승인 후 광고를 켭니다.
- 라우터가 없어 SPA rewrite 설정은 필요 없습니다. `index.html`을 파일로 직접 열지 말고 HTTP 서버로 엽니다.
- 해시가 붙은 JS/CSS는 장기 캐시해도 됩니다. `index.html`과 고정 이름 음원은 업데이트 때 캐시를 갱신합니다.
- 환경 변수는 `.env.example`을 참고합니다. `VITE_*` 값은 번들에 공개되므로 비밀키를 넣지 않습니다.

## 문제 해결

| 증상                           | 확인                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| 빈 화면/로딩 실패              | 개발자 도구 Network에서 asset 404, JS 오류 확인. HTTP 서버로 실행                          |
| 소리 없음                      | 플레이 버튼을 눌렀는지, 브라우저/OS 음소거, 게임 볼륨 확인                                 |
| "저장 보호 모드" 표시          | 손상·미래 버전 데이터. 필요하면 개발자 도구에서 백업한 뒤 설정에서 초기화                  |
| 폰에서 접속 불가               | 같은 Wi-Fi인지, PC 방화벽, Network 주소 확인                                               |
| 방향키로 이동 안 됨            | 게임 화면을 눌러 포커스. 설정 창/일시정지 상태 확인                                        |
| 게임패드 인식 안 됨            | 연결 후 버튼을 한 번 눌러야 브라우저가 패드를 알려 줍니다                                  |
| 배포에서 광고/결제 unavailable | CrazyGames Basic Launch·광고 차단/빈 광고·미지원 결제 확인. [SDK 안내](CRAZYGAMES.md) 참고 |

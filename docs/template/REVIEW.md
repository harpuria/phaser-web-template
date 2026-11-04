# 템플릿 점검

## 전체 점검 — 2026-11-04

검토 기준: `9109767`의 소스·문서·테스트와 배포 빌드 실행. 범위는 의존성 최신화, AI 에이전트의 착수 용이성, 단독·CrazyGames 배포, 그 외 개선점입니다.
같은 날 1~12번을 모두 반영해 0.4.0으로 배포했습니다. 아래 본문은 반영 전 근거이고, 반영 내용은 이 표와 [변경 기록](CHANGELOG.md), 검사 결과는 [검증 기록](VALIDATION.md)에 있습니다.

| 항목                | 반영                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. embed 배치       | `gameConfig.layout`(auto: iframe이면 embed), `?layout=`, `embed.spec.ts`의 iframe 4개 크기 검사       |
| 2. 외부 오류        | `isForeignError`/`isForeignRejection`, 단위 검사와 `contract.spec.ts`의 외부 스크립트 오류 검사       |
| 3. 언어             | `src/game/strings.ts`(ko/en), `gameConfig.locale`, `core/locale.ts`, `PlatformContext.warning` 코드화 |
| 4. 기본 대상        | `npm run build`는 대상이 없으면 중단, `check`는 두 대상 빌드, AGENTS.md에 `dev:standalone` 안내       |
| 5. 방향 잠금        | `releaseOrientationOnExit`, iframe 전체화면 허용 여부 확인. 실기기 재확인은 남음                      |
| 6. 버전             | 0.4.0, `package.json` 단일 원본, footer `Phaser.VERSION`. git tag는 병합 후 생성                      |
| 7. 의존성           | patch/minor 갱신, `@types/node` 24, TS 7 보류 기록, Dependabot, Node 22.12 CI                         |
| 8. 끝난 계획 문서   | `docs/IMPLEMENTATION_PLAN.md` 삭제                                                                    |
| 9. 게임 문서        | `docs/game/README.md` 양식, AGENTS.md에서 연결                                                        |
| 10. Shell 계약 분리 | `src/ui/system.ts`(`data-game-control`, `data-recovery`)                                              |
| 11. E2E 문구 의존   | `tests/e2e/ui.ts`(id), `data-state`·`data-kind`·`aria-pressed`, contract/demo 분리                    |
| 12. AGENTS.md       | 시작 명령, 네트워크 제한 환경, 실행한 Playwright project 보고                                         |

### 요약

| 우선순위 | 항목                                                                           | 영역       |
| -------- | ------------------------------------------------------------------------------ | ---------- |
| P1       | 1. CrazyGames 빌드가 웹사이트형 페이지(스크롤·사이드바·소개 문구)로 출력됨     | CrazyGames |
| P1       | 2. 다른 origin 스크립트 오류 하나로 게임이 치명 정지함                         | 공통·배포  |
| P2       | 3. UI 문구가 한국어로 고정되어 있고 문자열 테이블이 없음                       | CrazyGames |
| P2       | 4. 기본 `dev`/`build`가 CrazyGames 대상이라 자체 호스팅·오프라인에서 저장 불가 | 배포·AI    |
| P2       | 5. 전체화면 종료 시 방향 잠금을 풀지 않음                                      | 모바일     |
| P2       | 6. 0.3.0 이후 미배포 변경 3묶음, 버전 문자열을 다섯 곳에 하드코딩              | 출처 기록  |
| P2       | 7. 의존성 patch 7건 밀림, `@types/node` major가 실행 Node와 다름               | 의존성     |
| P3       | 8~12. AI 착수용 문서·구조 정리                                                 | AI 착수    |

### 1. P1 · CrazyGames 빌드가 iframe을 채우는 게임 화면이 아님

`npm run build:crazygames` 결과는 개발용 데모 페이지와 같습니다. 헤더 링크(`href="./"`), 소개 문구, 기록 사이드바, Service playground, footer가 모두 포함됩니다.
배포 빌드를 CrazyGames 데스크톱 iframe과 비슷한 1040×585로 열면 문서 높이가 1157px라서 페이지가 스크롤됩니다. 캔버스는 702×395이고 `플레이 시작` 버튼이 첫 화면 밖에 있습니다.
844×390 휴대폰 가로에서도 문서 높이가 1048px입니다. 휴대폰 가로 배치 덕분에 캔버스와 버튼은 첫 화면에 들어오지만 아래로 스크롤됩니다.

플랫폼 iframe에서는 게임이 iframe 전체를 채우고 스크롤·외부 링크·템플릿 브랜드가 없어야 합니다.
이 세션에서는 `docs.crazygames.com`에 접근할 수 없어 최신 요구사항 원문을 다시 확인하지 못했습니다. 반영 전에 [기술 요구사항](https://docs.crazygames.com/requirements/technical/)과 품질 요구사항을 확인합니다.

권장:

- `gameConfig.layout: 'page' | 'embed'`을 추가합니다. CrazyGames 빌드의 기본은 `embed`, 데모 개발 서버는 `page`로 둡니다.
- `embed`에서는 `#stage`가 `100vw × 100dvh`를 채우고 `body`가 스크롤되지 않게 합니다. 기록·설정·일시정지는 캔버스 위 오버레이나 Phaser UI로 표시합니다. 헤더·소개·사이드바·playground·footer는 렌더링하지 않습니다.
- 데모 브랜드 문구(`PHASER / WEB TEMPLATE`, `v0.3.0 READY TO BUILD`, `STAR COLLECTOR`)는 `page` 레이아웃에만 둡니다.
- 기존 반응형 E2E에 `embed` 검사를 추가합니다. 1040×585·1280×720·844×390·390×844에서 `scrollHeight <= innerHeight`이고, 캔버스가 viewport를 채우며 주요 버튼이 첫 화면에 있는지 확인합니다.
- 플랫폼에 자체 전체화면 버튼이 있다면 iframe 안의 전체화면 버튼을 유지할지 요구사항을 확인한 뒤 정합니다.

### 2. P1 · 외부 스크립트 오류가 치명 오류로 처리됨

[`watchUncaughtErrors`](../../src/core/errors.ts)는 `window`의 모든 `error`와 `unhandledrejection`을 `app.fail()`로 보냅니다.
배포 빌드에서 플레이를 시작한 뒤 다른 origin 스크립트가 `throw`하도록 재현했습니다. 결과는 `PAUSED`이고 오류 화면에 `Script error.`가 표시되었으며, 새로고침 전까지 게임이 멈췄습니다.

CrazyGames 페이지에서는 SDK·광고 스크립트가 같은 문서에서 실행됩니다. 일반 웹에서는 브라우저 확장도 같은 문서에서 실행됩니다. 이런 스크립트 한 곳의 오류가 게임을 멈추고, 플랫폼 QA에서 결함으로 보일 수 있습니다.

권장:

- `ErrorEvent.error`가 없고 `message === 'Script error.'`이거나 `filename`이 현재 origin이 아니면, `console.warn`만 남기고 치명 오류로 처리하지 않습니다.
- `unhandledrejection`은 출처를 판단하기 어렵습니다. 정책을 문서화한 뒤 `Error`가 아닌 reason이나 stack에 현재 origin이 없는 reason은 경고로 낮추는 방안을 검토합니다.
- 단위 검사(`tests/unit/fatal-error.test.ts`)와 E2E에 다른 origin 오류의 경우를 추가합니다. 자체 코드 오류의 기존 정지·저장 차단 동작은 유지합니다.

### 3. P2 · UI 언어가 한국어로 고정됨

`index.html`이 `lang="ko"`이고, Shell·Preload·예제 장면·오류 안내 문구가 모두 한국어 리터럴입니다.
CrazyGames의 이용자는 전 세계에 있으므로 파생 게임은 보통 영어 UI가 필요합니다. 지금 구조에서는 AI가 문구를 여러 파일에서 하나씩 찾아 바꿔야 합니다.

권장: `src/game/strings.ts`(또는 `src/config/strings.ts`)에 `ko`/`en` 문자열 테이블을 두고 `gameConfig.locale`로 선택합니다. 공통 코드(`core/`, `services/`)의 사용자 문구(예: `bootstrap.ts`의 저장 불가 안내)는 `app.ts`에서 주입합니다.
E2E는 문구 대신 `data-testid`나 역할·id로 요소를 찾습니다(11번과 같이 진행).

### 4. P2 · 기본 대상이 CrazyGames라서 생기는 실수

`npm run dev`와 `npm run build`의 기본 대상은 CrazyGames입니다.

- 자체 호스팅을 하려다 `npm run build`를 쓰면 SDK를 외부에서 불러옵니다. 다른 도메인에서는 SDK가 `disabled`를 반환해 브라우저 저장을 쓰지만, 광고 차단기나 네트워크 정책으로 `sdk.crazygames.com`이 막히면 로드 실패로 처리됩니다. 이 경우 저장할 수 없는 상태로 플레이하게 됩니다.
- 이번 점검 환경처럼 외부 host를 막은 AI 작업 환경에서도 `npm run dev`의 SDK 요청이 거절되어 저장 불가 상태가 됩니다. E2E는 SDK를 대역으로 바꾸므로 이 문제를 드러내지 않습니다.

권장: 둘 중 하나를 선택합니다.

- `build`는 대상을 명시해야만 실행되게 합니다(`VITE_PLATFORM`이나 전용 명령이 없으면 중단).
- 기본값은 유지하되 `AGENTS.md`와 README 첫 실행 안내에 "네트워크가 제한된 환경과 자체 호스팅은 `dev:standalone` / `build:standalone`"을 명시합니다.

### 5. P2 · 전체화면 종료 시 방향 잠금 해제

[`toggleFullscreen`](../../src/core/screen.ts)은 전체화면에 들어갈 때 `screen.orientation.lock()`을 호출하지만 나갈 때 `unlock()`을 호출하지 않습니다. 2026-10-29 Android 실기기 기록에서 이미 확인 필요로 남긴 항목이며 아직 반영되지 않았습니다.
권장: Phaser `LEAVE_FULLSCREEN` 이벤트(또는 `fullscreenchange`)에서 `screen.orientation.unlock?.()`을 호출하고 HMR 정리 때 listener를 해제합니다. 자동 회전을 켠 실기기에서 다시 확인합니다.

### 6. P2 · 템플릿 버전과 출처 기록

- [변경 기록](CHANGELOG.md)에서 0.3.0 이후 CrazyGames SDK·플랫폼별 빌드·오류 정지·저장 재시도 등 세 묶음이 `미배포`로 남아 있습니다. [적용 절차](APPLYING.md)는 템플릿 버전을 기록하라고 하지만, 지금은 같은 0.3.0이 서로 다른 두 코드를 가리킵니다. 0.4.0으로 배포하고 git tag를 만듭니다.
- 버전 문자열이 `package.json`, `src/config/game.ts`, `README.md`, `docs/template/APPLYING.md`에 따로 있고, Phaser 버전은 Shell footer에 `PHASER 4.2.1`로 하드코딩되어 있습니다. `gameConfig.version`은 Vite `define`으로 `package.json`의 값을 주입하고, footer에는 `Phaser.VERSION`을 씁니다.

### 7. P2 · 의존성 최신 여부

확인일 2026-11-04, npm registry 기준.

| 패키지            | 현재    | 최신    | 판단                                                                     |
| ----------------- | ------- | ------- | ------------------------------------------------------------------------ |
| phaser            | 4.2.1   | 4.2.1   | 최신 안정판. GitHub Releases도 4.2.1이 Latest. 4.3.0은 master에서 미배포 |
| vite              | 8.3.2   | 8.3.5   | patch 갱신                                                               |
| vitest            | 5.0.3   | 5.1.0   | minor 갱신(peer: vite 6~8)                                               |
| eslint            | 10.12.0 | 10.14.0 | minor 갱신                                                               |
| typescript-eslint | 8.71.0  | 8.72.1  | patch 갱신                                                               |
| prettier          | 3.9.9   | 3.9.10  | patch 갱신                                                               |
| @playwright/test  | 1.63.0  | 1.64.1  | minor 갱신. 브라우저 버전이 바뀌므로 세 엔진 E2E 재실행                  |
| @types/node       | 26.6.4  | 26.6.6  | 실행 Node(`.nvmrc` 24, 최소 22.12)에 맞춰 `24.x`로 내리는 것을 권장      |
| typescript        | 6.0.3   | 7.0.2   | **보류가 맞음.** typescript-eslint 8.72.1의 peer가 `<6.1.0`              |

- `npm audit --omit=dev`는 0건입니다. 전체 `npm audit`은 eslint·typescript-eslint가 쓰는 `minimatch@10.2.6`의 moderate 1건(GHSA-g3hv-75wg-m249)을 보고합니다. 개발 도구에만 해당하며, 상위 패키지가 `minimatch@11`을 허용하면 해소됩니다.
- TypeScript 7을 보류한 근거를 [의존성](../DEPENDENCIES.md)에 기록합니다.
- 최신화를 사람이 기억해야 하는 구조입니다. `.github/dependabot.yml`에서 npm·GitHub Actions를 월 1회로 묶어 PR을 받고, CI가 그대로 검증하게 합니다.
- CI는 `.nvmrc`의 Node 24만 검사합니다. `engines`의 최소 버전인 22.12를 보장하려면 Node 22로도 `npm run check`를 실행합니다.
- CrazyGames SDK v3 CDN은 이 세션에서 `sdk.crazygames.com`에 접근할 수 없어 2026-10-21 기록(3.8.0) 이후 다시 확인하지 못했습니다. 네트워크가 허용된 환경에서 `npm run test:sdk`나 CI `sdk_smoke`로 다시 확인합니다.

### 8~12. P3 · AI가 바로 착수하기 위한 정리

`AGENTS.md`(→ `CLAUDE.md`)가 짧고 규칙이 명확합니다. 구조 계약, 교체 체크리스트, 장면·migration 예제, ESLint 경계 검사가 있어 AI가 안전하게 변경할 기반은 충분합니다. 다음은 착수 속도를 높이기 위한 항목입니다.

8. `docs/IMPLEMENTATION_PLAN.md`는 끝난 템플릿 작업 기록인데 `docs/` 루트에 있고 어디에서도 링크되지 않습니다. 파생 게임에서는 AI가 이를 게임의 구현 계획으로 오인할 수 있습니다. `docs/template/`로 옮기거나 CHANGELOG에 합칩니다.
9. 파생 게임이 기획 문서를 둘 자리가 없습니다. `docs/game/README.md`(GDD·MVP 범위·저장 항목·플랫폼 대상을 적는 빈 양식)를 두고, `AGENTS.md`에서 "게임 기능 작업 전 먼저 읽기"로 연결합니다.
10. [Shell](../../src/ui/Shell.ts)은 300줄짜리 HTML 문자열 하나에 데모 HUD와 템플릿 계약(오류 시 조작 차단·설정창 닫기, 광고 중 UI 비활성화, 일시정지·회전 오버레이)을 함께 담고 있습니다. Shell을 교체하는 AI가 계약을 빠뜨리기 쉽습니다. 계약 부분을 `src/ui/system.ts` 같은 재사용 모듈로 분리하고, 데모 HUD만 교체 대상으로 둡니다. 1번의 `embed` 레이아웃도 이 분리 위에서 만드는 것이 수월합니다.
11. E2E가 데모의 한국어 문구(`플레이 시작`, `보상형 광고 테스트` 등)와 별 모으기 규칙에 의존합니다. 데모를 교체하면 템플릿 계약 검사(오류 정지, 저장 보호, SDK 이벤트 순서, standalone SDK 미요청)까지 같이 깨집니다. 계약 검사는 `data-testid`로 찾게 하고, 데모 흐름 검사와 파일을 분리합니다.
12. `AGENTS.md`에 첫 실행 명령(`npm ci`, 네트워크 제한 시 `dev:standalone`)과, Playwright가 Firefox·WebKit 브라우저를 설치하지 못한 환경에서 실행한 project를 구분해 보고하라는 안내를 추가합니다.

### 이번 점검에서 실행한 검사

| 검사                                      | 결과                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run check` (Linux x64, Node 22.23.4) | ESLint, Prettier, 단위 67개, TypeScript, Vite build 통과. Phaser chunk 1,374 kB(gzip 357 kB) |
| `npm outdated`, `npm view`, `npm audit`   | 위 7번 표                                                                                    |
| 배포 빌드 화면 크기 측정 (Chromium)       | 1040×585: 문서 1157px·캔버스 702×395, 844×390: 문서 1048px·캔버스 643×390                    |
| 다른 origin 스크립트 오류 재현 (Chromium) | 플레이 중 `Script error.` 치명 정지                                                          |
| E2E (Chromium desktop·Pixel 7만)          | 개발 38개 통과·8개 skip, `E2E_PREVIEW=1` 38개 통과·8개 skip, standalone 2개 통과             |

미검증: Firefox·WebKit E2E(이 환경에 브라우저 없음), `npm run test:sdk`와 CrazyGames 최신 요구사항(이 환경에서 `sdk.crazygames.com`, `docs.crazygames.com` 접근 거절), 실기기·CrazyGames Preview.

## 이전 점검 — 2026-10-21 (반영 완료)

검토 기준: `9090531`의 소스·문서·테스트와 배포 빌드 실행. SDK 확인 및 검사 결과는 [의존성](../DEPENDENCIES.md)과 [검증 기록](VALIDATION.md)에 기록합니다.
1~3번은 2026-10-21에 반영했습니다. 아래에는 수정 전 근거와 반영 내용을 함께 남깁니다.
2026-10-29 업데이트: 4번의 Firefox·WebKit 자동 검사를 추가했습니다. 실제 모바일 기기 검증은 남아 있습니다. 추가 개선 내용은 [변경 기록](CHANGELOG.md)을 봅니다.

### 1. P1 · 치명적 오류가 발생하면 게임 진행도 멈추기

**수정 전 브라우저에서 재현한 결함입니다.** 기존 [오류 callback](../../src/main.ts)은 `fatalError`와 안내 화면만 갱신했고, [Shell](../../src/ui/Shell.ts)의 버튼 비활성화 조건도 준비 상태와 광고 요청만 확인했습니다.

수정 전 배포 빌드에서 `/?round=2`로 플레이를 시작한 뒤 아래 오류를 발생시키면, 오류 화면이 떠 있는 동안 `PLAYING`이 `RESULT`로 바뀌고 플레이 횟수 1이 실제 localStorage에 저장됐습니다.

```js
setTimeout(() => {
  throw new Error('review fatal error');
}, 0);
```

반영: `app.fail(message)`가 첫 오류와 `fatal` pause reason을 유지합니다. 게임·오디오·SDK gameplay·입력을 멈추고 `App.flush()`의 후속 쓰기를 차단합니다. Shell은 열린 설정창을 닫고 복구 외 조작을 막습니다.
검사: 플레이 중 예외·Promise 거부 후 원래 판 길이가 지나도 판 종료·저장이 발생하지 않고 새로고침으로 복구되는 E2E를 추가했습니다. 단위 검사에서 광고 완료·탭 복귀·수동 정지 해제가 오류 정지를 풀지 않고 destroy 시에도 저장하지 않는지 확인합니다.

### 2. P2 · 배포 대상별 플랫폼 설정을 명시하기

기존 [기본 설정](../../src/config/game.ts)은 CrazyGames를 항상 켰습니다. [bootstrap](../../src/services/bootstrap.ts)은 SDK가 `disabled`를 반환하면 localStorage를 선택하지만, 로드·초기화가 실패하면 저장을 보호하기 위해 쓰기를 차단합니다. SDK 준비 대기는 최대 10초입니다.

따라서 자체 호스팅용 게임에서 SDK 설정을 그대로 두면 CrazyGames CDN 장애나 차단이 로딩 지연과 저장 불가로 이어집니다. 문서에 있는 수동 비활성화를 배포 설정으로 명시하면 실수를 줄일 수 있습니다.

반영: `VITE_PLATFORM`과 `dev:standalone` / `build:standalone`, `dev:crazygames` / `build:crazygames` 명령을 추가했습니다. 기존 기본값은 CrazyGames이며, 잘못된 값과 명시 mode 충돌은 시작·빌드 때 거절합니다. CrazyGames 모드의 초기화 실패 후 원본 보호 정책을 유지합니다.
검사: `test:e2e:standalone`이 자체 호스팅용 배포 빌드의 SDK 미요청·로컬 저장·새로고침 복원을 확인합니다. 대상 검증 단위 검사와 잘못된 값·mode 충돌의 실제 빌드 거절도 확인합니다.

### 3. P2 · 실제 CDN SDK를 확인하는 반복 가능한 검사 추가

현재 [SDK E2E](../../tests/e2e/crazygames.spec.ts)와 [공통 fixture](../../tests/e2e/platform-fixtures.ts)는 SDK 스크립트 요청을 테스트 대역으로 바꿉니다. 경계 계약은 검사하지만, 같은 v3 URL에서 공급자가 배포한 SDK 변경을 직접 검사하지는 않습니다.

공식 CDN을 그대로 사용하는 [검사](../../tests/sdk/crazygames-live.spec.ts)를 `npm run test:sdk`로 반복 실행할 수 있도록 추가했습니다. 일반 검사와 별도 디렉터리에 빌드·기록하므로 기존 `dist/`와 검사 결과를 덮어쓰지 않습니다.

반영: SDK 실행 버전·응답 식별값·파일 SHA-256·콘솔 오류·단계별 결과를 JSON으로 남깁니다. GitHub Actions 수동 실행의 `sdk_smoke`로도 선택할 수 있습니다.
검사: 공식 **3.8.0**의 초기화, 사용자 설정 변경 후에도 유지되는 SDK 음소거, rewarded/midgame 콜백·조작 복구, gameplay 이벤트, Data 새로고침 복원을 확인합니다. 실제 광고 송출·계정 동기화는 CrazyGames Preview에서 별도로 확인합니다.

### 4. P2 · 브라우저와 실제 모바일 기기 검증 확대

점검 당시 [Playwright 설정](../../playwright.config.ts)의 desktop과 Pixel 7은 모두 Chromium이었습니다. 당시에는 반응형 화면·합성 터치를 확인했으며 Safari/Firefox 및 실제 휴대폰의 오디오·전체화면·회전·GPU 동작은 미검증이었습니다.

당시 권장: [Playwright의 브라우저별 project](https://playwright.dev/docs/test-projects)에 따라 WebKit·Firefox에서 시작·플레이·설정·저장 복원 공통 흐름을 먼저 검사합니다. 모바일 이동 검사의 Chromium CDP 사용 부분은 공통 흐름과 분리하고, iPhone/Android에서 터치·오디오 재개·회전·전체화면·장시간 플레이를 직접 확인합니다.
완료 기준: 브라우저별 자동 검사 결과와 실제 기기 확인 결과를 구분해서 기록합니다. WebKit 자동 검사와 iPhone 실기기 검증을 동일하게 취급하지 않습니다.

### 권장하는 다음 작업

4번의 공통 흐름 자동 검사는 반영했습니다. 실제 모바일 기기에서는 [개발 안내의 검증 목록](../DEVELOPMENT.md#검증)을 따라 터치·회전·전체화면·오디오 재개·장시간 플레이를 확인합니다.

요청 예시: “game-implement로 실제 iPhone/Android에서 터치·회전·오디오·전체화면·장시간 플레이를 확인하고 기기별 결과를 기록해 줘.”

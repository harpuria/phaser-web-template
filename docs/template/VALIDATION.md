# 검증 기록

## 저장 재시도·전체화면 조작·설정 즉시 적용·브라우저 확대 — 2026-10-28~29 · macOS arm64 · Node 24.16.0

| 검사                             | 결과                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run check`                  | ESLint, Prettier, 단위 67개, TypeScript, Vite build 통과                                                |
| `npm run test:e2e`               | Chromium desktop / Pixel 7, Firefox, WebKit: 70개 통과, 8개 의도적 skip                                 |
| `E2E_PREVIEW=1 npm run test:e2e` | 전용 CrazyGames 빌드 생성 후 같은 구성: 70개 통과, 8개 의도적 skip                                      |
| `npm run test:e2e:standalone`    | Chromium desktop / Pixel 7: 2개 통과                                                                    |
| 휴대폰 가로 전체화면 추가 확인   | 배포 빌드·Pixel 7 에뮬레이션·844×390: 캔버스/버튼이 화면 안에 배치, 일시정지·재개·재시작, pageerror 0건 |

- 브라우저: Playwright 1.63.0의 Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6. Pixel 7은 Chromium 화면·합성 touch 에뮬레이션이며 실제 기기가 아닙니다. 8개 skip은 모바일에서 중복되는 반응형 7개와 키보드 Escape 1개입니다. 추가 Firefox/WebKit 프로젝트에서는 Chromium 반응형 전용 spec을 제외하고 공통·SDK 경계 흐름을 실행합니다.
- 저장 재시도: 변경 전 회귀 검사가 실패하는 것을 확인했습니다. 변경 후 일시 쓰기 실패가 반복되어도 기존 원본과 최신 메모리 값을 유지하고, 복구 후 최신 값을 저장합니다. 초기 읽기 실패·손상·미래 버전은 계속 원본 쓰기를 차단합니다. 브라우저에서는 재시도 버튼과 새로고침 후 진행 복원도 확인했습니다.
- 전체화면: 변경 전 조작 버튼이 fullscreen element 밖에 있는 회귀 검사 실패를 확인했습니다. 변경 후 전체화면 안에서 시작·일시정지·재개·판 종료·재시작·메뉴·나가기를 검사했습니다. desktop/WebKit 전체화면 결과, 모바일 세로 회전 안내와 버튼, 휴대폰 가로 일시정지 screenshot을 육안으로 확인했습니다.
- 움직임 줄이기: 변경 전 옵션을 켜도 메뉴 캔버스가 계속 변하는 실패를 확인했습니다. 변경 후 일정 시간 간격의 동일 캔버스 screenshot 비교로 정지·해제·설정 초기화 후 재개를 확인했으며 CSS 전환도 0초로 바뀝니다.
- 의존성 경계: 실제 ESLint API로 core/services의 정적 import·타입 import·re-export·동적 import가 거절되고, App 조립과 공통 모듈 간 import는 허용되는지 검사합니다.
- 확대 검사에서 SDK 이벤트 assertion이 preload 완료보다 먼저 실행되는 문제를 발견했습니다. 플레이 시작 버튼이 활성화된 뒤 이벤트를 확인하도록 수정한 후 세 엔진 모두 통과했습니다.
- 일반 개발/배포 결과는 `test-results/e2e/dev/`, `test-results/e2e/preview/`로 분리됩니다. 배포 검사는 `test-results/builds/e2e/`에 빌드하고 기존 `dist/`와 서버를 재사용하지 않습니다. 추가 가로 화면 screenshot은 `test-results/fullscreen-landscape-paused.png`입니다.
- 미검증: 실제 iPhone·실제 Safari·GPU 성능·청음·장시간 플레이, CrazyGames Preview/실환경 광고·계정 동기화, 원격 GitHub Actions 실행. Android 실기기는 아래 별도 기록을 참고합니다. 공식 CDN smoke는 이번 변경에서 재실행하지 않았으며 SDK 대역 검사와 구분합니다. 실제 기기 확인 목록은 [개발 안내](../DEVELOPMENT.md#검증)에 있습니다.

## Android 실기기 확인 — 2026-10-29 · Samsung SM-F966N · Android 17

| 항목               | 결과                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome 터치 실행   | 메뉴·플레이·결과 화면 확인. 디버그 표시에서 렌더 배율 ×1.5, 순간 FPS 약 60                                                                                                                                                |
| 실제 전체화면      | 세로에서 전체화면 진입 시 가로 전환. 전체화면 안에서 일시정지·재개·재시작·나가기 동작 확인                                                                                                                                |
| 저장 복원          | 두 판 진행 후 Chrome 새로고침. `LOCAL SAVE`, 최고 기록 4, 플레이 횟수 2 유지                                                                                                                                              |
| 전체화면 종료 방향 | Chrome 도구모음은 돌아왔으나 페이지와 기기는 가로 방향을 유지함. 종료 시 자동 회전은 꺼져 있었고(`accelerometer_rotation=0`, `user_rotation=1`), 테스트 시작 전 설정값은 기록하지 않아 OS 설정과 API 동작을 분리하지 못함 |

- 기기 해상도는 세로 1080×2520, 가로 2520×1080입니다. 개발 서버를 같은 LAN의 HTTP로 열어 검사했으며 Chrome에 보안 연결이 아님이 표시됩니다. HTTPS 배포 환경에서의 실기기 동작은 별도 확인이 필요합니다.
- 전체화면 코드는 진입 시 `screen.orientation.lock()`을 호출하지만 나갈 때 명시적으로 `unlock()`을 호출하지 않습니다. 자동 회전을 켠 상태에서 방향 복귀를 다시 확인하고, 필요하면 종료 처리에서 잠금을 해제해야 합니다.
- 화면과 Android 접근성 UI로 동작을 확인했습니다. Chrome 콘솔/JS 오류 로그와 실제 음량 청음은 수집하지 않았으므로 오류 0건·소리 정상으로 판단하지 않습니다.

## 오류 정지·플랫폼별 빌드·공식 SDK 검사 — 2026-10-21 · macOS arm64 · Node 24.16.0

| 검사                                            | 결과                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `npm run check`                                 | ESLint, Prettier, 단위 62개, TypeScript, Vite build 통과        |
| `npm run test:e2e -- --workers=1`               | desktop + Pixel 7: 32개 통과, 8개 의도적 skip                   |
| `E2E_PREVIEW=1 npm run test:e2e -- --workers=1` | 같은 구성으로 32개 통과, 8개 의도적 skip                        |
| `npm run test:e2e:standalone`                   | 자체 호스팅용 배포 빌드: desktop + Pixel 7 2개 통과             |
| `npm run test:sdk`                              | 공식 CDN SDK 3.8.0 local: 1개 통과, pageerror·console error 0건 |
| 잘못된 플랫폼 값·명시 mode 충돌                 | 각각 실제 Vite build가 설정 로드 단계에서 거절하는 것 확인      |
| CI 설정                                         | YAML 구문 검사 통과. 원격 GitHub Actions 실행은 미확인          |

- 오류 E2E는 수정 전 `PAUSED` 대신 `PLAYING` → `RESULT`가 되는 것을 확인해 실패시켰습니다. 수정 후 예외·Promise 거부 각각에 대해 원래 판 길이 이후에도 정지·SDK gameplayStop·저장 미발생을 확인하고 새로고침으로 복구했습니다. 열린 설정창의 오류 복구와 광고 완료·탭 복귀 후 오류 정지 유지도 검사했습니다.
- standalone은 실제 배포 빌드에서 SDK 요청을 차단하는 감시를 설치한 상태로 실행했습니다. SDK 요청 0건, 브라우저 로컬 저장·새로고침 복원, production 광고 unavailable을 확인했습니다.
- 공식 SDK 검사는 다운로드를 대체하지 않았습니다. 초기화 버전 3.8.0, SDK 음소거가 사용자 설정·설정창 닫기 이후에도 실제 Web Audio master gain에 우선 적용되는 것, rewarded/midgame 각각의 시작·완료 callback, 조작 복구, gameplay 이벤트 쌍, Data 새로고침 복원을 확인했습니다.
- 공식 SDK 결과는 `test-results/sdk/report.json`과 하위 artifact의 `sdk-observation.json`에 남습니다. 이번 CDN 파일의 SHA-256은 [의존성](../DEPENDENCIES.md)에 기록한 값과 같았습니다. 검사 빌드는 `test-results/builds/`에 만들어 배포용 `dist/`와 분리했습니다.
- 브라우저는 Playwright 1.63.0의 Chromium 153.0.8010.12입니다. Pixel 7과 반응형 화면은 emulation이며, 의도적 skip은 기존 모바일 중복 반응형 7개와 키보드 Escape 1개입니다.
- CrazyGames Preview/실환경 광고·계정 동기화, Safari/Firefox, 실제 Android/iPhone·GPU 성능·청음 확인은 미검증입니다. [점검 항목](REVIEW.md)의 1~3번을 반영했고 4번은 후속 작업으로 남깁니다.

## CrazyGames SDK 최신 여부·템플릿 점검 — 2026-10-21 · macOS arm64 · Node 24.16.0

| 검사                                            | 결과                                                          |
| ----------------------------------------------- | ------------------------------------------------------------- |
| 공식 설치 문서·CDN·실행 로그                    | v3 공식 URL 유지, 실제 CDN 및 local 초기화 버전 3.8.0         |
| `npm run check`                                 | ESLint, Prettier, 단위 52개, TypeScript, Vite build 통과      |
| `npm run test:e2e -- --workers=1`               | desktop + Pixel 7: 26개 통과, 8개 의도적 skip                 |
| `E2E_PREVIEW=1 npm run test:e2e -- --workers=1` | 같은 구성으로 26개 통과, 8개 의도적 skip                      |
| 공식 CDN SDK를 사용하는 배포 빌드 local 실행    | 초기화, SDK 설정 조회, 로컬 광고 후 조작 복구, Data 저장 복원 |

- 공식 문서가 안내하는 CDN 주소를 현재 로더가 이미 사용합니다. SDK 런타임 코드·npm 의존성·lockfile 교체 없이 최신 배포 파일을 불러오는 것을 확인했습니다. 버전·파일 식별값은 [의존성](../DEPENDENCIES.md)에 기록했습니다.
- 자동 E2E는 SDK 테스트 대역을 사용합니다. 별도 임시 Playwright 실행은 SDK 다운로드를 대체하지 않고 Chromium 153.0.8010.12에서 공식 CDN의 local 환경을 확인했습니다. `muteAudio=true` SDK 설정 조회, rewarded/midgame 각각의 `adStarted`·`adFinished` callback, rewarded 완료의 Mock 표시, 광고 후 조작 복구, Data 저장·새로고침 복원을 확인했으며 이 경로의 pageerror는 0건입니다. 실제 음량을 듣는 검사는 포함하지 않았습니다.
- 별도 오류 재현에서는 플레이 도중 예외가 발생해도 오류 안내 뒤에서 판이 종료되고 localStorage에 플레이 횟수가 저장되는 문제를 확인했습니다. 기존 오류 E2E는 메뉴의 안내 화면만 검사합니다. 개선 방향과 나머지 검토 결과는 [템플릿 점검](REVIEW.md)에 있습니다.
- 모바일은 Pixel 7 화면·합성 touch emulation입니다. 의도적 skip 8개는 모바일 프로젝트에서 중복되는 반응형 7개와 키보드 Escape 1개입니다.
- CrazyGames Preview/실환경 광고·계정 간 동기화, Safari/Firefox, Android/iPhone 실기기와 GPU 성능은 미검증입니다.

## 미배포 · CrazyGames SDK + 0.3.0 통합 — 2026-10-08 · macOS arm64 · Node 24.16.0

| 검사                                            | 결과                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `npm run check`                                 | ESLint, Prettier, 단위 52개, TypeScript, Vite build 통과          |
| `npm run test:e2e -- --workers=1`               | desktop + Pixel 7: 26개 통과, 8개 의도적 skip                     |
| `E2E_PREVIEW=1 npm run test:e2e -- --workers=1` | 같은 구성으로 26개 통과, 8개 skip                                 |
| 화면 확인                                       | 배포 빌드 desktop 결과·휴대폰 가로 640×360 플레이 screenshot 확인 |

- 원격 main `14e6868`의 반응형 배치·EXPAND 안전 영역·HiDPI 렌더 배율과 SDK 작업을 통합했습니다. 충돌 9개 파일을 정리하고 기존 0.3.0 기능과 SDK 초기화·광고·저장 수명을 함께 유지했습니다.
- 7가지 화면 크기의 반응형 검사는 SDK disabled 대역을 공유하여 외부 네트워크 없이 검사합니다. SDK 전용 E2E는 SDK 초기화·Data·광고 callback 대역을 사용합니다.
- 생략 8개는 모바일 프로젝트에서 중복되는 반응형 7개와 모바일 키보드 Escape 1개입니다. 브라우저는 Playwright 1.63.0 기본 Chromium 153.0.8010.12이며, Pixel 7·태블릿·휴대폰 화면은 emulation입니다.
- 이번 통합에서는 공식 CDN local 데모를 재실행하지 않았습니다. 아래 2026-10-07 기록과 구분합니다. CrazyGames Preview/실환경 광고·계정 간 동기화, Safari/Firefox, Android/iPhone 실기기는 미검증입니다.

## 미배포 · CrazyGames SDK — 2026-10-07 · macOS arm64 · Node 24.16.0

| 검사                                            | 결과                                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                 | ESLint, Prettier, 단위 45개, TypeScript, Vite build 통과                                                                     |
| `npm run test:e2e -- --workers=1`               | desktop + Pixel 7: 19개 통과, 모바일 키보드 1개 의도적 skip                                                                  |
| `E2E_PREVIEW=1 npm run test:e2e -- --workers=1` | 같은 구성으로 19개 통과, 1개 skip                                                                                            |
| 공식 CDN SDK를 사용하는 배포 빌드 local 실행    | 초기화, `muteAudio=true` 설정, rewarded/midgame 데모 표시·종료, 조작 차단·재개, 결과 화면, Data 새로고침 복원, pageerror 0건 |
| 화면 확인                                       | 공식 SDK local 실행의 결과 화면 screenshot 확인                                                                              |

- 브라우저: Playwright 1.63.0 기본 Chromium 153.0.8010.12. 모바일 검사는 Pixel 7 viewport/합성 touch이며 실기기가 아닙니다.
- 자동 E2E는 SDK 스크립트 요청을 테스트 대역으로 대체하여 초기화 전 Data 접근 방지, Basic Launch 광고 차단, 저장 보호, 로컬 데모 표시를 검사합니다. 공식 CDN 실행은 대역 없이 별도로 확인했습니다.
- 단위 검사는 초기화 공유·실패·timeout, 실제/로컬 완료 구분, 광고 실패·중복·늦은 callback·동시 요청·destroy, 중첩 일시정지, 플랫폼/광고 음소거 우선순위를 포함합니다.
- 초기 개발 E2E는 실행 중 소스 저장에 따른 HMR 중단과 4 worker 실행의 시간 초과를 관찰했습니다. 소스 변경을 마친 뒤 개발·배포 전체 검사를 각각 1 worker로 실행해 통과했습니다.
- CrazyGames Preview/실환경 광고·수익·계정 간 동기화·입점 심사, Safari/Firefox, Android/iPhone 실기기는 미검증입니다. [제출 안내](../CRAZYGAMES.md)의 Preview 절차로 확인해야 합니다.

## 0.3.0 — 2026-10-07 · Linux x64 · Node 22.22.0

| 검사                            | 결과                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| `npm run check`                 | 성공, 단위 검사 20개                                              |
| 개발 빌드 E2E                   | 18개 통과(반응형 7개 포함), 8개 skip(모바일 프로젝트 중복·Escape) |
| 배포 빌드 E2E (`E2E_PREVIEW=1`) | 18개 통과, 같은 구성                                              |
| 반응형 검사의 유효성            | 수정 전 코드에서 7개 중 5개 실패, 수정 후 모두 통과               |
| 메인 E2E, CPU 6배 throttling    | desktop/mobile 통과                                               |

배포 빌드에서 플레이 시작 직후 측정(Chromium 화면 크기 emulation). 배율은 안전 영역 960×540이 그려지는 CSS 배율입니다.

| 화면                | 0.2.0 배율 / 게임 카드 전체 보임 | 0.3.0 배율 / 게임 카드 전체 보임 |
| ------------------- | -------------------------------- | -------------------------------- |
| PC 1920×1080        | 1.11 / 예                        | 1.11 / 예                        |
| PC 1366×768         | 1.03 / 아니오                    | 1.03 / 예                        |
| iPad 세로 820×1180  | 0.50 / 예                        | 0.79 / 예                        |
| iPad 가로 1180×820  | 0.84 / 아니오                    | 0.84 / 예                        |
| 휴대폰 세로 390×844 | 0.36 / 예                        | 0.36 / 예 + 회전 안내            |
| 휴대폰 가로 844×390 | 0.53 / 아니오(화면 아래)         | 0.70 / 예                        |
| 휴대폰 가로 640×360 | 0.62 / 아니오                    | 0.52 / 예                        |

- 휴대폰 가로 640×360은 오른쪽 버튼 줄이 폭을 차지해 배율이 조금 줄었지만, 게임 전체가 한 화면에 보입니다.
- 렌더 배율 적용 후 단위 검사 27개, 개발/배포 E2E 각 18개 통과. 반응형 E2E는 터치 기기를 화소 밀도 3으로 emulation해 배율 상한(1.5)을 확인.
- 레티나 노트북(1440×900, 화소 밀도 2): 게임 화면 확대가 2.2배 → 1.1배. HUD 글자 확대 비교에서 번짐이 사라진 것을 확인. 휴대폰 가로 844×390: 2.1배 → 1.4배.
- 미검증: 실제 iPhone/Android 기기의 주소창 변화(`dvh`)·노치, **실기기 GPU 부담과 FPS**(headless Chromium은 소프트웨어 렌더링이라 측정 불가), Safari/Firefox.

## 0.2.0 — 2026-10-07 · Linux x64 · Node 22.22.0

| 검사                            | 결과                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `npm run check`                 | 성공: ESLint, Prettier, Vitest, TypeScript, Vite build       |
| 단위 검사                       | 20개 통과                                                    |
| 개발 빌드 E2E                   | 11개 통과, 1개 의도적 skip(모바일 Escape), desktop + Pixel 7 |
| 배포 빌드 E2E (`E2E_PREVIEW=1`) | 11개 통과, 같은 구성                                         |
| 화면 확인                       | desktop/mobile 결과 화면 screenshot 확인                     |

- 브라우저: 환경에 설치된 Chromium(Playwright build 1194)을 `executablePath`로 지정해 실행. Playwright 1.63.0 번들 Chromium은 아님.
- 문서의 장면·migration 예제 코드는 임시 파일로 타입 검사와 실행 검사를 통과한 뒤 삭제.
- GitHub Actions 첫 PR 실행에서 메인 E2E(desktop)가 별을 못 모아 실패. 키를 실제 시간 650ms만 누르는데, 느린 runner에서는 Phaser가 프레임 delta를 제한해 게임 시간이 느리게 흘러 별까지 닿지 못함. 판이 끝날 때까지 입력을 유지하도록 고친 뒤 CPU 10배 throttling에서 desktop/mobile 3회 연속 통과.
- v7 action(checkout, setup-node, upload-artifact)은 위 원격 실행에서 정상 동작 확인.

## 0.1.0 — 2026-10-04 · macOS arm64 · Node 24.16.0

| 검사                            | 결과                                                   |
| ------------------------------- | ------------------------------------------------------ |
| `npm run check`                 | 성공                                                   |
| 단위 검사 / 개발 E2E / 배포 E2E | 17개 / 8개 / 8개 통과 (Playwright 1.63.0 Chromium 153) |
| `npm audit --omit=dev`          | 알려진 취약점 0건 (확인 시점)                          |
| GitHub Actions                  | `main` 첫 push에서 성공                                |

## 확인한 동작

- Boot/asset preload/메뉴/게임/결과/재시작/메뉴 복귀.
- desktop 방향키, mobile touch 입력으로 실제 별 수집. 한 판 후 최고 기록·횟수 저장과 새로고침 복원.
- 설정 저장, 설정창 열기/닫기, 수동 pause 유지·재개, Escape 토글, 전체화면 진입/나가기.
- Mock 동의 gate와 완료·취소 UI, SDK disabled인 production에서 unavailable.
- asset 요청 실패 시 안내와 플레이 버튼 비활성화, 처리되지 않은 오류 시 안내 화면.
- 손상 저장의 원본 보존과 명시적 초기화.
- 단위: 순차 migration, 미래 버전 보호, 누락 migration, 접근 거부/용량 오류, 설정과 저장 분리, 동시 서비스 요청, Mock 오류, 중첩 pause와 수동 토글, 음량 범위, 오류 감시, 판 길이 조정값.

## 미검증 범위

- 실제 Android/iPhone 기기, Safari와 Firefox. 모바일 viewport와 합성 touch는 실기기 검증이 아닙니다.
- 실제 게임패드, 실기기 전체화면과 방향 고정(`screen.orientation.lock`).
- 실제 음량을 귀로 듣는 확인, 브라우저/OS별 백그라운드 오디오 정책.
- CrazyGames 실환경 광고와 계정 간 동기화, 실제 결제·분석 서버 연동, 외부 정적 호스팅 업로드, 여러 탭 동시 저장.

# 검증 기록

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

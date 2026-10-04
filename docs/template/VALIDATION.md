# 검증 기록

검증일: 2026-10-04 · 템플릿 0.1.0 · macOS arm64 · Node 24.16.0.

| 검사                            | 최종 결과                                                    |
| ------------------------------- | ------------------------------------------------------------ |
| npm 의존성 설치 / lockfile 생성 | 성공, 직접 버전 고정                                         |
| `npm run check`                 | 성공: ESLint, Prettier, Vitest, TypeScript, Vite build       |
| 단위 검사                       | 17개 통과                                                    |
| 개발 빌드 E2E                   | 8개 통과, desktop + Pixel 7 에뮬레이션                       |
| 배포 빌드 E2E (`E2E_PREVIEW=1`) | 8개 통과, 같은 2개 환경                                      |
| `npm audit --omit=dev`          | 알려진 취약점 0건 (확인 시점)                                |
| 화면 확인                       | desktop/mobile 전체 화면 screenshot 확인, 가로 overflow 없음 |

브라우저는 Playwright 1.63.0의 Chromium 153.0.8010.12입니다.

## 확인한 동작

- Boot/asset preload/메뉴/게임/결과/재시작/메뉴 복귀.
- desktop 방향키, mobile touchStart/touchEnd 입력으로 실제 별 수집.
- 초기 검사에서는 두 viewport의 마우스 pointer 이동도 확인.
- 한 판 완료 후 최고 기록/플레이 횟수 저장과 새로고침 복원.
- 설정 저장, 설정창 열기/닫기, 수동 pause 유지 및 재개.
- Mock 동의 gate와 완료·취소 UI, production에서 unavailable.
- 실제 asset 요청 실패 시 복구 안내와 플레이 버튼 비활성화.
- 손상 저장의 원본 보존과 명시적 초기화.
- 단위 검사: 구버전 순차 migration, 미래 버전 보호, 누락된 migration, 접근 거부/용량 오류, 설정과 저장 분리, 동시 서비스 요청, Mock 오류, 중첩 pause, 음량 범위 검사.

키보드 회귀 검사에서 DOM의 preventDefault가 Phaser 입력까지 차단하는 문제를 발견했습니다.
입력 target을 게임 요소로 한정하고, 포커스 상실 시 키 상태를 초기화한 뒤 위 검사를 다시 통과했습니다.
최종 브라우저 정상 흐름 검사에서 pageerror는 없습니다.

## 미검증 범위

- 실제 Android/iPhone 기기, Safari와 Firefox.
- 실제 음량을 귀로 듣는 확인, 브라우저/OS별 백그라운드 오디오 정책.
- 실제 외부 광고·결제·분석 SDK와 서버 연동 (미포함).
- 외부 정적 호스팅에 업로드한 결과 및 여러 탭 동시 저장 충돌.
- GitHub Actions 원격 실행. 워크플로를 작성했고 동일 명령은 로컬에서 통과했습니다.

모바일 viewport와 합성 touch 이벤트 검사를 실기기 검증으로 해석하지 않습니다.

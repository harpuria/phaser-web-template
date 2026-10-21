# 변경 기록

## 미배포 — 2026-10-21

- 오류·Promise 거부 시 첫 오류를 유지하고 플레이·오디오·SDK gameplay·입력·자동 저장을 중지. 설정창을 닫고 복구 외 조작 차단. 광고 완료·탭 복귀가 오류 정지를 풀지 않도록 검사.
- `VITE_PLATFORM`과 `standalone` / `crazygames` 개발·빌드 명령 추가. 잘못된 대상·명시 mode 충돌을 시작·빌드 때 거절. 자체 호스팅용 배포 빌드가 SDK 요청 없이 저장·복원하는지 E2E와 CI에서 검사.
- `npm run test:sdk`로 공식 CDN SDK local 초기화·음소거·광고·Data 저장 복원 검사. 버전·응답 식별값·SHA-256·콘솔 오류·단계별 결과를 기록하며, CI 수동 실행에서도 선택 가능.

## 미배포 — 2026-10-07

- CrazyGames HTML5 SDK v3 로더·초기화·환경 감지·Adapter 추가. SDK 준비 후 저장소 생성, loading/gameplay 이벤트와 platform mute 설정 연결.
- Basic Launch 기본값과 Full Launch 광고 전환 설정. midgame/rewarded, 광고 요청 중 조작 차단·시작 시 음소거, 실패/timeout/중복 callback·정리 처리.
- SDK Data를 진행·설정 저장에 사용. 읽기/초기화 실패 후 다른 저장소에 쓰지 않고 원본 보호. local SDK 광고는 `mock: true`, 실제 광고는 `false`.
- SDK 경계 단위·브라우저 검사와 제출/Progress Save/검증 안내 추가.

## 0.3.0 — 2026-10-07

- 화면 비율 대응: `Scale.FIT` → `Scale.EXPAND`. 기본 해상도는 안전 영역으로 두고 `core/viewport.ts`의 `centerSafeArea`로 화면 중앙에 맞춤. 남는 공간은 배경으로 채움.
- 게임 우선 배치: 게임 카드가 화면 높이를 넘지 않게 줄어들고, 플레이 시작 시 카드 전체가 보이도록 스크롤. 휴대폰 가로(높이 500px 이하)는 헤더·소개를 숨기고 게임이 화면 높이를 모두 사용하며 버튼은 오른쪽 세로 줄로 이동.
- 사이드바를 게임 아래로 내리는 기준 폭 800px → 1024px. 게임 칸이 사이드바 높이에 맞춰 늘어나 생기던 빈 공간 제거.
- 터치 기기에서 권장 방향이 아니면 회전 안내 문구 표시.
- 고해상도 화면 선명도: 렌더 배율 k(`gameConfig.maxRenderScale`, 기본 PC 2·터치 1.5)로 게임을 크게 그리고 카메라 zoom으로 맞춤. Text는 자동으로 k배 해상도, 예제 SVG는 k배로 불러와 `1/k`로 사용. `?debug`에 렌더 배율·FPS 표시.
- E2E: 7가지 화면 크기에서 게임 카드가 한 화면에 들어오는지, 안전 영역 배율 0.5 이상인지(휴대폰 세로는 회전 안내) 검사. 메인 E2E의 터치 좌표를 EXPAND에 맞게 계산.

## 0.2.0 — 2026-10-07

- 공통 코드와 데모 분리: 일시정지 대상을 `gameConfig.pausableScenes`로, 준비 완료 신호를 Preload로, 진행 상태를 `game/session.ts`로 옮김. `AudioService`는 asset 키를 인자로 받음.
- 해상도 고정값 제거: Preload·예제 장면·전환 색이 config와 `this.scale`을 따름.
- 추가: 키보드·게임패드·포인터 통합 이동 입력(`core/input.ts`), 전체화면과 방향 안내(`core/screen.ts`), 처리되지 않은 오류 안내(`core/errors.ts`), 개발용 `?debug`, `pixelArt` 설정, `.env.example`.
- 수정: 다른 이유로 멈춘 동안 일시정지 버튼·Escape가 반응하지 않던 문제.
- E2E: `?round=초`로 예제 판 길이를 줄여 메인 시나리오가 약 40초에서 약 13초로 단축. 수동 일시정지·전체화면·오류 화면 검사 추가. 이동 입력을 판 종료까지 유지해 느린 CI에서도 결과가 일정함.
- CI: action v7, push는 `main`만, 중복 실행 취소, 수동 실행.
- 문서: README를 실행·기능·명령 중심으로 축약, 교체 체크리스트·용어표·입력/화면/디버그 안내 추가, 제작 경위 정리.

## 0.1.0 — 2026-10-04

- Phaser 4.2.1 + TypeScript + Vite 웹 템플릿 생성. `godot-mobile-template`의 공통 기능 / 게임 / 서비스 Adapter 분리 방식을 웹에 맞게 옮김.
- 공통 저장/schema/migration 보호, 설정, 오디오, 전환, pause lifecycle.
- 30초 별 모으기 예제와 반응형 HTML 메뉴·설정·서비스 데모.
- 광고/결제/분석 Mock, 동의 및 동시 실행 gate, 배포 unavailable 기본값.
- 단위/E2E/CI 및 한국어 개발·적용 문서.

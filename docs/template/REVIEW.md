# 템플릿 점검 — 2026-10-21

검토 기준: `9090531`의 소스·문서·테스트와 배포 빌드 실행. SDK 확인 및 검사 결과는 [의존성](../DEPENDENCIES.md)과 [검증 기록](VALIDATION.md)에 기록합니다.
1~3번은 2026-10-21에 반영했습니다. 아래에는 수정 전 근거와 반영 내용을 함께 남깁니다.
2026-10-29 업데이트: 4번의 Firefox·WebKit 자동 검사를 추가했습니다. 실제 모바일 기기 검증은 남아 있습니다. 추가 개선 내용은 [변경 기록](CHANGELOG.md)을 봅니다.

## 1. P1 · 치명적 오류가 발생하면 게임 진행도 멈추기

**수정 전 브라우저에서 재현한 결함입니다.** 기존 [오류 callback](../../src/main.ts)은 `fatalError`와 안내 화면만 갱신했고, [Shell](../../src/ui/Shell.ts)의 버튼 비활성화 조건도 준비 상태와 광고 요청만 확인했습니다.

수정 전 배포 빌드에서 `/?round=2`로 플레이를 시작한 뒤 아래 오류를 발생시키면, 오류 화면이 떠 있는 동안 `PLAYING`이 `RESULT`로 바뀌고 플레이 횟수 1이 실제 localStorage에 저장됐습니다.

```js
setTimeout(() => {
  throw new Error('review fatal error');
}, 0);
```

반영: `app.fail(message)`가 첫 오류와 `fatal` pause reason을 유지합니다. 게임·오디오·SDK gameplay·입력을 멈추고 `App.flush()`의 후속 쓰기를 차단합니다. Shell은 열린 설정창을 닫고 복구 외 조작을 막습니다.
검사: 플레이 중 예외·Promise 거부 후 원래 판 길이가 지나도 판 종료·저장이 발생하지 않고 새로고침으로 복구되는 E2E를 추가했습니다. 단위 검사에서 광고 완료·탭 복귀·수동 정지 해제가 오류 정지를 풀지 않고 destroy 시에도 저장하지 않는지 확인합니다.

## 2. P2 · 배포 대상별 플랫폼 설정을 명시하기

기존 [기본 설정](../../src/config/game.ts)은 CrazyGames를 항상 켰습니다. [bootstrap](../../src/services/bootstrap.ts)은 SDK가 `disabled`를 반환하면 localStorage를 선택하지만, 로드·초기화가 실패하면 저장을 보호하기 위해 쓰기를 차단합니다. SDK 준비 대기는 최대 10초입니다.

따라서 자체 호스팅용 게임에서 SDK 설정을 그대로 두면 CrazyGames CDN 장애나 차단이 로딩 지연과 저장 불가로 이어집니다. 문서에 있는 수동 비활성화를 배포 설정으로 명시하면 실수를 줄일 수 있습니다.

반영: `VITE_PLATFORM`과 `dev:standalone` / `build:standalone`, `dev:crazygames` / `build:crazygames` 명령을 추가했습니다. 기존 기본값은 CrazyGames이며, 잘못된 값과 명시 mode 충돌은 시작·빌드 때 거절합니다. CrazyGames 모드의 초기화 실패 후 원본 보호 정책을 유지합니다.
검사: `test:e2e:standalone`이 자체 호스팅용 배포 빌드의 SDK 미요청·로컬 저장·새로고침 복원을 확인합니다. 대상 검증 단위 검사와 잘못된 값·mode 충돌의 실제 빌드 거절도 확인합니다.

## 3. P2 · 실제 CDN SDK를 확인하는 반복 가능한 검사 추가

현재 [SDK E2E](../../tests/e2e/crazygames.spec.ts)와 [공통 fixture](../../tests/e2e/platform-fixtures.ts)는 SDK 스크립트 요청을 테스트 대역으로 바꿉니다. 경계 계약은 검사하지만, 같은 v3 URL에서 공급자가 배포한 SDK 변경을 직접 검사하지는 않습니다.

공식 CDN을 그대로 사용하는 [검사](../../tests/sdk/crazygames-live.spec.ts)를 `npm run test:sdk`로 반복 실행할 수 있도록 추가했습니다. 일반 검사와 별도 디렉터리에 빌드·기록하므로 기존 `dist/`와 검사 결과를 덮어쓰지 않습니다.

반영: SDK 실행 버전·응답 식별값·파일 SHA-256·콘솔 오류·단계별 결과를 JSON으로 남깁니다. GitHub Actions 수동 실행의 `sdk_smoke`로도 선택할 수 있습니다.
검사: 공식 **3.8.0**의 초기화, 사용자 설정 변경 후에도 유지되는 SDK 음소거, rewarded/midgame 콜백·조작 복구, gameplay 이벤트, Data 새로고침 복원을 확인합니다. 실제 광고 송출·계정 동기화는 CrazyGames Preview에서 별도로 확인합니다.

## 4. P2 · 브라우저와 실제 모바일 기기 검증 확대

점검 당시 [Playwright 설정](../../playwright.config.ts)의 desktop과 Pixel 7은 모두 Chromium이었습니다. 당시에는 반응형 화면·합성 터치를 확인했으며 Safari/Firefox 및 실제 휴대폰의 오디오·전체화면·회전·GPU 동작은 미검증이었습니다.

당시 권장: [Playwright의 브라우저별 project](https://playwright.dev/docs/test-projects)에 따라 WebKit·Firefox에서 시작·플레이·설정·저장 복원 공통 흐름을 먼저 검사합니다. 모바일 이동 검사의 Chromium CDP 사용 부분은 공통 흐름과 분리하고, iPhone/Android에서 터치·오디오 재개·회전·전체화면·장시간 플레이를 직접 확인합니다.
완료 기준: 브라우저별 자동 검사 결과와 실제 기기 확인 결과를 구분해서 기록합니다. WebKit 자동 검사와 iPhone 실기기 검증을 동일하게 취급하지 않습니다.

## 권장하는 다음 작업

4번의 공통 흐름 자동 검사는 반영했습니다. 실제 모바일 기기에서는 [개발 안내의 검증 목록](../DEVELOPMENT.md#검증)을 따라 터치·회전·전체화면·오디오 재개·장시간 플레이를 확인합니다.

요청 예시: “game-implement로 실제 iPhone/Android에서 터치·회전·오디오·전체화면·장시간 플레이를 확인하고 기기별 결과를 기록해 줘.”

# 구조와 계약

## 파일 안내

```text
src/main.ts              앱 구성, Phaser 설정, 장면 등록, HMR 정리
src/config/game.ts       이름, 저장 namespace, 해상도, 시작 장면, 기능 스위치
src/app.ts               저장·설정·오디오·서비스 수명 소유, visibility/pagehide 처리
src/core/               Phaser와 무관한 저장/설정/일시정지 + 오디오/전환 도우미
src/services/platform.ts 외부 서비스 계약, Mock, unavailable, 동의·동시 요청 gate
src/scenes/             공통 Boot/Preload
src/game/               예제 게임 장면, 저장 schema, asset 로딩 목록
src/ui/Shell.ts          예제의 HTML 메뉴/HUD/설정/서비스 패널
public/assets/demo/     직접 만든 SVG와 합성 WAV
tests/unit/             저장과 서비스 실패 경계 검사
tests/e2e/              실제 브라우저에서 전체 흐름 검사
```

`App`은 구성과 앱 수명만 소유합니다. 게임 점수/보상 규칙은 `src/game/`에 둡니다.
게임은 `App.platform`을 호출하고 외부 SDK에 직접 접근하지 않습니다.
원본 Godot 프로젝트는 구조 참고용으로만 읽었으며 변경하지 않았습니다.

## 시작과 정리

`main`에서 App과 HTML Shell 생성 → Phaser Boot에서 audio/lifecycle 연결 → Preload → 설정된 시작 장면.
Preload는 게임의 `queueAssets` 함수를 호출하고 진행률/실패 화면을 표시합니다.
필수 asset 로딩 실패 시 다음 장면으로 진입하지 않습니다.

App은 장면 전환에도 유지됩니다. 장면별 물리·게임 객체·입력은 Phaser 장면 수명을 따릅니다.
전환은 registry lock으로 중복 요청을 막고 shutdown에서 lock을 해제합니다.
HMR에서는 HTML listener, timer, audio, game/canvas를 정리합니다.

`PauseState`는 `manual`, `settings`, `hidden`, `service` 이유를 집합으로 보관합니다.
모든 이유가 사라질 때만 Game 장면과 오디오를 재개합니다. 자동 복귀가 수동 정지를 취소하지 않습니다.
게임 장면 이름을 바꾸면 `App.pause`의 대상 이름도 함께 바꿉니다. 메뉴 애니메이션은 게임 시뮬레이션에 해당하지 않습니다.

## 저장

`Store<T>`는 `{ version, data }` JSON envelope 하나를 localStorage 키 하나에 기록합니다.
게임이 defaults/validate/migrations를 제공하고, 순차 migration이 모두 성공해야 정상 load로 인정합니다.
데이터를 갱신하면 dirty로 표시하고, 라운드 완료/주기/탭 숨김/pagehide에서 flush합니다.
브라우저 종료 시 이벤트는 보장되지 않으므로 중요한 진행 변경은 즉시 flush합니다.

실패 의미:

| 상태           | 동작                                               |
| -------------- | -------------------------------------------------- |
| ready          | 검증된 데이터, 쓰기 가능                           |
| corrupt        | JSON/schema/migration 실패. 원본 쓰기 차단         |
| future-version | 앱보다 높은 버전. 원본 쓰기 차단                   |
| unavailable    | 접근 거부/용량 부족. 메모리 플레이, 저장 실패 표시 |

실패 상태에서도 update는 메모리 값을 갱신하지만 false를 반환합니다.
명시적 사용자 초기화인 `reset()`만 원본을 삭제하고 쓰기를 다시 시도합니다.
게임 저장과 설정은 서로 다른 키이므로 게임 초기화가 음량 설정을 지우지 않습니다.
localStorage는 동기식·단일 슬롯이며 큰 데이터, 여러 탭 충돌 병합, 암호화, 부정행위 방지, 서버 동기화를 제공하지 않습니다.
다중 탭은 마지막 쓰기가 우선합니다. 실제 화폐/권한의 신뢰 원본으로 쓰지 않습니다.

## 오디오와 웹 입력

Phaser sound manager의 master/mute와 각 sound의 music/sfx 음량을 조합합니다.
BGM은 사용자 플레이 동작에서 시작하고 일시정지 동안 멈춥니다.
설정 창을 닫고 게임을 재개하면 변경된 볼륨을 적용합니다.
예제는 고정 논리 해상도 + FIT를 사용하고 HTML Shell은 CSS breakpoint로 재배치합니다.
입력 좌표는 Phaser world 좌표를 사용하며 canvas만 touch-action을 제한합니다.
HTML 버튼·슬라이더 포커스 중에는 게임의 키보드 이동을 막습니다.

## 서비스

`PlatformAdapter`는 광고·구매·분석 호출의 교체 지점입니다.
현재 구현은 개발용 Mock과 unavailable이며 앱 스토어/결제 SDK가 아닙니다.
`PlatformServices`는 기능 스위치, 동의, 동시 요청, 오류 변환을 담당합니다.
Mock 완료 결과는 `mock: true`를 포함하며 게임 재화/권한을 자동 지급하지 않습니다.
Mock 동의는 세션 메모리에만 보관하며 실제 개인정보 동의 솔루션을 대신하지 않습니다.

실제 Adapter 도입 시:

1. 별도 파일에서 SDK를 감싸고 명시적인 배포용 선택 경로를 `PlatformServices`에 추가합니다. 현재의 `isMock` gate도 이때 실제 readiness 판정으로 바꿉니다.
2. 광고 완료 callback, 구매 서버 검증·중복 처리·pending·복원 정책을 정의합니다.
3. 취소/실패/동의 철회/timeout/중복 callback을 검사합니다. Promise가 종료되지 않는 SDK에는 timeout과 요청 ID를 추가합니다.
4. 실제 SDK의 버전·약관·검증 결과를 의존성 문서에 기록합니다.

웹 공유/전체화면/로그인/리더보드/리뷰는 게임 요구가 정해질 때 추가합니다.
이 템플릿은 지원하지 않는 기능을 성공으로 가장하지 않습니다.

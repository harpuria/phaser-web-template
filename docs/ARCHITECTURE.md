# 구조와 계약

`core/`, `services/`, `app.ts`를 수정하기 전에 읽는 설계 문서다. 일반 사용법은 [개발 안내](DEVELOPMENT.md)를 참고한다.

## 파일 안내

```text
src/main.ts               Phaser 설정, 장면 등록, 오류 감시, HMR 정리
src/app.ts                저장·설정·오디오·일시정지·서비스 수명 소유
src/config/game.ts        이름, 버전(package.json), 언어, 배치, 저장 키 접두사, 해상도, 시작/일시정지 장면, 기능 스위치
src/config/platform.ts    배포 대상 검증(Vite 설정과 game 설정 공유)
src/core/                 게임과 무관한 공통 모듈
  store.ts settings.ts      버전 있는 저장소, 설정 schema
  audio.ts pause.ts         음량 적용, 이유별 중첩 일시정지
  input.ts navigation.ts    이동 입력 통합, 장면 전환
  screen.ts viewport.ts     전체화면·방향 고정, EXPAND 안전 영역 카메라·zoom
  renderScale.ts            고해상도 렌더 배율 계산(Phaser 없는 순수 함수)
  layout.ts locale.ts       page/embed 배치 결정, 브라우저 언어 선택(순수 함수)
  errors.ts                 예기치 않은 오류 감시(다른 origin 오류 제외)
src/services/platform.ts  광고·결제·분석 계약, capability gate, Mock, unavailable
src/services/bootstrap.ts SDK 초기화와 저장소 선택(App 생성 전 완료)
src/services/crazygames*  CrazyGames v3 타입·로더·Adapter
src/scenes/               공통 Boot / Preload 장면
src/game/                 게임 전용: 장면, 저장 schema, 진행 상태(session), asset 목록, 문구(strings)
src/ui/system.ts          HTML 공통 계약: 오류·광고 중 조작 차단, 일시정지·회전·오류 안내(유지)
src/ui/Shell.ts           예제 HTML 메뉴·HUD·설정·서비스 패널, page·embed 배치(교체 대상)
tests/unit/               공통 경계 단위 테스트
tests/e2e/                contract·crazygames·embed·demo·responsive(요소 ID는 ui.ts)
```

- **의존 방향**: `game/`, `ui/` → `core/`, `services/`. `core/`·`services/`는 `game/`이나 데모 asset 키에 의존하지 않는다.
- **조립 경계**: `App`은 `game/`의 schema와 `Session`만 조립하며, 점수·보상 규칙은 `game/`에 둔다. 게임 코드는 외부 SDK 대신 `app.platform`을 거친다.
- **자동 검증**: ESLint가 `core/`·`services/` → `game/` 방향의 모든 import(정적·동적·타입·re-export)를 차단한다. 필요한 데이터와 콜백은 `app.ts`에서 주입한다.

## 용어

| 용어         | 의미                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| envelope     | 저장 형식 `{ version, data }`. `version`으로 migration 필요 여부 판단             |
| dirty        | 메모리 값은 바뀌었지만 아직 저장소에 기록하지 않은 상태                           |
| flush        | 변경된(dirty) 값을 저장소에 기록하는 동작. 성공 여부를 `boolean`으로 반환         |
| pause reason | 일시정지 이유(`manual`, `settings`, `hidden`, `service` 등). 모두 해제되어야 재개 |
| gate         | 서비스 요청 전 확인 단계: 기능 스위치 → 동의 → 동시 요청 여부                     |
| Adapter      | 실제 SDK를 감싸 `PlatformAdapter` 계약에 맞추는 클래스                            |

## 시작과 정리

1. `main.ts`가 `createPlatform()` 완료를 기다린 뒤 `App`·`Shell`을 생성하고 오류 감시를 시작한다.
2. `BootScene`이 `app.attach(game)`으로 오디오, 탭 숨김/`pagehide`, 자동 저장 타이머를 연결한다.
3. `PreloadScene`이 `loadingStart`를 알리고 `queueAssets`로 asset을 불러오며 진행률을 표시한다. 실패하면 오류 안내와 새로고침 버튼을 띄우고, 모두 성공하면 `loadingStop`, `app.ready = true` 후 `startScene`으로 전환한다.
4. `transition()`은 registry lock으로 중복 전환을 막고 장면 `shutdown` 시 lock을 푼다.
5. HMR 시 오류 감시, HTML listener, 타이머, SDK listener·진행 중 요청, 오디오, Phaser 게임을 정리한다. SDK 초기화 중 dispose되면 게임을 생성하지 않는다.

`App`은 장면이 바뀌어도 유지되며, 물리·게임 객체·입력 키는 Phaser 장면 수명을 따른다.

### 예기치 않은 오류 처리

- **외부 오류 제외**: 광고·SDK·브라우저 확장 등 다른 origin 오류는 콘솔 경고만 남기고 게임을 멈추지 않는다. `ErrorEvent.filename`의 origin, `Script error.`, Promise 거부 stack 전체가 외부 origin인 경우를 제외하며 출처 불명 오류는 게임 오류로 본다. 게임 JS를 별도 CDN에서 서빙하면 `watchUncaughtErrors`의 `origin` 옵션을 맞춘다.
- **게임 오류 정지**: 게임 코드 예외와 Promise 거부는 `app.fail(message)`로 첫 오류를 유지한다. `fatal` 이유로 플레이·오디오·SDK gameplay·입력을 멈추고, 이후 모든 `App.flush()`(HMR·`pagehide`·자동 저장 포함)를 차단한다. 복구는 새로고침뿐이다.

## 일시정지

- `PauseState`는 일시정지 이유를 집합으로 관리하며 모든 이유가 사라질 때만 재개한다(탭 복귀가 수동 정지를 풀지 않음).
- 일시정지 중 `gameConfig.pausableScenes`의 장면과 오디오를 멈춘다. 메뉴 연출처럼 멈출 필요 없는 장면은 제외한다.
- 광고 `service` 이유만 있을 때는 장면만 멈추고 `adStarted` 콜백부터 음소거한다. 플랫폼 음소거는 사용자 음소거와 별도로 보관한다.
- 두 번째 콜백은 이유가 바뀔 때마다 실행되어, 탭이 숨겨진 상태에서 수동 정지를 추가해도 gameplay 이벤트가 정확히 반영된다.
- 수동 토글(버튼·Escape)은 `has('manual')` 기준이라 다른 이유로 멈춘 동안에도 의도대로 동작한다.
- `fatal`은 복구 전까지 유지되며 광고 완료·탭 복귀·설정창 닫기로 해제되지 않는다. Shell은 열린 설정창을 닫고 새로고침·전체화면 나가기 외 모든 조작을 막는다.

## 저장

`Store<T>`는 envelope 하나를 키 하나에 기록한다. 순차 migration과 최종 `validate`가 모두 통과해야 정상 로드로 인정하며, 갱신 시 `dirty`가 되어 판 종료·주기·탭 숨김·`pagehide`에 `flush()`한다(브라우저 종료 이벤트는 보장되지 않으므로 중요 진행은 즉시 `flush()`).

| 상태             | 의미와 동작                                             |
| ---------------- | ------------------------------------------------------- |
| `ready`          | 검증된 데이터, 읽기·쓰기 가능                           |
| `corrupt`        | JSON·schema·migration 실패. 원본 보호를 위해 쓰기 차단  |
| `future-version` | 앱보다 높은 버전. 원본 보호를 위해 쓰기 차단            |
| `unavailable`    | 접근 거부·용량 부족. 메모리로 플레이하며 저장 실패 표시 |

- 실패 상태에서도 `update()`는 메모리 값을 바꾸지만 `false`를 반환한다.
- 정상 읽기(빈 저장 포함) 후 쓰기만 실패하면 `canRetry`가 `true`다. 다음 `flush()`나 "저장 다시 시도" 버튼으로 최신 메모리 값을 재시도해 `ready`로 복구한다(초기 읽기 실패·손상·미래 버전·저장소 미제공은 재시도 불가).
- 원본 삭제는 사용자가 확인한 `reset()`뿐이다. 게임 진행과 설정은 별도 키라 서로 영향을 주지 않는다.
- 저장소 구현체는 생성 시 주입한다(CrazyGames `local`/실환경은 SDK Data, `disabled`/비활성화는 `localStorage`, SDK 초기화 실패는 쓰기 불가). Data 실패 후 `localStorage`로 전환하지 않는다.
- `localStorage`는 origin·브라우저별로 분리되므로 새 게임은 `storagePrefix`를 바꿔 충돌을 피한다.
- 여러 탭에서 동시에 열면 마지막에 저장한 내용이 덮어쓴다. 암호화·서버 동기화가 없으므로 실제 화폐·권한 원본으로 쓰지 않는다.

## 오디오, 입력, 화면

- **오디오**: `AudioService`는 `master`/`mute`를 sound manager에, `music`/`sfx` 음량을 각 sound에 적용한다. BGM은 사용자 상호작용 후 시작하고 일시정지 중 멈추며 설정 변경을 즉시 반영한다.
- **입력**: Phaser world 좌표를 쓰며 캔버스(`#game`)에만 `touch-action: none`을 적용한다. 키보드 이벤트도 `#game`에서만 받는다.
- **뷰포트와 렌더 배율**: `Scale.EXPAND`와 안전 영역(`width`×`height`)을 사용한다. `centerSafeArea`가 카메라를 `App.renderScale`(`k`, 시작 시 1회 결정)로 zoom하고 리사이즈마다 중앙 정렬한다. 텍스처는 `k`배로 준비해 `1/k`로 줄여 쓴다.
- **전체화면과 방향 고정**: 대상은 캔버스·오버레이·버튼 줄을 포함한 `#stage`다. `bindFullscreenOrientation`이 진입 시 방향 고정을 요청하고 종료(버튼·Esc·뒤로 가기) 시 해제한다. 전체화면 버튼은 `document.fullscreenEnabled`일 때만 보인다.
- **레이아웃과 언어**: `resolveLayout`이 시작 시 1회 배치를 정한다(`auto`면 iframe은 `embed`, 단독은 `page`, `?layout=` 우선). 문구는 `App.text`에서 읽으며 `core/`·`services/`는 문구 대신 상태 코드(`PlatformContext.warning = 'platform-unavailable'`)만 반환한다.
- **설정 반영**: `app.applySettings()`가 오디오·`app.listenSettings()` 구독자·Shell에 즉시 반영한다. 구독은 현재 설정을 즉시 전달하며 반환된 해제 함수를 `shutdown`에 연결한다. 메뉴 tween·CSS 전환은 `reducedMotion`을 따르며 OS 설정은 최초 기본값이다.

## HTML UI 계약

`SystemUi`(`src/ui/system.ts`)는 데모 Shell과 분리된 공통 계약이다. HTML UI를 교체해도 생성 후 `render()`를 호출해야 한다.

- 캔버스 컨테이너에 일시정지·회전·오류 안내(새로고침 포함)와 전체화면 나가기 버튼을 붙인다.
- `[data-game-control]` 요소는 준비 전·광고 요청 중·오류 상태에서 비활성화한다.
- 오류 상태에서는 `[data-recovery]` 외 모든 버튼·입력을 막고 캔버스를 `inert`로 바꾸며 열린 `<dialog>`를 닫는다.
- UI는 자체 표시를 갱신한 뒤 `render()`를 호출하고, 추가 비활성화 조건은 그 뒤에 `disabled ||= ...`로만 덧붙인다.

## 서비스

- **Adapter와 Gate**: `PlatformAdapter`는 광고·구매·분석·플레이 이벤트 교체 지점(`CrazyGamesAdapter`, `MockAdapter`, `UnavailableAdapter`)이다. `PlatformServices`가 기능 스위치·capability·Mock 동의·동시 요청 제어와 오류 변환을 맡는다(실제 CrazyGames 호출에는 Mock 동의 불필요).
- **완료 결과**: 형식은 `{ status: 'completed', mock: boolean }`다. 실제 CrazyGames 광고만 `mock: false`, `local` SDK·Mock은 `true`다. 보상 규칙은 `src/game/`에서 처리한다.
- **플레이·광고 수명**: `app.setGameplay()`는 조작 상태·의도적 일시정지·광고 중단을 합쳐 SDK 이벤트를 보낸다(탭 숨김 제외). 광고는 요청부터 UI·게임을 멈추고 시작 콜백부터 음소거하며 종료·실패 시 `service`만 해제한다. Adapter는 timeout·중복/늦은 콜백·`destroy` 취소를 처리한다.
- **배포 대상과 제한**: Basic Launch는 광고 capability를 끈다(`local` 데모 제외). 미지원 결제·분석은 `unavailable`/`false`다. `standalone`은 SDK를 요청하지 않고 브라우저 저장소를 쓰며, 배포 빌드에서 플랫폼 미지정이나 `--mode`·`VITE_PLATFORM` 충돌 시 중단된다([CrazyGames 안내](CRAZYGAMES.md)).

### 실제 Adapter 도입 절차

1. 별도 파일에서 외부 SDK를 감싸고 `bootstrap.ts`에 선택 경로와 준비 상태별 capability를 추가한다.
2. 광고 완료 콜백과 구매 서버 검증·중복 처리·pending·복원 정책을 정한다.
3. 취소·실패·동의 철회·timeout·중복 콜백을 테스트한다(끝나지 않을 수 있는 Promise에는 timeout과 요청 ID 필수).
4. SDK 버전·약관·검증 결과를 [의존성](DEPENDENCIES.md)에 기록한다.

지원하지 않는 기능을 성공으로 가장하지 않는다. 공유·로그인·리더보드 등은 게임 요구사항이 정해질 때 추가한다.

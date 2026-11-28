# 구조와 계약

`core/`, `services/`, `app.ts`를 고치기 전에 읽는 문서입니다. 사용법은 [개발 안내](DEVELOPMENT.md)에 있습니다.

## 파일 안내

```text
src/main.ts               Phaser 설정, 장면 등록, 오류 감시, HMR 정리
src/app.ts                저장·설정·오디오·일시정지·서비스의 수명 소유
src/config/game.ts        이름, 버전(package.json), 언어, 배치, 저장 키 접두사, 해상도, 시작/일시정지 장면, 기능 스위치
src/config/platform.ts    배포 대상 검증(Vite config와 game config가 공유)
src/core/                 게임과 무관하게 재사용하는 코드
  store.ts settings.ts      버전 있는 저장, 설정 schema
  audio.ts pause.ts         음량 적용, 이유별 일시정지
  input.ts navigation.ts    이동 입력 통합, 장면 전환
  screen.ts viewport.ts     전체화면/방향 고정, EXPAND 안전 영역 카메라·zoom
  renderScale.ts            고해상도 화면용 렌더 배율 계산(Phaser 없는 순수 함수)
  layout.ts locale.ts       page/embed 배치 결정, 브라우저 언어 선택(순수 함수)
  errors.ts                 처리되지 않은 오류 감시(다른 origin 오류 제외)
src/services/platform.ts  광고·결제·분석 계약, capability gate, Mock, unavailable
src/services/bootstrap.ts SDK 초기화와 저장소 선택 (App 생성 전에 완료)
src/services/crazygames*   CrazyGames v3 타입·로더·Adapter
src/scenes/               공통 Boot / Preload
src/game/                 게임 전용: 장면, 저장 schema, 진행 상태(session), asset 목록, 문구(strings)
src/ui/system.ts          HTML 공통 계약: 오류·광고 중 조작 차단, 일시정지·회전·오류 안내 (유지)
src/ui/Shell.ts           예제 HTML 메뉴/HUD/설정/서비스 패널, page·embed 배치 (교체 대상)
tests/unit/               공통 경계 단위 검사
tests/e2e/                contract(공통 계약)·crazygames(SDK 경계)·embed(iframe 배치)·demo(예제 흐름)·responsive, 요소 id는 ui.ts
```

의존 방향: `game/`, `ui/` → `core/`, `services/`. `core/`와 `services/`는 `game/`이나 데모 asset 키를 알지 않습니다.
`App`은 `game/`의 schema와 `Session`을 조립만 하고, 점수·보상 규칙은 `game/`에 둡니다.
게임은 외부 SDK를 직접 부르지 않고 `app.platform`을 거칩니다.
ESLint가 `core/`·`services/`에서 `game/`으로 향하는 정적 import/re-export·동적 import·타입 import를 차단합니다. 필요한 데이터와 callback은 `app.ts`에서 주입합니다.

## 용어

| 용어         | 뜻                                                                            |
| ------------ | ----------------------------------------------------------------------------- |
| envelope     | 저장 형식 `{ version, data }`. version으로 migration 여부를 판단              |
| dirty        | 메모리 값이 바뀌었지만 아직 localStorage에 쓰지 않은 상태                     |
| flush        | dirty 값을 실제로 쓰기. 성공 여부를 boolean으로 반환                          |
| pause reason | 일시정지 이유(`manual`, `settings`, `hidden`, `service` 등). 모두 풀려야 재개 |
| gate         | 서비스 요청 전 확인 단계: 기능 스위치 → 동의 → 동시 요청 여부                 |
| Adapter      | 실제 SDK를 감싸 `PlatformAdapter` 계약에 맞추는 클래스                        |

## 시작과 정리

1. `main.ts`가 `createPlatform()`으로 SDK 초기화와 저장소 선택을 기다린 뒤 `App`과 `Shell`을 만들고 오류 감시를 시작합니다.
2. `BootScene`이 `app.attach(game)`으로 오디오, 탭 숨김/pagehide 처리, 자동 저장 타이머를 연결합니다.
3. `PreloadScene`이 `loadingStart`를 알리고 게임의 `queueAssets`로 asset을 불러오며 진행률을 표시합니다.
   필수 asset을 불러오지 못하면 오류 안내와 게임을 새로고침할 버튼을 표시합니다. 모두 성공하면 `loadingStop`, `app.ready = true` 후 `startScene`으로 넘어갑니다.
4. 장면 전환은 `transition()`이 registry lock으로 중복 요청을 막고, 장면 shutdown 때 lock을 풉니다.
5. HMR 때는 오류 감시, HTML listener, 타이머, SDK listener·진행 중 요청, 오디오, Phaser 게임을 정리합니다. SDK 초기화 도중 dispose되면 게임을 만들지 않습니다.

`App`은 장면이 바뀌어도 유지됩니다. 물리·게임 객체·입력 키는 Phaser 장면 수명을 따릅니다.
처리되지 않은 오류·Promise 거부는 `app.fail(message)`로 전달합니다. 다른 origin(광고·플랫폼 SDK, 브라우저 확장)에서 온 오류는 경고만 남깁니다. 기준은 `ErrorEvent.filename`의 origin, 세부 정보가 가려진 `Script error.`, Promise 거부 stack의 모든 위치가 다른 origin인 경우입니다. 위치를 알 수 없는 오류는 게임 오류로 봅니다. 게임 JS를 다른 origin(CDN)에서 제공한다면 `watchUncaughtErrors`의 `origin`을 그 값으로 바꿉니다. 첫 오류를 유지하고 `fatal` 이유로 플레이·오디오·SDK gameplay와 입력을 멈춥니다. 이후 `App.flush()`는 쓰지 않으며, HMR 정리·pagehide·자동 저장도 이를 따릅니다. 새로고침으로 복구합니다.

## 일시정지

`PauseState`는 이유를 집합으로 보관하고, 모든 이유가 사라질 때만 재개합니다. 그래서 탭 복귀가 수동 정지를 풀지 않습니다.
일시정지 동안 `gameConfig.pausableScenes`의 장면과 오디오를 멈춥니다. 메뉴 연출처럼 멈출 필요 없는 장면은 목록에서 뺍니다.
광고 `service` 이유만 있을 때는 장면만 멈추고 `adStarted`부터 음소거합니다. 플랫폼 음소거는 사용자 설정과 별도로 보관합니다.
`PauseState`의 두 번째 callback은 이유가 바뀔 때마다 실행되어 숨김 상태에서 수동 정지를 추가해도 gameplay 이벤트가 반영됩니다.
수동 토글(버튼·Escape)은 `has('manual')`을 기준으로 해서 다른 이유로 멈춘 동안에도 의도대로 동작합니다.
`fatal`은 오류 복구 전까지 유지합니다. 광고 완료·탭 복귀·설정창 닫기가 이 이유를 해제하지 않습니다. Shell은 열린 설정창을 닫고 새로고침·전체화면 나가기 외의 조작을 비활성화합니다.

## 저장

`Store<T>`는 envelope 하나를 localStorage 키 하나에 기록합니다. 게임이 `defaults`/`validate`/`migrations`를 제공합니다.
순차 migration과 최종 validate가 모두 성공해야 정상 load로 인정합니다. 갱신하면 dirty가 되고, 판 종료·주기·탭 숨김·pagehide에서 flush합니다.
브라우저 종료 시 이벤트는 보장되지 않으므로 중요한 진행은 즉시 flush합니다.

| 상태           | 의미와 동작                                          |
| -------------- | ---------------------------------------------------- |
| ready          | 검증된 데이터, 쓰기 가능                             |
| corrupt        | JSON/schema/migration 실패. 원본 쓰기 차단           |
| future-version | 앱보다 높은 버전. 원본 쓰기 차단                     |
| unavailable    | 접근 거부/용량 부족. 메모리로 플레이, 저장 실패 표시 |

- 실패 상태에서도 `update`는 메모리 값을 바꾸지만 `false`를 반환합니다.
- 정상 읽기(빈 저장 포함) 후 쓰기만 실패했다면 `canRetry`가 true입니다. 다음 `flush()`가 최신 메모리 값을 재시도하며 성공하면 `ready`로 복구합니다. 자동 저장과 Shell의 저장 다시 시도 버튼이 같은 경로를 사용합니다. 초기 읽기 실패·손상·미래 버전·저장소 미제공에는 재시도를 허용하지 않습니다.
- 원본을 지우는 것은 사용자가 확인한 `reset()`뿐입니다. 게임 저장과 설정은 다른 키라서 서로 지우지 않습니다.
- 저장소는 생성 시 주입합니다. CrazyGames local/실환경은 SDK Data, SDK disabled/명시적 비활성화는 localStorage, SDK 초기화 실패는 쓰기 불가입니다. Data 실패 후 localStorage로 전환하지 않습니다.
- localStorage는 origin(도메인·포트)별·브라우저별로 분리됩니다. 새 게임은 `storagePrefix`를 바꿔 같은 도메인의 다른 게임과 충돌을 피합니다.
- 여러 탭은 마지막 쓰기가 이깁니다. 암호화·부정행위 방지·서버 동기화가 없으므로 실제 화폐/권한의 원본으로 쓰지 않습니다.

## 오디오, 입력, 화면

- `AudioService`는 master/mute를 sound manager에, music/sfx 음량을 각 sound에 적용합니다. asset 키는 호출하는 쪽이 넘깁니다.
- BGM은 사용자 동작 이후 시작하고 일시정지 동안 멈춥니다. 설정을 바꾸면 즉시 반영합니다.
- 입력은 Phaser world 좌표를 쓰고, 캔버스(`#game`)만 `touch-action: none`입니다. 키보드 이벤트는 `#game`에서만 받습니다.
- `Scale.EXPAND` + 안전 영역(`gameConfig.width`×`height`). `core/viewport.ts`의 `centerSafeArea`가 카메라를 렌더 배율 k로 zoom하고, 화면 크기 변경 때마다 안전 영역 중앙에 맞춥니다.
- 게임 화소 크기는 `안전 영역 × k`(`App.renderScale`, 시작 시 한 번 결정). 텍스처는 k배로 준비해 `1/k`로 줄여 씁니다.
- 전체화면 대상은 캔버스·오버레이·조작 버튼 줄을 포함하는 게임 카드 `#stage`입니다. 전체화면에서도 시작·일시정지·재개·메뉴·재시작이 가능합니다. `bindFullscreenOrientation`은 게임 카드가 전체화면에 진입한 뒤 방향 고정을 요청하고, 버튼·Esc·시스템 뒤로 가기로 전체화면을 종료하면 고정을 풉니다. 전체화면 버튼은 iframe이 전체화면을 허용할 때(`document.fullscreenEnabled`)만 보입니다.
- 배치는 `resolveLayout`이 시작 시 한 번 정합니다. `gameConfig.layout`이 `auto`면 iframe 안은 `embed`, 단독 페이지는 `page`이며 `?layout=`이 우선합니다. `embed`는 `#stage`가 창 전체를 채우고 문서가 스크롤되지 않습니다.
- 문구는 `App.text`(`src/game/strings.ts`)에서 읽습니다. `gameConfig.locale`이 `auto`면 브라우저 언어에서 지원 언어를 고르고, 없으면 `fallbackLocale`입니다. `core/`·`services/`는 문구를 직접 갖지 않고 상태 코드(예: `PlatformContext.warning = 'platform-unavailable'`)를 돌려줍니다.
- 설정을 갱신하거나 초기화한 뒤 `app.applySettings()`를 호출합니다. 오디오와 `app.listenSettings()` 구독자에 즉시 반영하고 Shell을 갱신합니다. 구독은 현재 설정을 즉시 전달하며 반환한 해제 함수를 장면 shutdown 때 호출합니다. 메뉴 반복 tween과 CSS 전환은 저장된 `reducedMotion`을 따릅니다. OS 설정은 새 설정의 기본값으로 사용합니다.

## HTML UI 계약

`SystemUi`(`src/ui/system.ts`)는 데모 Shell과 분리된 공통 계약입니다. HTML UI를 교체해도 생성해서 `render()`를 호출합니다.

- 캔버스 컨테이너에 일시정지·회전·오류 안내(새로고침)와 전체화면 나가기 버튼을 붙입니다.
- `[data-game-control]` 요소는 준비 전·광고 요청 중·오류 상태에서 비활성화합니다.
- 오류 상태에서는 범위 안의 모든 버튼·입력(`[data-recovery]` 제외)을 막고 캔버스를 inert로 바꾸며 열린 dialog를 닫습니다.
- UI는 자기 표시를 갱신한 뒤 `render()`를 호출하고, 추가 비활성화 조건은 그 뒤에 `disabled ||= ...`로만 더합니다.

## 서비스

`PlatformAdapter`는 광고·구매·분석·플레이 이벤트의 교체 지점입니다. `CrazyGamesAdapter`, 개발용 `MockAdapter`, `UnavailableAdapter`가 있습니다.
`PlatformServices`가 gate(기능 스위치, capability, Mock 동의, 동시 요청)와 오류 변환을 담당합니다. 실제 CrazyGames 호출에 Mock 동의를 요구하지 않습니다.
완료 결과는 `{ status: 'completed', mock: boolean }`입니다. 실제 CrazyGames 광고만 `mock: false`이며 local SDK와 Mock은 `true`입니다. 보상 규칙은 게임에서 처리합니다.
`app.setGameplay()`는 조작 가능한 플레이 상태를 받고, 의도적 정지·광고 중단과 합쳐 SDK 이벤트를 보냅니다. 탭 숨김만으로는 gameplayStop을 보내지 않습니다.
광고는 요청부터 UI/게임을 멈추고 실제 시작 callback부터 음소거하며, 종료·실패 때 광고 이유만 해제합니다. Adapter는 timeout·중복/늦은 callback·destroy 시 취소를 처리합니다.
Basic Launch는 광고 capability를 끕니다(local 데모 제외). 지원하지 않는 결제와 자체 분석은 unavailable/false입니다. 설정과 제출 방법은 [CrazyGames 안내](CRAZYGAMES.md)를 봅니다.
`gameConfig.platform`은 검증된 `VITE_PLATFORM`에서 결정하며, `standalone`은 SDK를 요청하지 않고 브라우저 저장소를 선택합니다. 개발 서버의 기본값과 `--mode crazygames`는 CrazyGames를 선택합니다. 배포 빌드(`vite build`)는 mode나 `VITE_PLATFORM`으로 대상을 명시해야 하며, 없으면 중단합니다. 명시한 플랫폼 mode와 환경 변수의 충돌·잘못된 값은 Vite 시작·빌드에서 거절합니다.

실제 Adapter 도입 시:

1. 별도 파일에서 SDK를 감싸고, `bootstrap.ts` 선택 경로와 준비 상태에 따른 capability를 추가합니다.
2. 광고 완료 callback, 구매 서버 검증·중복 처리·pending·복원 정책을 정합니다.
3. 취소/실패/동의 철회/timeout/중복 callback을 검사합니다. 끝나지 않는 Promise에는 timeout과 요청 ID를 둡니다.
4. SDK 버전·약관·검증 결과를 [의존성](DEPENDENCIES.md)에 기록합니다.

지원하지 않는 기능을 성공으로 가장하지 않습니다. 공유·로그인·리더보드 등은 게임 요구가 정해질 때 추가합니다.

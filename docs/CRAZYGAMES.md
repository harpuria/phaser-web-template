# CrazyGames SDK

이 템플릿은 HTML5 SDK v3를 기본으로 초기화합니다. 설정은 `src/config/game.ts`의 `services.crazyGames`에 있습니다.
게임은 SDK를 직접 호출하지 않고 `app.platform`을 사용합니다.

## 환경과 실행

| 환경                                | 동작                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| CrazyGames / Preview                | 실제 SDK 이벤트와 Data 저장. `launch: 'basic'`에서는 광고 요청 차단          |
| localhost / 127.0.0.1               | SDK의 local 환경. 데모 광고 결과는 `mock: true`                              |
| 다른 호스팅에서 SDK가 disabled 반환 | 브라우저 로컬 저장. 개발 빌드만 기존 Mock 선택 가능                          |
| SDK 로드·초기화 실패 / 10초 초과    | 메모리로 플레이, 저장·광고 중지, 재시도 안내. 로컬·클라우드 원본을 쓰지 않음 |

같은 네트워크의 휴대폰에서 IP 주소로 접속할 때는 `?useLocalSdk=true`로 SDK local 환경을 요청합니다.
SDK 없이 개발하거나 다른 플랫폼용으로 배포하려면 `services.crazyGames.enabled = false`로 바꿉니다.
실제 SDK는 `https://sdk.crazygames.com/crazygames-sdk-v3.js`에서 불러옵니다. 오프라인 개발은 SDK를 끄고 실행합니다.

## 장면과 일시정지

- `main.ts`는 SDK 초기화가 끝난 뒤 `App`과 저장소를 만듭니다. Data가 미리 로드되기 전에 기본 진행을 쓰지 않습니다.
- Preload가 `loadingStart()` / `loadingStop()`을 알립니다. asset 실패 시 준비 완료를 보내지 않습니다.
- 조작 가능한 장면에서 `app.setGameplay(true)`, 결과·메뉴·장면 shutdown에서 `app.setGameplay(false)`를 호출합니다. 예제는 이미 연결되어 있습니다.
- `app.pause.set('이유', true/false)`를 쓰면 수동 정지와 UI 중단도 SDK에 전달됩니다. 탭 숨김만으로는 SDK gameplay 이벤트를 보내지 않습니다.
- 광고 요청부터 완료·실패까지 `service` 이유로 게임을 멈춥니다. HTML UI도 이 동안 비활성화해야 합니다. 예제 Shell은 이를 처리합니다.
- 광고가 실제 시작한 callback에서만 음소거합니다. 기존 수동 정지, 사용자 음소거와 SDK `game.settings.muteAudio`를 보존합니다. SDK 설정 변경 listener는 종료 시 제거합니다.

## 광고 연결

기본 `launch: 'basic'`은 실제 CrazyGames 광고를 요청하지 않습니다. **Full Launch 승인 후** `launch: 'full'`로 바꿉니다.
공통 `services.ads = false`는 모든 광고를 끕니다. local 환경의 데모 광고는 Basic 설정에서도 연습할 수 있습니다.

`await app.platform.midgame()`은 판 종료·레벨 전환처럼 자연스러운 중단점에서 호출합니다. 예제는 판이 끝날 때 호출합니다.
메뉴·설정 버튼에 광고를 붙이지 않습니다. 빈 광고, 광고 차단, cooldown, Basic Launch 거절은 `unavailable`로 반환하고 계속 플레이할 수 있습니다.
SDK 오류·180초 callback timeout은 `error`이며 보상을 지급하지 않습니다. 중복·이전 요청의 늦은 callback은 무시합니다.

보상형은 보상 내용을 명확히 표시한 버튼을 사용자가 누른 뒤에만 요청합니다. 게임별 보상 규칙은 `src/game/`에 둡니다.

```ts
const result = await app.platform.rewarded();
if (result.status === 'completed' && !result.mock) {
  // 이 위치에서 게임의 보상을 한 번 지급하고 저장한다.
}
```

SDK `adFinished`만 완료로 취급합니다. `completed`만 확인하면 로컬 데모를 실제 보상으로 오인하므로 `mock`도 검사합니다.
실제 CrazyGames에서는 데모용 광고·구매 테스트 버튼을 숨깁니다. 결제·자체 분석 이벤트·배너·로그인 UI·리더보드는 이 Adapter에서 지원하지 않습니다.

## 저장과 제출

`save`와 `settings` 모두 SDK Data API를 `StoragePort`로 연결합니다. 기존 envelope와 schema 검증·migration은 그대로 적용됩니다.
Data 읽기 실패·손상·미래 버전 데이터는 원본을 덮어쓰지 않습니다. CrazyGames에서 Data 실패 후 localStorage로 대체하지 않습니다.
SDK가 disabled인 별도 호스팅에서만 기존 브라우저 저장을 씁니다.

1. 새 게임의 `storagePrefix`, 장면과 asset을 교체하고 `npm run check` 및 두 E2E 모드를 실행합니다.
2. `dist/` 내용 전체를 zip으로 묶습니다. zip 루트에 `index.html`이 있어야 합니다. Vite `base: './'`로 번들 asset 경로는 상대 경로입니다.
3. [Developer Portal](https://developer.crazygames.com/)에서 게임을 만들고 빌드를 올립니다.
4. **Progress Save에서 `Yes, using the Data Module from the CrazyGames SDK`를 선택합니다.** 끄면 Data API가 오류를 내며 이 템플릿은 저장 보호 상태가 됩니다.
5. Preview에서 gameplay 이벤트, 계정별 저장 복원, SDK 음소거, 광고 실패 후 재개를 확인합니다. Full Launch 후 광고 설정을 바꾸고 다시 검사합니다.

Data 저장 한도는 게임 전체 1MB입니다. `Store.flush()` 성공은 SDK가 쓰기를 받아들였다는 뜻이며 서버 동기화 완료를 보장하지 않습니다.
로그인 사용자는 기기 간 동기화, 게스트는 SDK가 관리하는 로컬 저장을 사용합니다. Data 사용 게임은 로그인 시 플랫폼이 게임을 다시 로드합니다.
이미 입점한 게임에 적용한다면 기존 로컬 키를 Data로 옮기는 별도 이관을 설계합니다. 템플릿은 클라우드 기록과 로컬 기록을 자동 병합하지 않습니다.

## 검증 범위와 공식 문서

자동 검사는 SDK 경계의 테스트 대역으로 초기화 순서, 이벤트, 저장 보호, 광고 완료·오류·timeout·중복 callback을 확인합니다.
이는 실제 광고 송출·수익·계정 동기화·입점 승인을 검증한 것이 아닙니다. 제출 게임의 Preview에서 확인해야 합니다.

- [SDK 설치·초기화·환경](https://docs.crazygames.com/sdk/intro/)
- [Gameplay·loading·muteAudio](https://docs.crazygames.com/sdk/game/)
- [광고 API](https://docs.crazygames.com/sdk/video-ads/) · [광고 요구사항](https://docs.crazygames.com/requirements/ads/)
- [Data 저장](https://docs.crazygames.com/sdk/data/) · [로그인 시 재로드](https://docs.crazygames.com/sdk/user/#auth-listener)
- [Basic / Full SDK 요구사항](https://docs.crazygames.com/requirements/technical/)

# CrazyGames SDK

CrazyGames HTML5 SDK v3를 기본으로 초기화한다(`src/config/game.ts`의 `services.crazyGames`).
게임 코드는 SDK를 직접 호출하지 않고 `app.platform`을 거친다.

## 배포 대상 선택

| 배포 대상   | 개발 서버                | 배포 빌드                  |
| ----------- | ------------------------ | -------------------------- |
| CrazyGames  | `npm run dev:crazygames` | `npm run build:crazygames` |
| 자체 호스팅 | `npm run dev:standalone` | `npm run build:standalone` |

- `npm run dev`는 CrazyGames가 기본이며, `npm run build`는 배포 대상을 지정하지 않으면 중단된다.
- `.env.local`이나 환경 변수 `VITE_PLATFORM=standalone` / `crazygames`로 기본값을 바꿀 수 있다. 전용 명령의 `--mode`와 충돌하거나 잘못된 값이 있으면 중단된다(예: `VITE_PLATFORM=standalone`이 남아 있으면 CrazyGames 빌드 불가).
- 선택 결과는 `gameConfig.platform`과 `services.crazyGames.enabled`에 반영된다. 자체 호스팅 빌드는 SDK 장애와 무관하게 브라우저 로컬 저장소를 쓴다.

## 환경별 동작

| 실행 환경                                      | 동작                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| CrazyGames / Preview                           | 실제 SDK 이벤트·Data 저장 사용(`launch: 'basic'`에서는 광고 요청 차단)     |
| `localhost` / `127.0.0.1`                      | SDK `local` 환경으로 동작. 데모 광고는 `mock: true` 반환                   |
| CrazyGames 외 호스팅에서 SDK가 `disabled` 반환 | 브라우저 로컬 저장소 사용. 개발 빌드에서만 기존 Mock 선택 가능             |
| SDK 로드·초기화 실패 또는 10초 시간 초과       | 메모리 전용 플레이(저장·광고 중지, 재시도 안내). 기존 원본은 덮어쓰지 않음 |

- 같은 Wi-Fi 휴대폰에서 IP 주소로 접속할 때는 `?useLocalSdk=true`를 붙여 SDK `local` 환경을 요청한다.
- SDK 없이 개발하거나 다른 플랫폼용으로 배포할 때는 `standalone` 명령을 쓴다.
- 실제 SDK는 `https://sdk.crazygames.com/crazygames-sdk-v3.js`에서 불러온다(오프라인 개발은 `npm run dev:standalone`).

## 화면 배치와 언어

- CrazyGames는 게임을 iframe 안에서 실행한다. `gameConfig.layout: 'auto'`면 iframe에서 자동으로 `embed` 배치가 적용되어 게임 카드가 창 전체를 채우고 스크롤·소개·사이드바·외부 링크가 사라진다(제출용 게임은 `'embed'` 고정 가능).
- 로컬에서는 `npm run dev:crazygames` 후 `?layout=embed`로 미리 본다. `embed.spec.ts`가 1040×585 등 iframe 크기에서 무스크롤과 버튼 노출을 검증한다.
- 전체화면 버튼은 iframe이 전체화면을 허용할 때만 보인다. 플랫폼이 자체 전체화면 버튼을 제공하면 게임 내 버튼 유지 여부를 요구사항에 맞춰 정한다.
- 문구는 브라우저 언어를 자동 감지하며 기본 대체 언어는 영어다(`gameConfig.locale`, `fallbackLocale`). 글로벌 이용자를 위해 영어 문구를 유지한다.
- 광고·SDK·브라우저 확장 등 다른 origin 스크립트 오류는 게임을 멈추지 않는다. 게임 코드 오류만 오류 화면으로 멈춘다.

## 장면과 일시정지

- `main.ts`는 SDK 초기화 완료 후 `App`과 저장소를 만든다. SDK Data 로드 전에 초기값으로 기존 진행 데이터를 덮어쓰지 않는다.
- `Preload`가 `loadingStart()`·`loadingStop()`을 호출한다. asset 로드 실패 시 준비 완료 신호를 보내지 않는다.
- 조작 가능한 장면에서 `app.setGameplay(true)`, 결과·메뉴·`shutdown`에서 `app.setGameplay(false)`를 호출한다(예제에 이미 연결됨).
- `app.pause.set('이유', true/false)`로 수동·UI 일시정지가 SDK에 전달된다(탭 숨김만으로는 gameplay 이벤트를 보내지 않음).
- 광고 요청부터 완료·실패까지 `service` 이유로 게임을 멈추며 HTML UI도 비활성화한다(예제 Shell 기본 처리).
- 광고 음소거는 `adStarted` 콜백 시점에만 적용한다. 기존 수동 일시정지·사용자 음소거·SDK `muteAudio` 상태는 보존하고, SDK 설정 listener는 종료 시 해제한다.

## 광고 연결

기본값 `launch: 'basic'`에서는 실제 광고를 요청하지 않는다. **Full Launch 승인 후** `launch: 'full'`로 바꾼다.
`services.ads = false`로 모든 광고를 끌 수 있으며, `local` 데모 광고는 Basic 설정에서도 테스트할 수 있다.

- `await app.platform.midgame()`은 판 종료·레벨 전환 같은 자연스러운 중단점에서 호출한다(메뉴·설정 버튼 금지).
- 빈 광고·광고 차단·쿨다운·Basic Launch 제한 시 `unavailable`을 반환하고 게임을 계속 진행한다.
- SDK 오류나 180초 콜백 시간 초과 시 `error`를 반환하며 보상을 지급하지 않는다. 중복 호출이나 늦은 콜백은 무시한다.
- 보상형 광고는 보상 내용을 명시한 버튼을 사용자가 누른 뒤에만 요청한다. 보상 규칙은 `src/game/`에 둔다.

```ts
const result = await app.platform.rewarded();
if (result.status === 'completed' && !result.mock) {
  // 이 위치에서 게임의 보상을 한 번 지급하고 저장한다.
}
```

- `adFinished` 콜백만 정상 완료로 본다. 로컬 데모 광고를 실제 보상으로 오인하지 않도록 반드시 `status === 'completed' && !result.mock`을 함께 확인한다.
- 실제 CrazyGames에서는 데모용 광고·구매 버튼을 숨긴다. 결제·자체 분석·배너·로그인 UI·리더보드는 지원하지 않는다.

## 저장과 제출

`save`와 `settings` 모두 SDK Data API를 `StoragePort`로 연결하며, 기존 envelope·schema 검증·migration 규칙을 그대로 따른다.
Data 읽기 실패·손상·미래 버전은 원본을 덮어쓰지 않고 `localStorage`로 대체하지도 않는다(브라우저 저장소는 SDK `disabled`인 별도 호스팅 전용).

1. `storagePrefix`·장면·asset을 교체하고 `npm run check`와 개발·배포 E2E를 통과시킨다. 최종 빌드는 `npm run build:crazygames`로 생성한다.
2. `dist/` 전체를 zip으로 압축한다(루트에 `index.html`, Vite `base: './'`로 상대 경로 사용).
3. [Developer Portal](https://developer.crazygames.com/)에 게임을 등록하고 zip을 업로드한다.
4. **Progress Save에서 `Yes, using the Data Module from the CrazyGames SDK`를 선택한다.** 끄면 Data API 오류로 저장 보호 상태가 된다.
5. Preview에서 gameplay 이벤트, 계정별 저장 복원, SDK 음소거, 광고 실패 후 재개, iframe 전체 채움과 무스크롤 여부를 확인한다. Full Launch 후에는 광고 설정을 켜고 다시 확인한다.

- Data 저장 한도는 게임 전체 1MB다. `Store.flush()` 성공은 SDK가 쓰기 요청을 수락했다는 뜻이며 서버 동기화 완료를 보장하지는 않는다.
- 로그인 사용자는 클라우드 동기화, 게스트는 SDK 로컬 저장소를 쓴다. Data 사용 게임은 로그인 시 플랫폼이 게임을 재로드한다.
- 이미 입점한 게임에 적용할 때는 기존 로컬 키를 SDK Data로 옮기는 이관 절차를 별도로 설계해야 한다(자동 병합 없음).

## 검증 범위와 공식 문서

- **자동 E2E 테스트**: SDK 테스트 대역으로 초기화 순서, 이벤트, 저장 보호, 광고 완료·오류·시간 초과·중복 콜백을 검증한다. 실제 광고 송출·수익·계정 동기화·입점 승인은 CrazyGames Preview에서 직접 확인해야 한다.
- **공식 CDN 테스트(`npm run test:sdk`)**: 외부 네트워크와 Playwright Chromium에서 공식 CDN SDK를 직접 불러와 `local` 초기화, SDK 음소거, rewarded/midgame 콜백과 조작 복구, gameplay 이벤트, Data 복원을 검증한다.
  - 관찰 기록(SDK 버전·HTTP 식별값·SHA-256·콘솔 오류·단계별 결과)은 `test-results/sdk/report.json`과 `sdk-observation.json`에 저장되며 실패 시에도 trace와 함께 남는다.
- **CI 선택 실행**: GitHub Actions 수동 실행의 `sdk_smoke` 옵션으로 `test:sdk`를 돌리고 결과를 artifact로 보관한다. 일반 push/PR은 네트워크에 독립적인 SDK 대역 테스트만 실행한다.

### 공식 문서

- [SDK 설치·초기화·환경](https://docs.crazygames.com/sdk/intro/)
- [Gameplay·loading·muteAudio](https://docs.crazygames.com/sdk/game/)
- [광고 API](https://docs.crazygames.com/sdk/video-ads/) · [광고 요구사항](https://docs.crazygames.com/requirements/ads/)
- [Data 저장](https://docs.crazygames.com/sdk/data/) · [로그인 시 재로드](https://docs.crazygames.com/sdk/user/#auth-listener)
- [Basic / Full SDK 요구사항](https://docs.crazygames.com/requirements/technical/)

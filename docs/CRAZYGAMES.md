# CrazyGames SDK

이 템플릿은 CrazyGames HTML5 SDK v3를 기본으로 초기화합니다. 관련 설정은 `src/config/game.ts`의 `services.crazyGames`에 있습니다.
게임 코드는 SDK를 직접 호출하지 않고 `app.platform`을 통해 연동합니다.

## 배포 대상 선택

| 배포 대상   | 개발 서버                | 배포 빌드                  |
| ----------- | ------------------------ | -------------------------- |
| CrazyGames  | `npm run dev:crazygames` | `npm run build:crazygames` |
| 자체 호스팅 | `npm run dev:standalone` | `npm run build:standalone` |

- `npm run dev`는 CrazyGames 모드가 기본이며, `npm run build`는 배포 대상을 명시하지 않으면 중단됩니다.
- `.env.local`이나 실행 환경의 `VITE_PLATFORM=standalone` / `crazygames`로 기본 배포 대상을 바꿀 수 있습니다. 단, 전용 명령의 `--mode`와 환경 변수가 충돌하거나 허용되지 않은 값이 들어 있으면 실행·빌드가 중단됩니다(예: `VITE_PLATFORM=standalone`을 설정한 상태에서 CrazyGames 빌드를 하려면 해당 값을 바꾸거나 제거해야 합니다).
- 선택 결과는 `src/config/game.ts`의 `platform`과 `services.crazyGames.enabled`에 반영됩니다. 자체 호스팅용 빌드는 SDK 장애와 관계없이 브라우저 로컬 저장소를 사용합니다.

## 환경별 동작

| 실행 환경                                      | 동작                                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| CrazyGames / Preview                           | 실제 SDK 이벤트와 Data 저장을 사용합니다. `launch: 'basic'`에서는 광고 요청을 차단합니다                       |
| `localhost` / `127.0.0.1`                      | SDK의 `local` 환경으로 동작합니다. 데모 광고 결과는 `mock: true`로 반환됩니다                                  |
| CrazyGames 외 호스팅에서 SDK가 `disabled` 반환 | 브라우저 로컬 저장소를 사용합니다. 개발 빌드에서만 기존 Mock을 선택할 수 있습니다                              |
| SDK 로드·초기화 실패 또는 10초 시간 초과       | 메모리 상태로 플레이하며 저장·광고를 중지하고 재시도를 안내합니다. 기존 로컬·클라우드 원본은 덮어쓰지 않습니다 |

- 같은 네트워크의 휴대폰에서 IP 주소로 접속할 때는 주소 뒤에 `?useLocalSdk=true`를 붙여 SDK `local` 환경을 요청합니다.
- SDK 없이 개발하거나 다른 플랫폼용으로 배포하려면 `standalone` 명령을 사용합니다.
- 실제 SDK는 `https://sdk.crazygames.com/crazygames-sdk-v3.js`에서 불러옵니다. 오프라인 환경에서는 `npm run dev:standalone`으로 실행합니다.

## 화면 배치와 언어

- CrazyGames는 게임을 iframe 안에서 실행합니다. `gameConfig.layout: 'auto'`를 사용하면 iframe 안에서 자동으로 `embed` 배치가 적용되어 게임 카드가 창 전체를 채우고, 페이지 스크롤·소개 문구·사이드바·외부 링크가 제거됩니다. 제출용 게임은 `'embed'`로 고정해도 됩니다.
- 로컬에서는 `npm run dev:crazygames` 실행 후 `?layout=embed`로 같은 화면을 미리 확인할 수 있습니다. `embed.spec.ts`가 1040×585 등 iframe 크기에서 스크롤이 생기지 않고 조작 버튼이 화면 안에 들어오는지 테스트합니다.
- 전체화면 버튼은 iframe이 전체화면을 허용할 때만 표시됩니다. 플랫폼이 자체 전체화면 버튼을 제공한다면 게임 내부 버튼의 유지 여부를 플랫폼 요구사항에 맞춰 결정합니다.
- 문구는 브라우저 언어를 자동으로 따르며 기본 대체 언어는 영어입니다(`gameConfig.locale`, `fallbackLocale`). 글로벌 이용자를 위해 영어 문구를 유지합니다.
- 광고·SDK·브라우저 확장 등 다른 origin 스크립트에서 발생한 오류는 게임을 멈추지 않습니다. 게임 코드의 오류만 오류 안내 화면으로 멈춥니다.

## 장면과 일시정지

- `main.ts`는 SDK 초기화가 끝난 뒤 `App`과 저장소를 생성합니다. SDK Data가 로드되기 전에 초기값으로 기존 진행 데이터를 덮어쓰지 않습니다.
- `Preload`가 `loadingStart()`와 `loadingStop()`을 호출합니다. asset 로드에 실패하면 준비 완료 신호를 보내지 않습니다.
- 조작 가능한 장면에서 `app.setGameplay(true)`, 결과·메뉴 화면이나 장면 `shutdown`에서 `app.setGameplay(false)`를 호출합니다(예제 장면은 이미 연결되어 있습니다).
- `app.pause.set('이유', true/false)`를 사용하면 수동 일시정지와 UI 열림으로 인한 정지도 SDK에 함께 전달됩니다. 탭 숨김만으로는 SDK gameplay 이벤트를 보내지 않습니다.
- 광고를 요청한 시점부터 완료·실패까지 `service` 이유로 게임을 멈춥니다. 이 동안 HTML UI도 비활성화해야 하며, 예제 Shell은 이를 기본 처리합니다.
- 음소거는 광고가 실제로 시작되었을 때(`adStarted` 콜백)만 적용합니다. 기존 수동 일시정지, 사용자 음소거 설정, SDK의 `game.settings.muteAudio` 상태는 보존되며 SDK 설정 변경 listener는 종료 시 제거합니다.

## 광고 연결

기본값인 `launch: 'basic'` 상태에서는 실제 CrazyGames 광고를 요청하지 않습니다. **Full Launch 승인을 받은 뒤** `launch: 'full'`로 변경합니다.
공통 설정 `services.ads = false`를 지정하면 모든 광고를 끕니다. `local` 환경의 데모 광고는 Basic 설정에서도 테스트할 수 있습니다.

- `await app.platform.midgame()`은 판 종료나 레벨 전환처럼 자연스러운 중단점에서 호출합니다(예제는 판이 끝날 때 호출). 메뉴나 설정 버튼에는 광고를 붙이지 않습니다.
- 빈 광고, 광고 차단, 쿨다운, Basic Launch 제한으로 광고를 띄울 수 없으면 `unavailable`을 반환하며 게임은 그대로 계속 진행됩니다.
- SDK 오류나 180초 콜백 시간 초과가 발생하면 `error`를 반환하며 보상을 지급하지 않습니다. 중복 호출이나 이전 요청의 늦은 콜백은 무시합니다.
- 보상형 광고는 보상 내용을 명확히 표시한 버튼을 사용자가 직접 누른 뒤에만 요청합니다. 게임별 보상 규칙은 `src/game/`에 둡니다.

```ts
const result = await app.platform.rewarded();
if (result.status === 'completed' && !result.mock) {
  // 이 위치에서 게임의 보상을 한 번 지급하고 저장합니다.
}
```

- SDK `adFinished` 콜백만 정상 완료로 취급합니다. `status === 'completed'`만 확인하면 로컬 데모 광고를 실제 보상으로 오인할 수 있으므로 반드시 `!result.mock`을 함께 검사합니다.
- 실제 CrazyGames 환경에서는 데모용 광고·구매 테스트 버튼을 숨깁니다. 결제·자체 분석 이벤트·배너·로그인 UI·리더보드는 이 Adapter에서 지원하지 않습니다.

## 저장과 제출

`save`와 `settings` 모두 SDK Data API를 `StoragePort`로 연결합니다. 기존 envelope 형식과 schema 검증·migration 규칙은 그대로 적용됩니다.
Data 읽기 실패·손상·미래 버전 데이터는 원본을 덮어쓰지 않으며, CrazyGames 환경에서 Data 저장에 실패하더라도 `localStorage`로 대체하지 않습니다. SDK가 `disabled`를 반환하는 별도 호스팅 환경에서만 브라우저 저장소를 사용합니다.

1. 새 게임의 `storagePrefix`, 장면, asset을 교체하고 `npm run check`와 개발/배포 E2E 테스트를 모두 통과시킵니다. 제출할 최종 빌드는 `npm run build:crazygames`로 생성합니다.
2. `dist/` 폴더 내용 전체를 zip으로 압축합니다. zip 루트에 `index.html`이 있어야 하며, Vite `base: './'` 설정으로 번들 asset은 상대 경로를 사용합니다.
3. [Developer Portal](https://developer.crazygames.com/)에서 게임을 등록하고 빌드 zip을 업로드합니다.
4. **Progress Save 항목에서 `Yes, using the Data Module from the CrazyGames SDK`를 선택합니다.** 이 옵션을 끄면 Data API가 오류를 반환하여 게임이 저장 보호 상태로 전환됩니다.
5. Preview에서 gameplay 이벤트, 계정별 저장 복원, SDK 음소거, 광고 실패 후 재개, iframe을 꽉 채우는 배치와 스크롤이 생기지 않는지 확인합니다. Full Launch 승인 후에는 광고 설정을 켜고 다시 확인합니다.

- Data 저장 한도는 게임 전체 기준 1MB입니다. `Store.flush()` 성공은 SDK가 쓰기 요청을 수락했다는 뜻이며, 서버 동기화 완료를 보장하지는 않습니다.
- 로그인 사용자는 기기 간 클라우드 동기화를, 게스트는 SDK가 관리하는 로컬 저장소를 사용합니다. Data 모듈을 사용하는 게임은 사용자가 로그인할 때 플랫폼이 게임을 다시 로드합니다.
- 이미 입점한 게임에 이 템플릿을 적용한다면 기존 로컬 키를 SDK Data로 옮기는 별도의 데이터 이관 절차를 설계해야 합니다. 템플릿은 클라우드 기록과 로컬 기록을 자동으로 병합하지 않습니다.

## 검증 범위와 공식 문서

- **자동 E2E 테스트**: SDK 경계의 테스트 대역으로 초기화 순서, 이벤트, 저장 보호, 광고 완료·오류·시간 초과·중복 콜백을 검증합니다. 실제 광고 송출·수익·계정 동기화·입점 승인은 검증하지 않으므로 제출 전 CrazyGames Preview에서 직접 확인해야 합니다.
- **공식 CDN 테스트(`npm run test:sdk`)**: 외부 네트워크와 Playwright Chromium 환경에서 실제 공식 CDN SDK를 불러와 `local` 초기화, SDK 음소거 우선 적용, rewarded/midgame 콜백과 조작 복구, gameplay 이벤트, Data 새로고침 복원을 확인합니다. 실행 결과와 관찰 기록(SDK 실행 버전·HTTP 응답 식별값·SHA-256·콘솔 오류·단계별 결과)은 `test-results/sdk/report.json`과 하위 `sdk-observation.json`에 저장되며, 실패 시에도 기록과 trace를 남깁니다.
- **CI 선택 실행**: GitHub Actions 수동 실행에서 `sdk_smoke` 옵션을 켜면 `test:sdk`를 실행하고 결과를 artifact로 보관합니다. 일반 push/PR에서는 외부 네트워크에 의존하지 않는 SDK 대역 테스트만 실행합니다.

### 공식 문서

- [SDK 설치·초기화·환경](https://docs.crazygames.com/sdk/intro/)
- [Gameplay·loading·muteAudio](https://docs.crazygames.com/sdk/game/)
- [광고 API](https://docs.crazygames.com/sdk/video-ads/) · [광고 요구사항](https://docs.crazygames.com/requirements/ads/)
- [Data 저장](https://docs.crazygames.com/sdk/data/) · [로그인 시 재로드](https://docs.crazygames.com/sdk/user/#auth-listener)
- [Basic / Full SDK 요구사항](https://docs.crazygames.com/requirements/technical/)

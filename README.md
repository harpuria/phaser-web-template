# phaser-web-template

Phaser로 데스크톱·모바일 웹 게임을 만드는 시작용 프로젝트입니다.
저장, 설정, 오디오, 일시정지, 입력, 전체화면, 광고·결제 연결 지점처럼 매번 반복되는 준비를 미리 해 두었습니다.
CrazyGames 입점을 위한 SDK v3 초기화·플레이 이벤트·광고 Adapter·Data 저장이 기본으로 연결되어 있습니다.

**Phaser 4.2.1 · TypeScript · Vite · 템플릿 0.4.0** — 버전과 선택 근거는 [의존성](docs/DEPENDENCIES.md)에 있습니다.

## 실행하기

Node.js는 `.nvmrc`의 24.x를 권장합니다. 22.x는 22.13.0부터 지원하며, 26.0.0 이상도 사용할 수 있습니다.

```bash
npm ci
npm run dev
```

터미널의 Local 주소(기본 `http://localhost:5173`)를 엽니다. 휴대폰은 같은 네트워크에서 Network 주소로 접속합니다.
`플레이 시작`을 누르면 30초 동안 별을 모으는 예제 게임이 실행됩니다.
방향키·WASD·게임패드로 움직이거나, 게임 화면을 누르고 있으면 그 지점으로 이동합니다.
SDK 없이 자체 호스팅용으로 개발하거나 외부 네트워크가 막힌 환경에서는 `npm run dev:standalone`을 사용합니다. `npm run dev`의 기본 대상은 CrazyGames입니다.
화면은 단독 페이지로 열면 소개 페이지(`page`), iframe 안(CrazyGames·itch.io)에서는 게임이 창을 꽉 채우는 배치(`embed`)로 표시됩니다. `?layout=embed`로 미리 볼 수 있습니다.

## 들어 있는 기능

| 기능                                                  | 위치                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| Boot → Preload → 시작 장면, 페이드 전환               | `src/scenes/`, `src/core/navigation.ts`                |
| 키보드·마우스·터치·게임패드 이동 입력                 | `src/core/input.ts`                                    |
| 저장 버전·순차 migration·손상 데이터 보호             | `src/core/store.ts`, `src/game/save.ts`                |
| 음소거·전체/BGM/SFX 음량, 움직임 줄이기 설정          | `src/core/settings.ts`, `audio.ts`                     |
| 수동·설정창·탭 숨김 일시정지                          | `src/core/pause.ts`                                    |
| 반응형 화면(EXPAND 안전 영역), 전체화면·회전 안내     | `src/core/viewport.ts`, `screen.ts`, `src/ui/Shell.ts` |
| iframe 배포용 전체 화면 배치(`embed`)                 | `src/core/layout.ts`, `src/ui/Shell.ts`, `style.css`   |
| 한국어·영어 문구, 브라우저 언어 자동 선택             | `src/game/strings.ts`, `src/core/locale.ts`            |
| 처리되지 않은 오류 안내 화면(외부 스크립트 오류 제외) | `src/core/errors.ts`, `src/ui/system.ts`               |
| 광고·결제·분석 Adapter와 개발용 Mock                  | `src/services/platform.ts`                             |
| CrazyGames SDK v3, 플레이 이벤트·광고·Data 저장       | `src/services/crazygames.ts`, `bootstrap.ts`           |
| 린트·포맷·타입·단위·브라우저 검사, CI                 | `npm run check`, `npm run test:e2e`                    |

CrazyGames는 Basic Launch 설정이 기본입니다. Full Launch 승인 후 광고를 켜고, 제출할 때 **Progress Save에서 SDK Data 사용을 선택**합니다.
설정·광고 호출 예제·Preview 검증 절차는 [CrazyGames 안내](docs/CRAZYGAMES.md)에 있습니다.
로컬 SDK 광고와 Mock은 실제 보상/결제가 아닙니다. 결제·로그인 UI·리더보드·PWA/offline은 포함하지 않습니다.

## 내 게임으로 바꾸기

[적용 절차](docs/template/APPLYING.md)로 새 프로젝트를 만든 뒤, [게임 문서](docs/game/README.md)에 기획을 적고 [개발 안내의 교체 체크리스트](docs/DEVELOPMENT.md#데모를-내-게임으로-바꾸기)를 따라 데모를 교체합니다.

## 명령

```bash
npm run dev                     # 개발 서버 (?debug 를 붙이면 물리 충돌 영역 표시)
npm run dev:standalone          # 외부 SDK 없이 개발
npm run build:standalone        # 자체 호스팅용 dist 생성
npm run build:crazygames        # CrazyGames 제출용 dist 생성
npm run check                   # lint + format + 단위 검사 + typecheck + 두 대상 빌드 확인
npx playwright install chromium firefox webkit # E2E 첫 실행 전 한 번
npm run test:e2e                # Chromium·Firefox·WebKit 및 모바일 Chromium 검사
E2E_PREVIEW=1 npm run test:e2e  # 전용 CrazyGames 빌드를 생성해 검사
npm run test:e2e:standalone     # 자체 호스팅용 배포 빌드·저장·SDK 미요청 검사
npm run test:sdk                # 공식 CDN SDK local 검사 (네트워크 필요)
npm run preview                 # dist를 로컬에서 확인
```

배포는 `build:standalone` 또는 `build:crazygames`로 만든 `dist/` 내용 전체를 올리면 됩니다. 대상 없이 `npm run build`를 실행하면 실수로 다른 플랫폼용 빌드를 올리지 않도록 중단합니다.
`VITE_PLATFORM=standalone` / `crazygames`로 기본 대상을 설정할 수 있습니다. 전용 명령의 대상과 환경 변수가 충돌하면 실행·빌드를 중단합니다. 자세한 내용은 [개발 안내 — 정적 배포](docs/DEVELOPMENT.md#정적-배포)를 봅니다.

## 문서

| 문서                                                                                                                 | 언제 읽나                                      |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [게임 문서](docs/game/README.md)                                                                                     | 파생 게임의 기획·결정 기록(게임 작업 전)       |
| [개발 안내](docs/DEVELOPMENT.md)                                                                                     | 장면·asset·저장·입력 작업, 배포, 문제 해결     |
| [구조와 계약](docs/ARCHITECTURE.md)                                                                                  | `core/`·`services/`·`app.ts`를 고치기 전       |
| [의존성](docs/DEPENDENCIES.md)                                                                                       | 버전을 올리거나 라이선스를 확인할 때           |
| [CrazyGames SDK](docs/CRAZYGAMES.md)                                                                                 | 플랫폼 설정, 광고·저장 연결, 제출 전 확인      |
| [적용 절차](docs/template/APPLYING.md)                                                                               | 새 게임을 만들거나 템플릿 업데이트를 가져올 때 |
| [변경 기록](docs/template/CHANGELOG.md) · [검증 기록](docs/template/VALIDATION.md) · [점검](docs/template/REVIEW.md) | 템플릿 자체의 이력                             |

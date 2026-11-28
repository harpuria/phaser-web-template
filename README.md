# phaser-web-template

Phaser로 데스크톱·모바일 웹 게임을 만들기 위한 스타터 템플릿입니다.
저장, 설정, 오디오, 일시정지, 입력, 전체화면, 광고·결제 연동 지점처럼 매번 반복되는 기반 기능을 미리 갖춰 두었습니다.
CrazyGames 입점에 필요한 SDK v3(초기화·플레이 이벤트·광고·클라우드 저장)도 기본 연동되어 있습니다.

**Phaser 4.2.1 · TypeScript · Vite · 템플릿 0.4.0** — 버전과 선택 근거는 [의존성](docs/DEPENDENCIES.md)에서 확인할 수 있습니다.

## 실행하기

Node.js는 `.nvmrc`의 24.x를 권장합니다. 22.x는 22.13.0부터 지원하며, 26.0.0 이상도 사용할 수 있습니다.

```bash
npm ci
npm run dev
```

- **접속**: 터미널에 표시되는 Local 주소(기본 `http://localhost:5173`)를 엽니다. 같은 Wi-Fi의 휴대폰에서는 Network 주소로 접속할 수 있습니다.
- **데모 플레이**: `플레이 시작`을 누르면 30초 동안 별을 모으는 예제 게임이 실행됩니다. 방향키·WASD·게임패드로 움직이거나, 게임 화면을 누른 채 원하는 방향으로 이동할 수 있습니다.
- **개발 모드 선택**: `npm run dev`는 기본적으로 CrazyGames 모드로 실행됩니다. SDK 없이 자체 호스팅용으로 개발하거나 외부 네트워크가 막힌 환경에서는 `npm run dev:standalone`을 사용합니다.
- **화면 배치**: 단독 페이지로 열면 소개·사이드바가 포함된 페이지(`page`)로, CrazyGames·itch.io 같은 iframe 안에서는 화면 전체를 채우는 임베드(`embed`) 모드로 표시됩니다. 주소 뒤에 `?layout=embed`를 붙여 미리 볼 수 있습니다.

## 주요 기능

| 기능                                                      | 위치                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| Boot → Preload → 시작 장면 흐름과 페이드 전환             | `src/scenes/`, `src/core/navigation.ts`                         |
| 키보드·마우스·터치·게임패드 통합 이동 입력                | `src/core/input.ts`                                             |
| 버전 관리·순차 migration·손상 데이터 보호 저장소          | `src/core/store.ts`, `src/game/save.ts`                         |
| 음소거·전체/BGM/SFX 음량 및 움직임 줄이기 설정            | `src/core/settings.ts`, `src/core/audio.ts`                     |
| 수동·설정창 열림·탭 숨김을 구분하는 중첩 일시정지         | `src/core/pause.ts`                                             |
| 반응형 화면(EXPAND 안전 영역), 전체화면 및 회전 안내      | `src/core/viewport.ts`, `src/core/screen.ts`, `src/ui/Shell.ts` |
| iframe 배포용 전체 화면 레이아웃(`embed`)                 | `src/core/layout.ts`, `src/ui/Shell.ts`, `src/style.css`        |
| 한국어·영어 문구 테이블과 브라우저 언어 자동 선택         | `src/game/strings.ts`, `src/core/locale.ts`                     |
| 예기치 않은 오류 안내 화면(외부 스크립트 오류 제외)       | `src/core/errors.ts`, `src/ui/system.ts`                        |
| 광고·결제·분석 Adapter 구조와 개발용 Mock                 | `src/services/platform.ts`                                      |
| CrazyGames SDK v3 연동(플레이 이벤트·광고·Data 저장)      | `src/services/crazygames.ts`, `src/services/bootstrap.ts`       |
| 린트·포맷·타입 검사, 단위·E2E 테스트 및 GitHub Actions CI | `npm run check`, `npm run test:e2e`                             |

- **CrazyGames 참고**: 기본 설정은 Basic Launch입니다. Full Launch 승인 후 광고를 켜고, 제출 시 **Progress Save에서 SDK Data 사용을 선택**합니다. 자세한 설정과 제출 절차는 [CrazyGames 안내](docs/CRAZYGAMES.md)를 참고합니다.
- **포함하지 않는 기능**: 로컬 SDK 데모 광고와 Mock은 실제 보상·결제가 아닙니다. 결제 연동, 로그인 UI, 리더보드, PWA/오프라인 모드는 포함하지 않습니다.

## 내 게임으로 바꾸기

[적용 절차](docs/template/APPLYING.md)에 따라 새 프로젝트를 만든 뒤, [게임 문서](docs/game/README.md)에 기획을 적고 [개발 안내의 교체 체크리스트](docs/DEVELOPMENT.md#데모를-내-게임으로-바꾸기)를 따라 데모를 교체합니다.

## 주요 명령어

```bash
# 개발
npm run dev                     # CrazyGames 모드 개발 서버 (?debug로 물리 충돌 영역 표시)
npm run dev:standalone          # 외부 SDK 없이 개발

# 빌드 및 미리보기
npm run build:standalone        # 자체 호스팅용 dist 생성
npm run build:crazygames        # CrazyGames 제출용 dist 생성
npm run preview                 # 생성된 dist를 로컬에서 확인

# 검증 및 테스트
npm run check                   # 린트 + 포맷 + 단위 테스트 + 타입 검사 + 두 플랫폼 빌드 확인
npx playwright install chromium firefox webkit # E2E 첫 실행 전 한 번 설치
npm run test:e2e                # Chromium·Firefox·WebKit 및 모바일 Chromium E2E 테스트
E2E_PREVIEW=1 npm run test:e2e  # CrazyGames 배포 빌드 기준 E2E 테스트
npm run test:e2e:standalone     # 자체 호스팅 빌드에서 SDK 미요청·로컬 저장 E2E 테스트
npm run test:sdk                # 공식 CDN SDK local 테스트 (외부 네트워크 필요)
```

- **배포**: `build:standalone` 또는 `build:crazygames`로 생성한 `dist/` 폴더 내용 전체를 정적 호스팅이나 플랫폼에 올립니다.
- **플랫폼 지정**: 배포 플랫폼을 지정하지 않고 `npm run build`를 실행하면, 잘못된 플랫폼용 빌드를 실수로 배포하는 일을 막기 위해 빌드가 중단됩니다. `.env.local`의 `VITE_PLATFORM` 설정과 정적 배포 세부 사항은 [개발 안내 — 정적 배포](docs/DEVELOPMENT.md#정적-배포)를 참고합니다.

## 문서

| 문서                                                                                                                 | 설명                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [게임 문서](docs/game/README.md)                                                                                     | 파생 게임의 기획과 결정 기록 (게임 기능 작업 전 작성)       |
| [개발 안내](docs/DEVELOPMENT.md)                                                                                     | 데모 교체, 장면·asset·저장·입력 개발, 배포 및 문제 해결     |
| [구조와 계약](docs/ARCHITECTURE.md)                                                                                  | `core/`·`services/`·`app.ts`를 수정하기 전에 읽는 설계 규칙 |
| [의존성](docs/DEPENDENCIES.md)                                                                                       | 패키지 버전, 선택 근거 및 라이선스 확인                     |
| [CrazyGames SDK](docs/CRAZYGAMES.md)                                                                                 | CrazyGames 플랫폼 설정, 광고·저장 연동 및 제출 전 확인      |
| [적용 절차](docs/template/APPLYING.md)                                                                               | 새 게임 프로젝트 생성 및 템플릿 업데이트 반영 방법          |
| [변경 기록](docs/template/CHANGELOG.md) · [검증 기록](docs/template/VALIDATION.md) · [점검](docs/template/REVIEW.md) | 템플릿 자체의 변경·검증·점검 이력                           |

# phaser-web-template

Phaser로 데스크톱·모바일 웹 게임을 만들기 위한 스타터 템플릿이다.
저장·설정·오디오·일시정지·입력·전체화면 등 웹 게임마다 반복되는 기반 기능을 미리 구현했다.
CrazyGames SDK v3(초기화·플레이 이벤트·광고·클라우드 저장)도 바로 쓸 수 있게 연동했다.

**Phaser 4.2.1 · TypeScript · Vite · 템플릿 0.4.0** — 버전과 선정 이유는 [의존성](docs/DEPENDENCIES.md)에 정리했다.

## 실행하기

Node.js는 `.nvmrc`의 24.x를 권장한다(22.13.0 이상 또는 26.0.0 이상 지원).

```bash
npm ci
npm run dev
```

- **접속**: 터미널의 Local 주소(기본 `http://localhost:5173`)로 연다. 같은 Wi-Fi 휴대폰에서는 Network 주소를 사용한다.
- **데모**: `플레이 시작`을 누르면 30초 별 모으기 예제가 시작된다. 방향키·WASD·게임패드나 화면 터치(누른 방향)로 움직인다.
- **개발 모드**: 기본값은 CrazyGames다. SDK 없이 개발하거나 오프라인 환경에서는 `npm run dev:standalone`을 쓴다.
- **화면 배치**: 단독 페이지는 `page`, iframe(CrazyGames·itch.io) 안에서는 전체 화면 `embed`로 열린다(`?layout=embed`로 미리보기).

## 주요 기능

| 기능                                              | 위치                                                            |
| ------------------------------------------------- | --------------------------------------------------------------- |
| Boot → Preload → 시작 장면 흐름과 페이드 전환     | `src/scenes/`, `src/core/navigation.ts`                         |
| 키보드·마우스·터치·게임패드 통합 이동 입력        | `src/core/input.ts`                                             |
| 버전 관리·순차 migration·손상 데이터 보호 저장소  | `src/core/store.ts`, `src/game/save.ts`                         |
| 음소거·전체/BGM/SFX 음량, 움직임 줄이기 설정      | `src/core/settings.ts`, `src/core/audio.ts`                     |
| 중첩 일시정지(수동·설정창·탭 숨김)                | `src/core/pause.ts`                                             |
| 반응형 화면(EXPAND 안전 영역), 전체화면·회전 안내 | `src/core/viewport.ts`, `src/core/screen.ts`, `src/ui/Shell.ts` |
| iframe 배포용 전체 화면 레이아웃(`embed`)         | `src/core/layout.ts`, `src/ui/Shell.ts`, `src/style.css`        |
| 한·영 다국어 문구와 브라우저 언어 자동 선택       | `src/game/strings.ts`, `src/core/locale.ts`                     |
| 오류 안내 화면(외부 스크립트 오류 제외)           | `src/core/errors.ts`, `src/ui/system.ts`                        |
| 광고·결제·분석 Adapter와 개발용 Mock              | `src/services/platform.ts`                                      |
| CrazyGames SDK v3(플레이 이벤트·광고·Data 저장)   | `src/services/crazygames.ts`, `src/services/bootstrap.ts`       |
| 린트·포맷·타입 검사, 단위·E2E 테스트, CI          | `npm run check`, `npm run test:e2e`                             |

- **CrazyGames 참고**: 기본 설정은 Basic Launch다. Full Launch 승인 후 광고를 켜고, 제출 시 **Progress Save에서 SDK Data 사용을 선택**한다([CrazyGames 안내](docs/CRAZYGAMES.md)).
- **미포함**: 결제 연동, 로그인 UI, 리더보드, PWA/오프라인 모드(로컬 SDK 광고·Mock은 테스트용이며 실제 보상·결제가 아니다).

## 내 게임으로 바꾸기

[적용 절차](docs/template/APPLYING.md)로 새 프로젝트를 만든 뒤, [게임 문서](docs/game/README.md)에 기획을 적고 [교체 체크리스트](docs/DEVELOPMENT.md#데모를-내-게임으로-바꾸기)를 따라 데모를 교체한다.

## 주요 명령어

```bash
# 개발
npm run dev                     # CrazyGames 모드 개발 서버 (?debug로 충돌 영역 표시)
npm run dev:standalone          # 외부 SDK 없이 개발

# 빌드 및 미리보기
npm run build:standalone        # 자체 호스팅용 dist 생성
npm run build:crazygames        # CrazyGames 제출용 dist 생성
npm run preview                 # 생성된 dist 로컬 확인

# 검증 및 테스트
npm run check                   # 린트·포맷·단위 테스트·타입 검사·양 플랫폼 빌드 확인
npx playwright install chromium firefox webkit # E2E 첫 실행 전 1회 설치
npm run test:e2e                # Chromium·Firefox·WebKit·모바일 Chromium E2E
E2E_PREVIEW=1 npm run test:e2e  # CrazyGames 배포 빌드 E2E
npm run test:e2e:standalone     # 자체 호스팅 빌드 E2E(SDK 미요청·로컬 저장)
npm run test:sdk                # 공식 CDN SDK local 테스트(외부 네트워크 필요)
```

- **배포**: `build:standalone` 또는 `build:crazygames`로 만든 `dist/` 전체를 호스팅이나 플랫폼에 올린다.
- **플랫폼 지정**: 플랫폼 없이 `npm run build`를 실행하면 오배포 방지를 위해 중단된다. `.env.local`의 `VITE_PLATFORM` 설정과 정적 배포 세부 절차는 [정적 배포](docs/DEVELOPMENT.md#정적-배포)를 참고한다.

## 문서

| 문서                                                                                                                 | 설명                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [게임 문서](docs/game/README.md)                                                                                     | 파생 게임의 기획·결정 기록(게임 작업 전 작성)    |
| [개발 안내](docs/DEVELOPMENT.md)                                                                                     | 데모 교체, 장면·asset·저장·입력, 배포, 문제 해결 |
| [구조와 계약](docs/ARCHITECTURE.md)                                                                                  | `core/`·`services/`·`app.ts` 수정 전 설계 규칙   |
| [의존성](docs/DEPENDENCIES.md)                                                                                       | 패키지 버전, 선정 이유, 라이선스                 |
| [CrazyGames SDK](docs/CRAZYGAMES.md)                                                                                 | CrazyGames 설정, 광고·저장 연동, 제출 전 확인    |
| [적용 절차](docs/template/APPLYING.md)                                                                               | 새 프로젝트 생성 및 템플릿 업데이트 반영         |
| [변경 기록](docs/template/CHANGELOG.md) · [검증 기록](docs/template/VALIDATION.md) · [점검](docs/template/REVIEW.md) | 템플릿 자체의 변경·검증·점검 이력                |

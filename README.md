# phaser-web-template

Phaser로 데스크톱·모바일 웹 게임을 만드는 시작용 프로젝트입니다.
`godot-mobile-template`의 공통 기능 / 게임 / 서비스 Adapter 분리 방식을 웹에 맞게 옮겼습니다.

**Phaser 4.2.1 · TypeScript · Vite · 템플릿 0.1.0**

2026-10-04 기준 [공식 최신 안정판](https://github.com/phaserjs/phaser/releases/tag/v4.2.1)과 npm `latest`가 모두 4.2.1입니다.
현행 Phaser의 별도 LTS 채널은 공식 배포 목록에서 확인되지 않아 최신 안정판을 정확한 버전으로 고정했습니다.
의존성은 `package-lock.json`에 잠겨 있습니다. [버전·출처](docs/DEPENDENCIES.md)

## 먼저 실행하기

Node.js 24와 npm을 준비한 뒤 프로젝트 폴더에서 실행합니다.

```bash
npm ci
npm run dev
```

터미널의 Local 주소(기본 `http://localhost:5173`)를 엽니다.
`플레이 시작`을 누르면 30초 동안 별을 모으는 예제 게임이 실행됩니다.
방향키/WASD로 움직이거나 게임 화면을 누르고 있으면 그 지점으로 이동합니다.
휴대폰은 같은 네트워크에서 터미널의 Network 주소로 접속합니다.

## 들어 있는 기능

| 기능                                      | 확인 방법                       |
| ----------------------------------------- | ------------------------------- |
| Boot → Preload → Menu → Game, 페이드 전환 | 플레이 → 메뉴 → 다시 플레이     |
| Arcade Physics, 키보드·마우스·터치        | 캐릭터를 움직여 별 수집         |
| 최고 기록·횟수 자동 저장                  | 한 판 완료 후 새로고침          |
| 저장 버전·순차 migration·손상 데이터 보호 | `src/core/store.ts`, 단위 검사  |
| 별도 설정 저장, 음소거·전체/BGM/SFX 음량  | 설정 열기, 효과음 듣기          |
| 수동·설정창·탭 숨김 일시정지              | 일시정지 또는 Escape, 설정 열기 |
| 반응형 화면·안전 영역·움직임 줄이기       | 화면 크기 변경, 설정 열기       |
| 광고/결제/분석 Adapter 및 개발용 Mock     | 하단 SERVICE PLAYGROUND         |
| 타입·린트·포맷·단위·브라우저 검사, CI     | 아래 검증 명령                  |

Mock은 성공/취소/오류 흐름을 연습하는 기능입니다. 실제 광고, 결제, 외부 분석 전송, 보상 지급은 없습니다.
광고·분석 Mock은 동의가 필요하며, **배포 빌드에서는 서비스가 `unavailable`을 반환**합니다.
실제 결제·광고·리더보드·로그인 SDK, 서버 저장, PWA/offline은 포함하지 않았습니다.

## 내 게임으로 바꾸기

1. [템플릿 적용 절차](docs/template/APPLYING.md)를 따라 새 프로젝트에 복사합니다.
2. `src/config/game.ts`의 이름, 저장 키, 시작 장면과 화면 크기를 바꿉니다.
3. `src/game/`에서 게임 장면·규칙·저장 schema·asset 목록을 작성합니다.
4. `src/main.ts`에서 장면을 등록하고 `src/ui/Shell.ts`의 데모 UI를 게임에 맞게 바꿉니다.
5. `index.html`의 설명과 `public/favicon.svg`를 바꿉니다.

직접 수정할 파일과 코드 예제는 [개발 안내](docs/DEVELOPMENT.md), 역할과 수명 관리는 [구조 안내](docs/ARCHITECTURE.md)에 있습니다.

## 검사와 배포

```bash
npm run check                  # lint + format + unit + typecheck + production build
npx playwright install chromium
npm run test:e2e               # 데스크톱/모바일 Chromium 검사
E2E_PREVIEW=1 npm run test:e2e  # 배포 빌드 검사 (먼저 npm run build)
npm run preview               # dist를 로컬에서 확인
```

`npm run build`로 생성한 **`dist/` 내용 전체**를 정적 호스팅에 업로드합니다.
상대 경로를 사용하므로 `/my-game/` 같은 하위 경로에도 배포할 수 있습니다.
`index.html`을 파일로 직접 열지 말고 HTTP 서버로 실행합니다.
호스팅 계정 생성이나 실제 배포는 수행하지 않습니다.

## 알아둘 점

- 로컬 저장은 브라우저와 origin별로 분리됩니다. 도메인/포트 변경, 브라우저 데이터 삭제 시 기록이 달라집니다.
- 손상/미래 버전 저장은 원본을 보호하고 메모리에서 플레이합니다. UI에 저장 불가 상태가 표시되며 사용자가 초기화할 때만 원본을 지웁니다.
- 음성 자동 재생 제한 때문에 BGM은 플레이 버튼을 누른 다음 시작합니다.
- 새 게임은 `storagePrefix`를 바꿔 같은 도메인의 다른 게임과 저장 키 충돌을 피합니다.
- 검증 범위와 미검증 항목은 [검증 기록](docs/template/VALIDATION.md)에 적습니다.

## 문서

- [개발 안내](docs/DEVELOPMENT.md): 게임 코드 교체, 저장 migration, 배포, 문제 해결
- [구조 안내](docs/ARCHITECTURE.md): 모듈 역할과 수명·서비스 계약
- [의존성](docs/DEPENDENCIES.md): 버전, 라이선스, 공식 근거
- [적용 절차](docs/template/APPLYING.md) · [변경 기록](docs/template/CHANGELOG.md) · [검증 기록](docs/template/VALIDATION.md)

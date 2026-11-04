# Phaser web template

게임 규칙·저장 schema·진행 상태·asset 목록·문구(`strings.ts`)는 `src/game/`에, 이름·해상도·언어·배치·기능 스위치는 `src/config/game.ts`에 둔다.
`src/main.ts`와 `src/app.ts`는 구성 지점이다. `src/core/`와 `src/services/`는 게임 간 재사용 경계이며 `src/game/`이나 데모 asset 키를 import하지 않는다.
데모 UI인 `src/ui/Shell.ts`는 파생 게임에 맞게 교체할 수 있다. 교체해도 `src/ui/system.ts`(오류·광고 중 조작 차단, 일시정지·회전 안내)는 연결한다.

## 시작

- `npm ci` 후 `npm run dev`(CrazyGames SDK local) 또는 `npm run dev:standalone`(외부 SDK 없음)을 실행한다. 외부 네트워크가 막힌 환경에서는 `dev:standalone`을 쓴다.
- 게임 기능 작업 전에 [게임 문서](docs/game/README.md)를 읽는다. 비어 있으면 기획 내용(장르·조작·판 구조·저장 항목·배포 대상)을 먼저 채운다.
- 배포 빌드는 대상을 명시한다: `npm run build:crazygames` 또는 `npm run build:standalone`. `npm run build`는 대상이 없으면 중단한다.

## 규칙

- 공통 API/수명/저장/서비스를 수정할 때 [구조 계약](docs/ARCHITECTURE.md)을 먼저 읽는다.
- 새 게임에 복사하거나 템플릿을 업데이트할 때 [적용 절차](docs/template/APPLYING.md)를 따른다.
- 의존성을 변경할 때 정확한 버전과 lockfile을 갱신하고 [의존성 기록](docs/DEPENDENCIES.md)에 근거를 남긴다. lockfile은 `.nvmrc`의 Node(npm 11)로 갱신한다.
- 저장 schema 변경에는 이전 fixture migration 검사를 추가한다. 읽기 실패 후 원본을 자동으로 덮어쓰지 않는다.
- 실제 광고·결제 SDK는 Adapter로 감싼다. production에서 Mock 성공을 실제 거래/보상으로 사용하지 않는다.
- 사용자에게 보이는 문구는 `src/game/strings.ts`에 모든 언어를 함께 추가한다. 검사는 문구가 아니라 id(`tests/e2e/ui.ts`)로 요소를 찾는다.

## 검증과 보고

- 검증은 `npm run check`, 관련 UI 변경은 `npm run test:e2e`로 수행한다. 배포 서비스 변경은 `E2E_PREVIEW=1 npm run test:e2e`, 배치 변경은 `embed.spec.ts`의 iframe 검사도 확인한다.
- 실제 실행한 검사와 미검증 브라우저/기기를 구분해 보고한다. Playwright 브라우저(Firefox·WebKit 등)를 설치하지 못해 일부 project만 실행했다면 실행한 project를 명시한다.

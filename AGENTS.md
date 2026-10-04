# Phaser web template

게임 규칙·저장 schema·asset 목록은 `src/game/`에, 이름·기능 스위치는 `src/config/game.ts`에 둔다.
`src/main.ts`와 `src/app.ts`는 구성 지점이다. `src/core/`와 `src/services/`는 게임 간 재사용 경계다.
데모 UI인 `src/ui/Shell.ts`는 파생 게임에 맞게 교체할 수 있다.

- 공통 API/수명/저장/서비스를 수정할 때 [구조 계약](docs/ARCHITECTURE.md)을 먼저 읽는다.
- 새 게임에 복사하거나 템플릿을 업데이트할 때 [적용 절차](docs/template/APPLYING.md)를 따른다.
- 의존성을 변경할 때 정확한 버전과 lockfile을 갱신하고 [의존성 기록](docs/DEPENDENCIES.md)에 근거를 남긴다.
- 저장 schema 변경에는 이전 fixture migration 검사를 추가한다. 읽기 실패 후 원본을 자동으로 덮어쓰지 않는다.
- 실제 광고·결제 SDK는 Adapter로 감싼다. production에서 Mock 성공을 실제 거래/보상으로 사용하지 않는다.
- 검증은 `npm run check`, 관련 UI 변경은 `npm run test:e2e`로 수행한다. 배포 서비스 변경은 build 후 `E2E_PREVIEW=1 npm run test:e2e`도 수행한다.
- 실제 실행한 검사와 미검증 브라우저/기기를 구분해 보고한다.

## Shell commands

명령은 `rtk`로 시작한다. 지원되지 않는 명령은 `rtk proxy <command>`로 실행한다.
예: `rtk npm run check`, `rtk proxy npx playwright test`, `rtk rg --files`.

# 새 게임에 적용하기

템플릿 버전: 0.4.0 · 저장소: https://github.com/harpuria/phaser-web-template

## 새 프로젝트 만들기

아래 중 하나로 git 이력 없이 템플릿 파일만 가져온다.

```bash
# 저장소가 GitHub 템플릿이면: 웹에서 "Use this template" 선택
npx degit harpuria/phaser-web-template my-game   # 공개 저장소일 때
git clone --depth 1 https://github.com/harpuria/phaser-web-template my-game && rm -rf my-game/.git
```

초기 설정 순서:

1. `npm ci` 후 `npm run dev`로 데모 실행을 확인한다(오프라인 환경은 `npm run dev:standalone`).
2. [게임 문서](../game/README.md)에 게임 개요와 출처(저장소 URL·버전·commit hash·적용 날짜)를 적는다.
3. [교체 체크리스트](../DEVELOPMENT.md#데모를-내-게임으로-바꾸기)를 따라 이름·저장 키·문구·장면·asset·UI를 바꾼다. CrazyGames 입점 게임은 [SDK 안내](../CRAZYGAMES.md)의 Progress Save와 gameplay 신호 연결도 확인한다.
4. `npm run check`와 E2E 테스트를 실행한다. `tests/e2e/ui.ts`의 ID만 새 UI에 맞추면 `contract`·`crazygames`·`embed` 테스트를 그대로 쓸 수 있다.

기존 프로젝트에 병합할 때는 파일을 덮어쓰지 말고 필요한 `core/`·`services/` 모듈만 가져온다.

## 템플릿 업데이트 가져오기

1. 기록해 둔 commit과 최신 템플릿의 diff에서 `core/`, `services/`, `scenes/`, 관련 테스트만 검토한다.
2. 게임의 `config/`, `game/`(schema·규칙), UI는 유지한다.
3. 저장 schema에 영향이 있으면 migration 테스트를 추가하고, [게임 문서](../game/README.md)의 템플릿 버전·commit을 갱신한다.

### 버전별 업그레이드 참고

- **CrazyGames 연동 추가 시**: `App` 생성 전에 `createPlatform()` 완료를 기다린다. 이미 입점한 게임의 로컬 데이터는 별도 SDK Data 이관이 필요하다.
- **플랫폼별 빌드 추가 시**: `src/config/platform.ts`, Vite 플랫폼 검증·`define`, npm 스크립트를 함께 반영하고 `gameConfig`의 `platform`·SDK 설정을 연결한다. 오류 감시는 `app.fail(message)`로 넘긴다.
- **0.4.0 반영 시**:
  - `src/ui/system.ts`를 추가해 게임 UI에서 `render()`를 호출하고 조작 버튼에 `data-game-control`을 붙인다.
  - 사용자 문구는 `src/game/strings.ts`로 옮기고 `PlatformContext.warning`의 `'platform-unavailable'` 코드 변경을 반영한다.
  - `npm run build`는 플랫폼 미지정 시 중단되므로 배포 스크립트가 `build:crazygames` 또는 `build:standalone`을 쓰는지 확인한다.

`docs/template/`는 템플릿 이력이다. 파생 게임의 기획·검증 기록은 `docs/game/`에 둔다.

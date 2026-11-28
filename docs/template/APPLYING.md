# 새 게임에 적용하기

템플릿 버전: 0.4.0 · 저장소: https://github.com/harpuria/phaser-web-template

## 새 프로젝트 만들기

아래 방법 중 하나로 git 이력 없이 템플릿 파일만 가져온다.

```bash
# 저장소가 GitHub 템플릿으로 설정되어 있으면: 웹에서 "Use this template" 선택
npx degit harpuria/phaser-web-template my-game   # 공개 저장소일 때
git clone --depth 1 https://github.com/harpuria/phaser-web-template my-game && rm -rf my-game/.git
```

이어서 아래 순서대로 초기 설정을 진행한다.

1. `npm ci` 후 `npm run dev`로 데모가 정상 실행되는지 확인한다. 외부 네트워크가 막힌 환경에서는 `npm run dev:standalone`을 사용한다.
2. [게임 문서](../game/README.md)에 게임 개요를 적고, 출처 표에 템플릿 저장소 URL·버전·가져온 commit hash·적용 날짜를 기록한다.
3. [교체 체크리스트](../DEVELOPMENT.md#데모를-내-게임으로-바꾸기)에 따라 이름·저장 키·문구·장면·asset·UI를 교체한다.
   CrazyGames에 입점할 게임이라면 [SDK 안내](../CRAZYGAMES.md)에서 Progress Save 설정과 장면 gameplay 신호 연결을 함께 확인한다.
4. `npm run check`와 게임에 맞춘 E2E 테스트를 실행한다. `tests/e2e/ui.ts`의 요소 ID를 새 UI에 맞추면 `contract`·`crazygames`·`embed` 테스트를 그대로 활용할 수 있다.

기존 프로젝트에 병합할 때는 같은 이름의 파일을 덮어쓰지 말고 필요한 `core/`·`services/` 모듈만 선택해 가져온다.

## 템플릿 업데이트 가져오기

1. 기록해 둔 commit과 최신 템플릿 사이의 diff에서 `core/`, `services/`, `scenes/`, 관련 테스트만 검토한다.
2. 게임의 `config/`, `game/`(schema·규칙), UI는 그대로 보존한다.
3. 저장 schema에 영향이 있으면 migration 테스트를 추가하고, [게임 문서](../game/README.md)에 기록한 템플릿 버전과 commit을 갱신한다.

### 버전별 업그레이드 참고

- **CrazyGames 연동 추가 시**: `App`을 생성하기 전에 `createPlatform()` 완료를 기다린다. 이미 입점한 게임의 로컬 저장 데이터는 별도의 SDK Data 이관 절차가 필요하다.
- **플랫폼별 빌드 추가 시**: `src/config/platform.ts`, Vite의 플랫폼 검증·`define`, npm 스크립트를 함께 반영하고 `gameConfig`의 `platform`·SDK 활성 설정을 연결한다. 오류 감시는 `app.fail(message)`로 전달한다.
- **0.4.0 반영 시**: `src/ui/system.ts`를 추가해 게임 UI에서 `render()`를 호출하고, 게임 조작 버튼에 `data-game-control`을 붙인다. 사용자 문구는 `src/game/strings.ts`로 옮기고 `PlatformContext.warning`이 문구 대신 `'platform-unavailable'` 상태 코드로 바뀐 점을 반영한다. `npm run build`는 배포 대상 없이 실행하면 중단되므로 배포 스크립트가 `build:crazygames` 또는 `build:standalone`을 사용하는지 확인한다.

`docs/template/`는 템플릿 자체의 이력이다. 파생 게임의 기획과 검증 기록은 `docs/game/`에 따로 관리한다.

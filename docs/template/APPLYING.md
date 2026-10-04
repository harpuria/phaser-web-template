# 새 게임에 적용하기

이 템플릿의 버전은 0.1.0입니다. 공개 저장소 URL/태그는 아직 정하지 않았습니다.

1. 빈 새 프로젝트에 파일을 복사합니다. `.git/`, `node_modules/`, `dist/`, `test-results/`, `playwright-report/`는 제외합니다.
2. 기존 프로젝트라면 이름이 같은 파일을 자동으로 덮어쓰지 말고 필요한 공통 기능만 병합합니다.
3. package 이름, `gameConfig.title`, `storagePrefix`, 시작 장면, index의 메타 정보/favicon을 바꿉니다.
4. `src/game/`과 UI를 게임에 맞게 작성합니다. 개발 과정에서 데모 asset/장면은 제거할 수 있습니다.
5. `npm ci` → `npm run check` → 게임에 맞춘 E2E 순으로 검사합니다.
6. 게임 문서에 출처 경로 또는 저장소 URL, 템플릿 버전, 사용한 commit hash(있는 경우), 적용 날짜를 기록합니다.

`docs/template/`는 이 템플릿 자체의 이력입니다. 파생 게임의 기획/검증은 별도 게임 문서에 기록합니다.
템플릿 업데이트 때는 `core/`, `services/`, Boot/Preload, 관련 검사 diff를 검토하고 게임 schema/규칙/config를 보존합니다.
schema 변경이 있으면 migration을 검증합니다. 저장소 URL이나 commit을 추측해 기록하지 않습니다.

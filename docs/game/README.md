# 게임 문서

이 파일은 파생 게임의 기획과 결정 기록을 남기는 자리입니다. 템플릿 자체의 이력은 `docs/template/`에 있습니다.
사람과 AI가 게임 기능을 구현하기 전에 먼저 읽는 문서이므로, 아래 항목을 게임에 맞게 채우고 내용이 바뀔 때마다 갱신합니다.
기획 문서가 여러 개라면(GDD, 시스템 표, MVP 범위 등) 이 폴더에 함께 두고 하단 목록에서 연결합니다.

## 출처

| 항목          | 값                                              |
| ------------- | ----------------------------------------------- |
| 템플릿 저장소 | https://github.com/harpuria/phaser-web-template |
| 템플릿 버전   | (예: 0.4.0)                                     |
| 가져온 commit | (commit hash)                                   |
| 적용 날짜     | (YYYY-MM-DD)                                    |

## 게임 개요

- 한 줄 소개:
- 장르와 플레이 감각(참고 작품):
- 배포 대상: CrazyGames / 자체 호스팅 / 기타 (`npm run build:crazygames`, `npm run build:standalone`)
- 화면 방향과 안전 영역: (예: 가로 960×540, `gameConfig.orientation`)
- 지원 언어: (예: en, ko — `src/game/strings.ts`, `gameConfig.locale`)

## 조작과 한 판의 구조

- 입력 방식: 사용할 입력(키보드·마우스·터치·게임패드)과 조작 방법
- 한 판의 흐름: 시작·종료 조건과 결과 화면의 주요 동작(재시작, 메뉴 이동 등)
- 일시정지가 필요한 화면(`gameConfig.pausableScenes`):

## 저장 데이터

| 항목 | 타입 | 의미 | 도입 버전 |
| ---- | ---- | ---- | --------- |
|      |      |      |           |

저장 schema를 변경할 때는 `src/game/save.ts`의 `version`을 올리고 이전 버전 fixture 테스트를 추가합니다.

## 광고·보상

- midgame 광고를 호출하는 자연스러운 중단점:
- 보상형 광고의 보상과 버튼 위치(보상 내용을 버튼에 명확히 표시):
- CrazyGames Launch 단계: Basic / Full (`services.crazyGames.launch`)

## MVP 범위와 이후

- MVP에 포함:
- 이후로 미룸:

## 결정 기록

| 날짜 | 결정 | 이유 |
| ---- | ---- | ---- |
|      |      |      |

## 관련 문서

- (GDD, 시스템 표 등 이 폴더의 다른 파일)

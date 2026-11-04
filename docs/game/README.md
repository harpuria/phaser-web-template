# 게임 문서

이 파일은 파생 게임의 기획·결정 기록을 두는 자리입니다. 템플릿 자체의 이력은 `docs/template/`에 있습니다.
AI와 사람이 게임 기능을 만들기 전에 먼저 읽는 문서이므로, 아래 항목을 게임에 맞게 채우고 바뀔 때마다 갱신합니다.
기획 문서가 여러 개라면(GDD, 시스템 표, MVP 범위) 이 폴더에 두고 아래 목록에서 연결합니다.

## 출처

| 항목          | 값                                              |
| ------------- | ----------------------------------------------- |
| 템플릿 저장소 | https://github.com/harpuria/phaser-web-template |
| 템플릿 버전   | (예: 0.4.0)                                     |
| 가져온 commit | (commit hash)                                   |
| 적용 날짜     | (YYYY-MM-DD)                                    |

## 게임 개요

- 한 줄 소개:
- 장르와 참고 감각:
- 대상 플랫폼: CrazyGames / 자체 호스팅 / 기타 (`npm run build:crazygames`, `build:standalone`)
- 화면 방향과 안전 영역: (예: 가로 960×540, `gameConfig.orientation`)
- 지원 언어: (예: en, ko — `src/game/strings.ts`, `gameConfig.locale`)

## 조작과 한 판의 구조

- 입력: 키보드 / 마우스 / 터치 / 게임패드 중 무엇을, 어떻게
- 한 판의 시작·종료 조건, 결과 화면에서 할 수 있는 것
- 일시정지가 필요한 화면(`gameConfig.pausableScenes`)

## 저장 데이터

| 항목 | 타입 | 의미 | 도입 버전 |
| ---- | ---- | ---- | --------- |
|      |      |      |           |

schema 변경은 `src/game/save.ts`의 version을 올리고 이전 버전 fixture 검사를 추가합니다.

## 광고·보상

- midgame 광고를 부르는 자연스러운 중단점:
- 보상형 광고의 보상과 버튼 위치(보상 내용을 버튼에 명시):
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

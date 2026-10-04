# 의존성과 출처

확인일: 2026-10-04. 정확한 전이 의존성은 `package-lock.json`을 기준으로 합니다.

| 구성                | 고정 버전        | 라이선스   | 역할                  |
| ------------------- | ---------------- | ---------- | --------------------- |
| Phaser              | 4.2.1            | MIT        | 게임 런타임           |
| TypeScript          | 6.0.3            | Apache-2.0 | 정적 타입 검사        |
| Vite                | 8.3.2            | MIT        | 개발 서버·번들        |
| Vitest              | 5.0.3            | MIT        | 단위 검사             |
| ESLint / @eslint/js | 10.12.0 / 10.0.1 | MIT        | 린트                  |
| typescript-eslint   | 8.71.0           | MIT        | TypeScript 린트       |
| Prettier            | 3.9.9            | MIT        | 포맷                  |
| @playwright/test    | 1.63.0           | Apache-2.0 | 브라우저 검사         |
| @types/node         | 26.6.4           | MIT        | 도구 설정의 Node 타입 |

권장 실행 환경은 `.nvmrc`의 Node.js 24입니다. 실제 로컬 검증은 Node 24.16.0에서 수행합니다.
런타임 의존성은 Phaser 하나이며 빌드 도구는 devDependencies입니다.

## Phaser 선택 근거

- [공식 릴리스](https://github.com/phaserjs/phaser/releases/tag/v4.2.1): 최신 안정판 4.2.1.
- [공식 archive](https://phaser.io/download/archive): 4.2.1 Giedi, 2026-07-09.
- npm registry의 `phaser` version과 latest tag도 4.2.1로 확인.
- 별도 현행 LTS tag는 확인되지 않았습니다. 오래된 Phaser 2 LTS 공지를 현재 버전의 지원 정책으로 해석하지 않습니다.
- v4는 렌더러가 크게 바뀌었으므로 Phaser 3 예제의 내부 렌더링 API는 그대로 복사하지 않고 설치된 타입/소스로 확인합니다.

## Asset과 서비스

`public/assets/demo/player.svg`, `star.svg`, `public/favicon.svg`는 이 템플릿에서 작성한 벡터입니다.
WAV 파일은 외부 음원을 가져오지 않고 사인파로 합성했습니다. 외부 이미지·음원·폰트 의존성이 없습니다.
웹 글꼴은 시스템 폰트를 사용합니다.
광고·결제·분석 SDK와 외부 전송 endpoint는 포함되지 않았습니다.

직접 의존성 라이선스는 설치된 각 package.json에서 확인했습니다.
실제 게임 배포 시 사용하는 전체 의존성/asset의 라이선스 고지와 추가 SDK 약관은 해당 게임에서 관리합니다.

## 업데이트

1. 공식 changelog와 Node 지원 범위를 확인합니다.
2. 정확한 버전으로 설치하고 package-lock.json을 함께 갱신합니다.
3. `npm run check`와 개발/배포 E2E를 실행합니다.
4. 이 표와 검증 기록에 실제 적용 버전·범위를 갱신합니다.

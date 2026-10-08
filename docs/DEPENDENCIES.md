# 의존성과 출처

확인일: 2026-10-04 (CI action·CrazyGames SDK는 2026-10-07). npm 전이 의존성은 `package-lock.json`이 기준입니다.

| 구성                 | 고정 버전            | 라이선스                   | 역할                  |
| -------------------- | -------------------- | -------------------------- | --------------------- |
| Phaser               | 4.2.1                | MIT                        | 게임 런타임           |
| TypeScript           | 6.0.3                | Apache-2.0                 | 정적 타입 검사        |
| Vite                 | 8.3.2                | MIT                        | 개발 서버·번들        |
| Vitest               | 5.0.3                | MIT                        | 단위 검사             |
| ESLint / @eslint/js  | 10.12.0 / 10.0.1     | MIT                        | 린트                  |
| typescript-eslint    | 8.71.0               | MIT                        | TypeScript 린트       |
| Prettier             | 3.9.9                | MIT                        | 포맷                  |
| @playwright/test     | 1.63.0               | Apache-2.0                 | 브라우저 검사         |
| @types/node          | 26.6.4               | MIT                        | 도구 설정의 Node 타입 |
| CrazyGames HTML5 SDK | v3 공식 CDN endpoint | CrazyGames Developer Terms | 플랫폼·광고·Data 저장 |

npm 런타임 의존성은 Phaser 하나이고 나머지는 devDependencies입니다. CrazyGames는 외부 스크립트로 로드하며 npm 패키지/lockfile 변경은 없습니다.
공식 설치 문서가 제공하는 `https://sdk.crazygames.com/crazygames-sdk-v3.js`로 URL과 major 버전을 고정했습니다.
이 endpoint는 공급자가 갱신하므로 npm의 정확한 patch 고정과는 다릅니다. 버전 변경 시 Preview에서 다시 검증합니다.
설치 근거는 [SDK v3 공식 문서](https://docs.crazygames.com/sdk/intro/), 사용 조건은 [Developer Terms](https://files.crazygames.com/documents/developer_terms_20250818.pdf)입니다.
Node.js는 22.12 이상(Vite 8 요구 사항)이 필요하며, 권장 버전은 `.nvmrc`의 24입니다.
CI는 `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` 모두 v7을 사용합니다.

## Phaser 선택 근거

- [공식 릴리스](https://github.com/phaserjs/phaser/releases/tag/v4.2.1)와 npm `latest`가 모두 4.2.1(2026-07-09)입니다.
- 현행 LTS 채널은 없어 최신 안정판을 정확한 버전으로 고정했습니다.
- v4는 렌더러가 크게 바뀌었습니다. Phaser 3 예제의 렌더링 관련 코드는 설치된 타입/소스로 확인한 뒤 사용합니다.

## Asset과 서비스

- `public/assets/demo/`의 SVG와 `public/favicon.svg`는 이 템플릿에서 직접 만든 벡터입니다.
- WAV는 사인파로 합성했습니다. 외부 이미지·음원·폰트가 없고 글꼴은 시스템 폰트입니다.
- CrazyGames SDK는 `sdk.crazygames.com`에서 로드되며, 활성 환경에서 플랫폼 이벤트·광고 요청·Data 저장을 SDK가 처리합니다.
- 별도 결제·분석 SDK는 없습니다. 기능 범위와 저장 보호는 [CrazyGames 안내](CRAZYGAMES.md)를 봅니다.
- 파생 게임은 실제로 쓰는 의존성/asset의 라이선스 고지와 SDK 약관을 직접 관리합니다.

## 업데이트 절차

1. 공식 changelog와 Node 지원 범위를 확인합니다.
2. 정확한 버전으로 설치하고 `package-lock.json`을 함께 커밋합니다.
3. `npm run check`, `npm run test:e2e`, `E2E_PREVIEW=1 npm run test:e2e`를 실행합니다.
4. 이 표와 [검증 기록](template/VALIDATION.md)을 갱신합니다.

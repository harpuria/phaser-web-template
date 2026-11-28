# 의존성과 출처

확인일: npm 의존성 2026-11-04, CI action 2026-10-07, CrazyGames SDK 2026-10-21. 전이 의존성은 `package-lock.json` 기준이다.

| 구성                 | 고정 버전            | 라이선스                   | 역할                  |
| -------------------- | -------------------- | -------------------------- | --------------------- |
| Phaser               | 4.2.1                | MIT                        | 게임 런타임           |
| TypeScript           | 6.0.3                | Apache-2.0                 | 정적 타입 검사        |
| Vite                 | 8.3.5                | MIT                        | 개발 서버·번들        |
| Vitest               | 5.1.0                | MIT                        | 단위 테스트           |
| ESLint / @eslint/js  | 10.14.0 / 10.0.1     | MIT                        | 린트                  |
| typescript-eslint    | 8.72.1               | MIT                        | TypeScript 린트       |
| Prettier             | 3.9.10               | MIT                        | 포맷                  |
| @playwright/test     | 1.64.1               | Apache-2.0                 | 브라우저 E2E 테스트   |
| @types/node          | 24.19.2              | MIT                        | 도구 설정의 Node 타입 |
| CrazyGames HTML5 SDK | v3 공식 CDN endpoint | CrazyGames Developer Terms | 플랫폼·광고·Data 저장 |

### 런타임·SDK·실행 환경

- **npm 의존성**: 런타임 의존성은 Phaser 하나뿐이며 나머지는 `devDependencies`다.
- **CrazyGames SDK**: 외부 스크립트(`https://sdk.crazygames.com/crazygames-sdk-v3.js`)로 로드하므로 npm·lockfile 변경은 없다. 공급자가 직접 갱신하는 v3 endpoint이므로 버전이 바뀌면 Preview에서 재검증한다.
- **SDK 확인 기록(2026-10-21)**: v3 endpoint 유지와 실행 버전 **3.8.0**을 확인했다([검증 기록](template/VALIDATION.md), [SDK 공식 문서](https://docs.crazygames.com/sdk/intro/), [Developer Terms](https://files.crazygames.com/documents/developer_terms_20250818.pdf)).
  - 당시 식별값(버전 고정·무결성 강제 아님): `Last-Modified` `2026-10-12T07:32:41Z`, SHA-256 `d4c44671cafbb694a0fd054078303242681bdf1b5908d6fb9f766d1de3f25911`
- **Node.js와 CI**: 지원 범위는 `^22.13.0 || ^24.0.0 || >=26.0.0`, 권장 버전은 `.nvmrc`의 24다. CI는 Node 22.13.0과 24에서 `npm ci --engine-strict` 후 `npm run check`를 실행하며 `actions/checkout`·`setup-node`·`upload-artifact` 모두 v7을 사용한다.

## 2026-11-04 갱신

- npm `latest` 기준으로 Vite 8.3.5, Vitest 5.1.0, ESLint 10.14.0, typescript-eslint 8.72.1, Prettier 3.9.10, Playwright 1.64.1로 올렸다. Phaser 4.2.1은 최신 안정판 유지(4.3.0은 master 미배포).
- Vitest 5.1.0(2026-11-02)과 ESLint 10.14.0(2026-10-30)은 배포 1주 이내 버전이라 문제 시 5.0.5 / 10.13.0으로 되돌린다.
- `@types/node`는 26에서 **24.x**로 내렸다. 실행 Node(`.nvmrc` 24, 최소 22.13.0)에 없는 최신 API가 타입 검사에서 통과되지 않도록 막기 위해서다. Dependabot도 25 이상을 제외하며(`.github/dependabot.yml`의 `versions: ['>=25']`), `.nvmrc` major 상향 시 함께 올린다.
- **TypeScript 7.0.2 보류**: `typescript-eslint` 8.72.1의 peer 범위(`<6.1.0`) 때문에 6.0.3을 유지한다. 7 지원 시 함께 올리며 Dependabot도 major 갱신을 제외했다.
- `npm audit --omit=dev`는 0건이다. 전체 `npm audit`의 moderate 1건(GHSA-g3hv-75wg-m249)은 ESLint 계열 개발 도구의 `minimatch@10.2.6`에서 발생하며 상위 패키지가 `minimatch@11`을 허용하면 해소된다(`npm audit fix --force`는 ESLint를 깨뜨리므로 금지).
- lockfile은 npm 11(Node 24)로 갱신한다(npm 10은 optional 패키지의 `libc` 필드를 삭제해 불필요한 diff 생성).
- Playwright 갱신 시 브라우저 버전도 바뀌므로 새 환경에서는 `npx playwright install chromium firefox webkit`을 다시 실행한다.
- `.github/dependabot.yml`이 npm과 GitHub Actions를 월 1회 PR로 제안한다. 병합 전에 이 표와 [검증 기록](template/VALIDATION.md)을 갱신한다.

## Phaser 선택 근거

- [공식 릴리스](https://github.com/phaserjs/phaser/releases/tag/v4.2.1)와 npm `latest` 모두 4.2.1(2026-07-09)이며 현행 LTS 채널이 없어 정확한 버전으로 고정했다.
- v4는 렌더러가 크게 바뀌었으므로 Phaser 3 예제의 렌더링 코드는 설치된 타입과 소스로 확인한 뒤 사용한다.

## Asset과 서비스

- `public/assets/demo/`의 SVG와 `public/favicon.svg`는 직접 제작한 벡터 이미지다. WAV 효과음은 사인파로 합성했고, 외부 이미지·음원·폰트 없이 시스템 폰트를 쓴다.
- CrazyGames SDK는 `sdk.crazygames.com`에서 로드하며 활성 환경의 플랫폼 이벤트·광고·Data 저장을 처리한다. 별도 결제·분석 SDK는 없다([CrazyGames 안내](CRAZYGAMES.md)).
- 파생 게임은 실제 사용하는 의존성·asset의 라이선스 고지와 SDK 약관을 직접 관리해야 한다.

## 업데이트 절차

1. 공식 changelog와 Node 지원 범위를 확인한다.
2. 정확한 버전으로 설치하고 `package-lock.json`을 함께 커밋한다.
3. `npm run check`, `npm run test:e2e`, `E2E_PREVIEW=1 npm run test:e2e`를 실행한다.
4. 이 표와 [검증 기록](template/VALIDATION.md)을 갱신한다.

# 의존성과 출처

확인일: npm 의존성 2026-11-04, CI action 2026-10-07, CrazyGames SDK 2026-10-21. npm 전이 의존성은 `package-lock.json`을 기준으로 합니다.

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

- **npm 의존성**: 런타임 의존성은 Phaser 하나뿐이며 나머지는 모두 `devDependencies`입니다.
- **CrazyGames SDK**: 외부 스크립트로 불러오므로 npm 패키지나 lockfile 변경은 없습니다. 공식 설치 문서가 제공하는 `https://sdk.crazygames.com/crazygames-sdk-v3.js`로 URL과 major 버전을 고정했습니다. 공급자가 이 endpoint를 직접 갱신하므로 npm의 정확한 patch 고정과는 다르며, 버전 변경 시 Preview에서 다시 검증합니다.
- **SDK 확인 기록(2026-10-21)**: 공식 설치 문서가 계속 v3 endpoint를 안내하는 것을 확인했고, CDN 파일과 실제 local 초기화 로그의 버전은 **3.8.0**이었습니다. 확인 당시 CDN 응답의 `Last-Modified`는 `2026-10-12T07:32:41Z`, 파일 SHA-256은 `d4c44671cafbb694a0fd054078303242681bdf1b5908d6fb9f766d1de3f25911`입니다. 이는 확인 시점의 식별값이며 버전 고정이나 무결성 강제 설정은 아닙니다. 초기화·로컬 광고·Data 저장 복원 결과와 미검증 범위는 [검증 기록](template/VALIDATION.md)에 남깁니다.
  - 참고: [SDK v3 공식 문서](https://docs.crazygames.com/sdk/intro/), [Developer Terms](https://files.crazygames.com/documents/developer_terms_20250818.pdf)
- **Node.js와 CI**: ESLint와 Vitest가 함께 지원하는 `^22.13.0 || ^24.0.0 || >=26.0.0` 범위를 사용하며 권장 버전은 `.nvmrc`의 24입니다. CI는 Node 22.13.0과 24 모두에서 `npm ci --engine-strict`로 설치한 뒤 `npm run check`를 실행합니다. GitHub Actions는 `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` 모두 v7을 사용합니다.

## 2026-11-04 갱신

- npm `latest` 기준으로 Vite 8.3.5, Vitest 5.1.0, ESLint 10.14.0, typescript-eslint 8.72.1, Prettier 3.9.10, Playwright 1.64.1로 올렸습니다. Phaser 4.2.1은 그대로 최신 안정판입니다(GitHub Releases Latest 기준, 4.3.0은 master에서 미배포).
- Vitest 5.1.0(2026-11-02)과 ESLint 10.14.0(2026-10-30)은 배포 1주 이내 버전이므로 문제가 생기면 5.0.5 / 10.13.0으로 되돌립니다.
- `@types/node`는 26에서 **24.x**로 내렸습니다. 타입 정의가 실행 Node(`.nvmrc` 24, 최소 22.13.0)보다 새 API를 허용하지 않도록 하기 위해서입니다. Dependabot은 `@types/node` 25 이상을 제안하지 않습니다(`.github/dependabot.yml`의 `versions: ['>=25']`). `.nvmrc`의 major를 올릴 때 이 범위도 함께 올립니다.
- **TypeScript 7.0.2는 보류**합니다. `typescript-eslint` 8.72.1의 peer 범위가 `typescript >=4.8.4 <6.1.0`이라 6.0.3을 유지하며, `typescript-eslint`가 7을 지원하면 함께 올립니다. Dependabot도 TypeScript major는 제외합니다.
- `npm audit --omit=dev`는 0건입니다. 전체 `npm audit`은 ESLint·typescript-eslint가 사용하는 `minimatch@10.2.6`의 moderate 1건(GHSA-g3hv-75wg-m249)을 보고합니다. 개발 도구에만 해당하며 상위 패키지가 `minimatch@11`을 허용하면 해소됩니다. `npm audit fix --force`는 ESLint를 깨뜨리므로 사용하지 않습니다.
- lockfile은 npm 11(Node 24)로 갱신합니다. npm 10은 optional 패키지의 `libc` 필드를 지워 불필요한 diff를 만듭니다.
- Playwright 버전을 올리면 브라우저 버전도 함께 바뀝니다. 새 환경에서는 `npx playwright install chromium firefox webkit`을 다시 실행합니다.
- `.github/dependabot.yml`이 npm(개발 도구 minor/patch 묶음, Phaser 별도)과 GitHub Actions를 월 1회 PR로 제안합니다. 병합 전에 이 문서의 표와 [검증 기록](template/VALIDATION.md)을 갱신합니다.

## Phaser 선택 근거

- [공식 릴리스](https://github.com/phaserjs/phaser/releases/tag/v4.2.1)와 npm `latest`가 모두 4.2.1(2026-07-09)입니다.
- 현행 LTS 채널이 없어 최신 안정판을 정확한 버전으로 고정했습니다.
- v4는 렌더러가 크게 바뀌었습니다. Phaser 3 예제의 렌더링 관련 코드는 설치된 타입과 소스로 확인한 뒤 사용합니다.

## Asset과 서비스

- `public/assets/demo/`의 SVG와 `public/favicon.svg`는 이 템플릿에서 직접 만든 벡터 이미지입니다.
- WAV 효과음은 사인파로 합성했습니다. 외부 이미지·음원·폰트는 없으며 글꼴은 시스템 폰트를 사용합니다.
- CrazyGames SDK는 `sdk.crazygames.com`에서 불러오며, 활성 환경에서 플랫폼 이벤트·광고 요청·Data 저장을 SDK가 처리합니다.
- 별도 결제·분석 SDK는 없습니다. 기능 범위와 저장 보호 정책은 [CrazyGames 안내](CRAZYGAMES.md)를 참고합니다.
- 파생 게임은 실제로 사용하는 의존성·asset의 라이선스 고지와 SDK 약관을 직접 관리해야 합니다.

## 업데이트 절차

1. 공식 changelog와 Node 지원 범위를 확인합니다.
2. 정확한 버전으로 설치하고 `package-lock.json`을 함께 커밋합니다.
3. `npm run check`, `npm run test:e2e`, `E2E_PREVIEW=1 npm run test:e2e`를 실행합니다.
4. 이 문서의 표와 [검증 기록](template/VALIDATION.md)을 갱신합니다.

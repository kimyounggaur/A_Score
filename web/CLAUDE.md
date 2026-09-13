@AGENTS.md

# 1. 프로젝트 정의와 North Star

ScoreStore는 악보를 검색하고, 샘플을 확인하고, 결제한 뒤 보관함에서 받는 한국어 디지털 악보 스토어다.

> 곡을 검색해서 → 샘플로 확인하고 → 1분 안에 결제하고 → 보관함에서 워터마크 PDF를 받는 흐름이 360px 폰에서 끊김 없이 동작한다.

# 2. 스택과 실제 설치 버전

아래 값은 `package.json`에 설치된 값을 2026-09-13에 읽어 기록했다. 버전 변경 시 이 표도 함께 갱신한다.

| 영역        | 패키지와 실제 선언 버전                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| 프레임워크  | Next.js `16.3.5`, React/React DOM `19.2.8`, TypeScript `5.9.3`                 |
| 스타일/UI   | Tailwind CSS `4.3.3`, shadcn `4.21.0`, radix-ui `1.6.7`, lucide-react `1.45.0` |
| 상태/검증   | Zustand `5.0.15`, Zod `4.6.4`                                                  |
| 유틸리티    | date-fns `4.4.0`, clsx `2.1.1`, tailwind-merge `3.7.0`                         |
| 단위 테스트 | Vitest `5.0.0`, jsdom `30.0.1`, Testing Library React `16.3.3`                 |
| E2E/접근성  | Playwright `1.63.0`, axe Playwright `4.13.0`                                   |
| 코드 품질   | ESLint `9.39.5`, Prettier `3.9.6`                                              |
| 폰트 도구   | subset-font `2.7.0`                                                            |

TypeScript는 `strict`와 `noUncheckedIndexedAccess`를 모두 켠다. Next.js 16에서는 `next lint`가 제거되었으므로 ESLint CLI를 직접 실행한다.

# 3. 디렉터리 구조와 책임

```text
web/
├─ app/                 App Router 페이지, 레이아웃, 오류/메타데이터
├─ components/          ui, layout, store, auth, instrument icon 컴포넌트
├─ lib/
│  ├─ catalog/          분류·상품 모델·Zod 스키마의 단일 진실 공급원
│  ├─ points/           유상/무상 포인트 lot 배분과 원장 계산
│  ├─ search/           URL 쿼리 파싱, 한국어 정규화·검색·facet
│  ├─ repositories/     화면과 데이터 구현을 분리하는 비동기 계약
│  ├─ payments/         mock/Toss 결제 게이트웨이 계약
│  ├─ stores/           장바구니·찜·모의 세션 UI 상태
│  └─ config/           사업자·정책·포인트·검색·표시 문구
├─ data/mock/           Zod로 로드 시 검증되는 Stage B 샘플 데이터
├─ public/fonts/        MaruBuri·Noto Sans KR 서브셋과 확보된 라이선스 문서
├─ scripts/             재현 가능한 빌드 보조 스크립트
├─ tests/unit/          순수 로직·repository 단위 테스트
├─ tests/e2e/           구매·접근성·회귀 E2E
└─ docs/                결정, 백로그, QA, 운영·롤백 문서
```

페이지와 컴포넌트는 런타임별 repository facade만 사용한다. `lib/repositories/index.ts`는 조합·테스트용이며, 화면이 `data/mock` 구현을 직접 import하지 않는다.

# 4. 라우트 맵

| 경로                                                                                | 화면/렌더링                    | 접근        |
| ----------------------------------------------------------------------------------- | ------------------------------ | ----------- |
| `/`                                                                                 | 홈, 정적(1시간 재검증)         | 전체        |
| `/scores`                                                                           | 목록·검색, 요청 시 서버 렌더링 | 전체        |
| `/scores/[id]`, `/bundles/[id]`, `/band-sets/[id]`                                  | 상품 유형별 정적 상세          | 전체        |
| `/instruments/[instrument]`, `/arrangers/[id]`                                      | 악기 랜딩·편곡자 크레딧        | 전체        |
| `/cart`                                                                             | 장바구니                       | 전체        |
| `/checkout`, `/checkout/success`, `/checkout/fail`                                  | 주문·결제 결과                 | 로그인      |
| `/login`                                                                            | 로그인                         | 전체        |
| `/me`, `/me/library`, `/me/orders`, `/me/orders/[id]`, `/me/points`, `/me/wishlist` | 개인 화면                      | 로그인      |
| `/points/charge`, `/notifications`                                                  | 포인트 충전·알림               | 로그인      |
| `/legal/terms`, `/legal/privacy`, `/legal/refund`                                   | 법적 문서 초안                 | 전체        |
| `/admin/*`                                                                          | 관리자                         | 관리자      |
| `/dev/ui`                                                                           | 컴포넌트 카탈로그              | 데모 모드만 |

# 5. 불변 규칙 R1~R13

- R1 금액·포인트 계산은 `lib/pricing.ts`와 `lib/points/`의 순수 함수에서만 한다. 컴포넌트 안에서 가격을 더하거나 할인율을 계산하지 않는다.
- R2 악기·기보 형식·상품 유형·장르·난이도 값은 `lib/catalog/taxonomy.ts`에서만 정의한다. 화면·목데이터·관리자가 같은 상수를 쓴다. 문자열 리터럴로 분류를 쓰지 않는다.
- R3 `.tsx` 파일에 hex 색상·px 폰트 크기를 직접 쓰지 않는다. Tailwind 토큰 클래스만 사용한다.
- R4 사용자가 보는 화면 상태(선택 상품·필터·정렬·페이지·탭)는 URL로 복원 가능해야 한다. 새로고침·뒤로가기·링크 공유에서 같은 화면이 나와야 한다.
- R5 동작하지 않는 버튼을 만들지 않는다. 미구현 기능은 `components/ui/ComingSoon`으로 준비 중 상태를 명시한다.
- R6 클릭 가능한 div를 만들지 않는다. 이동은 `<Link>`, 동작은 `<button>`을 쓴다. 아이콘만 있는 버튼에는 `aria-label`이 있어야 한다.
- R7 값이 없는 정보는 렌더링하지 않는다. 조성·BPM·페이지·형식·편곡자에 기본값을 채우지 않는다.
- R8 화면 코드는 `lib/repositories/interfaces.ts`의 인터페이스만 호출한다. 목데이터 배열을 직접 import하지 않는다.
- R9 주문 금액은 클라이언트가 보낸 값을 믿지 않고 카탈로그 기준으로 다시 계산한다. 모의 결제에서도 같은 함수를 쓴다.
- R10 판매 가능 여부는 게시 상태(`published`)와 이용허락(`licenseStatus`)을 모두 만족할 때만 true다.
- R11 320px에서 가로 스크롤이 없어야 한다. 터치 대상은 최소 44×44px, `prefers-reduced-motion`을 존중하고 본문 대비는 4.5:1 이상이어야 한다.
- R12 사용자 화면은 해요체, 관리자 화면은 합니다체를 쓴다. 오류 메시지는 원인과 다음 행동을 함께 적고 빈 화면에는 할 수 있는 행동을 제시한다.
- R13 비밀 값은 서버에서만 읽는다. `NEXT_PUBLIC_` 환경변수에 비밀을 넣지 않는다.

# 6. 자주 쓰는 명령

- `npm run verify`: lint → typecheck → 단위 테스트 → 프로덕션 빌드
- `npm run test:unit`: Vitest 단위 테스트 1회 실행
- `npm run test:e2e`: Playwright E2E
- `npm run test:a11y`: axe 접근성 E2E
- `npm run font:subset`: MaruBuri 고정 문구와 앱 문구용 Noto Sans KR WOFF2 재생성 (`Noto_SANS_KR_SOURCE`로 원본 경로 지정 가능)
- `npm run audio:demo`: 저작권 음원이 아닌 30초 합성 WAV 샘플 재생성

# 7. 레거시 프로토타입 참조 규칙

`../index.html`과 `../ScoreStore.dc.html`은 화면 구성·문구 참고용 읽기 전용이다. 레거시의 인라인 React/Babel 코드는 새 앱에 복사하지 않는다.

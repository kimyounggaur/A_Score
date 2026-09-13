# ScoreStore Web

악기를 기준으로 디지털 악보를 찾고, 모의 결제를 거쳐 보관함에 지급하는 한국어 반응형 스토어입니다. 현재 `web/`은 실제 외부 결제나 파일 다운로드를 연결하지 않은 Stage B 구현입니다.

## 로컬 실행

Node.js 20 이상을 사용합니다.

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다. `.env.local`의 `NEXT_PUBLIC_DEMO_MODE=true`일 때 `/dev/ui`와 관리자 데모 안내가 표시됩니다. 관리자 데모 계정은 로그인 화면에서 `admin@scorestore.demo`를 사용합니다.

## 검증

```powershell
npm run verify
npm run test:e2e
npm run test:a11y
npm run audio:demo
npm run font:subset
```

Playwright 브라우저가 없다면 먼저 `npx playwright install chromium`을 실행합니다. `verify`는 ESLint, TypeScript, Vitest, 프로덕션 빌드를 순서대로 검사합니다. 브라우저 검사는 실행 전에 프로덕션 빌드를 만들고 `next start`에 연결하므로 실제 배포와 같은 404·메타데이터 동작을 검사합니다.

`font:subset`은 Windows 기본 경로의 `NotoSansKR-VF.ttf`를 사용하며, 다른 환경에서는 `Noto_SANS_KR_SOURCE`에 원본 경로를 지정합니다. 생성된 Noto Sans KR 서브셋의 OFL 라이선스는 폰트 자산과 함께 보관합니다.

## 배포

Vercel 프로젝트의 Root Directory를 `web`으로 지정합니다. 배포·롤백 절차와 필수 환경 변수는 [docs/runbook.md](docs/runbook.md)에 정리되어 있습니다.

실서비스 전환에는 사업자 정보, 곡별 이용허락, PG 계약, 폰트 배포 라이선스 및 법적 문서의 전문가 검토가 선행되어야 합니다. 확인되지 않은 값은 UI에 임의로 채우지 않습니다.

`NEXT_PUBLIC_DEMO_MODE=false`는 표시만 바꾸는 값이며 실서비스 전환 스위치가 아닙니다. 현재 인증·주문·포인트·관리자 권한은 브라우저 `localStorage` 기반 mock이어서 서버 보안 경계가 없습니다. Supabase Auth/Postgres/RLS/Storage 저장소, 서버 금액 재계산과 멱등 주문 트랜잭션, Toss Payments 승인·웹훅 검증, 권한·워터마크 다운로드까지 교체·검증한 뒤에만 Stage C로 전환합니다.

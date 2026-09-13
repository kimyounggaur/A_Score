# 배포·롤백 런북

## Vercel 프로젝트 설정

1. 이 저장소를 Vercel에 연결한다.
2. Framework Preset은 Next.js, Root Directory는 반드시 `web`으로 지정한다.
3. Stage B Preview/Production에는 `NEXT_PUBLIC_SITE_URL`과 `NEXT_PUBLIC_DEMO_MODE=true`를 설정한다. 변수가 빠진 빌드도 안전하게 데모로 표시된다. 아래 Stage C 외부·기술 게이트를 모두 통과한 컷오버 때만 `false`로 바꾼다. 비밀은 `NEXT_PUBLIC_` 이름으로 만들지 않는다.
4. 배포 전 `npm ci && npm run verify && npm run test:e2e`를 실행한다.
5. 새 주소에서 회귀 테스트가 통과하기 전에는 기존 GitHub Pages `/A_Score/`를 내리거나 덮어쓰지 않는다.

## 컷오버

1. Preview에서 핵심 구매 흐름과 회귀 테스트를 통과시키고, Stage B라면 DEMO 표기가 보이는지 확인한다.
2. Production으로 승격한 뒤 같은 테스트를 실제 주소에서 반복한다.
3. 통과한 경우에만 레거시 루트 `index.html` 상단에 새 주소 안내 배너를 추가한다.

## 롤백

1. Vercel Deployments에서 마지막 정상 배포를 Promote한다.
2. 새 주소 자체에 장애가 있으면 안내 배너를 제거하거나 기존 Pages 데모 주소로 되돌린다.
3. 결제·주문 데이터가 생긴 Stage C에서는 배포 롤백과 데이터 롤백을 분리하고, 주문 상태를 먼저 보존한다.
4. 원인·영향 시간·복구 배포 ID를 장애 기록에 남기고 회귀 테스트를 재실행한다.

## 현재 제약

- 이 런북은 Stage B 배포 골격이다. 실제 결제 오픈에는 사업자등록, 이용허락, PG 계약, 폰트 배포 권리, 법률 검토가 별도로 필요하다.
- `NEXT_PUBLIC_DEMO_MODE=false`만으로는 실서비스가 되지 않는다. Supabase Auth/Postgres/RLS/Storage repository, 서버 기준 금액 재계산과 멱등 주문 트랜잭션, Toss Payments 승인·웹훅 서명 검증, 구매 권한을 검사하는 워터마크 다운로드가 모두 연결되고 회귀·보안 검증을 통과해야 한다.
- 관리자 사이트명은 Stage B 브라우저 저장값이므로 현재 브라우저의 헤더·푸터·관리자 표기와 문서 메타에만 반영된다. SSR/OG 공유 메타데이터는 Stage C 서버 설정 저장소로 옮긴 뒤 반영한다.

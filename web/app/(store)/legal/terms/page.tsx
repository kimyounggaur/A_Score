import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "이용약관 초안",
  description: "ScoreStore 서비스 이용약관 법률 검토 전 초안이에요.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="이용약관"
      updatedAt="2026년 9월 13일"
      sections={[
        {
          title: "1. 서비스와 계정",
          content: (
            <p>
              ScoreStore는 디지털 악보를 검색하고 구매해 보관함에서 확인하는 서비스를 제공해요.
              구매와 재다운로드 기록을 안전하게 연결하기 위해 회원 계정이 필요해요.
            </p>
          ),
        },
        {
          title: "2. 디지털 콘텐츠 제공",
          content: (
            <p>
              결제가 확정되면 해당 악보의 이용 권한이 보관함에 지급돼요. 파일 형식, 페이지 수, 지원
              악기처럼 구매 판단에 필요한 정보는 각 상품 화면에서 확인할 수 있어요.
            </p>
          ),
        },
        {
          title: "3. 금지행위",
          content: (
            <p>
              계정 또는 구매 파일을 제3자와 공유하거나, 워터마크를 제거하거나, 허락 없이
              복제·배포·재판매해서는 안 돼요. 시스템의 정상적인 운영을 방해하는 자동화 접근도 제한될
              수 있어요.
            </p>
          ),
        },
        {
          title: "4. 저작권",
          content: (
            <p>
              악보와 편곡물의 권리는 각 권리자에게 있어요. 구매는 개인 연주를 위한 이용 권한이며,
              별도 허락 없이 저작권이나 배포 권한이 이전되지는 않아요.
            </p>
          ),
        },
        {
          title: "5. 변경과 문의",
          content: (
            <p>
              서비스 또는 약관이 바뀌면 적용일과 주요 내용을 미리 알릴 예정이에요. 최종 문의 채널과
              사업자 정보는 오픈 전에 확정해 고지해요.
            </p>
          ),
        },
      ]}
    />
  );
}

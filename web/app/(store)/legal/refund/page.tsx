import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "환불정책 초안",
  description: "ScoreStore 디지털 콘텐츠와 포인트 환불정책 법률 검토 전 초안이에요.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPage() {
  return (
    <LegalDocument
      title="환불정책"
      updatedAt="2026년 9월 13일"
      sections={[
        {
          title: "1. 다운로드 전",
          content: (
            <p>
              구매한 파일의 제공이 시작되기 전이라면 관련 법령과 결제수단 정책에 따라 취소를 요청할
              수 있도록 설계해요. 묶음 상품은 포함된 파일의 제공 여부를 함께 확인해요.
            </p>
          ),
        },
        {
          title: "2. 다운로드 후",
          content: (
            <p>
              디지털 콘텐츠가 제공된 뒤에는 청약철회가 제한될 수 있어요. 결제 전 샘플과 상품 정보를
              확인하고 이 제한에 동의하는 절차를 제공해요. 파일 오류나 표시 내용과 다른 경우의
              권리는 제한하지 않아요.
            </p>
          ),
        },
        {
          title: "3. 유상 포인트",
          content: (
            <p>
              사용하지 않은 유상 충전 포인트의 환불 조건, 수수료, 유효기간은 관계 법령과 결제 계약을
              검토한 뒤 확정해요. 보너스·적립 포인트는 유상 포인트와 별도 원장으로 관리해요.
            </p>
          ),
        },
        {
          title: "4. 환불 처리",
          content: (
            <p>
              주문번호와 환불 사유를 확인한 뒤 원 결제수단을 기준으로 처리해요. 사용 포인트 복원과
              보관함 이용 권한의 변화는 확정 전에 안내해요.
            </p>
          ),
        },
      ]}
    />
  );
}

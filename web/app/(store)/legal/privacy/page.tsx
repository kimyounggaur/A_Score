import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "개인정보처리방침 초안",
  description: "ScoreStore 개인정보처리방침 법률 검토 전 초안이에요.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="개인정보처리방침"
      updatedAt="2026년 9월 13일"
      sections={[
        {
          title: "1. 수집 항목",
          content: (
            <p>
              로그인 식별자, 이름, 이메일, 주문·결제 상태, 포인트와 다운로드 이력을 필요한 범위에서
              수집하는 구조예요. 결제 카드 정보는 결제대행사가 처리하며 ScoreStore가 직접 저장하지
              않아요.
            </p>
          ),
        },
        {
          title: "2. 이용 목적",
          content: (
            <p>
              회원 식별, 주문 처리, 구매한 콘텐츠 제공, 부정 이용 방지, 고객 문의 응대와 법적 의무
              이행에 이용해요.
            </p>
          ),
        },
        {
          title: "3. 보유 기간",
          content: (
            <p>
              회원 탈퇴나 목적 달성 후에는 지체 없이 파기하는 것을 원칙으로 해요. 다만 전자상거래 등
              관련 법령이 정한 거래 기록은 해당 기간 동안 분리 보관해요. 정확한 기간은 법률 검토 후
              확정해요.
            </p>
          ),
        },
        {
          title: "4. 처리 위탁과 국외 이전",
          content: (
            <p>
              인증, 데이터 보관, 결제, 오류 모니터링 제공자가 개인정보를 처리할 수 있어요. 실제
              제공자·위탁 업무·보유 기간·국외 이전 여부는 계약 확정 후 표로 고지해요.
            </p>
          ),
        },
        {
          title: "5. 이용자의 권리",
          content: (
            <p>
              본인 정보의 열람·정정·삭제·처리정지를 요청할 수 있어요. 접수 채널과 개인정보
              보호책임자 정보는 오픈 전에 확정해요.
            </p>
          ),
        },
      ]}
    />
  );
}

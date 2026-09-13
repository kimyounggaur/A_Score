"use client";

import { Database, RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { demoDataRepository } from "@/lib/repositories/demo-data-repository";

export function DemoDataControls() {
  const seed = () => {
    const result = demoDataRepository.seed();
    toast.success(`포인트 lot ${result.lots}개와 과거 주문 ${result.orders}건을 주입했어요.`);
  };

  const reset = () => {
    demoDataRepository.reset();
    toast.success("개발용 샘플 데이터만 초기화했어요.");
  };

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5"
      aria-labelledby="demo-data-heading"
    >
      <h2 className="text-xl font-bold text-ink-900" id="demo-data-heading">
        샘플 데이터
      </h2>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        데모 회원에게 결제 완료 주문과 연결된 유상·무상 포인트 원장 및 취소 과거 주문을 주입합니다.
        같은 버튼을 다시 눌러도 중복되지 않습니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={seed}>
          <Database aria-hidden="true" /> 샘플 데이터 주입
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          <RotateCcw aria-hidden="true" /> 샘플 데이터 초기화
        </Button>
      </div>
    </section>
  );
}

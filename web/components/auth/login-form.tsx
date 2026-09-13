"use client";

import { type FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, MessageCircle, Music2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { DEMO_ADMIN_EMAIL } from "@/lib/config/demo-account";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { safeNextPath } from "@/lib/navigation/safe-next";
import { useSessionStore } from "@/lib/stores/session";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useSessionStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (provider: "email" | "kakao", role: "user" | "admin" = "user") => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await signIn(provider, role);
      toast.success(role === "admin" ? "관리자 데모로 로그인했어요." : "로그인했어요.");
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void finish("email", email.trim().toLowerCase() === DEMO_ADMIN_EMAIL ? "admin" : "user");
  };

  return (
    <Card className="w-full max-w-md border-line bg-surface shadow-sm">
      <CardHeader className="text-center">
        <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-800">
          <Music2 aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-semibold">연주를 이어가 볼까요?</h1>
        <CardDescription>로그인하면 결제한 악보가 보관함에 안전하게 저장돼요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="h-12 w-full bg-point text-point-ink hover:bg-point/90"
          type="button"
          disabled={pending}
          onClick={() => void finish("kakao")}
        >
          <MessageCircle aria-hidden="true" /> 카카오로 시작하기 (모의)
        </Button>
        <div className="flex items-center gap-3" aria-hidden="true">
          <Separator className="flex-1" />
          <span className="text-xs text-text-muted">또는</span>
          <Separator className="flex-1" />
        </div>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="login-email">이메일</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              disabled={pending}
            />
          </div>
          <Button
            className="h-12 w-full bg-cta text-surface hover:bg-cta-hover"
            type="submit"
            disabled={pending}
          >
            <Mail aria-hidden="true" /> 이메일로 로그인
          </Button>
        </form>
        {error ? (
          <p className="rounded-lg bg-sale-bg p-3 text-sm text-sale-ink" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full"
          variant="ghost"
          type="button"
          onClick={() => router.replace("/")}
        >
          먼저 둘러보기
        </Button>
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
          <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-ink-600">
            UI 데모예요. 관리자 확인은 이메일에 {DEMO_ADMIN_EMAIL}를 입력하세요.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={<div className="text-sm text-text-muted">로그인 화면을 준비하고 있어요.</div>}
    >
      <LoginFormContent />
    </Suspense>
  );
}

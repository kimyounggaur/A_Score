import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "로그인",
  description: "ScoreStore에 로그인하고 구매한 악보를 안전하게 보관하세요.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <section className="page-shell flex min-h-[65vh] items-center justify-center py-10">
      <LoginForm />
    </section>
  );
}

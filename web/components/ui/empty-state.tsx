import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-line bg-surface py-10 text-center shadow-none">
      <CardContent className="mx-auto flex max-w-md flex-col items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-full bg-muted text-ink-600"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
        <p className="text-sm leading-6 text-text-muted">{description}</p>
        <div className="mt-2">{action}</div>
      </CardContent>
    </Card>
  );
}

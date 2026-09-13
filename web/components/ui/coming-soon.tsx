import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ComingSoon({ label }: { label: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" disabled>
        {label}
      </Button>
      <Badge variant="secondary" className="gap-1 text-ink-600">
        <Clock3 aria-hidden="true" /> 준비 중
      </Badge>
    </span>
  );
}

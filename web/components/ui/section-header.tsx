import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  href?: string;
};

export function SectionHeader({ title, description, href }: SectionHeaderProps) {
  return (
    <header className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900 md:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-cta hover:text-cta-hover"
          href={href}
        >
          더보기 <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </header>
  );
}

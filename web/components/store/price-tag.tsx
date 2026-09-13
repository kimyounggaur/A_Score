import { discountRate, formatWon, isFree, isOnSale, type PriceInfo } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type PriceTagProps = PriceInfo & {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export function PriceTag({
  listPrice,
  salePrice,
  saleEndsAt,
  size = "md",
  className,
}: PriceTagProps) {
  const price = { listPrice, salePrice, saleEndsAt };

  if (isFree(price)) {
    return <strong className={cn("text-free", sizeClasses[size], className)}>무료</strong>;
  }

  if (isOnSale(price)) {
    return (
      <span className={cn("flex flex-wrap items-baseline gap-2", sizeClasses[size], className)}>
        <span className="font-bold text-sale" aria-label={`${discountRate(price)}% 할인`}>
          -{discountRate(price)}%
        </span>
        <span className="font-bold text-ink-900">
          <span className="sr-only">판매가 </span>
          {formatWon(salePrice as number)}
        </span>
        <s className="text-xs font-normal text-text-muted">
          <span className="sr-only">정가 </span>
          {formatWon(listPrice)}
        </s>
      </span>
    );
  }

  return (
    <strong className={cn("text-ink-900", sizeClasses[size], className)}>
      {formatWon(listPrice)}
    </strong>
  );
}

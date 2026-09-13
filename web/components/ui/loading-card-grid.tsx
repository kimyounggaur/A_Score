import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCardGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4"
      aria-label="상품을 불러오는 중"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="space-y-3" key={index} aria-hidden="true">
          <Skeleton className="aspect-[4/5] rounded-lg" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
      ))}
    </div>
  );
}

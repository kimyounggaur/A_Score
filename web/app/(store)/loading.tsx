import { LoadingCardGrid } from "@/components/ui/loading-card-grid";

export default function StoreLoading() {
  return (
    <div className="page-shell py-8" role="status">
      <span className="sr-only">페이지를 불러오는 중이에요.</span>
      <div
        className="mb-8 h-32 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
      <LoadingCardGrid />
    </div>
  );
}

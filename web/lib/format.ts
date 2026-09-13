export { formatWon } from "@/lib/pricing";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const orderDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(value: Date | string | number): string {
  return dateFormatter.format(new Date(value));
}

export function formatPoint(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}P`;
}

export function formatOrderNo(date: Date, sequence: number | string): string {
  const dateParts = new Map(
    orderDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const datePart = `${dateParts.get("year")}${dateParts.get("month")}${dateParts.get("day")}`;
  const sequencePart = String(sequence).replace(/\D/g, "").slice(-6).padStart(6, "0");
  return `${datePart}-${sequencePart}`;
}

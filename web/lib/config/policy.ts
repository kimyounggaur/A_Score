export const DOWNLOAD_POLICY = Object.freeze({
  maxDownloads: 5,
  availableDays: 365,
  stageBProvidesFile: false,
});

export const REFUND_POLICY = Object.freeze({
  requiresConsentAtCheckout: true,
  summary: "디지털 콘텐츠는 다운로드 전후에 따라 환불 기준이 달라져요.",
  legalReviewComplete: false,
});

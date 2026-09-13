import { BONUS_EXPIRY_MONTHS, EARN_RATE_PERCENT, PAID_EXPIRY_MONTHS } from "@/lib/config/points";
import type { AdminSettings, SettingsRepository } from "@/lib/repositories/interfaces";
import { RepositoryError } from "@/lib/repositories/interfaces";
import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  siteName: "ScoreStore",
  earnRatePercent: EARN_RATE_PERCENT,
  paidExpiryMonths: PAID_EXPIRY_MONTHS,
  bonusExpiryMonths: BONUS_EXPIRY_MONTHS,
  pointChargeEnabled: true,
};

export class MockSettingsRepository implements SettingsRepository {
  constructor(private readonly store: VersionedMockStorage) {}

  async getSettings(): Promise<AdminSettings> {
    return structuredClone(
      this.store.read<AdminSettings>(MOCK_STORAGE_KEYS.settings, DEFAULT_ADMIN_SETTINGS),
    );
  }

  async updateSettings(settings: AdminSettings): Promise<AdminSettings> {
    if (!settings.siteName.trim()) {
      throw new RepositoryError("INVALID_SITE_NAME", "사이트 이름을 입력해 주세요.");
    }
    if (
      !Number.isFinite(settings.earnRatePercent) ||
      settings.earnRatePercent < 0 ||
      settings.earnRatePercent > 100
    ) {
      throw new RepositoryError("INVALID_EARN_RATE", "적립률은 0~100 사이여야 합니다.");
    }
    if (!Number.isInteger(settings.paidExpiryMonths) || settings.paidExpiryMonths < 1) {
      throw new RepositoryError(
        "INVALID_PAID_EXPIRY",
        "유상 포인트 유효기간은 1개월 이상의 정수여야 합니다.",
      );
    }
    if (!Number.isInteger(settings.bonusExpiryMonths) || settings.bonusExpiryMonths < 1) {
      throw new RepositoryError(
        "INVALID_BONUS_EXPIRY",
        "무상 포인트 유효기간은 1개월 이상의 정수여야 합니다.",
      );
    }

    const normalized = { ...settings, siteName: settings.siteName.trim() };
    this.store.write(MOCK_STORAGE_KEYS.settings, normalized);
    return structuredClone(normalized);
  }
}

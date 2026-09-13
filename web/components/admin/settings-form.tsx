"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { announceAdminSettings } from "@/lib/repositories/browser-events";
import type { AdminSettings } from "@/lib/repositories/interfaces";
import { settingsRepository } from "@/lib/repositories/settings-repository";

export function SettingsForm() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsRepository.getSettings().then(setSettings);
  }, []);

  const updateNumber = (
    field: keyof Pick<AdminSettings, "earnRatePercent" | "paidExpiryMonths" | "bonusExpiryMonths">,
    raw: string,
  ) => {
    const value = Number(raw);
    setSettings((current) =>
      current ? { ...current, [field]: Number.isFinite(value) ? value : 0 } : current,
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await settingsRepository.updateSettings(settings);
      setSettings(saved);
      announceAdminSettings(saved);
      toast.success("설정을 저장했습니다. 다음 모의 거래부터 적용됩니다.");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "설정을 저장하지 못했습니다. 입력값을 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">설정</h1>
        <p className="mt-1 text-sm text-text-muted">
          보여주기용 값이 아니라 모의 결제와 포인트 원장에 사용하는 정책입니다.
        </p>
      </header>
      {!settings ? (
        <p className="py-12 text-center text-sm text-text-muted" role="status">
          설정을 불러오는 중입니다.
        </p>
      ) : (
        <form className="max-w-2xl space-y-5" onSubmit={submit}>
          <Card className="border-line bg-surface shadow-none">
            <CardHeader>
              <CardTitle>사이트 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="site-name">사이트 이름</Label>
              <Input
                id="site-name"
                value={settings.siteName}
                onChange={(event) => setSettings({ ...settings, siteName: event.target.value })}
                required
              />
            </CardContent>
          </Card>
          <Card className="border-line bg-surface shadow-none">
            <CardHeader>
              <CardTitle>포인트 정책</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="earn-rate">현금 결제 적립률 (%)</Label>
                <Input
                  id="earn-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.earnRatePercent}
                  onChange={(event) => updateNumber("earnRatePercent", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid-expiry">유상 포인트 유효기간 (개월)</Label>
                <Input
                  id="paid-expiry"
                  type="number"
                  min={1}
                  step={1}
                  value={settings.paidExpiryMonths}
                  onChange={(event) => updateNumber("paidExpiryMonths", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus-expiry">무상 포인트 유효기간 (개월)</Label>
                <Input
                  id="bonus-expiry"
                  type="number"
                  min={1}
                  step={1}
                  value={settings.bonusExpiryMonths}
                  onChange={(event) => updateNumber("bonusExpiryMonths", event.target.value)}
                />
              </div>
              <Label
                className="sm:col-span-3 flex cursor-pointer items-center gap-3"
                htmlFor="charge-enabled"
              >
                <Checkbox
                  id="charge-enabled"
                  checked={settings.pointChargeEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pointChargeEnabled: checked === true })
                  }
                />
                포인트 충전 기능을 사용합니다.
              </Label>
            </CardContent>
          </Card>
          <p className="rounded-lg bg-brand-50 p-4 text-sm leading-6 text-brand-800">
            단일 판매자 모델을 사용하므로 판매자 역할과 최소 출금액 설정은 제공하지 않습니다.
          </p>
          <Button
            className="bg-cta text-surface hover:bg-cta-hover"
            type="submit"
            disabled={saving}
          >
            <Save aria-hidden="true" />
            {saving ? "저장 중입니다" : "설정 저장"}
          </Button>
        </form>
      )}
    </section>
  );
}

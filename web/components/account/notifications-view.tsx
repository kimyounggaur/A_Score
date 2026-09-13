"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Circle } from "lucide-react";

import { AccountError, AccountLoading, formatDateTime } from "@/components/account/account-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { NotificationItem } from "@/lib/repositories/interfaces";
import { notificationRepository } from "@/lib/repositories/notification-repository";
import { useSessionStore } from "@/lib/stores/session";

function safeInternalHref(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function NotificationsView() {
  const session = useSessionStore((state) => state.session);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const userId = session.id;
    let active = true;
    notificationRepository
      .list(userId)
      .then((notifications) => {
        if (active) setItems(notifications);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "알림을 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [session]);

  if (!session) return null;
  const unreadCount = items?.filter((item) => !item.readAt).length ?? 0;

  const markRead = async (notificationId: string) => {
    if (busyId) return;
    setBusyId(notificationId);
    setError(null);
    try {
      await notificationRepository.markRead(session.id, notificationId);
      setItems(
        (current) =>
          current?.map((item) =>
            item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item,
          ) ?? null,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알림을 읽음 처리하지 못했어요.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setError(null);
    try {
      await notificationRepository.markAllRead(session.id);
      const readAt = new Date().toISOString();
      setItems(
        (current) => current?.map((item) => ({ ...item, readAt: item.readAt ?? readAt })) ?? null,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알림을 모두 읽음 처리하지 못했어요.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-ink-900">알림</h1>
            {unreadCount > 0 ? <Badge variant="sale">새 알림 {unreadCount}</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-text-muted">
            주문과 보관함, ScoreStore의 새 소식을 확인해요.
          </p>
        </div>
        <Button
          className="self-start"
          type="button"
          variant="outline"
          disabled={unreadCount === 0 || markingAll}
          onClick={markAllRead}
        >
          <CheckCheck aria-hidden="true" /> {markingAll ? "처리 중" : "전체 읽음"}
        </Button>
      </header>

      {error ? <AccountError message={error} /> : null}
      {!items && !error ? <AccountLoading label="알림을 불러오고 있어요." /> : null}
      {items?.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="새로운 알림이 없어요"
          description="주문과 서비스 소식이 생기면 이곳에 알려드릴게요."
          action={
            <Button asChild variant="outline">
              <Link href="/me">마이페이지로</Link>
            </Button>
          }
        />
      ) : null}

      {items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const href = safeInternalHref(item.href);
            const unread = !item.readAt;
            return (
              <Card
                className={`border-line shadow-none ${unread ? "bg-brand-50" : "bg-surface"}`}
                key={item.id}
              >
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${unread ? "bg-cta" : "bg-line"}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-ink-900">{item.title}</h2>
                      {unread ? <Badge variant="new">새 알림</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-700">{item.message}</p>
                    <p className="mt-2 text-xs text-text-muted">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {href ? (
                      <Button asChild variant="outline">
                        <Link
                          href={href}
                          onClick={() => {
                            if (unread) void markRead(item.id);
                          }}
                        >
                          내용 보기
                        </Link>
                      </Button>
                    ) : null}
                    {unread ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busyId === item.id}
                        onClick={() => void markRead(item.id)}
                      >
                        <Circle aria-hidden="true" />
                        {busyId === item.id ? "처리 중" : "읽음"}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

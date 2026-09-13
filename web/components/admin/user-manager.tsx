"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListSearchField } from "@/components/navigation/list-search-field";
import { useListQueryNavigation } from "@/components/navigation/use-list-query-navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { parseAdminUserListQuery } from "@/lib/navigation/list-query";
import { adminRepository } from "@/lib/repositories/admin-repository";
import type { SessionUser } from "@/lib/repositories/interfaces";
import { useSessionStore } from "@/lib/stores/session";

const PAGE_SIZE = 10;

function suspensionBlockReason(
  user: SessionUser | undefined,
  currentUserId: string | undefined,
  activeAdminCount: number,
): string | null {
  if (!user || user.suspended || user.role !== "admin") return null;
  if (user.id === currentUserId) return "현재 로그인한 관리자 계정은 정지할 수 없습니다.";
  if (activeAdminCount <= 1) return "활성 관리자를 최소 1명 유지해야 합니다.";
  return null;
}

export function UserManager() {
  const { searchParams, replaceFilters, pushPage } = useListQueryNavigation();
  const pathname = usePathname();
  const router = useRouter();
  const { q: query, role, status, sort, page } = parseAdminUserListQuery(searchParams);
  const dialogAction = searchParams.get("dialog");
  const dialogUserId = searchParams.get("user");
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<SessionUser | null>(null);
  const dialogOpenedHere = useRef(false);
  const hydratedDialogKey = useRef<string | null>(null);
  const closingDialog = useRef(false);
  const session = useSessionStore((state) => state.session);
  const refreshSession = useSessionStore((state) => state.refreshSession);
  const activeAdminCount = users.filter((user) => user.role === "admin" && !user.suspended).length;

  const navigateDialog = useCallback(
    (action: "suspend" | "restore", userId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("dialog", action);
      next.set("user", userId);
      dialogOpenedHere.current = true;
      closingDialog.current = false;
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const replaceWithoutDialog = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("dialog");
    next.delete("user");
    const href = next.size > 0 ? `${pathname}?${next.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeDialog = useCallback(() => {
    closingDialog.current = true;
    hydratedDialogKey.current = null;
    setSelected(null);
    if (dialogOpenedHere.current) {
      dialogOpenedHere.current = false;
      router.back();
      return;
    }
    replaceWithoutDialog();
  }, [replaceWithoutDialog, router]);

  const reload = () =>
    adminRepository.listUsers().then((next) => {
      setUsers(next);
      setLoaded(true);
    });
  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;

      if (!dialogAction) {
        closingDialog.current = false;
        hydratedDialogKey.current = null;
        dialogOpenedHere.current = false;
        setSelected(null);
        if (dialogUserId) replaceWithoutDialog();
        return;
      }

      if (closingDialog.current) return;

      const target = dialogUserId ? users.find((user) => user.id === dialogUserId) : undefined;
      const blockedReason = suspensionBlockReason(target, session?.id, activeAdminCount);
      const isValid =
        (dialogAction === "suspend" && target?.suspended !== true && !blockedReason) ||
        (dialogAction === "restore" && target?.suspended === true);
      if (!isValid) {
        hydratedDialogKey.current = null;
        dialogOpenedHere.current = false;
        setSelected(null);
        replaceWithoutDialog();
        return;
      }

      const key = `${dialogAction}:${dialogUserId}`;
      if (hydratedDialogKey.current === key) return;
      hydratedDialogKey.current = key;
      setSelected(target ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeAdminCount,
    dialogAction,
    dialogUserId,
    loaded,
    replaceWithoutDialog,
    session?.id,
    users,
  ]);

  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  const filtered = users.filter((user) => {
    if (role !== "all" && user.role !== role) return false;
    if (status === "active" && user.suspended) return false;
    if (status === "suspended" && !user.suspended) return false;
    return (
      !normalized || `${user.name} ${user.email}`.toLocaleLowerCase("ko-KR").includes(normalized)
    );
  });
  const sorted = filtered.toSorted((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "ko-KR");
    return Date.parse(b.joinedAt) - Date.parse(a.joinedAt);
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const confirmToggle = async () => {
    if (!selected) return;
    const blockedReason = suspensionBlockReason(selected, session?.id, activeAdminCount);
    if (blockedReason) {
      toast.error(`${blockedReason} 다른 관리자 계정에서 처리하십시오.`);
      return;
    }
    try {
      await adminRepository.upsertUser({ ...selected, suspended: !selected.suspended });
      toast.success(
        selected.suspended ? "회원 이용 정지를 해제했습니다." : "회원 이용을 정지했습니다.",
      );
      closeDialog();
      await reload();
      await refreshSession();
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "회원 상태를 변경하지 못했습니다. 계정 정보를 확인한 뒤 다시 시도하십시오.",
      );
    }
  };

  const openToggle = (user: SessionUser) => {
    const blockedReason = suspensionBlockReason(user, session?.id, activeAdminCount);
    if (blockedReason) {
      toast.error(`${blockedReason} 다른 관리자 계정에서 처리하십시오.`);
      return;
    }
    const action = user.suspended ? "restore" : "suspend";
    navigateDialog(action, user.id);
  };

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">회원 관리</h1>
        <p className="mt-1 text-sm text-text-muted">운영에 필요한 최소 개인정보만 표시합니다.</p>
      </header>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]">
        <div className="flex-1">
          <ListSearchField
            key={query}
            id="user-search"
            label="회원 검색"
            placeholder="이름 또는 이메일"
            query={query}
            onCommit={(value) => replaceFilters({ q: value || null })}
          />
        </div>
        <div>
          <Label className="sr-only" htmlFor="user-role">
            역할 필터
          </Label>
          <select
            id="user-role"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm sm:w-auto"
            value={role}
            onChange={(event) => replaceFilters({ role: event.target.value })}
          >
            <option value="all">모든 역할</option>
            <option value="user">일반 회원</option>
            <option value="admin">관리자</option>
          </select>
        </div>
        <div>
          <Label className="sr-only" htmlFor="user-status">
            회원 상태
          </Label>
          <select
            id="user-status"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm sm:w-auto"
            value={status}
            onChange={(event) => replaceFilters({ status: event.target.value })}
          >
            <option value="all">모든 상태</option>
            <option value="active">정상</option>
            <option value="suspended">정지</option>
          </select>
        </div>
        <div>
          <Label className="sr-only" htmlFor="user-sort">
            회원 정렬
          </Label>
          <select
            id="user-sort"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm sm:w-auto"
            value={sort}
            onChange={(event) => replaceFilters({ sort: event.target.value })}
          >
            <option value="newest">최근 가입순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loaded ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-text-muted">
                  회원을 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : null}
            {loaded && visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-text-muted">
                  조건에 맞는 회원이 없습니다.
                </TableCell>
              </TableRow>
            ) : null}
            {visible.map((user) => {
              const blockedReason = suspensionBlockReason(user, session?.id, activeAdminCount);
              const reasonId = `user-${user.id}-suspension-reason`;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role === "admin" ? "관리자" : "일반"}</TableCell>
                  <TableCell>{formatDate(user.joinedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={user.suspended ? "sale" : "free"}>
                      {user.suspended ? "정지" : "정상"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        variant="outline"
                        type="button"
                        disabled={Boolean(blockedReason)}
                        aria-describedby={blockedReason ? reasonId : undefined}
                        aria-label={`${user.name} 회원 ${user.suspended ? "복구" : "정지"}`}
                        onClick={() => openToggle(user)}
                      >
                        {user.suspended ? (
                          <ShieldCheck aria-hidden="true" />
                        ) : (
                          <ShieldOff aria-hidden="true" />
                        )}
                        {user.suspended ? "복구" : "정지"}
                      </Button>
                      {blockedReason ? (
                        <p className="max-w-52 text-xs leading-5 text-text-muted" id={reasonId}>
                          {blockedReason}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {sorted.length > PAGE_SIZE ? (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="회원 관리 페이지">
          <Button
            type="button"
            variant="outline"
            disabled={safePage <= 1}
            onClick={() => pushPage(Math.max(1, safePage - 1))}
          >
            이전
          </Button>
          <span className="text-sm text-text-muted" aria-live="polite">
            {safePage} / {pageCount} 페이지
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={safePage >= pageCount}
            onClick={() => pushPage(Math.min(pageCount, safePage + 1))}
          >
            다음
          </Button>
        </nav>
      ) : null}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected?.suspended ? "회원 이용 정지를 해제합니까?" : "회원 이용을 정지합니까?"}
            </DialogTitle>
            <DialogDescription>
              {selected?.name} 회원의 로그인과 구매 권한에 영향을 줍니다. 처리 전에 계정 정보를
              확인하십시오.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              취소
            </Button>
            <Button
              type="button"
              variant={selected?.suspended ? "default" : "destructive"}
              onClick={confirmToggle}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

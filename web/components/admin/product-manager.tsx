"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

import { PriceTag } from "@/components/store/price-tag";
import { ListSearchField } from "@/components/navigation/list-search-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminProductFormFromProduct,
  adminProductFormSchema,
  buildAdminProduct,
  createEmptyAdminProductForm,
  getAdminProductFormErrors,
  type AdminProductFormErrors,
  type AdminProductFormState,
} from "@/lib/catalog/admin-product-form";
import {
  GENRES,
  INSTRUMENTS,
  LEVELS,
  NOTATION_FORMATS,
  PRODUCT_TYPE,
  PRODUCT_TYPES,
  type Genre,
  type Level,
  type ProductType,
} from "@/lib/catalog/taxonomy";
import { isPurchasableScore } from "@/lib/catalog/integrity";
import type { CatalogProduct, LicenseStatus, ProductStatus } from "@/lib/catalog/types";
import { formatDate } from "@/lib/format";
import { parseAdminProductListQuery } from "@/lib/navigation/list-query";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { RepositoryError } from "@/lib/repositories/interfaces";
import { useListQueryNavigation } from "@/components/navigation/use-list-query-navigation";

const PAGE_SIZE = 10;

function toggleValue<T>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="text-sm text-sale-ink" id={id}>
      {message}
    </p>
  ) : null;
}

export function ProductManager() {
  const { searchParams, replaceFilters, pushPage } = useListQueryNavigation();
  const pathname = usePathname();
  const router = useRouter();
  const { q: query, status, sort, page } = parseAdminProductListQuery(searchParams);
  const dialogAction = searchParams.get("dialog");
  const dialogProductId = searchParams.get("product");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<AdminProductFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AdminProductFormErrors>({});
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [deleting, setDeleting] = useState<CatalogProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogOpenedHere = useRef(false);
  const hydratedDialogKey = useRef<string | null>(null);
  const lastDialogTrigger = useRef<HTMLButtonElement | null>(null);
  const closingDialog = useRef(false);

  const navigateDialog = useCallback(
    (action: "create" | "edit" | "delete", productId?: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("dialog", action);
      if (productId === undefined) next.delete("product");
      else next.set("product", String(productId));
      dialogOpenedHere.current = true;
      closingDialog.current = false;
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const replaceWithoutDialog = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("dialog");
    next.delete("product");
    const href = next.size > 0 ? `${pathname}?${next.toString()}` : pathname;
    router.replace(href, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeDialogUrl = useCallback(() => {
    hydratedDialogKey.current = null;
    if (dialogOpenedHere.current) {
      dialogOpenedHere.current = false;
      router.back();
      return;
    }
    replaceWithoutDialog();
  }, [replaceWithoutDialog, router]);

  const reload = () =>
    adminRepository.listProducts().then((next) => {
      setProducts(next);
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
        setForm(null);
        setEditing(null);
        setDeleting(null);
        if (dialogProductId) replaceWithoutDialog();
        return;
      }

      if (closingDialog.current) return;

      const validId =
        dialogProductId && /^\d+$/.test(dialogProductId) ? Number(dialogProductId) : null;
      const target =
        validId !== null && Number.isSafeInteger(validId)
          ? products.find((product) => product.id === validId)
          : undefined;
      const isValid =
        (dialogAction === "create" && dialogProductId === null) ||
        ((dialogAction === "edit" || dialogAction === "delete") && Boolean(target));

      if (!isValid) {
        hydratedDialogKey.current = null;
        dialogOpenedHere.current = false;
        setForm(null);
        setEditing(null);
        setDeleting(null);
        replaceWithoutDialog();
        return;
      }

      const key = `${dialogAction}:${dialogProductId ?? ""}`;
      if (hydratedDialogKey.current === key) return;
      hydratedDialogKey.current = key;
      setFieldErrors({});
      setDeleting(dialogAction === "delete" ? (target ?? null) : null);

      if (dialogAction === "create") {
        const nextId = Math.max(3000, ...products.map((product) => product.id)) + 1;
        setEditing(null);
        setForm(createEmptyAdminProductForm(nextId));
        return;
      }

      if (dialogAction === "edit" && target) {
        const purchasableScoreIds = new Set(
          products.filter(isPurchasableScore).map((candidate) => candidate.id),
        );
        const nextForm = adminProductFormFromProduct(target);
        setEditing(target);
        setForm({
          ...nextForm,
          itemIds: nextForm.itemIds.filter((itemId) => purchasableScoreIds.has(itemId)),
        });
        return;
      }

      setEditing(null);
      setForm(null);
    });
    return () => {
      cancelled = true;
    };
  }, [dialogAction, dialogProductId, loaded, products, replaceWithoutDialog]);

  const openCreate = (trigger: HTMLButtonElement) => {
    lastDialogTrigger.current = trigger;
    navigateDialog("create");
  };
  const openEdit = (product: CatalogProduct, trigger: HTMLButtonElement) => {
    lastDialogTrigger.current = trigger;
    navigateDialog("edit", product.id);
  };
  const updateForm = (next: AdminProductFormState) => {
    setFieldErrors({});
    setForm(next);
  };
  const closeForm = () => {
    closingDialog.current = true;
    setFieldErrors({});
    setForm(null);
    setEditing(null);
    closeDialogUrl();
  };
  const openDelete = (product: CatalogProduct, trigger: HTMLButtonElement) => {
    lastDialogTrigger.current = trigger;
    navigateDialog("delete", product.id);
  };
  const closeDelete = () => {
    closingDialog.current = true;
    setDeleting(null);
    closeDialogUrl();
  };
  const scoreOptions = products.filter(isPurchasableScore);
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  const filtered = products.filter(
    (product) =>
      (status === "all" || product.status === status) &&
      (!normalized ||
        `${product.title} ${product.artist ?? ""}`.toLocaleLowerCase("ko-KR").includes(normalized)),
  );
  const sorted = filtered.toSorted((a, b) => {
    if (sort === "sales") return b.salesCount - a.salesCount;
    if (sort === "title") return a.title.localeCompare(b.title, "ko-KR");
    return Date.parse(b.publishedAt ?? "1970-01-01") - Date.parse(a.publishedAt ?? "1970-01-01");
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    const result = adminProductFormSchema.safeParse(form);
    if (!result.success) {
      setFieldErrors(getAdminProductFormErrors(result.error));
      toast.error("입력 내용을 확인해 주세요.");
      return;
    }
    const product = buildAdminProduct(result.data, editing);
    setFieldErrors({});
    setSaving(true);
    try {
      if (editing) await adminRepository.updateProduct(editing.id, product);
      else await adminRepository.createProduct(product);
      toast.success(editing ? "상품을 수정했습니다." : "상품을 등록했습니다.");
      closeForm();
      await reload();
    } catch (caught) {
      if (caught instanceof RepositoryError && caught.code === "BUNDLE_ITEMS_UNAVAILABLE") {
        setFieldErrors({ itemIds: caught.message });
      }
      toast.error(
        caught instanceof Error
          ? caught.message
          : "상품을 저장하지 못했습니다. 입력값을 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminRepository.removeProduct(deleting.id);
      toast.success("상품을 삭제하거나 판매 이력에 따라 숨김 처리했습니다.");
      closeDelete();
      await reload();
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "상품을 처리하지 못했습니다. 다시 시도해 주세요.",
      );
    }
  };

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">악보 관리</h1>
          <p className="mt-1 text-sm text-text-muted">스토어와 같은 카탈로그를 사용합니다.</p>
        </div>
        <Button
          className="bg-cta text-surface hover:bg-cta-hover"
          type="button"
          onClick={(event) => openCreate(event.currentTarget)}
        >
          <Plus aria-hidden="true" /> 악보 등록
        </Button>
      </header>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <ListSearchField
            key={query}
            id="product-search"
            label="상품 검색"
            placeholder="제목 또는 아티스트"
            query={query}
            onCommit={(value) => replaceFilters({ q: value || null })}
          />
        </div>
        <div>
          <Label className="sr-only" htmlFor="product-status">
            게시 상태
          </Label>
          <select
            id="product-status"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm sm:w-auto"
            value={status}
            onChange={(event) => replaceFilters({ status: event.target.value })}
          >
            <option value="all">모든 상태</option>
            <option value="draft">초안</option>
            <option value="published">게시</option>
            <option value="hidden">숨김</option>
          </select>
        </div>
        <div>
          <Label className="sr-only" htmlFor="product-sort">
            정렬
          </Label>
          <select
            id="product-sort"
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm sm:w-auto"
            value={sort}
            onChange={(event) => replaceFilters({ sort: event.target.value })}
          >
            <option value="newest">최근 등록순</option>
            <option value="sales">판매순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>악기·형식</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>가격</TableHead>
              <TableHead>게시·허락</TableHead>
              <TableHead>판매</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loaded ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-text-muted">
                  상품을 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : null}
            {loaded && visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-text-muted">
                  조건에 맞는 상품이 없습니다.
                </TableCell>
              </TableRow>
            ) : null}
            {visible.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <p className="max-w-48 truncate font-medium">{product.title}</p>
                  <p className="text-xs text-text-muted">#{product.id}</p>
                </TableCell>
                <TableCell className="max-w-48 text-xs">
                  {product.instrumentIds
                    .map((id) => INSTRUMENTS.find((item) => item.id === id)?.label)
                    .filter(Boolean)
                    .join(", ")}{" "}
                  ·{" "}
                  {product.formats
                    .map((id) => NOTATION_FORMATS.find((item) => item.id === id)?.label)
                    .filter(Boolean)
                    .join(", ")}
                </TableCell>
                <TableCell>
                  {PRODUCT_TYPES.find((item) => item.id === product.type)?.label}
                </TableCell>
                <TableCell>
                  <PriceTag
                    listPrice={product.listPrice}
                    salePrice={product.salePrice}
                    saleEndsAt={product.saleEndsAt}
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={product.status === "published" ? "free" : "secondary"}>
                      {product.status}
                    </Badge>
                    <span className="text-xs text-text-muted">{product.licenseStatus}</span>
                  </div>
                </TableCell>
                <TableCell>{product.salesCount.toLocaleString("ko-KR")}</TableCell>
                <TableCell>{product.publishedAt ? formatDate(product.publishedAt) : "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`${product.title} 수정`}
                      onClick={(event) => openEdit(product, event.currentTarget)}
                    >
                      <Edit3 aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`${product.title} 삭제`}
                      onClick={(event) => openDelete(product, event.currentTarget)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sorted.length > PAGE_SIZE ? (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="악보 관리 페이지">
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
        open={Boolean(form)}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          onCloseAutoFocus={(event) => {
            const trigger = lastDialogTrigger.current;
            if (!trigger?.isConnected) return;
            event.preventDefault();
            trigger.focus();
            lastDialogTrigger.current = null;
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? "상품 수정" : "상품 등록"}</DialogTitle>
            <DialogDescription>
              분류는 스토어와 같은 taxonomy만 사용하며, 이용허락 확인 전에는 게시할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <form className="space-y-5" id="product-form" noValidate onSubmit={save}>
              {Object.keys(fieldErrors).length > 0 ? (
                <p className="rounded-lg bg-sale-bg p-3 text-sm text-sale-ink" role="alert">
                  상품을 저장하지 않았습니다. 오류가 표시된 입력 항목을 확인해 주세요.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-title">제목</Label>
                  <Input
                    aria-describedby={fieldErrors.title ? "product-title-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.title)}
                    id="product-title"
                    value={form.title}
                    onChange={(event) => updateForm({ ...form, title: event.target.value })}
                    required
                  />
                  <FieldError id="product-title-error" message={fieldErrors.title} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-artist">아티스트</Label>
                  <Input
                    id="product-artist"
                    value={form.artist}
                    onChange={(event) => updateForm({ ...form, artist: event.target.value })}
                    disabled={form.type === PRODUCT_TYPE.BUNDLE}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-type">상품 유형</Label>
                  <select
                    id="product-type"
                    className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
                    value={form.type}
                    disabled={Boolean(editing)}
                    onChange={(event) =>
                      updateForm({ ...form, type: event.target.value as ProductType })
                    }
                  >
                    {PRODUCT_TYPES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-genre">장르</Label>
                  <select
                    id="product-genre"
                    className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
                    value={form.genre}
                    onChange={(event) =>
                      updateForm({ ...form, genre: event.target.value as Genre })
                    }
                  >
                    {GENRES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <fieldset
                aria-describedby={fieldErrors.instrumentIds ? "instruments-error" : undefined}
              >
                <legend className="mb-2 text-sm font-medium">악기 (복수 선택)</legend>
                <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-line p-3 sm:grid-cols-4">
                  {INSTRUMENTS.map((instrument) => (
                    <Label
                      className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
                      key={instrument.id}
                      htmlFor={`instrument-${instrument.id}`}
                    >
                      <Checkbox
                        aria-invalid={Boolean(fieldErrors.instrumentIds)}
                        id={`instrument-${instrument.id}`}
                        checked={form.instrumentIds.includes(instrument.id)}
                        onCheckedChange={() =>
                          updateForm({
                            ...form,
                            instrumentIds: toggleValue(form.instrumentIds, instrument.id),
                          })
                        }
                      />
                      {instrument.label}
                    </Label>
                  ))}
                </div>
                <FieldError id="instruments-error" message={fieldErrors.instrumentIds} />
              </fieldset>
              <fieldset aria-describedby={fieldErrors.formats ? "formats-error" : undefined}>
                <legend className="mb-2 text-sm font-medium">기보 형식 (복수 선택)</legend>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-line p-3 sm:grid-cols-4">
                  {NOTATION_FORMATS.map((format) => (
                    <Label
                      className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
                      key={format.id}
                      htmlFor={`format-${format.id}`}
                    >
                      <Checkbox
                        aria-invalid={Boolean(fieldErrors.formats)}
                        id={`format-${format.id}`}
                        checked={form.formats.includes(format.id)}
                        onCheckedChange={() =>
                          updateForm({ ...form, formats: toggleValue(form.formats, format.id) })
                        }
                      />
                      {format.label}
                    </Label>
                  ))}
                </div>
                <FieldError id="formats-error" message={fieldErrors.formats} />
              </fieldset>
              {form.type === PRODUCT_TYPE.BUNDLE ? (
                <fieldset
                  aria-describedby={
                    fieldErrors.itemIds
                      ? "bundle-items-help bundle-items-error"
                      : "bundle-items-help"
                  }
                >
                  <legend className="mb-2 text-sm font-medium">수록곡 (복수 선택)</legend>
                  <p className="mb-2 text-xs text-text-muted" id="bundle-items-help">
                    게시·이용허락 확인이 끝난 단일 악보만 선택할 수 있습니다.
                  </p>
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line p-3">
                    {scoreOptions.map((score) => (
                      <Label
                        className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
                        key={score.id}
                        htmlFor={`item-${score.id}`}
                      >
                        <Checkbox
                          aria-invalid={Boolean(fieldErrors.itemIds)}
                          id={`item-${score.id}`}
                          checked={form.itemIds.includes(score.id)}
                          onCheckedChange={() =>
                            updateForm({ ...form, itemIds: toggleValue(form.itemIds, score.id) })
                          }
                        />
                        {score.title}
                      </Label>
                    ))}
                  </div>
                  <FieldError id="bundle-items-error" message={fieldErrors.itemIds} />
                </fieldset>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="list-price">정가</Label>
                  <Input
                    aria-describedby={fieldErrors.listPrice ? "list-price-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.listPrice)}
                    id="list-price"
                    type="number"
                    min={0}
                    step={1}
                    value={form.listPrice}
                    onChange={(event) => {
                      const listPrice = event.target.value;
                      updateForm({
                        ...form,
                        listPrice,
                        ...(listPrice.trim() === "0" ? { salePrice: "", saleEndsAt: "" } : {}),
                      });
                    }}
                    required
                  />
                  <FieldError id="list-price-error" message={fieldErrors.listPrice} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-price">할인가</Label>
                  <Input
                    aria-describedby={fieldErrors.salePrice ? "sale-price-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.salePrice)}
                    id="sale-price"
                    type="number"
                    min={0}
                    step={1}
                    value={form.salePrice}
                    onChange={(event) => {
                      const salePrice = event.target.value;
                      updateForm({
                        ...form,
                        salePrice,
                        saleEndsAt: salePrice ? form.saleEndsAt : "",
                      });
                    }}
                    disabled={!form.listPrice.trim() || Number(form.listPrice) === 0}
                  />
                  <FieldError id="sale-price-error" message={fieldErrors.salePrice} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-end">할인 종료</Label>
                  <Input
                    aria-describedby={fieldErrors.saleEndsAt ? "sale-end-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.saleEndsAt)}
                    id="sale-end"
                    type="datetime-local"
                    value={form.saleEndsAt}
                    onChange={(event) => updateForm({ ...form, saleEndsAt: event.target.value })}
                    disabled={!form.salePrice}
                    required={Boolean(form.salePrice)}
                  />
                  <FieldError id="sale-end-error" message={fieldErrors.saleEndsAt} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rhythm-level">리듬 난이도</Label>
                  <select
                    id="rhythm-level"
                    className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
                    value={form.levelRhythm}
                    onChange={(event) =>
                      updateForm({
                        ...form,
                        levelRhythm: event.target.value
                          ? (Number(event.target.value) as Level)
                          : "",
                      })
                    }
                  >
                    <option value="">표시 안 함</option>
                    {LEVELS.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technique-level">기법 난이도</Label>
                  <select
                    id="technique-level"
                    className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
                    value={form.levelTechnique}
                    onChange={(event) =>
                      updateForm({
                        ...form,
                        levelTechnique: event.target.value
                          ? (Number(event.target.value) as Level)
                          : "",
                      })
                    }
                  >
                    <option value="">표시 안 함</option>
                    {LEVELS.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages">페이지</Label>
                  <Input
                    aria-describedby={fieldErrors.pages ? "pages-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.pages)}
                    id="pages"
                    type="number"
                    min={1}
                    step={1}
                    value={form.pages}
                    onChange={(event) => updateForm({ ...form, pages: event.target.value })}
                  />
                  <FieldError id="pages-error" message={fieldErrors.pages} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-signature">조성</Label>
                  <Input
                    id="key-signature"
                    value={form.keySignature}
                    onChange={(event) => updateForm({ ...form, keySignature: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    aria-describedby={fieldErrors.bpm ? "bpm-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.bpm)}
                    id="bpm"
                    type="number"
                    min={1}
                    step={1}
                    value={form.bpm}
                    onChange={(event) => updateForm({ ...form, bpm: event.target.value })}
                  />
                  <FieldError id="bpm-error" message={fieldErrors.bpm} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="license-status">이용허락</Label>
                  <select
                    aria-describedby={
                      fieldErrors.licenseStatus ? "license-status-error" : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.licenseStatus)}
                    id="license-status"
                    className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm aria-invalid:border-sale"
                    value={form.licenseStatus}
                    onChange={(event) =>
                      updateForm({ ...form, licenseStatus: event.target.value as LicenseStatus })
                    }
                    required
                  >
                    <option value="pending">확인 중</option>
                    <option value="cleared">확인 완료</option>
                    <option value="blocked">판매 불가</option>
                  </select>
                  <FieldError id="license-status-error" message={fieldErrors.licenseStatus} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publication-status">게시 상태</Label>
                  <select
                    aria-describedby={fieldErrors.status ? "publication-status-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.status)}
                    id="publication-status"
                    className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm aria-invalid:border-sale"
                    value={form.status}
                    onChange={(event) =>
                      updateForm({ ...form, status: event.target.value as ProductStatus })
                    }
                    required
                  >
                    <option value="draft">초안</option>
                    <option value="published">게시</option>
                    <option value="hidden">숨김</option>
                  </select>
                  <FieldError id="publication-status-error" message={fieldErrors.status} />
                </div>
              </div>
            </form>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              취소
            </Button>
            <Button
              form="product-form"
              type="submit"
              disabled={saving}
              className="bg-cta text-surface hover:bg-cta-hover"
            >
              {saving ? "저장 중" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) closeDelete();
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            const trigger = lastDialogTrigger.current;
            if (!trigger?.isConnected) return;
            event.preventDefault();
            trigger.focus();
            lastDialogTrigger.current = null;
          }}
        >
          <DialogHeader>
            <DialogTitle>상품을 삭제합니까?</DialogTitle>
            <DialogDescription>
              판매 이력이 있으면 완전 삭제하지 않고 숨김 처리합니다. 이 작업 뒤에도 주문 기록은
              유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDelete}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={remove}>
              삭제 또는 숨김
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

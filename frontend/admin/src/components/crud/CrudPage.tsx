'use client';

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { InlineAlert, primaryButton, secondaryButton } from "@/components/ui/Field";
import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api";
import { errorMessage } from "@/services/cms";
import { cn } from "@/lib/cn";
import { FieldInput, toFormValues, toRequestBody, type FieldDef, type FormValues } from "./fields";

export type Row = { id: number } & Record<string, unknown>;

export interface Column<T extends Row> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface CrudPageProps<T extends Row> {
  /** Page title; also used in messages ("ویرایش {entity}"). */
  title: string;
  entity: string;
  crumbs?: string[];
  description?: string;
  queryKey: readonly unknown[];
  listUrl: string;
  /** POST target for new rows; null hides the "add" button. Defaults to listUrl. */
  createUrl?: string | null;
  itemUrl: (id: number) => string;
  columns: Column<T>[];
  /** Form fields; without them rows are read-only (delete only). */
  fields?: FieldDef[];
  deletable?: boolean;
  /** Free-text filter; the text typed in the header search (?q=) is applied too. */
  searchText?: (row: T) => string;
  rowActions?: (row: T) => React.ReactNode;
  headerActions?: React.ReactNode;
  emptyMessage?: string;
  /** Other cached queries that change when this list changes. */
  invalidate?: readonly (readonly unknown[])[];
  /** Reshapes the list response, e.g. flattening nested rows. */
  transform?: (data: unknown) => T[];
  /** Inside another screen (e.g. a modal): no page header. */
  embedded?: boolean;
}

/** List + create/edit/delete screen driven by a column and field configuration. Table on desktop, cards on phones. */
export function CrudPage<T extends Row>(props: CrudPageProps<T>) {
  return (
    <Suspense>
      <CrudScreen {...props} />
    </Suspense>
  );
}

function CrudScreen<T extends Row>({
  title,
  entity,
  crumbs,
  description,
  queryKey,
  listUrl,
  createUrl,
  itemUrl,
  columns,
  fields,
  deletable = true,
  searchText,
  rowActions,
  headerActions,
  emptyMessage,
  invalidate = [],
  embedded,
  transform,
}: CrudPageProps<T>) {
  const queryClient = useQueryClient();
  const headerQuery = useSearchParams().get("q")?.trim() ?? "";
  const [search, setSearch] = useState(headerQuery);
  const list = useQuery({ queryKey, queryFn: async () => {
    const data = await apiGet<unknown>(listUrl);
    return transform ? transform(data) : (data as T[]);
  } });

  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [toDelete, setToDelete] = useState<T | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editing === "new" ? apiPost(createUrl ?? listUrl, body) : apiPut(itemUrl((editing as T).id), body),
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(itemUrl(id)),
    onSuccess: () => {
      setToDelete(null);
      refresh();
    },
  });

  function open(row: T | "new") {
    save.reset();
    setValues(toFormValues(fields ?? [], row === "new" ? null : row));
    setEditing(row);
  }

  const q = search.trim();
  const rows = (list.data ?? []).filter((r) => !q || !searchText || searchText(r).includes(q));
  const canCreate = !!fields && createUrl !== null;
  const visibleFields = (fields ?? []).filter((f) => !f.visible || f.visible(values));

  const actions = (row: T, mobile?: boolean) => (
    <div className={cn("flex items-center gap-1", mobile ? "justify-end" : "justify-center")}>
      {rowActions?.(row)}
      {fields && (
        <button
          type="button"
          onClick={() => open(row)}
          className="inline-flex size-10 items-center justify-center rounded-xl text-brand-600 hover:bg-brand-500/10"
          aria-label={`ویرایش ${entity}`}
          title="ویرایش"
        >
          <Pencil className="size-4" />
        </button>
      )}
      {deletable && (
        <button
          type="button"
          onClick={() => setToDelete(row)}
          className="inline-flex size-10 items-center justify-center rounded-xl text-danger-fg hover:bg-danger/10"
          aria-label={`حذف ${entity}`}
          title="حذف"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );

  const cell = (row: T, c: Column<T>) => c.render?.(row) ?? (row[c.key] === null || row[c.key] === undefined || row[c.key] === "" ? "—" : String(row[c.key]));
  const [primary, ...rest] = columns;

  return (
    <div className="space-y-5">
      {!embedded && (
        <PageHeader
          title={title}
          crumbs={crumbs ?? [title]}
          action={
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {headerActions}
              {canCreate && (
                <button type="button" onClick={() => open("new")} className={cn(primaryButton, "flex-1 sm:flex-none")}>
                  <Plus className="size-4" />
                  افزودن {entity}
                </button>
              )}
            </div>
          }
        />
      )}
      {!embedded && description && <p className="-mt-2 text-sm leading-7 text-muted">{description}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {searchText && (
          <label className="relative block flex-1 sm:max-w-sm">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="h-11 w-full rounded-xl border border-line bg-surface pr-11 pl-4 text-sm text-ink outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10"
            />
          </label>
        )}
        {embedded && canCreate && (
          <button type="button" onClick={() => open("new")} className={cn(primaryButton, "sm:mr-auto")}>
            <Plus className="size-4" />
            افزودن {entity}
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        {list.isError ? (
          <ErrorState message={errorMessage(list.error, "دریافت اطلاعات با خطا مواجه شد.")} onRetry={() => list.refetch()} />
        ) : list.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message={q ? "موردی مطابق جستجو پیدا نشد." : (emptyMessage ?? "هنوز موردی ثبت نشده است.")} />
        ) : (
          <>
            {/* Tablet / desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-line bg-surface-2 text-xs text-muted">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="whitespace-nowrap p-4 font-bold">
                        {c.label}
                      </th>
                    ))}
                    <th className="p-4 text-center font-bold">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-surface-2/60">
                      {columns.map((c, i) => (
                        <td key={c.key} className={cn("p-4", i === 0 ? "font-bold" : "text-muted", c.className)}>
                          {cell(row, c)}
                        </td>
                      ))}
                      <td className="p-2">{actions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((row) => (
                <li key={row.id} className="p-4">
                  <div className="font-bold text-ink">{cell(row, primary)}</div>
                  {rest.length > 0 && (
                    <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
                      {rest.map((c) => (
                        <div key={c.key} className="contents">
                          <dt className="text-muted">{c.label}</dt>
                          <dd className="min-w-0 break-words text-ink">{cell(row, c)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="mt-2 border-t border-line/60 pt-2">{actions(row, true)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {fields && (
        <Modal
          open={editing !== null}
          title={editing === "new" ? `افزودن ${entity}` : `ویرایش ${entity}`}
          onClose={() => setEditing(null)}
          className="sm:max-w-2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(toRequestBody(visibleFields, values));
            }}
            className="space-y-4"
          >
            {save.isError && <InlineAlert tone="error">{errorMessage(save.error, "ذخیره اطلاعات با خطا مواجه شد.")}</InlineAlert>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleFields.map((f) => (
                <FieldInput key={f.name} field={f} values={values} onChange={(name, v) => setValues((s) => ({ ...s, [name]: v }))} />
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
                انصراف
              </button>
              <button type="submit" disabled={save.isPending} className={primaryButton}>
                {save.isPending ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`حذف ${entity}`}
        message={
          remove.isError
            ? errorMessage(remove.error, "حذف با خطا مواجه شد.")
            : `آیا از حذف «${toDelete ? String(toDelete[primary.key] ?? "") : ""}» اطمینان دارید؟`
        }
        busy={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => {
          setToDelete(null);
          remove.reset();
        }}
      />
    </div>
  );
}

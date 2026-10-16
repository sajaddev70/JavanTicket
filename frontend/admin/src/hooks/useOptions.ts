import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/services/api";
import type { SelectOption } from "@/components/crud/fields";

type Row = { id: number } & Record<string, unknown>;

/** Rows of an admin list endpoint, plus select options built from them. Shares the list's cache key. */
export function useOptions(queryKey: readonly unknown[], url: string, label: (row: Row) => string) {
  const query = useQuery({ queryKey, queryFn: () => apiGet<Row[]>(url) });
  const rows = query.data ?? [];
  const options: SelectOption[] = rows.map((r) => ({ value: r.id, label: label(r) }));
  return { rows, options };
}

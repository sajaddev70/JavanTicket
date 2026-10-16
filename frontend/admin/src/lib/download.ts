import { api } from "@/services/api";

/** Downloads a file (e.g. a CSV export) from the admin API with the admin's token. */
export async function downloadFile(url: string, params: Record<string, unknown>, fileName: string) {
  const blob = (await api.get(url, { params: cleanParams(params), responseType: "blob", timeout: 120_000 })) as unknown as Blob;
  saveBlob(blob, fileName);
}

/** Saves rows built in the browser as a CSV file Excel opens with Persian text intact. */
export function downloadCsv(fileName: string, header: string[], rows: unknown[][]) {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  saveBlob(new Blob([text], { type: "text/csv;charset=utf-8" }), fileName);
}

function saveBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Drops empty filters so they are not sent as `?x=`. */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));
}

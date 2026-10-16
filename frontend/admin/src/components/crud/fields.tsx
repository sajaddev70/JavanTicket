'use client';

import { useId, useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { adminApi } from "@/services/admin";
import { errorMessage } from "@/services/cms";
import { mediaUrl } from "@/lib/media";
import { toEnDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

export type FormValues = Record<string, string | boolean>;

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "switch" | "image" | "color" | "datetime";
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Spans both columns of the form grid. */
  wide?: boolean;
  dir?: "ltr" | "rtl";
  /** Select options; may depend on the other values (e.g. halls of the chosen city). */
  options?: SelectOption[] | ((values: FormValues) => SelectOption[]);
  /** Select values are ids: send them as numbers. */
  numeric?: boolean;
  /** Label of the empty choice (default: "—", or "انتخاب کنید" when required). */
  emptyLabel?: string;
  defaultValue?: string | boolean;
  visible?: (values: FormValues) => boolean;
}

const control =
  "w-full rounded-xl border border-line bg-field px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** ISO instant -> value of a datetime-local input in the viewer's time zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** API row -> form values (every field becomes a string, switches a boolean). */
export function toFormValues(fields: FieldDef[], row?: Record<string, unknown> | null): FormValues {
  const values: FormValues = {};
  for (const f of fields) {
    const raw = row?.[f.name];
    if (f.type === "switch") values[f.name] = raw === undefined || raw === null ? ((f.defaultValue as boolean) ?? false) : Boolean(raw);
    else if (raw === undefined || raw === null) values[f.name] = (f.defaultValue as string) ?? "";
    else if (f.type === "datetime") values[f.name] = toLocalInput(String(raw));
    else values[f.name] = String(raw);
  }
  return values;
}

/** Form values -> request body in the API's snake_case shape. */
export function toRequestBody(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "switch") body[f.name] = Boolean(v);
    else if (typeof v !== "string" || v.trim() === "") body[f.name] = null;
    else if (f.type === "number" || (f.type === "select" && f.numeric)) {
      const n = Number(toEnDigits(v).replace(/[,٬\s]/g, ""));
      body[f.name] = Number.isNaN(n) ? null : n;
    } else if (f.type === "datetime") body[f.name] = new Date(v).toISOString();
    else body[f.name] = v.trim();
  }
  return body;
}

export function FieldInput({
  field,
  values,
  onChange,
}: {
  field: FieldDef;
  values: FormValues;
  onChange: (name: string, value: string | boolean) => void;
}) {
  const id = useId();
  const value = values[field.name];
  const label = (
    <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">
      {field.label}
      {field.required && <span className="text-danger"> *</span>}
    </span>
  );
  const hint = field.hint && <span className="mt-1 block text-[12px] text-muted">{field.hint}</span>;
  const wrap = cn("block", field.wide && "md:col-span-2");

  switch (field.type) {
    case "switch":
      return (
        <label className={cn("flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-field px-3.5", field.wide && "md:col-span-2")}>
          <span className="text-[14px] font-semibold text-ink">{field.label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 after:absolute after:right-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:-translate-x-5" />
        </label>
      );
    case "textarea":
      return (
        <label className={wrap}>
          {label}
          <textarea
            value={String(value ?? "")}
            required={field.required}
            dir={field.dir}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={cn(control, "min-h-28 py-3 leading-7")}
          />
          {hint}
        </label>
      );
    case "select": {
      const options = typeof field.options === "function" ? field.options(values) : (field.options ?? []);
      return (
        <label className={wrap}>
          {label}
          <select
            value={String(value ?? "")}
            required={field.required}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={cn(control, "h-12 appearance-none")}
          >
            <option value="">{field.emptyLabel ?? (field.required ? "انتخاب کنید" : "—")}</option>
            {options.map((o) => (
              <option key={o.value} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
          {hint}
        </label>
      );
    }
    case "color":
      return (
        <label className={wrap}>
          {label}
          <div className="flex h-12 items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#2f80f5"}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-field p-1"
              aria-label={field.label}
            />
            <input
              id={id}
              value={String(value ?? "")}
              dir="ltr"
              placeholder="#2f80f5"
              onChange={(e) => onChange(field.name, e.target.value)}
              className={cn(control, "h-12 text-left")}
            />
          </div>
          {hint}
        </label>
      );
    case "image":
      return <ImageField field={field} value={String(value ?? "")} onChange={(v) => onChange(field.name, v)} />;
    default:
      return (
        <label className={wrap}>
          {label}
          <input
            type={field.type === "datetime" ? "datetime-local" : "text"}
            inputMode={field.type === "number" ? "decimal" : undefined}
            value={String(value ?? "")}
            required={field.required}
            dir={field.dir ?? (field.type === "number" || field.type === "datetime" ? "ltr" : undefined)}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={cn(control, "h-12", (field.dir === "ltr" || field.type === "number") && "text-left")}
          />
          {hint}
        </label>
      );
  }
}

/** Upload an image to the backend (or paste its address) with a live preview. */
function ImageField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const preview = mediaUrl(value);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      onChange(await adminApi.upload(file));
    } catch (err) {
      setError(errorMessage(err, "بارگذاری تصویر با خطا مواجه شد."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("block", field.wide && "md:col-span-2")}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">
        {field.label}
        {field.required && <span className="text-danger"> *</span>}
      </span>
      <div className="flex items-stretch gap-3">
        <div className="relative flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-field">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded / remote image
            <img src={preview} alt="" className="size-full object-contain" />
          ) : (
            <ImageUp className="size-6 text-muted" />
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <Loader2 className="size-5 animate-spin text-brand-600" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 text-[13px] font-bold text-ink hover:border-brand-500/40 disabled:opacity-60"
            >
              <ImageUp className="size-4" />
              بارگذاری تصویر
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-danger-fg hover:bg-danger/10"
                aria-label="حذف تصویر"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <input
            value={value}
            dir="ltr"
            placeholder="/uploads/... یا https://..."
            onChange={(e) => onChange(e.target.value)}
            className={cn(control, "h-10 text-left text-[13px]")}
            aria-label={`آدرس ${field.label}`}
          />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {error && <span className="mt-1 block text-[12px] text-danger-fg">{error}</span>}
      {field.hint && <span className="mt-1 block text-[12px] text-muted">{field.hint}</span>}
    </div>
  );
}

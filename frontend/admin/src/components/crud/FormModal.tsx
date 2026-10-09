'use client';

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { InlineAlert, primaryButton, secondaryButton } from "@/components/ui/Field";
import { errorMessage } from "@/services/cms";
import { FieldInput, toFormValues, toRequestBody, type FieldDef, type FormValues } from "./fields";

/**
 * Create / edit dialog for a set of fields. Mount it with a `key` per record so the form starts from that record.
 * `submit` receives the request body (snake_case, typed per field).
 */
export function FormModal({
  title,
  fields,
  initial,
  submit,
  onClose,
  onSaved,
  wide = true,
}: {
  title: string;
  fields: FieldDef[];
  initial?: Record<string, unknown> | null;
  submit: (body: Record<string, unknown>) => Promise<unknown>;
  onClose: () => void;
  onSaved?: () => void;
  wide?: boolean;
}) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(fields, initial));
  const save = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      onSaved?.();
      onClose();
    },
  });
  const visible = fields.filter((f) => !f.visible || f.visible(values));

  return (
    <Modal open title={title} onClose={onClose} className={wide ? "sm:max-w-2xl" : undefined}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(toRequestBody(visible, values));
        }}
        className="space-y-4"
      >
        {save.isError && <InlineAlert tone="error">{errorMessage(save.error, "ذخیره اطلاعات با خطا مواجه شد.")}</InlineAlert>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((f) => (
            <FieldInput key={f.name} field={f} values={values} onChange={(name, v) => setValues((s) => ({ ...s, [name]: v }))} />
          ))}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButton}>
            انصراف
          </button>
          <button type="submit" disabled={save.isPending} className={primaryButton}>
            {save.isPending ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

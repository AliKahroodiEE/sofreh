"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

interface SectionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Present when renaming an existing section. */
  initialName?: string;
  onSubmit: (name: string) => Promise<unknown>;
}

export function SectionDialog({ open, onClose, initialName, onSubmit }: SectionDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={initialName ? "ویرایش نام بخش" : "بخش جدید منو"}>
      {/* Mounted only while open, so the field starts fresh every time. */}
      <SectionForm initialName={initialName ?? ""} onSubmit={onSubmit} onClose={onClose} />
    </Modal>
  );
}

function SectionForm({ initialName, onSubmit, onClose }: { initialName: string; onSubmit: (name: string) => Promise<unknown>; onClose: () => void }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const invalid = trimmed.length < 1 || trimmed.length > 40;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (invalid) return;
    setSaving(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch {
      // The mutation already showed the API error.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="نام بخش" hint="مثل پیتزاها، پیش‌غذا، نوشیدنی‌ها (حداکثر ۴۰ حرف)">
        {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="پیش‌غذاها" />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          انصراف
        </Button>
        <Button type="submit" loading={saving} disabled={invalid}>
          {initialName ? "ذخیره" : "افزودن بخش"}
        </Button>
      </div>
    </form>
  );
}

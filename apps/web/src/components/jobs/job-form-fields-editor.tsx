"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { slugifyFieldKey, generateId } from "@/lib/id";
import {
  DOCUMENT_FIELD_PRESETS,
  FORM_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
} from "@/lib/form-fields";
import type { ApplicationFormField, FormFieldType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELD_TYPES = FORM_FIELD_TYPES;

export function JobFormFieldsEditor({
  fields: initial,
  onSave,
  onCancel,
}: {
  fields: ApplicationFormField[];
  onSave: (fields: ApplicationFormField[]) => void;
  onCancel?: () => void;
}) {
  const [fields, setFields] = useState(initial);

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setFields(initial);
  }

  function addField() {
    const label = "New field";
    setFields((prev) => [
      ...prev,
      {
        id: generateId("f"),
        fieldKey: slugifyFieldKey(label),
        label,
        type: "text",
        required: false,
        order: prev.length + 1,
      },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_FIELD_PRESETS.map((preset) => (
          <Button
            key={preset.fieldKey}
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() =>
              setFields((prev) => [
                ...prev,
                {
                  id: generateId("f"),
                  fieldKey: preset.fieldKey,
                  label: preset.label,
                  type: preset.type,
                  required: true,
                  order: prev.length + 1,
                },
              ])
            }
          >
            + {preset.label}
          </Button>
        ))}
      </div>
      {fields.map((field, i) => (
        <div key={field.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
          <Input
            value={field.label}
            onChange={(e) => {
              const next = [...fields];
              next[i] = {
                ...field,
                label: e.target.value,
                fieldKey: slugifyFieldKey(e.target.value) || field.fieldKey,
              };
              setFields(next);
            }}
            placeholder="Label"
          />
          <Input value={field.fieldKey} readOnly className="bg-muted/50 text-muted-foreground" />
          <Select
            value={field.type}
            onValueChange={(v) => {
              if (!v) return;
              const next = [...fields];
              next[i] = { ...field, type: v as FormFieldType };
              setFields(next);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {FORM_FIELD_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(c) => {
                  const next = [...fields];
                  next[i] = { ...field, required: c };
                  setFields(next);
                }}
              />
              <Label className="text-xs">Required</Label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addField}>
        <Plus className="mr-1 h-4 w-4" />
        Add field
      </Button>
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          className="rounded-full bg-brand hover:bg-brand/90"
          onClick={() => onSave(fields.map((f, i) => ({ ...f, order: i + 1 })))}
        >
          Save form fields
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

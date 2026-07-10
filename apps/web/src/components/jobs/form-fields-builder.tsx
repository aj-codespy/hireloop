"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { ApplicationFormField, FormFieldType } from "@/lib/types";
import {
  DOCUMENT_FIELD_PRESETS,
  FORM_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
} from "@/lib/form-fields";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FIELD_TYPES = FORM_FIELD_TYPES;

export function FormFieldsBuilder({ fields: initial }: { fields: ApplicationFormField[] }) {
  const [fields, setFields] = useState(initial);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        id: `new-${prev.length}`,
        fieldKey: "field",
        label: "New field",
        type: "text",
        required: false,
        order: prev.length + 1,
      },
    ]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function save() {
    toast.success("Application form saved (demo)");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Application form</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Public form fields shown to candidates before shortlisting.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1 h-4 w-4" />
          Add field
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_FIELD_PRESETS.map((preset) => (
            <Button
              key={preset.fieldKey}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setFields((prev) => [
                  ...prev,
                  {
                    id: `doc-${preset.fieldKey}-${prev.length}`,
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
          <div key={field.id} className="rounded-lg border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...field, label: e.target.value };
                    setFields(next);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input
                  value={field.fieldKey}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...field, fieldKey: e.target.value };
                    setFields(next);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) => {
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
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => {
                      const next = [...fields];
                      next[i] = { ...field, required: checked };
                      setFields(next);
                    }}
                  />
                  <Label>Required</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button onClick={save}>Save form</Button>
        </div>
      </CardContent>
    </Card>
  );
}

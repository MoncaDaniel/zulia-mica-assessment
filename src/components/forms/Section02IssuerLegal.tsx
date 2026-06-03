"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S02Schema, type S02Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import { YesNoNAField } from "./shared/YesNoNAField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S02Data>;
  onSave: (data: S02Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section02IssuerLegal({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S02Data>({
    resolver: zodResolver(S02Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-8">
      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="issuerIdentifiable"
          render={({ field }) => (
            <YesNoField
              label="Issuer identifiable (name, registration number, jurisdiction, contacts)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.issuerIdentifiable}
            />
          )}
        />
        <Textarea
          label="Notes"
          rows={2}
          placeholder="Additional context..."
          {...register("issuerIdentifiableNotes")}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="issuerAuthorised"
          render={({ field }) => (
            <YesNoNAField
              label="Issuer authorised if required (EMT issuer must be a credit institution or e-money institution)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.issuerAuthorised}
            />
          )}
        />
        <Textarea
          label="Notes"
          rows={2}
          placeholder="Authorisation details, applicable exemptions..."
          {...register("issuerAuthorisedNotes")}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="sourceCodeDisclosed"
          render={({ field }) => (
            <YesNoField
              label="Source code repository disclosed (e.g. GitHub URL)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.sourceCodeDisclosed}
            />
          )}
        />
        <Input
          label="Repository URL"
          type="url"
          placeholder="https://github.com/..."
          {...register("sourceCodeUrl")}
          disabled={readOnly}
        />
        <Textarea
          label="Notes"
          rows={2}
          {...register("sourceCodeNotes")}
          disabled={readOnly}
        />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save & Continue</Button>
        </div>
      )}
    </form>
  );
}

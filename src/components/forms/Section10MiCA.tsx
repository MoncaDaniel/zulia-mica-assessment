"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S10Schema, type S10Data } from "@/types/assessment";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import { YesNoNAField } from "./shared/YesNoNAField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S10Data>;
  onSave: (data: S10Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section10MiCA({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S10Data>({
    resolver: zodResolver(S10Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="p-4 bg-brand-500/10 rounded-lg border border-brand-500/30">
        <Select
          label="MiCA Classification Confirmed"
          options={[
            { value: "", label: "Select classification" },
            { value: "EMT", label: "EMT – E-Money Token (Art. 48)" },
            { value: "ART", label: "ART – Asset-Referenced Token (Art. 16)" },
            { value: "OCA", label: "OCA – Other Crypto-Asset (Art. 4)" },
            { value: "None", label: "None / Out of scope" },
          ]}
          {...register("micaClassification")}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="reservesVerified"
          render={({ field }) => (
            <YesNoNAField
              label="If EMT or ART: reserves and attestations verified (Art. 32 / Art. 51)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.reservesVerified}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("reservesNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="executionFrameworkAligned"
          render={({ field }) => (
            <YesNoField
              label="Execution framework aligned (listing and trading accommodated within firm's execution model, commercial model, and best execution framework)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.executionFrameworkAligned}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("executionFrameworkNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="marketAbuseMonitoring"
          render={({ field }) => (
            <YesNoField
              label="Market-abuse monitoring configured (token and trading pairs onboarded into market abuse surveillance framework with alert scenarios and thresholds)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.marketAbuseMonitoring}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("marketAbuseNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="transparencyPublished"
          render={({ field }) => (
            <YesNoField
              label="Transparency and Operating Rules published (client-facing disclosures, token-specific warnings, and applicable Operating Rules published prior to go-live)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.transparencyPublished}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("transparencyNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="significantTokenAssessment"
          render={({ field }) => (
            <YesNoNAField
              label="Significant token assessment completed (if applicable — Art. 23 / Art. 43)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.significantTokenAssessment}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("significantTokenNotes")} disabled={readOnly} />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save & Continue</Button>
        </div>
      )}
    </form>
  );
}

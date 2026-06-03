"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S09Schema, type S09Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S09Data>;
  onSave: (data: S09Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section09Technical({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S09Data>({
    resolver: zodResolver(S09Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="space-y-3 p-4 bg-red-900/10 rounded-lg border border-red-800/50">
        <p className="text-xs text-red-300 font-medium uppercase tracking-wide">Security Incidents</p>
        <Controller
          control={control}
          name="securityIncidents"
          render={({ field }) => (
            <YesNoField
              label="Major security incidents applicable to the code"
              hint="Yes = negative signal (inverted scoring)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.securityIncidents}
            />
          )}
        />
        <Textarea label="Details" rows={3} placeholder="Describe any known exploits, hacks, or vulnerabilities..." {...register("securityIncidentsDetails")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="githubReviewed"
          render={({ field }) => (
            <YesNoField
              label="GitHub repository reviewed"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.githubReviewed}
            />
          )}
        />
        <Input label="GitHub URL" type="url" placeholder="https://github.com/..." {...register("githubUrl")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="vulnerabilitiesManaged"
          render={({ field }) => (
            <YesNoField
              label="Vulnerabilities and bugs managed and regularly fixed"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.vulnerabilitiesManaged}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("vulnerabilitiesNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="euIntegration"
          render={({ field }) => (
            <YesNoField
              label="Token can be integrated in the European ecosystem"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.euIntegration}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("euIntegrationNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="smartContractAudit"
          render={({ field }) => (
            <YesNoField
              label="Independent smart contract audit performed"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.smartContractAudit}
            />
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Auditor Name" {...register("auditorsName")} disabled={readOnly} />
          <Input label="Audit Report Link" type="url" {...register("auditReportLink")} disabled={readOnly} />
        </div>
      </div>

      <Textarea
        label="Other Technical Concerns"
        rows={4}
        placeholder="Code quality, architecture concerns, dependency risks..."
        {...register("otherTechnicalConcerns")}
        disabled={readOnly}
      />

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save & Continue</Button>
        </div>
      )}
    </form>
  );
}

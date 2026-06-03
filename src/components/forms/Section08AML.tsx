"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S08Schema, type S08Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import { YesNoNAField } from "./shared/YesNoNAField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S08Data>;
  onSave: (data: S08Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section08AML({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S08Data>({
    resolver: zodResolver(S08Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Input
        label="FIT Test Classification Result"
        placeholder="e.g. Crypto-asset, E-Money Token, etc."
        {...register("fitTestResult")}
        disabled={readOnly}
      />

      <div className="space-y-3 p-4 bg-amber-900/10 rounded-lg border border-amber-800/50">
        <p className="text-xs text-amber-300 font-medium uppercase tracking-wide">Privacy / Anonymisation Risk</p>
        <Controller
          control={control}
          name="inbuiltAnonymisation"
          render={({ field }) => (
            <YesNoField
              label="Does the token have an inbuilt anonymisation function?"
              hint="Yes = higher AML risk (inverted scoring)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.inbuiltAnonymisation}
            />
          )}
        />
        <Controller
          control={control}
          name="holdersIdentifiable"
          render={({ field }) => (
            <YesNoNAField
              label="If yes: can holders and transaction history be identified by CASPs?"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.holdersIdentifiable}
            />
          )}
        />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="blockchainAnalyticsTools"
          render={({ field }) => (
            <YesNoField
              label="Supported by deployed blockchain analytics tools"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.blockchainAnalyticsTools}
            />
          )}
        />
        <Input label="Tool Name(s)" {...register("blockchainAnalyticsToolName")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="transactionsTraceable"
          render={({ field }) => (
            <YesNoField
              label="Transactions can be effectively traced and monitored"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.transactionsTraceable}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("transactionsTraceableNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="listedOnExchanges"
          render={({ field }) => (
            <YesNoField
              label="Listed on major crypto exchanges"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.listedOnExchanges}
            />
          )}
        />
        <Input label="List of Exchanges" placeholder="Binance, Coinbase, Kraken..." {...register("exchangesList")} disabled={readOnly} />
        <Input label="Daily Trading Volume (USD)" type="number" {...register("dailyTradingVolume")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-red-900/10 rounded-lg border border-red-800/50">
        <p className="text-xs text-red-300 font-medium uppercase tracking-wide">Illicit Activity</p>
        <Controller
          control={control}
          name="illicitActivities"
          render={({ field }) => (
            <YesNoField
              label="Involvement in illicit activities identified"
              hint="Yes = non-compliant (inverted scoring)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.illicitActivities}
            />
          )}
        />
        <Textarea label="Details" rows={2} {...register("illicitActivitiesDetails")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-amber-900/10 rounded-lg border border-amber-800/50">
        <p className="text-xs text-amber-300 font-medium uppercase tracking-wide">Securities Risk</p>
        <Controller
          control={control}
          name="passiveRevenueRights"
          render={({ field }) => (
            <YesNoField
              label="Ownership conveys rights to passive revenue, rate of return, interests in a company, profits, derivatives, or operates as debt/equity instrument"
              hint="Yes = potential securities classification issue (inverted scoring)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.passiveRevenueRights}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("passiveRevenueNotes")} disabled={readOnly} />
      </div>

      <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="projectCommitment"
          render={({ field }) => (
            <YesNoField
              label="Project understands and commits to working for benefit of users and supports healthy crypto environment"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.projectCommitment}
            />
          )}
        />
        <Textarea label="Notes" rows={2} {...register("projectCommitmentNotes")} disabled={readOnly} />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save & Continue</Button>
        </div>
      )}
    </form>
  );
}

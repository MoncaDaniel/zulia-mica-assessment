"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S04Schema, type S04Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S04Data>;
  onSave: (data: S04Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section04Tokenomics({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S04Data>({
    resolver: zodResolver(S04Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Supply</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Total Supply" placeholder="e.g. 1,000,000,000" {...register("totalSupply")} disabled={readOnly} />
        <Input label="Circulating Supply at TGE" placeholder="e.g. 200,000,000" {...register("circulatingSupplyTGE")} disabled={readOnly} />
      </div>

      <Textarea
        label="Distribution / Allocation (founders / investors / treasury)"
        rows={4}
        placeholder="e.g. Team: 15%, Investors: 20%, Treasury: 30%, Community: 35%"
        {...register("distributionAllocation")}
        disabled={readOnly}
      />

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="vestingSchedule"
          render={({ field }) => (
            <YesNoField
              label="Vesting schedule for insiders disclosed"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.vestingSchedule}
            />
          )}
        />
        <Textarea label="Vesting Details" rows={2} {...register("vestingDetails")} disabled={readOnly} />
      </div>

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="mintingBurning"
          render={({ field }) => (
            <YesNoField
              label="Minting / Burning mechanism disclosed"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.mintingBurning}
            />
          )}
        />
        <Textarea label="Details" rows={2} {...register("mintingBurningDetails")} disabled={readOnly} />
      </div>

      <Textarea
        label="Token Swap Details (if any)"
        rows={2}
        {...register("tokenSwapDetails")}
        disabled={readOnly}
      />

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="fundingHistoryDisclosed"
          render={({ field }) => (
            <YesNoField
              label="Funding history disclosed (SAFT / IEO / ICO)"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.fundingHistoryDisclosed}
            />
          )}
        />
        <Textarea label="Details" rows={2} {...register("fundingHistoryDetails")} disabled={readOnly} />
      </div>

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="priceOracleModel"
          render={({ field }) => (
            <YesNoField
              label="Price reference / oracle model disclosed"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.priceOracleModel}
            />
          )}
        />
        <Textarea label="Details" rows={2} {...register("priceOracleDetails")} disabled={readOnly} />
      </div>

      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-2">Pricing & Market</h3>
      <Textarea
        label="Price Performance and Trading Volume (secondary market)"
        rows={3}
        {...register("pricePerformance")}
        disabled={readOnly}
      />
      <Textarea label="Token Use Description" rows={3} {...register("tokenUseDescription")} disabled={readOnly} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Private Offer Price" {...register("privateOfferPrice")} disabled={readOnly} />
        <Input label="Public Offer Price" {...register("publicOfferPrice")} disabled={readOnly} />
        <Input label="Current Price" {...register("currentPrice")} disabled={readOnly} />
        <Input label="Valuation" {...register("valuation")} disabled={readOnly} />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save & Continue</Button>
        </div>
      )}
    </form>
  );
}

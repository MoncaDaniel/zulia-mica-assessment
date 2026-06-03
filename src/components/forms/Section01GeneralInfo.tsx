"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S01Schema, type S01Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<S01Data>;
  onSave: (data: S01Data) => Promise<void>;
  readOnly?: boolean;
}

const TOKEN_CLASSIFICATION_OPTIONS = [
  { value: "", label: "Select classification" },
  { value: "EMT", label: "EMT – E-Money Token" },
  { value: "ART", label: "ART – Asset-Referenced Token" },
  { value: "OCA", label: "OCA – Other Crypto-Asset" },
  { value: "Utility", label: "Utility Token" },
  { value: "Other", label: "Other" },
];

export function Section01GeneralInfo({ defaultValues, onSave, readOnly }: Props) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<S01Data>({
    resolver: zodResolver(S01Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Chain / Network" {...register("chain")} disabled={readOnly} />
        <Input label="Consensus Mechanism" {...register("consensusMechanism")} disabled={readOnly} />
        <Input label="Blockchain Explorer URL" type="url" {...register("explorerUrl")} disabled={readOnly} />
        <Input label="Smart Contract Address" {...register("smartContractAddress")} disabled={readOnly} />
        <Input label="Issuer Legal Name" {...register("issuerLegalName")} disabled={readOnly} />
        <Input label="Issue Date" type="date" {...register("issueDate")} disabled={readOnly} />
        <Input label="Whitepaper URL" type="url" {...register("whitepaperUrl")} disabled={readOnly} />
        <Input label="Website / Docs URL" type="url" {...register("websiteUrl")} disabled={readOnly} />
        <Input label="Jurisdiction(s)" placeholder="e.g. EU, Switzerland, BVI" {...register("jurisdictions")} disabled={readOnly} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Token Classification"
          options={TOKEN_CLASSIFICATION_OPTIONS}
          {...register("tokenClassification")}
          disabled={readOnly}
        />
      </div>

      <Textarea
        label="ESG Considerations"
        rows={3}
        placeholder="Describe any environmental, social, or governance considerations..."
        {...register("esgConsiderations")}
        disabled={readOnly}
      />

      <Textarea
        label="Community Links"
        rows={3}
        placeholder="Discord, Telegram, Twitter/X, Reddit, Forum..."
        {...register("communityLinks")}
        disabled={readOnly}
      />

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            Save & Continue
          </Button>
        </div>
      )}
    </form>
  );
}

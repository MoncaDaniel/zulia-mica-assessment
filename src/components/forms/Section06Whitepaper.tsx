"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S06Schema, type S06Data } from "@/types/assessment";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S06Data>;
  onSave: (data: S06Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

const CHECKLIST_ITEMS: Array<{ field: keyof S06Data; label: string }> = [
  { field: "wpIssuerIdentification", label: "Includes issuer identification (name, reg. no., jurisdiction, contacts)" },
  { field: "wpTokenDescription", label: "Includes full token description (name, ticker, supply, technology, use case)" },
  { field: "wpTokenomicsDetails", label: "Includes tokenomics details" },
  { field: "wpRightsObligations", label: "Lists rights and obligations of token holders" },
  { field: "wpRiskDisclosure", label: "Contains comprehensive risk disclosure (market, liquidity, tech, regulatory)" },
  { field: "wpGovernance", label: "Contains project governance and decision-making structure" },
  { field: "wpTechnologySecurity", label: "Contains technology and security features including audits" },
  { field: "wpUseCase", label: "Contains detailed use case" },
  { field: "wpRegulatoryCompliance", label: "Explains regulatory compliance approach" },
  { field: "wpTeamAdvisors", label: "Provides team and advisor skills and experience" },
  { field: "wpMarketAnalysis", label: "Includes market analysis (competitors, target audience)" },
  { field: "wpDisclaimerLegal", label: "Contains disclaimer and legal information" },
  { field: "wpRoadmap", label: "Contains development and adoption roadmap" },
];

export function Section06Whitepaper({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S06Data>({
    resolver: zodResolver(S06Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <p className="text-sm text-slate-400">
        Review the project whitepaper against the MiCA Article 19 requirements. Mark each item as present or absent.
      </p>

      <div className="space-y-3">
        {CHECKLIST_ITEMS.map(({ field, label }, idx) => (
          <div key={field} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-xs font-mono text-slate-500 mt-1 w-6 shrink-0">{String(idx + 1).padStart(2, "0")}</span>
            <div className="flex-1">
              <Controller
                control={control}
                name={field as "wpIssuerIdentification"}
                render={({ field: f }) => (
                  <YesNoField
                    label={label}
                    name={f.name}
                    value={f.value ?? ""}
                    onChange={f.onChange}
                    aiSuggestion={aiData?.[field as string]}
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <Textarea
        label="Other relevant comments about the whitepaper"
        rows={4}
        placeholder="Quality observations, gaps, notable provisions..."
        {...register("wpComments")}
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

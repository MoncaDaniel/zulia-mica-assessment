"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S05Schema, type S05Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S05Data>;
  onSave: (data: S05Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

const scoredFields: Array<{
  fieldName: keyof S05Data;
  notesName: keyof S05Data;
  label: string;
  aiKey: string;
}> = [
  {
    fieldName: "teamIdentifiable",
    notesName: "teamIdentifiableNotes",
    label: "Team members easily identifiable (names, LinkedIn, bios)",
    aiKey: "teamIdentifiable",
  },
  {
    fieldName: "teamExperience",
    notesName: "teamExperienceNotes",
    label: "Team members have proven experience, education, and knowledge",
    aiKey: "teamExperience",
  },
  {
    fieldName: "teamTrackRecord",
    notesName: "teamTrackRecordNotes",
    label: "Team members have proven track record and successful past projects",
    aiKey: "teamTrackRecord",
  },
  {
    fieldName: "advisorsDisclosed",
    notesName: "advisorsNotes",
    label: "Advisors disclosed and relevant to the project",
    aiKey: "advisorsDisclosed",
  },
];

export function Section05TeamAdvisors({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S05Data>({
    resolver: zodResolver(S05Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      {scoredFields.map(({ fieldName, notesName, label, aiKey }) => (
        <div key={fieldName} className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <Controller
            control={control}
            name={fieldName as "teamIdentifiable"}
            render={({ field }) => (
              <YesNoField
                label={label}
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                aiSuggestion={aiData?.[aiKey]}
              />
            )}
          />
          <Textarea
            label="Notes"
            rows={2}
            {...register(notesName as "teamIdentifiableNotes")}
            disabled={readOnly}
          />
        </div>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Token allocation to team members (%)"
          type="number"
          min={0}
          max={100}
          {...register("teamAllocationPct")}
          disabled={readOnly}
        />
      </div>

      <Textarea
        label="Vesting details for team token allocation"
        rows={3}
        {...register("teamAllocationVesting")}
        disabled={readOnly}
      />

      <Textarea
        label="Other available information about the team"
        rows={4}
        placeholder="LinkedIn profiles, past projects, relevant credentials..."
        {...register("otherTeamInfo")}
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

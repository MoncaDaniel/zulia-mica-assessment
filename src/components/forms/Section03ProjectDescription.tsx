"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S03Schema, type S03Data } from "@/types/assessment";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S03Data>;
  onSave: (data: S03Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section03ProjectDescription({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S03Data>({
    resolver: zodResolver(S03Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-8">
      <Textarea
        label="Description of the Project"
        rows={5}
        placeholder="Provide a comprehensive description of the project, its goals, and how the token fits into the ecosystem..."
        {...register("projectDescription")}
        disabled={readOnly}
      />

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="clearUseCase"
          render={({ field }) => (
            <YesNoField
              label="Clear use-case / intended function is defined"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.clearUseCase}
            />
          )}
        />
        <Textarea
          label="Notes"
          rows={2}
          placeholder="Describe the use-case clarity..."
          {...register("clearUseCaseNotes")}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Controller
          control={control}
          name="roadmapDisclosed"
          render={({ field }) => (
            <YesNoField
              label="Roadmap disclosed with milestones"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              aiSuggestion={aiData?.roadmapDisclosed}
            />
          )}
        />
        <Textarea
          label="Notes"
          rows={2}
          placeholder="Roadmap quality, milestone specificity..."
          {...register("roadmapNotes")}
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

"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S07Schema, type S07Data } from "@/types/assessment";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { YesNoField } from "./shared/YesNoField";
import type { AiSectionData } from "@/lib/ai/types";

interface Props {
  defaultValues?: Partial<S07Data>;
  onSave: (data: S07Data) => Promise<void>;
  readOnly?: boolean;
  aiData?: AiSectionData;
}

export function Section07Community({ defaultValues, onSave, readOnly, aiData }: Props) {
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<S07Data>({
    resolver: zodResolver(S07Schema),
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Community Size (total members / followers)" {...register("communitySize")} disabled={readOnly} />
        <Input label="Platforms" placeholder="Discord, Telegram, Twitter/X..." {...register("communityPlatforms")} disabled={readOnly} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Community Engagement"
          options={[
            { value: "", label: "Select engagement level" },
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" },
          ]}
          {...register("communityEngagement")}
          disabled={readOnly}
        />
        <Select
          label="Community Sentiment"
          options={[
            { value: "", label: "Select sentiment" },
            { value: "Positive", label: "Positive" },
            { value: "Neutral", label: "Neutral" },
            { value: "Negative", label: "Negative" },
          ]}
          {...register("communitySentiment")}
          disabled={readOnly}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Textarea label="Engagement Notes" rows={2} {...register("communityEngagementNotes")} disabled={readOnly} />
        <Textarea label="Sentiment Notes" rows={2} {...register("communitySentimentNotes")} disabled={readOnly} />
      </div>

      {([
        { fieldName: "bugBountyProgram" as const, notesName: "bugBountyLink" as const, label: "Bug bounty program active", isLink: true as boolean },
        { fieldName: "communityParticipation" as const, notesName: "communityParticipationNotes" as const, label: "Community participation (code contributions, bug reports, proposals)", isLink: false as boolean },
        { fieldName: "communityEvents" as const, notesName: "communityEventsNotes" as const, label: "Community events (hackathons, AMAs, meetups)", isLink: false as boolean },
        { fieldName: "developerRelations" as const, notesName: "developerRelationsNotes" as const, label: "Developer Relations / DevRel programs", isLink: false as boolean },
      ]).map(({ fieldName, notesName, label, isLink }) => (
        <div key={fieldName} className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <Controller
            control={control}
            name={fieldName}
            render={({ field }) => (
              <YesNoField
                label={label}
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                aiSuggestion={aiData?.[fieldName]}
              />
            )}
          />
          <Input
            label={isLink ? "Bug Bounty Link" : "Notes"}
            type={isLink ? "url" : "text"}
            {...register(notesName)}
            disabled={readOnly}
          />
        </div>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Token Holders (number)" {...register("tokenHoldersCount")} disabled={readOnly} />
      </div>
      <Textarea label="Token Holders Distribution Notes" rows={2} {...register("tokenHoldersNotes")} disabled={readOnly} />
      <Textarea label="Other available information about the community" rows={3} {...register("otherCommunityInfo")} disabled={readOnly} />

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save & Continue</Button>
        </div>
      )}
    </form>
  );
}

"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
} from "@/components/editorial";

type RelationshipOption = { id: string; label: string };

export function IntroScreen({
  subjectName,
  subjectRole,
  relationshipOptions,
  onStart,
}: {
  subjectName: string;
  subjectRole?: string;
  relationshipOptions: RelationshipOption[];
  onStart: (relationshipId: string, respondentName?: string) => void;
}) {
  const [relationshipId, setRelationshipId] = useState(
    relationshipOptions[0]?.id ?? ""
  );
  const [respondentName, setRespondentName] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onStart(
      relationshipId,
      respondentName.trim() ? respondentName.trim() : undefined
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-2xl">
        <EditorialSection spacing="lg">
          <div className="space-y-8">
            <div className="space-y-4">
              <EditorialLabel accent>Feedback Survey</EditorialLabel>
              <EditorialHeadline as="h1" size="md">
                Share your thoughts about {subjectName}
              </EditorialHeadline>
              {subjectRole && (
                <p className="text-body-lg text-ink-soft">
                  {subjectRole}
                </p>
              )}
            </div>

            <RuledDivider spacing="sm" />

            <p className="text-body-lg text-ink-soft max-w-xl">
              This is an AI-guided interview. Your honest feedback will help create
              a comprehensive 360-degree review. The conversation typically takes 5-10 minutes.
            </p>

            <RuledDivider spacing="sm" />

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-3">
                <Label
                  htmlFor="relationship"
                  className="text-label uppercase tracking-label text-ink font-semibold"
                >
                  Your Relationship
                </Label>
                <select
                  id="relationship"
                  className="flex h-14 w-full border-3 border-ink bg-paper px-4 py-3 text-base text-ink focus:outline-none focus:ring-4 focus:ring-ink/10 transition-all"
                  value={relationshipId}
                  onChange={(e) => setRelationshipId(e.target.value)}
                  required
                >
                  {relationshipOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="respondentName"
                  className="text-label uppercase tracking-label text-ink font-semibold"
                >
                  Your Name (Optional)
                </Label>
                <Input
                  id="respondentName"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="h-14 text-base border-3 border-ink/20 focus:border-ink bg-paper text-ink"
                />
              </div>

              <Button
                size="lg"
                className="w-full h-14 bg-ink hover:bg-ink/90 text-paper text-body-lg font-semibold"
                disabled={!relationshipId}
              >
                Begin Interview
              </Button>

              <p className="text-label text-ink-soft text-center pt-2">
                TIP: SPECIFIC EXAMPLES ARE MOST HELPFUL
              </p>
            </form>
          </div>
        </EditorialSection>
      </div>
    </div>
  );
}

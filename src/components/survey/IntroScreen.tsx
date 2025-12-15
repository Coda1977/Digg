"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const relationshipLabel = useMemo(() => {
    return (
      relationshipOptions.find((r) => r.id === relationshipId)?.label ??
      relationshipId
    );
  }, [relationshipId, relationshipOptions]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onStart(
      relationshipId,
      respondentName.trim() ? respondentName.trim() : undefined
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">
            Feedback about {subjectName}
            {subjectRole ? ` (${subjectRole})` : ""}
          </CardTitle>
          <CardDescription>
            This is an AI-guided interview. Please answer as honestly as you can.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="relationship">Your relationship</Label>
              <select
                id="relationship"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              {relationshipLabel && (
                <p className="text-xs text-muted-foreground">
                  Selected: {relationshipLabel}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="respondentName">Your name (optional)</Label>
              <Input
                id="respondentName"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="e.g. Alex"
              />
            </div>

            <Button className="w-full" disabled={!relationshipId}>
              Start
            </Button>

            <p className="text-xs text-muted-foreground">
              Tip: specific examples are most helpful.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

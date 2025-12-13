"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { IntroScreen } from "@/components/survey/IntroScreen";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThankYouScreen } from "@/components/survey/ThankYouScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SurveyState = "loading" | "not_found" | "intro" | "chat" | "completed" | "resume";

export default function SurveyPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [state, setState] = useState<SurveyState>("loading");
  const [relationship, setRelationship] = useState<string>("");

  // First, try to find the survey by uniqueId
  const surveyData = useQuery(api.surveys.getByUniqueId, { uniqueId: surveyId });
  const startSurvey = useMutation(api.surveys.start);

  useEffect(() => {
    if (surveyData === undefined) {
      setState("loading");
      return;
    }

    if (surveyData === null) {
      setState("not_found");
      return;
    }

    // Check survey status
    if (surveyData.status === "completed") {
      setState("completed");
    } else if (surveyData.status === "in_progress") {
      // Resume existing survey
      setRelationship(surveyData.relationship || "");
      setState("chat");
    } else {
      // Not started - show intro
      setState("intro");
    }
  }, [surveyData]);

  const handleStart = async (selectedRelationship: string, respondentName?: string) => {
    if (!surveyData) return;

    await startSurvey({
      surveyId: surveyData._id,
      relationship: selectedRelationship,
      respondentName,
    });

    setRelationship(selectedRelationship);
    setState("chat");
  };

  const handleComplete = () => {
    setState("completed");
  };

  // Loading state
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state
  if (state === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <h1 className="text-2xl font-semibold mb-2">Survey Not Found</h1>
            <p className="text-muted-foreground">
              This survey link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (state === "completed" && surveyData) {
    return <ThankYouScreen subjectName={surveyData.project.subjectName} />;
  }

  // Intro state
  if (state === "intro" && surveyData) {
    return (
      <IntroScreen
        subjectName={surveyData.project.subjectName}
        subjectRole={surveyData.project.subjectRole}
        relationshipOptions={surveyData.template.relationshipOptions}
        onStart={handleStart}
      />
    );
  }

  // Chat state
  if (state === "chat" && surveyData && relationship) {
    return (
      <ChatInterface
        surveyId={surveyData._id}
        template={surveyData.template}
        project={surveyData.project}
        relationship={relationship}
        onComplete={handleComplete}
      />
    );
  }

  return null;
}

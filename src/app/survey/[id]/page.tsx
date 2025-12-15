"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { IntroScreen } from "@/components/survey/IntroScreen";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThankYouScreen } from "@/components/survey/ThankYouScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SurveyPage() {
  const params = useParams();
  const uniqueId = params.id as string;

  const [relationship, setRelationship] = useState<string>("");
  const [forceCompleted, setForceCompleted] = useState(false);

  // First, try to find the survey by uniqueId
  const surveyData = useQuery(api.surveys.getByUniqueId, { uniqueId });
  const startSurvey = useMutation(api.surveys.start);

  const relationshipId = relationship || surveyData?.relationship || "";

  const handleStart = async (
    selectedRelationship: string,
    respondentName?: string
  ) => {
    if (!surveyData) return;

    await startSurvey({
      surveyId: surveyData._id,
      relationship: selectedRelationship,
      respondentName,
    });

    setRelationship(selectedRelationship);
  };

  const handleComplete = () => {
    setForceCompleted(true);
  };

  // Loading state
  if (surveyData === undefined) {
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
  if (surveyData === null) {
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
  if (forceCompleted || surveyData.status === "completed") {
    return <ThankYouScreen subjectName={surveyData.project.subjectName} />;
  }

  // Intro state
  if (surveyData.status === "not_started" && !relationship) {
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
  if (relationshipId && (surveyData.status === "in_progress" || relationship)) {
    return (
      <ChatInterface
        uniqueId={uniqueId}
        surveyId={surveyData._id}
        template={surveyData.template}
        project={surveyData.project}
        relationship={relationshipId}
        onComplete={handleComplete}
      />
    );
  }

  return null;
}

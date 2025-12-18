"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { IntroScreen } from "@/components/survey/IntroScreen";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThankYouScreen } from "@/components/survey/ThankYouScreen";
import {
  EditorialHeadline,
  EditorialLabel,
  EditorialSection,
  RuledDivider,
} from "@/components/editorial";

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
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <EditorialSection spacing="lg" className="w-full">
          <div className="animate-pulse max-w-[900px] mx-auto space-y-6">
            <div className="h-4 bg-ink/5 w-40" />
            <div className="h-12 bg-ink/5 w-2/3" />
            <div className="h-4 bg-ink/5 w-full max-w-xl" />
            <RuledDivider weight="thick" spacing="sm" />
            <div className="h-14 bg-ink/5 w-full" />
            <div className="h-14 bg-ink/5 w-2/3" />
          </div>
        </EditorialSection>
      </div>
    );
  }

  // Not found state
  if (surveyData === null) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 sm:px-8">
        <EditorialSection spacing="lg" className="w-full">
          <div className="max-w-[900px] mx-auto border-l-4 border-accent-red pl-6 py-2 space-y-4">
            <EditorialLabel accent>Not Found</EditorialLabel>
            <EditorialHeadline as="h1" size="md">
              Survey link not found
            </EditorialHeadline>
            <p className="text-body text-ink-soft">
              This survey link is invalid or has expired.
            </p>
          </div>
        </EditorialSection>
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

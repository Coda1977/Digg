"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

import { EditorialLabel } from "@/components/editorial";

export default function ProjectShareRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const createSurvey = useMutation(api.surveys.createPublicFromProject);

  const projectId = params.id as Id<"projects">;
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const result = await createSurvey({ projectId });
        router.replace(`/survey/${result.uniqueId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid project link");
      }
    })();
  }, [createSurvey, projectId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-paper text-ink">
        <div className="w-full max-w-[900px] border-l-4 border-accent-red pl-6 py-2">
          <EditorialLabel accent>Link Error</EditorialLabel>
          <h1 className="mt-2 font-serif font-bold tracking-headline text-headline-xs leading-tight">
            Link not available
          </h1>
          <p className="mt-3 text-body text-ink-soft">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-paper text-ink">
      <div className="w-full max-w-[900px] border-l-4 border-ink pl-6 py-2">
        <EditorialLabel>Feedback Survey</EditorialLabel>
        <h1 className="mt-2 font-serif font-bold tracking-headline text-headline-xs leading-tight">
          Starting survey…
        </h1>
        <div className="mt-3 flex items-center gap-3 text-body text-ink-soft" role="status">
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft animate-bounce [animation-delay:-0.32s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft animate-bounce [animation-delay:-0.16s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft animate-bounce" />
          </span>
          <span>Preparing your interview</span>
        </div>
      </div>
    </div>
  );
}

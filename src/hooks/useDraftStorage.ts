import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseDraftStorageOptions = {
  surveyId: string;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
};

export function useDraftStorage({ surveyId, draft, setDraft }: UseDraftStorageOptions) {
  useEffect(() => {
    const storageKey = `digg_draft_${surveyId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDraft(saved);
      }
    } catch {
      // localStorage may be disabled
    }
  }, [setDraft, surveyId]);

  useEffect(() => {
    const storageKey = `digg_draft_${surveyId}`;
    const timeoutId = setTimeout(() => {
      try {
        if (draft.trim()) {
          localStorage.setItem(storageKey, draft);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // localStorage may be disabled
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [draft, surveyId]);

  const clearDraftStorage = useCallback(() => {
    const storageKey = `digg_draft_${surveyId}`;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // localStorage may be disabled
    }
  }, [surveyId]);

  return { clearDraftStorage };
}

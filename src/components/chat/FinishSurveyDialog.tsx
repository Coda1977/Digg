"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditorialButton } from "@/components/editorial";

type FinishSurveyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
  currentLanguage: "en" | "he";
  onConfirm: () => void;
};

export function FinishSurveyDialog({
  open,
  onOpenChange,
  isGenerating,
  currentLanguage,
  onConfirm,
}: FinishSurveyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={currentLanguage === "he" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>
            {currentLanguage === "he"
              ? "האם אתה מוכן לסיים?"
              : "Are you ready to finish?"}
          </DialogTitle>
          <DialogDescription>
            {currentLanguage === "he"
              ? "לא ניתן יהיה להוסיף תשובות נוספות לאחר השליחה."
              : "You won't be able to add more responses after submitting."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <EditorialButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            {currentLanguage === "he" ? "המשך עריכה" : "Continue Editing"}
          </EditorialButton>
          <EditorialButton
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            disabled={isGenerating}
          >
            {currentLanguage === "he" ? "סיים סקר" : "Finish Survey"}
          </EditorialButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

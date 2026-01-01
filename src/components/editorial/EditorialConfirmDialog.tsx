"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditorialButton } from "./EditorialButton";

export interface EditorialConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
}

export function EditorialConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  error = null,
  onConfirm,
}: EditorialConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-accent-red/10 border-l-4 border-accent-red">
            <AlertCircle className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
            <p className="text-body text-accent-red">{error}</p>
          </div>
        )}

        <DialogFooter className="gap-3">
          <EditorialButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </EditorialButton>
          <EditorialButton
            variant={isDestructive ? "destructive" : "primary"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </EditorialButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

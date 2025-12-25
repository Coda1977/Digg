"use client";

import { useEffect } from "react";
import type { DbMessage } from "@/hooks/useTypeformAdapter";

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  messages: DbMessage[];
  language: "en" | "he";
};

export function HistoryModal({
  isOpen,
  onClose,
  messages,
  language,
}: HistoryModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Group messages into Q&A pairs
  const pairs: Array<{ question: string; answer: string }> = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "assistant") {
      // Find the next user message
      const nextUserMsg = messages[i + 1];
      if (nextUserMsg && nextUserMsg.role === "user") {
        pairs.push({
          question: msg.content,
          answer: nextUserMsg.content,
        });
        i++; // Skip the user message since we've paired it
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-[200] animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-paper max-w-[650px] w-[90%] max-h-[80vh] overflow-y-auto p-8 animate-modalIn">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-ink/10">
          <h2 className="font-sans text-[0.75rem] uppercase tracking-[0.1em] font-semibold">
            {language === "he" ? "התשובות שלך" : "Your Responses"}
          </h2>
          <button
            onClick={onClose}
            className="text-[1.5rem] bg-transparent border-none cursor-pointer text-ink-soft hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* History List */}
        <div>
          {pairs.length === 0 ? (
            <p className="text-ink-soft text-center py-8">
              {language === "he" ? "עדיין אין תשובות" : "No responses yet"}
            </p>
          ) : (
            pairs.map((pair, index) => (
              <div
                key={index}
                className="py-5 border-b border-ink/6 last:border-b-0"
              >
                <p className="text-[0.9rem] text-ink-soft mb-2">{pair.question}</p>
                <p className="text-[1rem] text-ink leading-[1.5]">"{pair.answer}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

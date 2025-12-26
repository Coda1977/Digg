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
      const nextUserMsg = messages[i + 1];
      if (nextUserMsg && nextUserMsg.role === "user") {
        pairs.push({
          question: msg.content,
          answer: nextUserMsg.content,
        });
        i++;
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
      className="fixed inset-0 z-[200] flex items-center justify-center animate-fadeIn p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="max-w-[650px] w-[95%] sm:w-[90%] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6 md:p-8 animate-modalIn"
        style={{ backgroundColor: '#FAFAF8' }}
      >
        {/* Modal Header */}
        <div
          className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4"
          style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}
        >
          <h2
            className="font-sans uppercase tracking-[0.1em] font-semibold"
            style={{ fontSize: '0.8rem', color: '#0A0A0A' }}
          >
            {language === "he" ? "התשובות שלך" : "Your Responses"}
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors"
            style={{ fontSize: '1.5rem', color: '#52525B' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0A0A0A'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#52525B'}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* History List */}
        <div>
          {pairs.length === 0 ? (
            <p className="text-center py-6 sm:py-8" style={{ color: '#52525B' }}>
              {language === "he" ? "עדיין אין תשובות" : "No responses yet"}
            </p>
          ) : (
            pairs.map((pair, index) => (
              <div
                key={index}
                className="py-4 sm:py-5"
                style={{
                  borderBottom: index === pairs.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <p
                  className="mb-2 font-serif"
                  style={{ fontSize: '0.875rem', color: '#52525B', lineHeight: '1.4' }}
                >
                  {pair.question}
                </p>
                <p
                  className="font-serif"
                  style={{ fontSize: '1rem', color: '#0A0A0A', lineHeight: '1.5' }}
                >
                  "{pair.answer}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

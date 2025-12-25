"use client";

import { useRef, useEffect } from "react";
import { Mic } from "lucide-react";

type QuestionCardProps = {
  questionNumber: number;
  questionText: string;
  onSubmit: (answer: string) => void;
  onFinish: () => void;
  isGenerating: boolean;
  textDirection: "ltr" | "rtl";
  language: "en" | "he";
  isListening: boolean;
  voiceLoading: boolean;
  toggleVoice: () => void;
  draft: string;
  setDraft: (value: string) => void;
};

export function QuestionCard({
  questionNumber,
  questionText,
  onSubmit,
  onFinish,
  isGenerating,
  textDirection,
  language,
  isListening,
  voiceLoading,
  toggleVoice,
  draft,
  setDraft,
}: QuestionCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!draft.trim() || isGenerating) return;
    onSubmit(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "Enter" && draft.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-[700px] mx-auto animate-fadeInUp">
      {/* Question Header with Drop Cap Number */}
      <div className="flex gap-5 mb-12 items-start">
        <span
          className="text-[4rem] font-bold leading-none font-serif flex-shrink-0 min-w-[50px]"
          style={{ color: '#DC2626' }}
        >
          {questionNumber}
        </span>
        <h2 className="font-serif text-[1.5rem] font-normal leading-[1.45] tracking-[-0.01em] pt-2 flex-1 min-w-0 break-words">
          {questionText}
        </h2>
      </div>

      {/* Answer Input Area */}
      <div className="relative mb-8">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === "he" ? "שתף את מחשבותיך..." : "Share your thoughts..."}
          dir={textDirection}
          className="typeform-focus-ring w-full px-6 py-6 pr-20 font-serif text-[1.125rem] leading-[1.7] border-2 border-ink/40 bg-white text-ink resize-none min-h-[180px] transition-all focus:outline-none focus:border-ink placeholder:text-ink-lighter"
          disabled={isGenerating}
        />

        {/* Voice Button - top-right of textarea */}
        <div className="absolute right-4 top-4 flex items-center gap-2 group">
          <span
            className={`font-sans text-[0.7rem] uppercase tracking-wide transition-all duration-200 text-ink-lighter ${
              isListening
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0"
            }`}
          >
            {isListening
              ? language === "he"
                ? "מאזין..."
                : "Listening..."
              : language === "he"
                ? "דבר"
                : "Speak"}
          </span>
          <button
            type="button"
            onClick={toggleVoice}
            disabled={voiceLoading || isGenerating}
            style={{
              backgroundColor: isListening ? '#DC2626' : '#0A0A0A',
              color: '#FAFAF8',
            }}
            className="typeform-voice-btn w-11 h-11 flex items-center justify-center border-none cursor-pointer transition-all flex-shrink-0 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={isListening ? "Stop recording" : "Start recording"}
          >
            {isListening ? (
              <div className="flex items-center gap-0.5 h-5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-white animate-wave"
                    style={{
                      height: [6, 12, 18, 12, 6][i] + "px",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Action Row - centered submit button */}
      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!draft.trim() || isGenerating}
          style={{
            backgroundColor: '#DC2626',
            color: 'white',
            opacity: 1,
          }}
          className="inline-flex items-center justify-center gap-3 px-12 py-4 font-sans text-[1rem] font-semibold border-none cursor-pointer transition-all hover:brightness-90 disabled:cursor-not-allowed"
        >
          {isGenerating ? (language === "he" ? "שולח..." : "Sending...") : language === "he" ? "המשך" : "Continue"} →
        </button>
        <div className="flex items-center gap-6">
          <p className="font-sans text-[0.75rem] text-ink-lighter">
            {language === "he" ? (
              <>
                לחץ <kbd className="bg-ink/5 px-2 py-1">Ctrl</kbd> +{" "}
                <kbd className="bg-ink/5 px-2 py-1">Enter</kbd> לשלוח
              </>
            ) : (
              <>
                Press <kbd className="bg-ink/5 px-2 py-1">Ctrl</kbd> +{" "}
                <kbd className="bg-ink/5 px-2 py-1">Enter</kbd> to submit
              </>
            )}
          </p>
          <span className="text-ink-lighter">•</span>
          <button
            type="button"
            onClick={onFinish}
            disabled={isGenerating}
            style={{ color: '#DC2626' }}
            className="font-sans text-[0.875rem] font-medium hover:brightness-75 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {language === "he" ? "סיים סקר" : "Finish Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}

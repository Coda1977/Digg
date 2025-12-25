type WaitingCardProps = {
  questionNumber: number;
  language: "en" | "he";
};

export function WaitingCard({ questionNumber, language }: WaitingCardProps) {
  return (
    <div className="w-full max-w-[700px] mx-auto animate-fadeInUp">
      {/* Question Header with Drop Cap Number */}
      <div className="flex gap-5 mb-12 items-start">
        <span className="text-[4rem] font-bold leading-none text-accent-red font-serif flex-shrink-0 min-w-[50px]">
          {questionNumber}
        </span>
        <div className="flex-1 pt-2 space-y-3">
          <div className="h-6 bg-ink/10 rounded animate-pulse w-full" />
          <div className="h-6 bg-ink/10 rounded animate-pulse w-3/4" />
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center">
        <p className="font-sans text-ink-soft text-[1rem]">
          {language === "he" ? "מכין את השאלה הבאה..." : "Preparing next question..."}
        </p>
      </div>
    </div>
  );
}

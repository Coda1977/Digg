type WaitingCardProps = {
  language: "en" | "he";
};

export function WaitingCard({ language }: WaitingCardProps) {
  return (
    <div className="w-full max-w-[700px] mx-auto animate-fadeInUp">
      {/* Question Loading Placeholder */}
      <div className="mb-6 sm:mb-8 md:mb-12 space-y-2 sm:space-y-3">
        <div className="h-5 sm:h-6 bg-ink/10 animate-pulse w-full" />
        <div className="h-5 sm:h-6 bg-ink/10 animate-pulse w-3/4" />
      </div>

      {/* Loading message */}
      <div className="text-center">
        <p className="font-sans text-ink-soft text-[0.9rem] sm:text-[1rem]">
          {language === "he" ? "מכין את השאלה הבאה..." : "Preparing next question..."}
        </p>
      </div>
    </div>
  );
}

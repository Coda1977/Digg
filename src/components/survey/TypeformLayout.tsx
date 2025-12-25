import type { ReactNode } from "react";

type TypeformLayoutProps = {
  subjectName: string;
  progress: number;
  onHistoryClick?: () => void;
  showHistory?: boolean;
  children: ReactNode;
};

export function TypeformLayout({
  subjectName,
  progress,
  onHistoryClick,
  showHistory = false,
  children,
}: TypeformLayoutProps) {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-paper border-b border-ink/8">
        <div className="flex justify-between items-center px-8 py-4">
          <h1 className="font-serif text-[18px] font-bold tracking-tight">
            {subjectName}
          </h1>
          {showHistory && (
            <button
              onClick={onHistoryClick}
              className="font-sans text-[0.9rem] font-medium text-paper bg-ink border-2 border-ink px-5 py-2.5 rounded transition-all hover:bg-accent-red hover:border-accent-red"
            >
              View History
            </button>
          )}
        </div>
      </header>

      {/* Main Container - vertically centered */}
      <main className="flex flex-col justify-center min-h-screen pt-20 pb-16 px-8">
        {children}
      </main>

      {/* Progress Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-[50]">
        <div className="h-3 bg-ink/10">
          <div
            className="typeform-progress-glow h-full bg-gradient-to-r from-accent-red to-[#ef4444] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </footer>
    </div>
  );
}

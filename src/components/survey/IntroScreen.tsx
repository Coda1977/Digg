"use client";

import { useState } from "react";

type RelationshipOption = { id: string; label: string };

export function IntroScreen({
  subjectName,
  relationshipOptions,
  onStart,
}: {
  subjectName: string;
  subjectRole?: string;
  relationshipOptions: RelationshipOption[];
  onStart: (relationshipId: string, respondentName?: string) => void;
}) {
  const [relationshipId, setRelationshipId] = useState("");
  const [respondentName, setRespondentName] = useState("");

  const handleSubmit = () => {
    if (!relationshipId) return;
    onStart(
      relationshipId,
      respondentName.trim() ? respondentName.trim() : undefined
    );
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="w-full max-w-[520px] mx-auto text-center animate-fadeInUp">
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] mb-4 sm:mb-5" style={{ color: '#DC2626' }}>
          360° Feedback
        </p>
        <h1 className="font-serif text-[1.75rem] sm:text-[2rem] md:text-[2.25rem] mb-4 sm:mb-5 leading-[1.2]">
          Share your feedback on {subjectName}
        </h1>
        <p className="text-ink-soft mb-8 sm:mb-12 leading-[1.6] text-base sm:text-[1.1rem]">
          Your responses are confidential and will help {subjectName} grow professionally.
        </p>

        <input
          type="text"
          value={respondentName}
          onChange={(e) => setRespondentName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 sm:px-5 py-3 sm:py-4 font-serif text-base sm:text-[1rem] border-2 border-ink-lighter bg-white text-ink mb-6 sm:mb-8 transition-all focus:outline-none focus:border-ink"
        />

        <p className="font-sans text-[0.75rem] uppercase tracking-[0.1em] text-ink-soft mb-4 sm:mb-5">
          Your relationship to {subjectName}
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center mb-8 sm:mb-12">
          {relationshipOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRelationshipId(opt.id)}
              style={{
                backgroundColor: relationshipId === opt.id ? '#DC2626' : 'white',
                borderColor: relationshipId === opt.id ? '#DC2626' : '#A1A1AA',
                color: relationshipId === opt.id ? 'white' : '#0A0A0A',
                transform: relationshipId === opt.id ? 'scale(1.05)' : 'scale(1)',
              }}
              className="px-4 sm:px-6 py-3 sm:py-4 min-h-[44px] font-sans text-[0.875rem] font-medium border-2 cursor-pointer transition-all hover:border-ink"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!relationshipId}
          style={{
            backgroundColor: '#DC2626',
            color: 'white',
            opacity: 1,
          }}
          className="inline-flex items-center justify-center gap-3 px-6 sm:px-10 md:px-12 py-4 min-h-[48px] font-sans text-[1rem] font-semibold border-none cursor-pointer transition-all hover:brightness-90 disabled:cursor-not-allowed"
        >
          Begin Survey →
        </button>
      </div>
    </div>
  );
}

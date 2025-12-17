"use client";

import {
  EditorialSection,
  EditorialHeadline,
  RuledDivider,
} from "@/components/editorial";

export function ThankYouScreen({ subjectName }: { subjectName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <div className="w-full max-w-2xl">
        <EditorialSection spacing="lg">
          <div className="space-y-8 text-center">
            <EditorialHeadline as="h1" size="lg" className="text-accent-red">
              Thank you.
            </EditorialHeadline>

            <RuledDivider spacing="sm" />

            <div className="space-y-6 max-w-xl mx-auto">
              <p className="text-body-lg text-ink">
                Your feedback about <span className="font-serif font-bold">{subjectName}</span> has been submitted successfully.
              </p>

              <p className="text-body text-ink-soft">
                Your insights will contribute to a comprehensive 360-degree review
                that helps create meaningful professional development opportunities.
              </p>

              <RuledDivider spacing="xs" weight="thin" />

              <p className="text-label text-ink-soft uppercase tracking-label">
                You can safely close this tab
              </p>
            </div>
          </div>
        </EditorialSection>
      </div>
    </div>
  );
}

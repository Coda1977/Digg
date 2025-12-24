import Link from "next/link";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
} from "@/components/editorial";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-3 border-ink bg-paper sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="text-label font-sans font-semibold uppercase tracking-label text-ink">
            Digg
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/login"
              className="text-body text-ink hover:text-accent-red transition-colors"
            >
              Admin Login
            </Link>
            <Link
              href="/admin"
              className="text-body text-ink hover:text-accent-red transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <EditorialSection spacing="md">
          <div className="space-y-6 max-w-3xl">
            <EditorialLabel>Survey Platform</EditorialLabel>
            <EditorialHeadline as="h1" size="lg">
              Build better feedback, faster.
            </EditorialHeadline>
            <p className="text-body-lg text-ink-soft max-w-2xl">
              Digg is an AI-powered interview workflow for 360-degree feedback. Create
              projects, share survey links, and review insights in an editorial,
              paper-and-ink experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors"
              >
                Admin Login
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </EditorialSection>

        <RuledDivider weight="thick" spacing="sm" />

        <EditorialSection spacing="md">
          <div className="space-y-8">
            <EditorialLabel>How It Works</EditorialLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-l-4 border-ink pl-6 py-2 space-y-3">
                <p className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                  Step 1
                </p>
                <h2 className="font-serif font-bold text-headline-xs tracking-headline">
                  Create a project
                </h2>
                <p className="text-body text-ink-soft">
                  Define the subject, choose a template, and generate survey links.
                </p>
              </div>
              <div className="border-l-4 border-ink pl-6 py-2 space-y-3">
                <p className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                  Step 2
                </p>
                <h2 className="font-serif font-bold text-headline-xs tracking-headline">
                  Collect interviews
                </h2>
                <p className="text-body text-ink-soft">
                  Respondents complete an AI-guided interview in a simple chat flow.
                </p>
              </div>
              <div className="border-l-4 border-ink pl-6 py-2 space-y-3">
                <p className="text-label font-sans font-semibold uppercase tracking-label text-ink-soft">
                  Step 3
                </p>
                <h2 className="font-serif font-bold text-headline-xs tracking-headline">
                  Review insights
                </h2>
                <p className="text-body text-ink-soft">
                  Aggregate results and export a report for the subject and stakeholders.
                </p>
              </div>
            </div>
          </div>
        </EditorialSection>
      </main>

      <div className="h-editorial-md" aria-hidden="true" />
    </div>
  );
}

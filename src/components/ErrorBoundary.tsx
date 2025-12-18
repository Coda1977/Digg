"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { EditorialSection, EditorialLabel, EditorialHeadline } from "./editorial";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <EditorialSection spacing="lg">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-accent-red" />
            </div>
            <div className="space-y-3">
              <EditorialLabel>Error</EditorialLabel>
              <EditorialHeadline as="h1" size="md">
                Something went wrong
              </EditorialHeadline>
            </div>
            <p className="text-body-lg text-ink-soft">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-transparent hover:text-ink transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </EditorialSection>
      );
    }

    return this.props.children;
  }
}

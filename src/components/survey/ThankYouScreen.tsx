"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ThankYouScreen({ subjectName }: { subjectName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-xl">Thank you!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Your feedback about {subjectName} has been submitted.
          </p>
          <p className="text-sm text-muted-foreground">
            You can safely close this tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

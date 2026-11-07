"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBriefing } from "@/components/briefing-provider"
import type { Briefing } from "@/lib/types"

export function DataGate({ children }: { children: (data: Briefing) => React.ReactNode }) {
  const state = useBriefing()
  if (state.status === "loading") return <LoadingBrief />
  if (state.status === "error" || !state.data) return <ErrorBrief message={state.message ?? "The briefing file could not be read."} />
  return children(state.data)
}

function LoadingBrief() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="h-14 max-w-3xl animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Loading the 2023 FARS briefing.</p>
    </div>
  )
}

function ErrorBrief({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-card">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">The briefing file did not load</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6">
        <p>
          The dashboard reads <code className="rounded bg-muted px-1.5 py-0.5">public/data/briefing.json</code>.
          Rebuild it from the NHTSA extract, then reload this page.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-[#1c1915] px-4 py-3 text-[#f3ecdf]">python3 pipeline/build.py</pre>
        <Button variant="outline" render={<Link href="/" />}>
          Back to overview
        </Button>
      </CardContent>
    </Card>
  )
}

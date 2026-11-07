"use client"

import { DataGate } from "@/components/data-gate"
import { LimitNote } from "@/components/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCount, formatGenerated } from "@/lib/format"
import type { Briefing } from "@/lib/types"

const FALLBACK = [
  "A motorcyclist killed is an operator or passenger with fatal injury on FARS body type 80 through 89.",
  "Unknown helmet and alcohol values stay unknown.",
  "State ranks are counts of deaths. FARS does not include miles ridden.",
]

export default function MethodsPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">How the numbers are built</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#3f3a34]">
          The warehouse is DuckDB. The marts are SQL files in <code>sql/</code>. The Excel briefing recomputes the headline counts with formulas over one row per death, and it checks those formulas against the warehouse.
        </p>
        <LimitNote>
          2023 is the latest final FARS year used here. The April 2026 manual still marks the 2024 national file as an Annual Report File, so that year can be revised.
        </LimitNote>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Rules that do not depend on the file loading</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            {FALLBACK.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <DataGate>{(data) => <MethodsDetail data={data} />}</DataGate>
    </div>
  )
}

function MethodsDetail({ data }: { data: Briefing }) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Definitions from the warehouse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.definitions.map((item) => (
            <div key={item.topic} className="grid gap-1 border-b border-border pb-4 last:border-0 sm:grid-cols-[11rem_1fr]">
              <p className="text-sm font-medium">{item.topic}</p>
              <p className="text-sm leading-6 text-[#3f3a34]">{item.rule}</p>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            Built {formatGenerated(data.meta.generatedAt)}. Manual:{" "}
            <a className="underline underline-offset-4" href={data.meta.manualUrl}>
              {data.meta.manual}
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Quality checks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>What it means</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.quality.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="font-mono text-xs">{check.id}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(check.n)}</TableCell>
                  <TableCell className="whitespace-normal">{check.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Rebuild</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6">
          <p>From the repo root, with Python 3.12 and the packages in <code>pipeline/requirements.txt</code>:</p>
          <pre className="overflow-x-auto rounded-lg bg-[#1c1915] px-4 py-3 text-[#f3ecdf]">python3 pipeline/build.py</pre>
          <p>
            The script reads the 2023 national CSVs from <code>data/raw/</code> or downloads the zip from NHTSA, then writes the DuckDB file, <code>public/data/briefing.json</code>, and the Excel workbook.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

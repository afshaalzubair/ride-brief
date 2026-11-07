"use client"

import { DataGate } from "@/components/data-gate"
import { LimitNote, ShareBar } from "@/components/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCount, formatPct } from "@/lib/format"
import type { Briefing } from "@/lib/types"

export default function HelmetPage() {
  return <DataGate>{(data) => <Helmet data={data} />}</DataGate>
}

function Helmet({ data }: { data: Briefing }) {
  const { overview } = data
  const known = overview.helmetUsed + overview.helmetNotUsed
  const dot = data.helmetCodes.find((row) => row.code === 5)?.deaths ?? 0
  const other = data.helmetCodes.find((row) => row.code === 16)?.deaths ?? 0
  const dotUnknown = data.helmetCodes.find((row) => row.code === 19)?.deaths ?? 0

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Helmet use among people who died</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#3f3a34]">
          {formatCount(overview.helmetNotUsed)} motorcyclists who died were coded as wearing no helmet.
          Another {formatCount(overview.helmetUnknown)} have no usable helmet code.
          Among the {formatCount(known)} deaths with a known status, {formatPct(overview.knownHelmetNonuse)} were not wearing one.
        </p>
        <LimitNote>
          The used group is wider than DOT-compliant helmets. Of the {formatCount(overview.helmetUsed)} deaths coded as helmeted,{" "}
          {formatCount(dot)} were DOT-compliant, {formatCount(other)} were other than DOT-compliant, and {formatCount(dotUnknown)} were a helmet of unknown DOT compliance.
        </LimitNote>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Three groups, no imputation</CardTitle>
          <CardDescription>
            HELM_USE 5, 16, and 19 are used. Code 17 is not used. Codes 20, 96, 98, and 99 stay unknown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShareBar
            parts={[
              { label: "Used", value: overview.helmetUsed },
              { label: "Not used", value: overview.helmetNotUsed },
              { label: "Unknown", value: overview.helmetUnknown },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Raw helmet codes</CardTitle>
          <CardDescription>
            {formatCount(overview.helmetMisuseIndicated)} deaths coded as helmeted also have an indication of helmet misuse. That flag records possible misuse noted in the case material.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Deaths</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.helmetCodes.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="tabular-nums">{row.code}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{row.group}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.deaths)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Body type</CardTitle>
          <CardDescription>
            Motorcycles here are FARS body types 80 through 89. All-terrain vehicles (90) and snowmobiles (91) are excluded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Body type</TableHead>
                <TableHead className="text-right">Deaths</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bodyTypes.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="tabular-nums">{row.code}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.deaths)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPct(row.share)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

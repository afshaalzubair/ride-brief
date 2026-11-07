"use client"

import { DataGate } from "@/components/data-gate"
import { LimitNote, ShareBar } from "@/components/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatPct } from "@/lib/format"
import type { Briefing } from "@/lib/types"

export default function AlcoholPage() {
  return <DataGate>{(data) => <Alcohol data={data} />}</DataGate>
}

function Alcohol({ data }: { data: Briefing }) {
  const { overview, bac } = data
  const deaths = overview.motorcyclistDeaths
  const knownPolice = overview.drinkingInvolved + overview.drinkingNotInvolved
  const policeKnownShare = knownPolice === 0 ? null : overview.drinkingInvolved / knownPolice
  const numericShare = bac.numericResults === 0 ? null : bac.atOrAbove008 / bac.numericResults

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Alcohol is mostly uncoded</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#3f3a34]">
          For {formatCount(overview.drinkingUnknown)} of {formatCount(deaths)} motorcyclists killed, police-reported alcohol involvement is missing.
          The {formatCount(overview.drinkingInvolved)} deaths coded as alcohol involved are {formatPct(overview.drinkingInvolved / deaths)} of all deaths
          and {formatPct(policeKnownShare)} of deaths with a yes-or-no code.
        </p>
        <LimitNote>
          DRINKING records whether the reporting officer marked alcohol as involved. The FARS manual says that mark does not mean alcohol caused the crash.
          NHTSA publishes a separate alcohol-impaired-driving statistic that imputes a blood alcohol concentration when the test is missing. This briefing leaves missing tests missing.
        </LimitNote>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Police-reported involvement</CardTitle>
          <CardDescription>Unknown is its own result. It is larger than either yes or no.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareBar
            parts={[
              { label: "Involved", value: overview.drinkingInvolved },
              { label: "Not involved", value: overview.drinkingNotInvolved },
              { label: "Unknown", value: overview.drinkingUnknown },
            ]}
          />
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-3">
        <Step label="All motorcyclists killed" value={formatCount(bac.deaths)} detail="The only honest denominator for a national share." />
        <Step label="Numeric BAC on file" value={formatCount(bac.numericResults)} detail={`${formatPct(bac.numericResults / bac.deaths)} of deaths have a number from 0.00 through 0.94 or higher.`} />
        <Step label="Numeric result at or above 0.08" value={formatCount(bac.atOrAbove008)} detail={`${formatPct(bac.atOrAbove008 / bac.deaths)} of all deaths, and ${formatPct(numericShare)} of deaths with a number.`} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Why the 0.08 share moves when the denominator changes</CardTitle>
          <CardDescription>
            ALC_RES is stored in thousandths of g/dL. A value of 80 means 0.08. A value of 940 means 0.94 or greater and is counted with the 0.08-and-above group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6">
          <p>
            {formatCount(bac.testNotGiven)} deaths are coded as test not given. {formatCount(bac.positiveValueMissing)} are a positive reading with no numeric value.
            {" "}{formatCount(bac.testedResultUnknown)} were tested with an unknown result. Together, {formatCount(bac.noNumericResult)} deaths have no numeric result.
          </p>
          <p>
            Quoting {formatPct(numericShare)} as the share of motorcyclists killed who were at or above 0.08 would treat the untested deaths as if they did not exist.
            Quoting {formatPct(bac.atOrAbove008 / bac.deaths)} as the full impaired share would treat every missing test as under 0.08. Neither sentence is supported.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Step({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-serif text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

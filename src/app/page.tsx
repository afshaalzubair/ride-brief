"use client"

import Link from "next/link"
import { DataGate } from "@/components/data-gate"
import { LimitNote, MonthChart, ShareBar } from "@/components/charts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatPct } from "@/lib/format"
import type { Briefing } from "@/lib/types"

export default function OverviewPage() {
  return (
    <DataGate>
      {(data) => <Overview data={data} />}
    </DataGate>
  )
}

function Overview({ data }: { data: Briefing }) {
  const { overview } = data
  const deaths = overview.motorcyclistDeaths
  const knownHelmet = overview.helmetUsed + overview.helmetNotUsed
  const peakMonth = data.months.reduce((best, month) => (month.deaths > best.deaths ? month : best))
  const peakAge = data.age.reduce((best, band) => (band.deaths > best.deaths ? band : best))

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Badge variant="outline">Census of fatal crashes</Badge>
        <h1 className="max-w-4xl font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          {formatCount(deaths)} motorcyclists were killed in U.S. traffic crashes in 2023.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-[#3f3a34]">
          Those deaths happened in {formatCount(overview.motorcycleCrashes)} fatal crashes that involved a motorcycle.
          Another {formatCount(overview.otherDeaths)} people died in the same crashes and were not on a motorcycle.
        </p>
        <LimitNote>
          FARS records people who died, not miles ridden. A larger state count is not evidence that riding there is more dangerous per mile.
          Helmet and alcohol figures describe this fatality census. They are not estimates of what a helmet or a drink does.
        </LimitNote>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Motorcyclists killed"
          value={formatCount(deaths)}
          detail={`${formatCount(overview.operatorDeaths)} operators and ${formatCount(overview.passengerDeaths)} passengers`}
        />
        <Metric
          label="No helmet, known status"
          value={formatPct(overview.knownHelmetNonuse)}
          detail={`${formatCount(overview.helmetNotUsed)} of ${formatCount(knownHelmet)} with a usable helmet code`}
        />
        <Metric
          label="Alcohol code missing"
          value={formatPct(overview.drinkingUnknown / deaths)}
          detail={`${formatCount(overview.drinkingUnknown)} deaths have no police yes-or-no`}
        />
        <Metric
          label="Ten states' share"
          value={formatPct(overview.top10Share)}
          detail="Share of motorcyclist deaths, ranked by count"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Helmet, as coded</CardTitle>
            <CardDescription>
              Unknown stays unknown. {formatCount(overview.helmetUnknown)} deaths remain in their own group.
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
            <Link href="/helmet" className="mt-4 inline-block text-sm underline underline-offset-4">
              Helmet codes and body types
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">When the crash happened</CardTitle>
            <CardDescription>
              NCSA daytime is 6:00 a.m. to 5:59 p.m. Nighttime is the other coded hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareBar
              parts={[
                { label: "Daytime", value: overview.daytime },
                { label: "Nighttime", value: overview.nighttime },
                { label: "Unknown", value: overview.timeUnknown },
              ]}
            />
            <Link href="/time" className="mt-4 inline-block text-sm underline underline-offset-4">
              Hour, month, and weekend cuts
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Deaths by month</CardTitle>
          <CardDescription>
            {peakMonth.label} has the most, {formatCount(peakMonth.deaths)}. The largest age band is {peakAge.band} ({formatCount(peakAge.deaths)}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthChart months={data.months} />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Other people killed in these crashes</CardTitle>
            <CardDescription>
              {formatCount(overview.otherDeaths)} deaths are in a motorcycle-involved fatal crash and are not counted as motorcyclists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.otherDeaths.map((row) => (
                <li key={row.who} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <span>{row.who}</span>
                  <span className="tabular-nums font-medium">{formatCount(row.deaths)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Who was on the motorcycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            <p>{formatPct(overview.operatorDeaths / deaths)} were operators.</p>
            <p>
              {formatCount(data.sex.find((row) => row.label === "Male")?.deaths ?? 0)} were coded male,{" "}
              {formatCount(data.sex.find((row) => row.label === "Female")?.deaths ?? 0)} female, and{" "}
              {formatCount(data.sex.find((row) => row.label === "Not reported")?.deaths ?? 0)} not reported.
            </p>
            <p>
              {formatCount(overview.multiVehicle)} died in a multi-vehicle crash and {formatCount(overview.singleVehicle)} in a single-vehicle crash.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-serif text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

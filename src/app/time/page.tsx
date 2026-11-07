"use client"

import { DataGate } from "@/components/data-gate"
import { HourChart, LimitNote, ShareBar } from "@/components/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, hourLabel } from "@/lib/format"
import type { Briefing } from "@/lib/types"

export default function TimePage() {
  return <DataGate>{(data) => <Time data={data} />}</DataGate>
}

function Time({ data }: { data: Briefing }) {
  const { overview } = data
  const peak = data.hours.reduce((best, hour) => (hour.deaths > best.deaths ? hour : best))
  const peakMonth = data.months.reduce((best, month) => (month.deaths > best.deaths ? month : best))
  const maxDay = Math.max(...data.dayOfWeek.map((day) => day.deaths), 1)

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">The day splits almost in half</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#3f3a34]">
          {formatCount(overview.daytime)} motorcyclists died in NCSA daytime hours and {formatCount(overview.nighttime)} at night.
          The single busiest hour is {hourLabel(peak.hour)}, with {formatCount(peak.deaths)} deaths.
          {peakMonth.label} is the busiest month, with {formatCount(peakMonth.deaths)}.
        </p>
        <LimitNote>
          Hour 99 and a missing hour stay unknown ({formatCount(overview.timeUnknown)} deaths). They are not assigned to day or night.
        </LimitNote>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Hour of the crash</CardTitle>
          <CardDescription>Copper bars are 6:00 a.m. through 5:59 p.m. Ink bars are nighttime. The axis label marks the start of the hour.</CardDescription>
        </CardHeader>
        <CardContent>
          <HourChart hours={data.hours} />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Day of week</CardTitle>
            <CardDescription>Calendar day, not the NCSA weekend window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.dayOfWeek.map((day) => (
              <div key={day.code} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
                <span>{day.label}</span>
                <div className="h-3 overflow-hidden rounded-sm bg-[#e7dfd0]">
                  <div className="h-full bg-[#1c1915]" style={{ width: `${(day.deaths / maxDay) * 100}%` }} />
                </div>
                <span className="text-right tabular-nums">{formatCount(day.deaths)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">NCSA weekday and weekend</CardTitle>
            <CardDescription>
              Weekend runs from 6:00 p.m. Friday through 5:59 a.m. Monday. A Saturday morning is weekend. A Friday afternoon is weekday.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareBar
              parts={[
                { label: "Weekday", value: overview.weekday },
                { label: "Weekend", value: overview.weekend },
                { label: "Unknown", value: overview.weekUnknown },
              ]}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

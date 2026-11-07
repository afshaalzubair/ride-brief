"use client"

import { DataGate } from "@/components/data-gate"
import { LimitNote } from "@/components/charts"
import { StatesExplorer } from "@/components/states-explorer"
import { formatCount, formatPct } from "@/lib/format"
import type { Briefing, StateRow } from "@/lib/types"

export default function StatesPage() {
  return <DataGate>{(data) => <States data={data} />}</DataGate>
}

function States({ data }: { data: Briefing }) {
  const florida = findPostal(data, "FL")
  const california = findPostal(data, "CA")
  const texas = findPostal(data, "TX")

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Counts, not a danger ranking</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#3f3a34]">
          The ten states with the most motorcyclist deaths account for {formatPct(data.overview.top10Share)} of the national count.
          {florida ? ` ${florida.name} has the most, ${formatCount(florida.deaths)}.` : ""}
          {california && texas
            ? ` ${california.name} and ${texas.name} are close in count (${formatCount(california.deaths)} and ${formatCount(texas.deaths)}) and far apart in helmet coding: non-use among known status is ${formatPct(california.nonuseAmongKnown)} in ${california.name} and ${formatPct(texas.nonuseAmongKnown)} in ${texas.name}.`
            : ""}
        </p>
        <LimitNote>
          The gap describes people who died. It does not estimate the effect of a helmet law, because this file has no miles ridden, no measure of who chooses to ride, and no exposure by state.
        </LimitNote>
      </section>
      <StatesExplorer states={data.states} />
    </div>
  )
}

function findPostal(data: Briefing, postal: string): StateRow | undefined {
  return data.states.find((state) => state.postal === postal)
}

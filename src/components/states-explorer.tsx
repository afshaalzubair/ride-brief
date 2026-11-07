"use client"

import { useMemo, useState } from "react"
import { EmptyCut } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCount, formatPct } from "@/lib/format"
import type { StateRow } from "@/lib/types"

export function StatesExplorer({ states }: { states: StateRow[] }) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return states
    return states.filter(
      (state) => state.name.toLowerCase().includes(needle) || state.postal.toLowerCase().includes(needle)
    )
  }, [query, states])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="w-full sm:max-w-xs">
          <span className="mb-1 block text-sm font-medium">Find a state</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Texas or TX"
            aria-label="Find a state"
          />
        </label>
        <p className="text-sm text-muted-foreground">
          {formatCount(filtered.length)} of {formatCount(states.length)} states
        </p>
      </div>
      {filtered.length === 0 ? (
        <div className="space-y-4">
          <EmptyCut
            title={`No state matches "${query.trim()}".`}
            detail="Try a full name or a postal abbreviation. The table includes the 50 states and the District of Columbia."
          />
          <div className="text-center">
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Deaths</TableHead>
              <TableHead className="text-right">Share</TableHead>
              <TableHead className="text-right">Helmet not used</TableHead>
              <TableHead className="text-right">Non-use, known status</TableHead>
              <TableHead className="text-right">Nighttime</TableHead>
              <TableHead className="text-right">Alcohol involved</TableHead>
              <TableHead className="text-right">Alcohol unknown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((state) => (
              <TableRow key={state.postal}>
                <TableCell>{state.deathRank}</TableCell>
                <TableCell>
                  <span className="font-medium">{state.name}</span>
                  <span className="ml-2 text-muted-foreground">{state.postal}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(state.deaths)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPct(state.share)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(state.helmetNotUsed)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPct(state.nonuseAmongKnown)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPct(state.nighttimeShare)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(state.alcoholInvolved)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCount(state.alcoholUnknown)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

import { formatCount, formatPct, hourLabel } from "@/lib/format"

const GROUP_COLOR: Record<string, string> = {
  Used: "bg-[#1f4d3a]",
  "Not used": "bg-[#9c3418]",
  Unknown: "bg-[#8a8175]",
  Involved: "bg-[#9c3418]",
  "Not involved": "bg-[#1f4d3a]",
  Daytime: "bg-[#c47b4a]",
  Nighttime: "bg-[#1c1915]",
  Weekday: "bg-[#1f4d3a]",
  Weekend: "bg-[#9c3418]",
  "Single-vehicle": "bg-[#1c1915]",
  "Multi-vehicle": "bg-[#c47b4a]",
}

export function EmptyCut({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="font-serif text-2xl text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

export function ShareBar({
  parts,
}: {
  parts: { label: string; value: number; tone?: string }[]
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0)
  if (total === 0) {
    return <EmptyCut title="Nothing in this cut" detail="Every group in this chart has a count of zero." />
  }
  return (
    <div>
      <div className="flex h-10 overflow-hidden rounded-md" role="img" aria-label={parts.map((part) => `${part.label} ${formatCount(part.value)}`).join(", ")}>
        {parts.map((part) => (
          <div
            key={part.label}
            className={part.tone ?? GROUP_COLOR[part.label] ?? "bg-[#1c1915]"}
            style={{ width: `${(part.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {parts.map((part) => (
          <li key={part.label} className="flex items-start gap-2 text-sm">
            <span className={`mt-1 size-2.5 shrink-0 rounded-sm ${part.tone ?? GROUP_COLOR[part.label] ?? "bg-[#1c1915]"}`} />
            <span>
              <span className="block font-medium">{part.label}</span>
              <span className="text-muted-foreground">
                {formatCount(part.value)} · {formatPct(part.value / total)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HourChart({ hours }: { hours: { hour: number; deaths: number }[] }) {
  const max = Math.max(...hours.map((hour) => hour.deaths), 1)
  if (hours.every((hour) => hour.deaths === 0)) {
    return <EmptyCut title="No hour of crash is coded" detail="Every death in this file is missing the hour." />
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex h-48 items-end gap-1 border-b border-[#1c1915]/20">
          {hours.map((hour) => {
            const daytime = hour.hour >= 6 && hour.hour <= 17
            return (
              <div key={hour.hour} className="flex h-full flex-1 items-end">
                <div
                  className={daytime ? "w-full rounded-t-sm bg-[#c47b4a]" : "w-full rounded-t-sm bg-[#1c1915]"}
                  style={{ height: `${Math.max((hour.deaths / max) * 100, hour.deaths ? 2 : 0)}%` }}
                  title={`${hourLabel(hour.hour)}: ${formatCount(hour.deaths)}`}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex gap-1 text-[10px] text-muted-foreground">
          {hours.map((hour) => (
            <div key={hour.hour} className="flex-1 text-center">
              {hour.hour % 3 === 0 ? hourLabel(hour.hour).replace(" ", "") : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MonthChart({ months }: { months: { label: string; deaths: number }[] }) {
  const max = Math.max(...months.map((month) => month.deaths), 1)
  if (months.every((month) => month.deaths === 0)) {
    return <EmptyCut title="No month is coded" detail="The crash month is missing for every death in this cut." />
  }
  return (
    <div className="grid grid-cols-12 items-end gap-1.5 sm:gap-2">
      {months.map((month) => (
        <div key={month.label} className="flex flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end sm:h-36">
            <div
              className="w-full rounded-t-sm bg-[#9c3418]"
              style={{ height: `${Math.max((month.deaths / max) * 100, month.deaths ? 4 : 0)}%` }}
              title={`${month.label}: ${formatCount(month.deaths)}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground sm:text-xs">{month.label.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  )
}

export function LimitNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-[#9c3418] pl-4 text-sm leading-6 text-[#3f3a34]">{children}</p>
  )
}

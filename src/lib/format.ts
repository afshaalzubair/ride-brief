export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatPct(share: number | null | undefined, digits = 1): string {
  if (share == null || Number.isNaN(share)) return "n/a"
  return `${(share * 100).toFixed(digits)}%`
}

export function formatGenerated(iso: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
  return `${formatted} CT`
}

export function groupCount(rows: { group: string; deaths: number }[], name: string): number {
  return rows.find((row) => row.group === name)?.deaths ?? 0
}

export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "a.m." : "p.m."
  const clock = hour % 12 === 0 ? 12 : hour % 12
  return `${clock} ${suffix}`
}

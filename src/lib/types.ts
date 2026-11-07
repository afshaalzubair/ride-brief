export type CountShare = {
  deaths: number
  share: number
}

export type GroupCount = CountShare & {
  group: string
}

export type StateRow = {
  stateCode: number
  name: string
  postal: string
  deaths: number
  share: number
  deathRank: number
  cumulativeShare: number
  helmetUsed: number
  helmetNotUsed: number
  helmetUnknown: number
  helmetKnown: number
  nonuseAmongKnown: number | null
  nighttime: number
  nighttimeShare: number | null
  alcoholInvolved: number
  alcoholUnknown: number
}

export type Briefing = {
  meta: {
    title: string
    year: number
    release: string
    sourceName: string
    sourceUrl: string
    manual: string
    manualUrl: string
    generatedAt: string
    geography: string
  }
  overview: {
    motorcycleCrashes: number
    motorcyclistDeaths: number
    otherDeaths: number
    helmetUsed: number
    helmetNotUsed: number
    helmetUnknown: number
    knownHelmetNonuse: number | null
    drinkingInvolved: number
    drinkingNotInvolved: number
    drinkingUnknown: number
    daytime: number
    nighttime: number
    timeUnknown: number
    weekday: number
    weekend: number
    weekUnknown: number
    singleVehicle: number
    multiVehicle: number
    operatorDeaths: number
    passengerDeaths: number
    helmetMisuseIndicated: number
    top10Share: number | null
  }
  helmet: GroupCount[]
  helmetCodes: { code: number; label: string; group: string; deaths: number }[]
  bodyTypes: { code: number; label: string; deaths: number; share: number }[]
  alcohol: GroupCount[]
  bac: {
    deaths: number
    numericResults: number
    atOrAbove008: number
    below008: number
    testNotGiven: number
    positiveValueMissing: number
    testedResultUnknown: number
    noNumericResult: number
  }
  hours: { hour: number; deaths: number }[]
  dayOfWeek: { code: number; label: string; deaths: number }[]
  dayPart: GroupCount[]
  weekPart: GroupCount[]
  months: { month: number; label: string; deaths: number }[]
  age: { band: string; sort: number; deaths: number; share: number }[]
  sex: { label: string; deaths: number; share: number }[]
  roles: { label: string; deaths: number; share: number }[]
  vehicles: GroupCount[]
  otherDeaths: { who: string; deaths: number; share: number }[]
  states: StateRow[]
  quality: { id: string; level: string; n: number; detail: string }[]
  definitions: { topic: string; rule: string }[]
}

export function isBriefing(value: unknown): value is Briefing {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<Briefing>
  return (
    typeof record.overview?.motorcyclistDeaths === "number" &&
    Array.isArray(record.states) &&
    record.states.length >= 50 &&
    Array.isArray(record.hours) &&
    record.hours.length === 24 &&
    Array.isArray(record.definitions)
  )
}

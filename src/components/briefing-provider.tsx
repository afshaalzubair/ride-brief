"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { isBriefing, type Briefing } from "@/lib/types"

type LoadState =
  | { status: "loading"; data: null; message: null }
  | { status: "ready"; data: Briefing; message: null }
  | { status: "error"; data: null; message: string }

const BriefingContext = createContext<LoadState | null>(null)

export function BriefingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoadState>({ status: "loading", data: null, message: null })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(window.location.search)
    const url = params.get("briefing") === "unavailable" ? "/data/missing-briefing.json" : "/data/briefing.json"

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`The briefing file returned HTTP ${response.status}.`)
        }
        const payload: unknown = await response.json()
        if (!isBriefing(payload)) {
          throw new Error("The briefing file is missing the death count, the state table, or the hour table.")
        }
        setState({ status: "ready", data: payload, message: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : "The briefing file could not be read."
        setState({ status: "error", data: null, message })
      })

    return () => controller.abort()
  }, [])

  return <BriefingContext.Provider value={state}>{children}</BriefingContext.Provider>
}

export function useBriefing(): LoadState {
  const value = useContext(BriefingContext)
  if (!value) {
    throw new Error("useBriefing must be used inside BriefingProvider")
  }
  return value
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/helmet", label: "Helmet" },
  { href: "/alcohol", label: "Alcohol" },
  { href: "/time", label: "Time" },
  { href: "/states", label: "States" },
  { href: "/methods", label: "Methods" },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <header className="bg-[#1c1915] text-[#f3ecdf]">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-[#e7b59a] uppercase">
              NHTSA FARS · 2023 final
            </p>
            <p className="font-serif text-2xl leading-none tracking-tight">Ride Brief</p>
          </div>
          <Button
            variant="outline"
            className="border-[#d9d0c1]/40 bg-transparent text-[#f3ecdf] hover:bg-[#f3ecdf] hover:text-[#1c1915]"
            render={<a href="/ride_brief_2023.xlsx" />}
          >
            Excel briefing
          </Button>
        </div>
      </header>
      <nav className="sticky top-0 z-20 border-b border-border bg-[#f3ecdf]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm whitespace-nowrap",
                  active ? "bg-[#1c1915] text-[#f3ecdf]" : "text-[#3f3a34] hover:bg-[#e7dfd0]"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <p>
            Independent reading of a public NHTSA file. Not a NHTSA product, and not a measure of risk per mile.
          </p>
          <p>
            Source:{" "}
            <a className="underline decoration-[#d9d0c1] underline-offset-4 hover:text-foreground" href="https://www.nhtsa.gov/research-data/fatality-analysis-reporting-system-fars">
              Fatality Analysis Reporting System
            </a>
            , 2023 final national CSV.
          </p>
        </div>
      </footer>
    </div>
  )
}

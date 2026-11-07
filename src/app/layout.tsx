import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { BriefingProvider } from "@/components/briefing-provider";
import { Shell } from "@/components/shell";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Ride Brief",
    template: "%s · Ride Brief",
  },
  description:
    "A 2023 briefing of U.S. motorcycle deaths in traffic crashes, built from NHTSA FARS with SQL and an auditable Excel workbook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        <BriefingProvider>
          <Shell>{children}</Shell>
        </BriefingProvider>
      </body>
    </html>
  );
}

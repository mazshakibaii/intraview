import type { Metadata } from "next"
import "@/styles/globals.css"
import { Inter as FontSans } from "next/font/google"

import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { ClientProvider, ThemeProvider } from "@/components/providers"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Shadcn Convex Nextjs Starter",
  description: "Starter repo for the best stack ever",
  // manifest: "/manifest.json",
  // openGraph: {
  //   title: "Shadcn Convex Nextjs Starter",
  //   description: "Starter repo for the best stack ever",
  //   url: "https://www.evie.doctor",
  //   images: [
  //     {
  //       url: "",
  //       width: 1200,
  //       height: 630,
  //       alt: "Shadcn Convex Nextjs Starter",
  //     },
  //   ],
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   title: "Shadcn Convex Nextjs Starter",
  //   description: "Starter repo for the best stack ever",
  //   images: [
  //     {
  //       url: "",
  //       width: 1200,
  //       height: 630,
  //       alt: "Shadcn Convex Nextjs Starter",
  //     },
  //   ],
  // },
  // icons: {
  //   icon: "/favicon.ico",
  //   shortcut: "/favicon.ico",
  //   apple: "/apple-touch-icon.png",
  // },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClientProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <ThemeProvider attribute="class" forcedTheme="light">
            <Header />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClientProvider>
  )
}

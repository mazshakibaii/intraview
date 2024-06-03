import Link from "next/link"
import { HeaderAuthButtons } from "./auth-buttons"
import config from "@/lib/config"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b shadow-md bg-background/10 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link className="flex items-center gap-2" href="/">
          <p className="font-semibold text-xl">
            {config.siteName}
            <span className="text-blue-500">.</span>
          </p>
        </Link>
        <HeaderAuthButtons />
      </div>
    </header>
  )
}

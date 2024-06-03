import config from "@/lib/config"
import { UserProfile } from "@clerk/nextjs"

export const metadata = {
  title: `${config.siteName} | Your Account`,
}

export default function AccountPage() {
  return (
    <main className="min-h-[calc(100dvh-64px)] bg-secondary flex">
      <div className="container flex p-4 md:p-6">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: {
                width: "100%",
              },
              cardBox: {
                width: "100%",
              },
            },
          }}
        />
      </div>
    </main>
  )
}

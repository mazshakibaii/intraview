import { IntraviewCards } from "@/components/intraview/cards"
import { Id } from "../../../../convex/_generated/dataModel"
import RoleOverview from "@/components/intraview/role-overview"
import { IntraviewQuestions } from "@/components/intraview/questions"

export const metadata = {
  title: "Intraview | View Report",
}

export default function Report({
  params: { id },
}: {
  params: { id: Id<"runs"> }
}) {
  return (
    <main className="min-h-[calc(100dvh-65px)]">
      <div className="container flex flex-col gap-4 px-4 md:px-6 py-4 md:py-4">
        <IntraviewCards runId={id} />
        <RoleOverview runId={id} />
        <IntraviewQuestions runId={id} />
      </div>
    </main>
  )
}

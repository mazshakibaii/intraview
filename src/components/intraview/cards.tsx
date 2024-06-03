"use client"
import { Progress } from "../ui/progress"
import { Id } from "../../../convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useEffect } from "react"

export function IntraviewCards({ runId }: { runId: Id<"runs"> }) {
  const run = useQuery(api.runs.fetchRun, { runId: runId })
  const totalQuestions = run?.questions
    ?.map((category: any) => category.questions.length)
    .reduce((a: number, b: number) => a + b, 0)

  const questionsAnswered = run?.questions
    ?.map((category: any) => category.questions.filter((q: any) => q.answer))
    .flat().length

  useEffect(() => {
    console.log(run)
  }, [run])
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-2">
      <div className="rounded-md bg-blue-500 p-3 space-y-2">
        <div className="flex flex-row justify-between">
          <p className="font-semibold -mt-1">Progress</p>
          <p className="-mt-1">
            {questionsAnswered}/{totalQuestions}
          </p>
        </div>
        <Progress
          value={
            questionsAnswered ? (questionsAnswered / totalQuestions) * 100 : 0
          }
          className="!h-2 bg-blue-400"
        />
      </div>
      {/* <div className="rounded-md bg-blue-500 p-4 space-y-2 flex flex-row justify-between items-center">
          <p className="font-semibold -mt-1">Score</p>
          <p className="-mt-1">0</p>
        </div> */}
      <div className="rounded-md bg-teal-500 p-3 space-y-2">
        <div className="flex flex-row justify-between">
          <p className="font-semibold -mt-1">Score</p>
          <p className="-mt-1">
            {run?.score ? parseFloat((run?.score * 100).toFixed()) : 0}/100
          </p>
        </div>
        <Progress
          value={run?.score ? parseFloat((run?.score * 100).toFixed()) : 0}
          className="!h-2 bg-teal-400"
        />
      </div>
    </section>
  )
}

// function CardItem({
//   title,
//   description,
//   progress,
// }: {
//   title: string
//   description: string
//   progress: number
// }) {
//   return (
//     <div className="rounded-md bg-blue-500 p-4 space-y-2">
//       <div className="flex flex-row justify-between">
//         <p className="font-semibold -mt-1">Progress</p>
//         <p className="-mt-1">9/20</p>
//       </div>
//       <Progress value={0} className="!h-2 bg-blue-400" />
//     </div>
//   )
// }

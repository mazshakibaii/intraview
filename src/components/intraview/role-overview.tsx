"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Id } from "../../../convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

export default function RoleOverview({ runId }: { runId: Id<"runs"> }) {
  const run = useQuery(api.runs.fetchRun, { runId })
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {run?.jobTitle}, {run?.employer}
        </CardTitle>
        <CardDescription>Role Overview</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="description">
            <AccordionTrigger className="pt-0">
              Job Description
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <p className="whitespace-break-spaces">{run?.jobDescription}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="keywords">
            <AccordionTrigger className="py-0">Key Skills</AccordionTrigger>
            <AccordionContent className="pb-0 pt-4">
              <p className="whitespace-break-spaces">{run?.keySkills}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

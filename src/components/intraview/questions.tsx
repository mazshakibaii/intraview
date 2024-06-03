"use client"

import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/lib/deepgram/DeepgramProvider"
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/lib/deepgram/MicrophoneProvider"

import { Card } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HybridTooltip,
  HybridTooltipContent,
  HybridTooltipTrigger,
  TouchProvider,
} from "@/components/ui/hybird-tooltip"
import { Progress } from "../ui/progress"
import { CircleCheckBig, CircleDashed, Info, RefreshCcw } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import Visualizer from "../ui/visualizer"
import { Button } from "../ui/button"
import { TooltipProvider } from "../ui/tooltip"

export function IntraviewQuestions({ runId }: { runId: Id<"runs"> }) {
  const run = useQuery(api.runs.fetchRun, { runId })

  const categoryCards = run?.questions?.map((category) => {
    const totalQuestions = category.questions.length
    const completedQuestions = category.questions.filter(
      (question) => question.answer
    ).length

    const questionList = category.questions.map((question, index) => {
      return (
        <AccordionItem value={String(index)} key={index}>
          <AccordionTrigger
            className={cn(
              "flex flex-row gap-3",
              index === category.questions.length - 1 ? "!pb-0" : ""
            )}
          >
            <div className="flex flex-row gap-3">
              <div className="min-h-[15px] min-w-[15px] mt-1.5">
                {question.answer ? (
                  <CircleCheckBig size={15} className="text-green-500" />
                ) : (
                  <CircleDashed size={15} className="text-neutral-400" />
                )}
              </div>
              <p className="text-start font-normal flex-grow">
                {question.question}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              "!pb-0",
              index === category.questions.length - 1 ? "!pt-4" : ""
            )}
          >
            {question.answer ? (
              <ViewAnswer
                question={question}
                runId={runId}
                category={category.category}
              />
            ) : (
              <AnswerQuestion
                runId={runId}
                question={question.question}
                category={category.category}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      )
    })
    return (
      <Card key={category.category} className="flex flex-col gap-2 py-4 px-6">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row gap-3 text-lg items-center">
            {totalQuestions > completedQuestions ? (
              <CircleDashed
                size={20}
                className={
                  completedQuestions === 0
                    ? "text-neutral-400"
                    : completedQuestions >= 0
                      ? "text-yellow-500"
                      : ""
                }
              />
            ) : (
              <CircleCheckBig size={20} className="text-green-500" />
            )}
            <p className="">{category.category}</p>
          </div>
          <p className="bg-neutral-900 p-2 rounded-md">
            {/* {completedQuestions}/{totalQuestions} */}
            {category.score ? parseFloat((category.score * 100).toFixed()) : 0}
          </p>
        </div>
        <div>
          <Accordion type="single" collapsible>
            {questionList}
          </Accordion>
        </div>
      </Card>
    )
  })

  return <section className="flex flex-col gap-4">{categoryCards}</section>
}

function AnswerQuestion({
  runId,
  question,
  category,
}: {
  runId: Id<"runs">
  question: string
  category: string
}) {
  const [caption, setCaption] = useState<string | undefined>("")
  const [status, setStatus] = useState<"idle" | "starting" | "ready">("idle")
  const {
    connection,
    connectToDeepgram,
    connectionState,
    disconnectFromDeepgram,
  } = useDeepgram()
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    microphoneState,
    stopMicrophone,
  } = useMicrophone()
  const captionTimeout = useRef<any>()
  const keepAliveInterval = useRef<any>()
  const updateAnswer = useMutation(api.runs.updateAnswer)

  // useEffect(() => {
  //   setupMicrophone()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  const handleStart = () => {
    setupMicrophone()
    startMicrophone()

    setStatus("starting")
  }

  const handleStop = async () => {
    stopMicrophone()
    disconnectFromDeepgram()
    if (caption) {
      await updateAnswer({ answer: caption, runId, category, question })
      setCaption("")
    }
    setStatus("idle")
  }

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
        vad_events: true,
        endpointing: 300,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState])

  useEffect(() => {
    if (!microphone) return
    if (!connection) return
    setStatus("ready")

    const onData = (e: BlobEvent) => {
      connection?.send(e.data)
    }

    const onTranscript = (data: LiveTranscriptionEvent) => {
      if (typeof window === "undefined") {
        // This is running on the server, so return early
        return
      }
      console.log(data)
      const { is_final: isFinal, speech_final: speechFinal } = data
      let thisCaption = data.channel.alternatives[0].transcript

      if (isFinal) {
        setCaption((prev) => prev + " " + thisCaption)
      }

      // console.log("thisCaption", thisCaption)
      // if (thisCaption !== "") {
      //   console.log('thisCaption !== ""', thisCaption)
      //   setCaption(thisCaption)
      // }

      // if (isFinal && speechFinal) {
      //   clearTimeout(captionTimeout.current)
      //   captionTimeout.current = setTimeout(() => {
      //     setCaption(undefined)
      //     clearTimeout(captionTimeout.current)
      //   }, 3000)
      // }
    }

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript)
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData)

      startMicrophone()
    }

    return () => {
      // prettier-ignore
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData)
      clearTimeout(captionTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState])

  useEffect(() => {
    if (!connection) return

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive()

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive()
      }, 10000)
    } else {
      clearInterval(keepAliveInterval.current)
    }

    return () => {
      clearInterval(keepAliveInterval.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState])
  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full h-full flex items-center justify-start space-x-2">
        {status === "ready" ? (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => handleStop()}
          >
            Stop Recording
          </Button>
        ) : status === "starting" ? (
          <Button
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            disabled
          >
            Loading...
          </Button>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStart()}
          >
            Start Recording
          </Button>
        )}
        <div className="w-full h-10">
          {microphone && status === "ready" && (
            <Visualizer microphone={microphone} />
          )}
        </div>
        {/* <div className="absolute bottom-[8rem]  inset-x-0 max-w-4xl mx-auto text-center">
        {caption && <span className="bg-black/70 p-8">{caption}</span>}
      </div> */}
      </div>
      {caption}
    </div>
  )
}

type Question = {
  question: string
  answer?: string
  feedback?: string
  score?: number
  improvedAnswer?: string
  suggestions?: string[]
  areas?: {
    clarity: {
      score: number
      feedback: string
    }
    competency: {
      score: number
      feedback: string
    }
    relevance: {
      score: number
      feedback: string
    }
    structure: {
      score: number
      feedback: string
    }
  }
}

function ViewAnswer({
  question,
  runId,
  category,
}: {
  question: Question
  runId: Id<"runs">
  category: string
}) {
  const retry = useMutation(api.runs.retryQuestion)
  // const [loadingRetry, setLoadingRetry] = useState(false)
  const areas =
    question?.areas &&
    Object.entries(question.areas).map(([key, value]) => (
      <div
        className={cn(
          "col-span-1 rounded-md p-2 font-semibold",
          value.score >= 0 && value.score <= 0.3
            ? "bg-red-700"
            : value.score > 0.3 && value.score <= 0.6
              ? "bg-yellow-700"
              : value.score > 0.6 && value.score <= 0.8
                ? "bg-green-500"
                : value.score > 0.8 && value.score <= 1
                  ? "bg-green-900"
                  : ""
        )}
        key={key}
      >
        <TouchProvider>
          <TooltipProvider delayDuration={200}>
            <HybridTooltip>
              <HybridTooltipTrigger asChild>
                <div className="flex flex-row justify-between">
                  <div className="flex flex-row gap-2 items-center">
                    <p>
                      {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                    </p>
                    <Info size={15} className="text-white" />
                  </div>
                  <p className="text-right">{value.score * 10}/10</p>
                </div>
              </HybridTooltipTrigger>
              <HybridTooltipContent
                align="start"
                side="bottom"
                alignOffset={-10}
                sideOffset={10}
                className="max-w-[300px]"
              >
                <p className="font-normal">{value.feedback}</p>
              </HybridTooltipContent>
            </HybridTooltip>
          </TooltipProvider>
        </TouchProvider>
      </div>
    ))
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full bg-neutral-900 p-3 rounded-md flex flex-col gap-2">
        <p className="text-lg font-bold">Your answer:</p>
        <p>{question.answer}</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">{areas}</div>
        <p className="text-lg font-bold">Feedback:</p>
        <p>{question.feedback}</p>
        {question.improvedAnswer && (
          <p>
            Here&apos;s an example of how you could&apos;ve answered better:
          </p>
        )}
        <p className="whitespace-break-spaces pl-5">
          {question.improvedAnswer}
        </p>
        {question.suggestions && (
          <>
            <p className="text-lg font-bold">Suggestions:</p>
            <ul className="list-disc list-inside">
              {question.suggestions?.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div>
        <Button
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => {
            console.log("Clearing message...")
            retry({ runId, category: category, question: question.question })
          }}
        >
          Try again <RefreshCcw size={15} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}

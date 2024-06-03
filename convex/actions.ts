"use node"

import { ConvexError, v } from "convex/values"
import { action, internalAction } from "./_generated/server"
import { openai } from "@ai-sdk/openai"
import z from "zod"
import { generateObject } from "ai"
import { internal } from "./_generated/api"
import { createClient, DeepgramError } from "@deepgram/sdk"

const runSchema = z.object({
  jobTitle: z.string().describe("The job title"),
  employer: z.string().describe("The employer"),
  keySkills: z
    .array(z.string())
    .describe("The key skills required for the job"),
  category: z
    .string()
    .describe(
      "The category of the job, for example Financial Services, Marketing, Human Resources, etc."
    ),
  questions: z
    .array(
      z.object({
        category: z.string().describe("The category of the question."),
        questions: z
          .array(
            z.object({
              question: z
                .string()
                .describe(
                  "The question, prioritise the STAR (Situation, Task, Action, Result) format but do not include it in the question."
                ),
            })
          )
          .describe("An array of questions for this category."),
      })
    )
    .describe(
      "An array of interview questions for this job by category. The categories must be either Competency Questions, Technical Questions, or Situational Questions."
    ),
})

export const startRun = internalAction({
  args: { jobDescription: v.string(), runId: v.id("runs") },
  async handler(ctx, args) {
    const model = openai("gpt-4o")

    const { object } = await generateObject({
      model,
      schema: runSchema,
      prompt: `Generate the requested JSON object for the following job description:\n[START]\n${args.jobDescription}\n[END]`,
    })

    await ctx.runMutation(internal.runs.updateRun, {
      runId: args.runId,
      ...object,
    })
  },
})

export const authenticateDeepgram = action({
  args: {},
  async handler(ctx) {
    // const user = currentUser(ctx, {})
    console.log("Authenticating Deepgram")
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? "")

    let { result: projectsResult, error: projectsError } =
      await deepgram.manage.getProjects()

    if (projectsError) {
      throw new ConvexError(projectsError.message)
    }

    const project = projectsResult?.projects[0]

    if (!project) {
      throw new ConvexError("No project found")
    }

    let { result: newKeyResult, error: newKeyError } =
      await deepgram.manage.createProjectKey(project.project_id, {
        comment: "Temporary API key",
        scopes: ["usage:write"],
        tags: ["convex", "intraview"],
        time_to_live_in_seconds: 60 * 5,
      })

    if (newKeyError) {
      throw new ConvexError(newKeyError.message)
    }

    return newKeyResult
  },
})

const feedbackSchema = z.object({
  score: z
    .number()
    .describe("A score, rating the candidate's response between 0 and 1"),
  feedback: z
    .string()
    .describe("A short feedback message on the candidate's response"),
  improvedAnswer: z
    .string()
    .describe(
      "Re-write the candidate's answer to improve it. Do not include markdown in this response."
    ),
  suggestions: z
    .array(z.string())
    .describe("Suggestions for the candidate to improve their answer."),
  areas: z
    .object({
      clarity: z
        .object({
          score: z
            .number()
            .describe(
              "A score, rating the clarity of the response between 0 and 1"
            ),
          feedback: z
            .string()
            .describe(
              "A short feedback message on the clarity of the response"
            ),
        })
        .describe(
          "Assess the clarity of the candidate's response to the question asked."
        ),
      relevance: z
        .object({
          score: z
            .number()
            .describe(
              "A score, rating the relevance of the response between 0 and 1"
            ),
          feedback: z
            .string()
            .describe(
              "A short feedback message on the relevance of the response"
            ),
        })
        .describe(
          "Assess the relevance of the candidate's response to the question asked."
        ),
      structure: z
        .object({
          score: z
            .number()
            .describe(
              "A score, rating the structure of the response between 0 and 1"
            ),
          feedback: z
            .string()
            .describe(
              "A short feedback message on the structure of the response"
            ),
        })
        .describe(
          "Assess the structure of the candidate's response to the question asked. If relevant, include an assessment of their use of STAR (Situation, Task, Action, Results) to structure their response."
        ),
      competency: z
        .object({
          score: z
            .number()
            .describe(
              "A score, rating the candidate's competency in the question asked between 0 and 1"
            ),
          feedback: z
            .string()
            .describe(
              "A short feedback message on the candidate's competency in the question asked"
            ),
        })
        .describe(
          "Assess the candidate's competency (technical, soft skills, etc.) in the question asked."
        ),
    })
    .describe(
      "An optional area of feedback on the candidate's response addressed to the candidate."
    ),
})

// v.object({
//   question: v.string(),
//   answer: v.optional(v.string()),
//   feedback: v.optional(v.string()),
//   score: v.optional(v.number()),
//   areas: v.optional(
//     v.array(
//       v.object({
//         name: v.string(),
//         score: v.number(),
//         feedback: v.string(),
//       })
//     )
//   ),

export const questionFeedback = internalAction({
  args: {
    runId: v.id("runs"),
    category: v.string(),
    question: v.string(),
    answer: v.string(),
    jobDescription: v.string(),
    categoryIndex: v.number(),
    questionIndex: v.number(),
  },
  async handler(ctx, args) {
    const run = await ctx.runQuery(internal.runs.getRunById, {
      runId: args.runId,
    })
    if (!run || !run.questions) return null

    // OpenAI
    const model = openai("gpt-4o")
    const { object, usage: tokenUsage } = await generateObject({
      model,
      schema: feedbackSchema,
      prompt: `You are tasked with assessing a candidate's performance to interview questions. Your responses will be presented to the candidate, so address the candidate directly. Generate the requested JSON object for the candidate's response to the question:\n\n:Question: ${args.question}\nAnswer: ${args.answer}\n\n[JOB DESCRIPTION]\n${args.jobDescription}\n[JOB DESCRIPTION END]`,
    })

    // run.questions[args.categoryIndex].questions[args.questionIndex].areas =
    //   object.areas

    let usage =
      run.questions[args.categoryIndex].questions[args.questionIndex].usage

    let question =
      run.questions[args.categoryIndex].questions[args.questionIndex]
    question.score = object.score
    question.feedback = object.feedback
    question.areas = object.areas
    question.usage = usage
      ? usage + tokenUsage.totalTokens
      : tokenUsage.totalTokens
    question.suggestions = object.suggestions
    question.improvedAnswer = object.improvedAnswer

    await ctx.runMutation(internal.runs.updateRun, {
      runId: args.runId,
      questions: run.questions,
    })

    await ctx.runMutation(internal.runs.calculateScore, { runId: args.runId })
  },
})

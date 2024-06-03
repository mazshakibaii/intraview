import { v } from "convex/values"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"
import { currentUser } from "./users"
import { internal } from "./_generated/api"

export const fetchRun = query({
  args: { runId: v.optional(v.id("runs")) },
  handler: async (ctx, args) => {
    if (!args.runId) return null
    const run = await ctx.db.get(args.runId)
    if (!run) return null
    return run
  },
})

export const startReport = mutation({
  args: { jobDescription: v.string() },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx, {})
    const reportId = await ctx.db.insert("runs", {
      userId: user?._id,
      status: "waiting",
      jobDescription: args.jobDescription,
      score: 0,
    })
    await ctx.scheduler.runAfter(0, internal.actions.startRun, {
      runId: reportId,
      jobDescription: args.jobDescription,
    })
    return reportId
  },
})

export const updateRun = internalMutation({
  args: {
    runId: v.id("runs"),
    jobTitle: v.optional(v.string()),
    employer: v.optional(v.string()),
    category: v.optional(v.string()),
    score: v.optional(v.number()),
    keySkills: v.optional(v.array(v.string())),
    usage: v.optional(v.number()),
    questions: v.array(
      v.object({
        category: v.string(),
        score: v.optional(v.number()),
        questions: v.array(
          v.object({
            question: v.string(),
            answer: v.optional(v.string()),
            feedback: v.optional(v.string()),
            improvedAnswer: v.optional(v.string()),
            suggestions: v.optional(v.array(v.string())),
            score: v.optional(v.number()),
            usage: v.optional(v.number()),
            areas: v.optional(
              v.object({
                clarity: v.object({
                  score: v.number(),
                  feedback: v.string(),
                }),
                relevance: v.object({
                  score: v.number(),
                  feedback: v.string(),
                }),
                structure: v.object({
                  score: v.number(),
                  feedback: v.string(),
                }),
                competency: v.object({
                  score: v.number(),
                  feedback: v.string(),
                }),
              })
            ),
          })
        ),
      })
    ),
  },
  async handler(ctx, args) {
    const { runId, ...otherData } = args
    await ctx.db.patch(args.runId, { ...otherData, status: "ready" })
  },
})

export const updateAnswer = mutation({
  args: {
    runId: v.id("runs"),
    category: v.string(),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)
    if (!run || !run.questions) return
    const categoryIndex = run.questions.findIndex(
      (q) => q.category === args.category
    )
    const questionIndex = run.questions[categoryIndex].questions.findIndex(
      (q) => q.question === args.question
    )
    if (categoryIndex !== -1 && questionIndex !== -1) {
      run.questions[categoryIndex].questions[questionIndex].answer = args.answer

      await ctx.db.patch(args.runId, {
        questions: run.questions,
      })
      await ctx.scheduler.runAfter(0, internal.actions.questionFeedback, {
        runId: args.runId,
        category: args.category,
        question: args.question,
        answer: args.answer,
        jobDescription: run.jobDescription,
        categoryIndex: categoryIndex,
        questionIndex: questionIndex,
      })
    }
  },
})

export const getRunById = internalQuery({
  args: { runId: v.id("runs") },
  async handler(ctx, args) {
    const run = await ctx.db.get(args.runId)
    return run
  },
})

export const retryQuestion = mutation({
  args: {
    runId: v.id("runs"),
    category: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Clearing question")
    const run = await ctx.db.get(args.runId)
    if (!run || !run.questions) return
    const categoryIndex = run.questions.findIndex(
      (q) => q.category === args.category
    )
    const questionIndex = run.questions[categoryIndex].questions.findIndex(
      (q) => q.question === args.question
    )
    if (categoryIndex !== -1 && questionIndex !== -1) {
      run.questions[categoryIndex].questions[questionIndex].answer = undefined
      run.questions[categoryIndex].questions[questionIndex].areas = undefined
      run.questions[categoryIndex].questions[questionIndex].feedback = undefined
      run.questions[categoryIndex].questions[questionIndex].score = undefined
      run.questions[categoryIndex].questions[questionIndex].suggestions =
        undefined
      run.questions[categoryIndex].questions[questionIndex].improvedAnswer =
        undefined

      await ctx.db.patch(args.runId, {
        questions: run.questions,
      })
    }
  },
})

export const calculateScore = internalMutation({
  args: {
    runId: v.id("runs"),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)
    if (!run || !run.questions) return
    // Create a new run object
    let newRun = { ...run }

    // Calculate the score for each question
    newRun.questions = run.questions.map((questionCategory) => {
      let newQuestionCategory = { ...questionCategory }

      newQuestionCategory.questions = questionCategory.questions.map(
        (question) => {
          let newQuestion = { ...question }

          if (!question.answer) {
            newQuestion.score = 0
          } else {
            let totalScore = 0
            let count = 0
            for (let area in question.areas) {
              let score = (question.areas as any)[area].score
              if (typeof score === "number") {
                totalScore += score
                count++
              }
            }
            newQuestion.score = count > 0 ? totalScore / count : 0
          }

          return newQuestion
        }
      )

      // Calculate the score for each category
      let totalScore = 0
      newQuestionCategory.questions.forEach((question) => {
        totalScore += question.score ?? 0
      })
      newQuestionCategory.score =
        newQuestionCategory.questions.length > 0
          ? totalScore / newQuestionCategory.questions.length
          : 0

      return newQuestionCategory
    })

    // Calculate the overall score
    let totalScore = 0
    let count = 0
    newRun.questions.forEach((questionCategory) => {
      if (
        questionCategory.score !== null &&
        questionCategory.score !== undefined
      ) {
        totalScore += questionCategory.score
        count++
      }
    })
    newRun.score = count > 0 ? totalScore / count : 0

    await ctx.db.patch(args.runId, {
      questions: newRun.questions,
      score: newRun.score,
    })
  },
})

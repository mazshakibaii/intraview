import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// EXAMPLE: https://github.com/thomasballinger/convex-clerk-users-table/blob/main/convex/listMessages.ts

export default defineSchema({
  users: defineTable({
    // this is UserJSON from @clerk/backend
    clerkUser: v.any(),
    admin: v.optional(v.boolean()),
  }).index("by_clerk_id", ["clerkUser.id"]),
  runs: defineTable({
    userId: v.optional(v.id("users")),
    jobDescription: v.string(),
    jobTitle: v.optional(v.string()),
    employer: v.optional(v.string()),
    category: v.optional(v.string()),
    score: v.optional(v.number()),
    keySkills: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("waiting"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("failed")
      )
    ),
    questions: v.optional(
      v.array(
        v.object({
          category: v.string(),
          score: v.optional(v.number()),
          questions: v.array(
            v.object({
              question: v.string(),
              answer: v.optional(v.string()),
              feedback: v.optional(v.string()),
              usage: v.optional(v.number()),
              score: v.optional(v.number()),
              improvedAnswer: v.optional(v.string()),
              suggestions: v.optional(v.array(v.string())),
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
      )
    ),
  }),
})

import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// EXAMPLE: https://github.com/thomasballinger/convex-clerk-users-table/blob/main/convex/listMessages.ts

export default defineSchema({
  users: defineTable({
    // this is UserJSON from @clerk/backend
    clerkUser: v.any(),
    admin: v.optional(v.boolean()),
  }).index("by_clerk_id", ["clerkUser.id"]),
})

import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server"

import { ConvexError, v } from "convex/values"
import { Doc, Id } from "./_generated/dataModel"
import { UserJSON } from "@clerk/backend"
import { internal } from "./_generated/api"

/**
 * Whether the current user is fully logged in, including having their information
 * synced from Clerk via webhook.
 *
 * Like all Convex queries, errors on expired Clerk token.
 */
export const userLoginStatus = query(
  async (
    ctx
  ): Promise<
    | ["No JWT Token", null]
    | ["No Clerk User", null]
    | ["Logged In", Doc<"users">]
  > => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      // no JWT token, user hasn't completed login flow yet
      return ["No JWT Token", null]
    }
    const user = await getCurrentUser(ctx)
    if (user === null) {
      // If Clerk has not told us about this user we're still waiting for the
      // webhook notification.
      return ["No Clerk User", null]
    }
    return ["Logged In", user]
  }
)

/** The current user, containing user preferences and Clerk user info. */
export const currentUser = query((ctx: QueryCtx) => getCurrentUser(ctx))

/** Get user by Clerk use id (AKA "subject" on auth)  */
export const getUser = internalQuery({
  args: { subject: v.string() },
  async handler(ctx, args) {
    return await userQuery(ctx, args.subject)
  },
})

/** Create a new Clerk user or update existing Clerk user data. */
export const updateOrCreateUser = internalMutation({
  args: { clerkUser: v.any() }, // no runtime validation, trust Clerk
  async handler(ctx, { clerkUser }: { clerkUser: UserJSON }) {
    const userRecord = await userQuery(ctx, clerkUser.id)

    if (userRecord === null) {
      const newUser = await ctx.db.insert("users", {
        clerkUser,
        admin: false,
      })
    } else {
      await ctx.db.patch(userRecord._id, { clerkUser })
    }
  },
})

/** Delete a user by clerk user ID. */
export const deleteUser = internalMutation({
  args: { id: v.string() },
  async handler(ctx, { id }) {
    const userRecord = await userQuery(ctx, id)

    if (userRecord === null) {
      console.warn("can't delete user, does not exist", id)
    } else {
      await ctx.db.delete(userRecord._id)
    }
  },
})

/** Set the user preference of the color of their text. */
//   export const setColor = mutation({
//     args: { color: v.string() },
//     handler: async (ctx, { color }) => {
//       const user = await mustGetCurrentUser(ctx)
//       await ctx.db.patch(user._id, { color })
//     },
//   })

// Helpers

export async function userQuery(
  ctx: QueryCtx,
  clerkUserId: string
): Promise<(Omit<Doc<"users">, "clerkUser"> & { clerkUser: UserJSON }) | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkUser.id", clerkUserId))
    .unique()
}

export async function userById(
  ctx: QueryCtx,
  id: Id<"users">
): Promise<(Omit<Doc<"users">, "clerkUser"> & { clerkUser: UserJSON }) | null> {
  return await ctx.db.get(id)
}

async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    return null
  }
  return await userQuery(ctx, identity.subject)
}

export async function mustGetCurrentUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const userRecord = await getCurrentUser(ctx)
  if (!userRecord) throw new Error("Can't get current user")
  return userRecord
}

// Custom actions

// Create Clerk user manually from admin panel
// export const createUser = action({
//   args: {
//     first_name: v.string(),
//     last_name: v.string(),
//     email: v.string(),
//     telephone: v.string(),
//     restaurant_name: v.string(),
//     currency: v.string(),
//   },
//   handler: async (
//     ctx,
//     { first_name, last_name, email, telephone, restaurant_name, currency }
//   ) => {
//     const user = await ctx.auth.getUserIdentity()

//     // Is authenticated?
//     if (!user) {
//       throw new ConvexError("No user")
//     }
//     const convexUser = await ctx.runQuery(internal.users.getUser, {
//       subject: user.subject,
//     })

//     // Is Admin?
//     if (!convexUser || !convexUser.admin) {
//       throw new Error("No permissions to create user")
//     }

//     // Clerk API Post
//     const response: { id: string } = await ky
//       .post("https://api.clerk.com/v1/users", {
//         headers: {
//           Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
//         },
//         json: {
//           first_name: first_name,
//           last_name: last_name,
//           email_address: [email],
//           skip_password_requirement: true,
//         },
//       })
//       .json()

//     // Wait 3 seconds for the user to be created via webhook
//     await new Promise((resolve) => setTimeout(resolve, 5000))

//     // Get the user from Convex using Clerk ID
//     const newConvexUser = await ctx.runQuery(internal.users.getUser, {
//       subject: response.id,
//     })

//     // Check if user created
//     if (!newConvexUser) {
//       throw new ConvexError("Failed to create user")
//     }

//     // Update the user
//     // await ctx.runMutation(internal.users.updateNewUser, {
//     //   convexId: newConvexUser._id,
//     //   restaurant_name,
//     //   currency,
//     // })
//     return { status: "success" }
//   },
// })

// export const updateNewUser = internalMutation({
//   args: {
//     convexId: v.id("users"),
//     restaurant_name: v.string(),
//     currency: v.string(),
//   },
//   async handler(ctx, { convexId, restaurant_name, currency }) {
//     const restaurantId = await ctx.db.insert("stores", {
//       name: restaurant_name,
//       owner: convexId,
//       currency: currency,
//     })

//     for (const item of defaultCategories) {
//       await ctx.db.insert("menuCategories", {
//         name: item,
//         store: restaurantId,
//       })
//     }

//     await ctx.db.patch(convexId, { store: restaurantId })

//     // Handle restaurant ID mappings, not required for now as 1 user per restaurant for MVP.
//   },
// })

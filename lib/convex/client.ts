"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ConvexAuthProvider } from "@convex-dev/auth/react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export default convex

export { ConvexProvider, ConvexAuthProvider }

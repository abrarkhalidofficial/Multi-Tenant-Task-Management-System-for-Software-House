"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Navbar } from "@/components/layout/navbar"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { redirect, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface NewTaskPageProps {
  params: {
    id: string
  }
}

export default function NewTaskPage({ params }: NewTaskPageProps) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(api.users.getCurrentUser)
  const project = useQuery(api.projects.getProject, { projectId: params.id as Id<"projects"> })
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/auth")
    }
  }, [isAuthenticated, isLoading])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      router.push(`/projects/${params.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !currentUser || !project) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TaskDialog projectId={params.id as Id<"projects">} open={isOpen} onOpenChange={handleOpenChange} />
    </div>
  )
}

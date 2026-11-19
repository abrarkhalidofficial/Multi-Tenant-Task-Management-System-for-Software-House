"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Navbar } from "@/components/layout/navbar"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect } from "react"

interface BoardPageProps {
  params: {
    id: string
  }
}

export default function BoardPage({ params }: BoardPageProps) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(api.users.getCurrentUser)
  const project = useQuery(api.projects.getProject, { projectId: params.id as Id<"projects"> })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/auth")
    }
  }, [isAuthenticated, isLoading])

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
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${project._id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">Task Board</p>
          </div>
        </div>

        <KanbanBoard projectId={params.id as Id<"projects">} />
      </div>
    </div>
  )
}

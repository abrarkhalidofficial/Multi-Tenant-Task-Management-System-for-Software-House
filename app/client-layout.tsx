"use client";

import type React from "react";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-convex-auth";
import { useProjects } from "@/hooks/use-projects";

interface Project {
  id: string;
  name: string;
  color: string;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { projects } = useProjects();

  // Transform backend projects to match frontend structure
  const transformedProjects =
    projects?.map((project: any) => ({
      id: project.id.toString(),
      name: project.name,
      color: "bg-blue-200", // Default color, can be customized
    })) || [];

  const [localProjects, setLocalProjects] =
    useState<Project[]>(transformedProjects);

  const handleAddProject = (project: Omit<Project, "id">) => {
    const newProject = {
      ...project,
      id: Date.now().toString(),
    };
    setLocalProjects([...localProjects, newProject]);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout projects={localProjects} onAddProject={handleAddProject}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

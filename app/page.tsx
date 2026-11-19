import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TaskFlow</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            Multi-Tenant Task Management
            <span className="text-blue-600 block">for Software Houses</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-pretty">
            Organize projects, assign tasks, and manage teams with clear role-based permissions. Built for software
            development teams that need powerful project management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Multi-Tenant Architecture</CardTitle>
              <CardDescription>
                Complete data isolation for each software house with tenant-specific settings and branding.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Role-Based Permissions</CardTitle>
              <CardDescription>
                Admin, Project Manager, Team Lead, Member, and Client roles with granular access control.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Real-Time Collaboration</CardTitle>
              <CardDescription>
                Live updates, comments, @mentions, and notifications powered by Convex real-time sync.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>
                Track progress, completion rates, and team performance with comprehensive reports.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Kanban Boards</CardTitle>
              <CardDescription>
                Visual task management with drag-and-drop functionality and multiple view options.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Assign tasks, track workload, and manage team members across multiple projects.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to streamline your project management?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join software houses already using TaskFlow to deliver projects on time.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-12 py-4">
              Get Started Today
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 TaskFlow. Built with Next.js and Convex.</p>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, UserPlus, Mail, MoreHorizontal, Shield, UserCheck, UserX, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import type { User, UserRole } from "@/lib/types/database"

// Mock users data
const mockUsers: User[] = [
  {
    id: "1",
    tenantId: "tenant_1",
    email: "john@acme.com",
    name: "John Doe",
    role: "admin",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    lastLoginAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    tenantId: "tenant_1",
    email: "sarah@acme.com",
    name: "Sarah Wilson",
    role: "project_manager",
    isActive: true,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
    lastLoginAt: new Date("2024-01-19"),
  },
  {
    id: "3",
    tenantId: "tenant_1",
    email: "mike@acme.com",
    name: "Mike Johnson",
    role: "team_lead",
    isActive: true,
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
  },
]

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800",
  project_manager: "bg-blue-100 text-blue-800",
  team_lead: "bg-green-100 text-green-800",
  member: "bg-gray-100 text-gray-800",
  client: "bg-purple-100 text-purple-800",
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  team_lead: "Team Lead",
  member: "Member",
  client: "Client",
}

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("member")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)

  const handleInviteUser = async () => {
    // Mock invite logic
    const inviteLink = `https://taskflow.com/invite?token=abc123&email=${encodeURIComponent(inviteEmail)}`

    // Copy to clipboard
    await navigator.clipboard.writeText(inviteLink)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)

    setInviteEmail("")
    setIsInviteOpen(false)
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
  }

  const handleToggleActive = (userId: string) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, isActive: !user.isActive } : user)))
  }

  if (currentUser?.role !== "admin") {
    return (
      <Alert>
        <AlertDescription>You don't have permission to manage users.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your team members and their roles.</p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your workspace</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInviteUser} className="w-full">
                {copiedInvite ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Invitation Link Copied!
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Generate Invitation Link
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Team Members ({users.length})</CardTitle>
          </div>
          <CardDescription>Manage roles and permissions for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      {!user.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.lastLoginAt ? `Last active ${user.lastLoginAt.toLocaleDateString()}` : "Never logged in"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, "project_manager")}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Make Project Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, "member")}>
                        <Users className="w-4 h-4 mr-2" />
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(user.id)}>
                        {user.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

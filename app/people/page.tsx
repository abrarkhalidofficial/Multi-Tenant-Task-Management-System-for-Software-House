"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "@/hooks/use-users";
import {
  Search,
  Users,
  Grid3X3,
  List,
  Filter,
  Mail,
  Clock,
  Moon,
  ChevronDown,
} from "lucide-react";

type ViewMode = "list" | "grid" | "teams";

export default function PeoplePage() {
  const { users, isLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Filter users based on search query and selected team
  const filteredUsers =
    users?.filter((user: any) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = selectedTeam === "all" || user.team === selectedTeam;
      return matchesSearch && matchesTeam;
    }) || [];

  // Group users by teams for team view
  const usersByTeams = filteredUsers.reduce((acc: any, user: any) => {
    const teamId = user.team || "unassigned";
    if (!acc[teamId]) acc[teamId] = [];
    acc[teamId].push(user);
    return acc;
  }, {} as Record<string, any[]>);

  const PersonCard = ({
    user,
    compact = false,
  }: {
    user: NonNullable<ReturnType<typeof useUsers>["users"]>[0];
    compact?: boolean;
  }) => {
    // Check if user is currently working based on working hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = user.workingHours.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = user.workingHours.end.split(":").map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    const isWorking =
      currentTime >= startTime && currentTime <= endTime && user.isActive;

    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardContent className={`${compact ? "p-4" : "p-6"}`}>
          <div className="flex items-start space-x-4">
            <div className="relative">
              <Avatar className={`${compact ? "w-10 h-10" : "w-12 h-12"}`}>
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {!isWorking && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <Moon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3
                  className={`${
                    compact ? "text-sm" : "text-base"
                  } font-semibold text-gray-900 dark:text-white truncate`}
                >
                  {user.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                  {user.team && (
                    <Badge variant="secondary" className="text-xs">
                      {user.team}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-1 space-y-1">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>
                    {user.workingHours.start} - {user.workingHours.end}{" "}
                    {user.workingHours.timezone}
                  </span>
                  {isWorking ? (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      • Online
                    </span>
                  ) : (
                    <span className="ml-2 text-gray-400 dark:text-gray-500">
                      • Offline
                    </span>
                  )}
                </div>
                {user.lastSeenAt && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Last seen:{" "}
                      {new Date(user.lastSeenAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ListView = () => (
    <div className="space-y-4">
      {filteredUsers.map((user: any) => (
        <PersonCard key={user.id} user={user} />
      ))}
    </div>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredUsers.map((user: any) => (
        <PersonCard key={user.id} user={user} compact />
      ))}
    </div>
  );

  const TeamsView = () => (
    <div className="space-y-6">
      {Object.entries(usersByTeams).map(([teamId, teamUsers]) => {
        if (teamUsers.length === 0) return null;

        return (
          <div key={teamId}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {teamId === "unassigned" ? "Unassigned" : teamId}
                </h3>
                <Badge variant="outline">
                  {teamUsers.length} member{teamUsers.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamUsers.map((user: any) => (
                <PersonCard key={user.id} user={user} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            People
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team members and view their availability
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          People
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your team members and view their availability
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search people by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Team Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent"
              >
                <Filter className="w-4 h-4 mr-2" />
                {selectedTeam === "all"
                  ? "All Teams"
                  : selectedTeam === "unassigned"
                  ? "Unassigned"
                  : selectedTeam}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <DropdownMenuItem
                onClick={() => setSelectedTeam("all")}
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                All Teams
              </DropdownMenuItem>
              {Array.from(
                new Set(users?.map((u: any) => u.team).filter(Boolean))
              ).map((team: any) => (
                <DropdownMenuItem
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {team}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => setSelectedTeam("unassigned")}
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Unassigned
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-800">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "teams" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("teams")}
              className="h-8 px-3"
            >
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredUsers.length} of {users?.length || 0} people
          {selectedTeam !== "all" &&
            ` in ${
              selectedTeam === "unassigned" ? "Unassigned" : selectedTeam
            }`}
        </p>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No people found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <>
            {viewMode === "list" && <ListView />}
            {viewMode === "grid" && <GridView />}
            {viewMode === "teams" && <TeamsView />}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Users, CheckCircle2, Clock, Search } from "lucide-react";

export default function AdminDashboard() {
  const projects = useQuery(api.projects.list);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");

  const filteredProjects = useMemo(() => {
    if (!projects) return null;

    let filtered = projects;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.subjectName.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.subjectRole?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [projects, statusFilter, searchQuery]);

  if (projects === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  const totalSurveys = projects.reduce((sum, p) => sum + p.stats.total, 0);
  const completedSurveys = projects.reduce(
    (sum, p) => sum + p.stats.completed,
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your feedback projects
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/templates/new">
              <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="sm:inline">New Template</span>
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/projects/new">
              <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="sm:inline">New Project</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects by name, subject, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="flex-1 sm:flex-initial"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className="flex-1 sm:flex-initial"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "closed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("closed")}
                className="flex-1 sm:flex-initial"
              >
                Closed
              </Button>
            </div>
          </div>

          {/* Filter Results */}
          {filteredProjects && filteredProjects.length !== projects.length && (
            <p className="text-xs text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4 sm:pb-6">
            <div className="text-3xl sm:text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">Total Surveys</CardTitle>
            <Users className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4 sm:pb-6">
            <div className="text-3xl sm:text-2xl font-bold">{totalSurveys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">
              Completed Surveys
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4 sm:pb-6">
            <div className="text-3xl sm:text-2xl font-bold">{completedSurveys}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-xl sm:text-lg font-semibold mb-4">
          {searchQuery || statusFilter !== "all" ? "Filtered Projects" : "Recent Projects"}
        </h2>
        {!filteredProjects || filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              {projects.length === 0 ? (
                <>
                  <p className="text-base sm:text-sm text-muted-foreground mb-6 sm:mb-4">
                    No projects yet. Create your first feedback project!
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/admin/projects/new">
                      <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                      Create Project
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-base sm:text-sm text-muted-foreground">
                  No projects match your search criteria.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link key={project._id} href={`/admin/projects/${project._id}`}>
                <Card className="hover:border-primary/50 active:scale-[0.98] transition-all cursor-pointer h-full">
                  <CardHeader className="pb-3 sm:pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg sm:text-base line-clamp-1">
                        {project.subjectName}
                      </CardTitle>
                      <Badge
                        variant={
                          project.status === "active" ? "default" : "secondary"
                        }
                        className="shrink-0"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.subjectRole && (
                      <p className="text-base sm:text-sm text-muted-foreground line-clamp-1">
                        {project.subjectRole}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 sm:gap-1">
                        <CheckCircle2 className="h-4 w-4 sm:h-3 sm:w-3" />
                        {project.stats.completed} completed
                      </span>
                      {project.stats.inProgress > 0 && (
                        <span className="flex items-center gap-1.5 sm:gap-1">
                          <Clock className="h-4 w-4 sm:h-3 sm:w-3" />
                          {project.stats.inProgress} in progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-xs text-muted-foreground line-clamp-1">
                      {project.template?.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

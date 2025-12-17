"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle2, Clock, Search, ArrowRight } from "lucide-react";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialCard,
} from "@/components/editorial";

export default function AdminDashboard() {
  const router = useRouter();
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <EditorialSection spacing="lg">
          <div className="animate-pulse space-y-editorial-md">
            <div className="h-24 bg-ink/5 rounded w-2/3" />
            <RuledDivider />
            <div className="h-48 bg-ink/5 rounded" />
          </div>
        </EditorialSection>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <EditorialSection spacing="lg">
        <div className="space-y-6">
          <EditorialHeadline as="h1" size="lg">
            Dashboard
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft max-w-2xl">
            Manage your feedback projects, create new surveys, and analyze insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto bg-ink hover:bg-ink/90 text-paper">
              <Link href="/admin/projects/new">
                <Plus className="h-5 w-5 mr-2" />
                New Project
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-ink text-ink hover:bg-ink/5">
              <Link href="/admin/templates/new">
                <Plus className="h-5 w-5 mr-2" />
                New Template
              </Link>
            </Button>
          </div>
        </div>
      </EditorialSection>

      <RuledDivider />

      {/* Stats Section */}
      <EditorialSection spacing="md" ruled>
        <div className="space-y-editorial-xs">
          <EditorialLabel>Project Statistics</EditorialLabel>
          <div className="grid grid-cols-3 gap-editorial-xs">
            <div>
              <div className="text-headline-sm font-serif font-bold text-ink">
                {activeProjects.length}
              </div>
              <p className="text-body text-ink-soft mt-2">Active Projects</p>
            </div>
            <div>
              <div className="text-headline-sm font-serif font-bold text-ink">
                {totalSurveys}
              </div>
              <p className="text-body text-ink-soft mt-2">Total Surveys</p>
            </div>
            <div>
              <div className="text-headline-sm font-serif font-bold text-ink">
                {completedSurveys}
              </div>
              <p className="text-body text-ink-soft mt-2">Completed</p>
            </div>
          </div>
        </div>
      </EditorialSection>

      {/* Search and Filters */}
      <EditorialSection spacing="md" ruled>
        <div className="space-y-6">
          <EditorialLabel>Filter Projects</EditorialLabel>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft" />
              <Input
                type="search"
                placeholder="Search by name, subject, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-ink/20 focus:border-ink bg-paper text-ink"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="lg"
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "bg-ink text-paper" : "border-ink text-ink hover:bg-ink/5"}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="lg"
                onClick={() => setStatusFilter("active")}
                className={statusFilter === "active" ? "bg-ink text-paper" : "border-ink text-ink hover:bg-ink/5"}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "closed" ? "default" : "outline"}
                size="lg"
                onClick={() => setStatusFilter("closed")}
                className={statusFilter === "closed" ? "bg-ink text-paper" : "border-ink text-ink hover:bg-ink/5"}
              >
                Closed
              </Button>
            </div>
          </div>

          {/* Filter Results */}
          {filteredProjects && filteredProjects.length !== projects.length && (
            <p className="text-label text-ink-soft">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          )}
        </div>
      </EditorialSection>

      {/* Projects List */}
      <EditorialSection spacing="md" ruled>
        <div className="space-y-editorial-xs">
          <EditorialLabel>
            {searchQuery || statusFilter !== "all" ? "Filtered Projects" : "Recent Projects"}
          </EditorialLabel>

          {!filteredProjects || filteredProjects.length === 0 ? (
            <div className="py-editorial-md text-center border-t-3 border-ink/10 mt-8">
              {projects.length === 0 ? (
                <div className="space-y-6">
                  <p className="text-body-lg text-ink-soft max-w-md mx-auto">
                    No projects yet. Create your first feedback project to get started.
                  </p>
                  <Button asChild size="lg" className="bg-accent-red hover:bg-accent-red/90 text-paper">
                    <Link href="/admin/projects/new">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Project
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-body-lg text-ink-soft">
                  No projects match your search criteria.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-editorial-xs mt-8">
              {filteredProjects.map((project) => (
                <EditorialCard
                  key={project._id}
                  eyebrow={project.status.toUpperCase()}
                  headline={project.subjectName}
                  onClick={() => router.push(`/admin/projects/${project._id}`)}
                  description={
                    <>
                      {project.subjectRole && (
                        <span className="block text-ink font-medium mb-2">
                          {project.subjectRole}
                        </span>
                      )}
                      <span className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          {project.stats.completed} completed
                        </span>
                        {project.stats.inProgress > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {project.stats.inProgress} in progress
                          </span>
                        )}
                      </span>
                      {project.template?.name && (
                        <span className="block text-label mt-2 uppercase">
                          Template: {project.template.name}
                        </span>
                      )}
                    </>
                  }
                  action={
                    <span className="inline-flex items-center gap-2 text-ink font-medium">
                      View Project
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </EditorialSection>
    </div>
  );
}

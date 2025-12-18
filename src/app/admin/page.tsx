"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
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
      <EditorialSection spacing="lg">
        <div className="animate-pulse space-y-editorial-md">
          <div className="h-16 bg-ink/5 w-2/3" />
          <RuledDivider weight="thick" spacing="sm" />
          <div className="h-40 bg-ink/5" />
        </div>
      </EditorialSection>
    );
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  const totalSurveys = projects.reduce((sum, p) => sum + p.stats.total, 0);
  const completedSurveys = projects.reduce(
    (sum, p) => sum + p.stats.completed,
    0
  );

  return (
    <div>
      {/* Hero Section */}
      <EditorialSection spacing="lg">
        <div className="space-y-6">
          <EditorialLabel>Digg Admin</EditorialLabel>
          <EditorialHeadline as="h1" size="xl">
            Dashboard
          </EditorialHeadline>
          <p className="text-body-lg text-ink-soft max-w-2xl">
            Manage your feedback projects, create new surveys, and analyze insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-ink text-paper font-medium hover:bg-accent-red hover:border-accent-red transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Project
            </Link>
            <Link
              href="/admin/templates/new"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-ink bg-transparent text-ink font-medium hover:bg-ink hover:text-paper transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Template
            </Link>
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
              <div className="font-serif font-bold text-ink leading-none text-[56px] sm:text-[72px]">
                {activeProjects.length}
              </div>
              <p className="text-body text-ink-soft mt-2">Active Projects</p>
            </div>
            <div>
              <div className="font-serif font-bold text-ink leading-none text-[56px] sm:text-[72px]">
                {totalSurveys}
              </div>
              <p className="text-body text-ink-soft mt-2">Total Surveys</p>
            </div>
            <div>
              <div className="font-serif font-bold text-ink leading-none text-[56px] sm:text-[72px]">
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
                className="pl-12 h-14 text-base sm:text-base rounded-none border-3 border-ink bg-paper text-ink placeholder:text-ink-lighter focus-visible:border-accent-red focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(["all", "active", "closed"] as const).map((value) => {
                const label =
                  value === "all" ? "All" : value === "active" ? "Active" : "Closed";
                const active = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    aria-pressed={active}
                    className={
                      "min-h-[48px] px-6 py-3 border-3 font-medium transition-colors " +
                      (active
                        ? "border-ink bg-ink text-paper hover:bg-accent-red hover:border-accent-red"
                        : "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper")
                    }
                  >
                    {label}
                  </button>
                );
              })}
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
                  <Link
                    href="/admin/projects/new"
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 border-3 border-accent-red bg-accent-red text-paper font-medium hover:bg-[#B91C1C] hover:border-[#B91C1C] transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Project
                  </Link>
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
                    <div className="space-y-3">
                      {project.subjectRole && (
                        <p className="text-body text-ink">{project.subjectRole}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-body text-ink-soft">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {project.stats.completed} completed
                        </span>
                        {project.stats.inProgress > 0 && (
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {project.stats.inProgress} in progress
                          </span>
                        )}
                      </div>
                      {project.template?.name && (
                        <p className="text-label text-ink-soft uppercase tracking-label">
                          Template · {project.template.name}
                        </p>
                      )}
                    </div>
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

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Plus, CheckCircle2, Clock, Search, ArrowRight, X } from "lucide-react";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialDataRow,
  EditorialButton,
  EditorialInput,
  StatusBadge,
} from "@/components/editorial";

type SortOption = "newest" | "oldest" | "most_responses" | "alphabetical";

export default function AdminDashboard() {
  const router = useRouter();
  const projects = useQuery(api.projects.list);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b._creationTime ?? 0) - (a._creationTime ?? 0);
        case "oldest":
          return (a._creationTime ?? 0) - (b._creationTime ?? 0);
        case "most_responses":
          return b.stats.completed - a.stats.completed;
        case "alphabetical":
          return a.subjectName.localeCompare(b.subjectName);
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, statusFilter, searchQuery, sortBy]);

  // Calculate counts for filter tabs
  const statusCounts = useMemo(() => {
    if (!projects) return { all: 0, active: 0, closed: 0 };
    return {
      all: projects.length,
      active: projects.filter(p => p.status === "active").length,
      closed: projects.filter(p => p.status === "closed").length,
    };
  }, [projects]);

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
  }

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
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="space-y-6">
        <div className="space-y-6">
          <EditorialLabel>Digg Admin</EditorialLabel>
          <EditorialHeadline as="h1" size="xl">
            Dashboard
          </EditorialHeadline>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <p className="text-body-lg text-ink-soft max-w-2xl">
              Manage your feedback projects, create new surveys, and analyze insights.
            </p>
            <div className="flex gap-3">
              <EditorialButton variant="primary" asChild>
                <Link href="/admin/projects/new">
                  <Plus className="h-5 w-5" />
                  New Project
                </Link>
              </EditorialButton>
              <EditorialButton variant="outline" asChild>
                <Link href="/admin/templates">
                  <ArrowRight className="h-5 w-5" />
                  Templates
                </Link>
              </EditorialButton>
            </div>
          </div>
        </div>
      </section>

      <RuledDivider />

      {/* Stats Section */}
      <section className="space-y-6">
        <EditorialLabel>Project Statistics</EditorialLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <div className="font-serif font-bold text-ink leading-none text-[48px] sm:text-[64px]">
              {activeProjects.length}
            </div>
            <p className="text-body text-ink-soft mt-1">Active Projects</p>
          </div>
          <div>
            <div className="font-serif font-bold text-ink leading-none text-[48px] sm:text-[64px]">
              {totalSurveys}
            </div>
            <p className="text-body text-ink-soft mt-1">Total Surveys</p>
          </div>
          <div>
            <div className="font-serif font-bold text-ink leading-none text-[48px] sm:text-[64px]">
              {completedSurveys}
            </div>
            <p className="text-body text-ink-soft mt-1">Completed</p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="space-y-6">
        <div className="bg-paper border-y border-ink/10 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <EditorialLabel>Projects</EditorialLabel>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Status Filter with counts */}
              <div className="flex gap-2" role="group" aria-label="Filter by status">
                {(["all", "active", "closed"] as const).map((value) => {
                  const label = value === "all" ? "All" : value === "active" ? "Active" : "Closed";
                  const count = statusCounts[value];
                  const isActive = statusFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      aria-pressed={isActive}
                      className={`text-label font-medium px-3 py-1 transition-colors ${isActive ? "text-ink underline decoration-2 underline-offset-4" : "text-ink-soft hover:text-ink"}`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort projects"
                className="text-label font-medium px-3 py-1 border border-ink/20 bg-paper text-ink cursor-pointer focus:outline-none focus:border-ink"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_responses">Most Responses</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft pointer-events-none" />
              <EditorialInput
                type="search"
                placeholder="Search by name, subject, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
                aria-label="Search projects"
              />
            </div>
            {hasActiveFilters && (
              <EditorialButton
                type="button"
                variant="ghost"
                size="small"
                onClick={clearFilters}
                aria-label="Clear all filters"
              >
                <X className="h-4 w-4" />
                Clear
              </EditorialButton>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div>
          {!filteredProjects || filteredProjects.length === 0 ? (
            <div className="py-16 text-center">
              {projects.length === 0 ? (
                <div className="space-y-6">
                  <p className="text-body-lg text-ink-soft max-w-md mx-auto">
                    No projects yet. Create your first feedback project to get started.
                  </p>
                  <EditorialButton variant="primary" asChild>
                    <Link href="/admin/projects/new">
                      <Plus className="h-5 w-5" />
                      Create Your First Project
                    </Link>
                  </EditorialButton>
                </div>
              ) : (
                <p className="text-body-lg text-ink-soft">
                  No projects match your search criteria.
                </p>
              )}
            </div>
          ) : (
            <div>
              {filteredProjects.map((project) => {
                  const responseRate = project.stats.total > 0
                    ? `${project.stats.completed}/${project.stats.total}`
                    : "0";
                  return (
                    <EditorialDataRow
                      key={project._id}
                      onClick={() => router.push(`/admin/projects/${project._id}`)}
                      status={
                        <StatusBadge
                          status={project.status as "active" | "closed"}
                        />
                      }
                      title={project.subjectName}
                      meta={
                        <>
                          <span className="font-medium">{project.name}</span>
                          {project.subjectRole && <span className="text-ink-lighter">• {project.subjectRole}</span>}
                          {project.template?.name && (
                            <span className="text-ink-lighter">• {project.template.name}</span>
                          )}
                          <span className="text-ink-lighter flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> {responseRate} completed
                          </span>
                        </>
                      }
                      actions={
                        <ArrowRight className="h-5 w-5 text-ink-lighter group-hover:text-ink transition-colors" />
                      }
                    />
                  );
                })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Plus, CheckCircle2, Clock, Search, ArrowRight } from "lucide-react";
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLabel,
  RuledDivider,
  EditorialDataRow, // Changed from EditorialCard
  EditorialButton,
  EditorialInput,
  StatusBadge,
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
            <div className="flex flex-col sm:flex-row gap-4">
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
                      className={`text-label font-medium px-3 py-1 transition-colors ${active ? "text-ink underline decoration-2 underline-offset-4" : "text-ink-soft hover:text-ink"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft pointer-events-none" />
            <EditorialInput
              type="search"
              placeholder="Search by name, subject, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
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
              {filteredProjects.map((project) => (
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
                      {project.subjectRole && <span>{project.subjectRole}</span>}
                      {project.template?.name && (
                        <span className="text-ink-lighter">• {project.template.name}</span>
                      )}
                      <span className="text-ink-lighter flex items-center gap-1 ml-2">
                        <CheckCircle2 className="h-4 w-4" /> {project.stats.completed}
                      </span>
                    </>
                  }
                  actions={
                    <ArrowRight className="h-5 w-5 text-ink-lighter group-hover:text-ink transition-colors" />
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

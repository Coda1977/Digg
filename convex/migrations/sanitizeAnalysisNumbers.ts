/**
 * Migration: Sanitize corrupt numbers in analysis data
 *
 * This migration finds and fixes corrupt numeric values (like -9.44e21) in:
 * - analysis.strengths[].frequency
 * - analysis.coverage.totalInterviews
 * - analysis.coverage.breakdown values
 * - segmentedAnalysis[].strengths[].frequency
 * - segmentedAnalysis[].basedOnSurveyCount
 *
 * Run with: npx convex run migrations/sanitizeAnalysisNumbers:sanitizeAllAnalysis
 */

import { internalMutation } from "../_generated/server";

// Sanitization helpers - same logic as in projects.ts
function isValidFrequency(val: number | undefined): boolean {
  if (val === undefined) return true; // undefined is valid
  return Number.isFinite(val) && val >= 1 && val <= 100;
}

function isValidCount(val: number): boolean {
  return Number.isFinite(val) && val >= 0 && val <= 1000;
}

export const sanitizeAllAnalysis = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    let processed = 0;
    let fixed = 0;
    const details: string[] = [];

    for (const project of projects) {
      processed++;

      if (!project.analysis) continue;

      let needsFix = false;

      // Deep clone the analysis to modify
      const sanitized = JSON.parse(JSON.stringify(project.analysis)) as typeof project.analysis;

      // Check and fix strengths frequency
      if (sanitized.strengths) {
        sanitized.strengths = sanitized.strengths.map(
          (s: { point: string; quote?: string; frequency?: number }) => {
            if (s.frequency !== undefined && !isValidFrequency(s.frequency)) {
              details.push(
                `Project ${project._id}: Fixed strength frequency ${s.frequency}`
              );
              needsFix = true;
              return { ...s, frequency: undefined };
            }
            return s;
          }
        );
      }

      // Check and fix coverage.totalInterviews
      if (sanitized.coverage) {
        if (!isValidCount(sanitized.coverage.totalInterviews)) {
          details.push(
            `Project ${project._id}: Fixed totalInterviews ${sanitized.coverage.totalInterviews}`
          );
          needsFix = true;
          sanitized.coverage = {
            ...sanitized.coverage,
            totalInterviews: 0,
          };
        }

        // Check and fix breakdown values
        if (sanitized.coverage.breakdown) {
          const fixedBreakdown: Record<string, number> = {};
          for (const [key, value] of Object.entries(sanitized.coverage.breakdown)) {
            const numValue = value as number;
            if (!isValidCount(numValue)) {
              details.push(
                `Project ${project._id}: Fixed breakdown[${key}] ${numValue}`
              );
              needsFix = true;
              fixedBreakdown[key] = 0;
            } else {
              fixedBreakdown[key] = numValue;
            }
          }
          sanitized.coverage.breakdown = fixedBreakdown;
        }
      }

      // Check and fix segmented analysis
      if (project.segmentedAnalysis) {
        const sanitizedSegments = project.segmentedAnalysis.map((segment) => {
          let segmentNeedsFix = false;
          const sanitizedSegment = { ...segment };

          // Fix strengths frequency
          if (sanitizedSegment.strengths) {
            sanitizedSegment.strengths = sanitizedSegment.strengths.map(
              (s: { point: string; quote?: string; frequency?: number }) => {
                if (s.frequency !== undefined && !isValidFrequency(s.frequency)) {
                  details.push(
                    `Project ${project._id} segment ${segment.relationshipType}: Fixed frequency ${s.frequency}`
                  );
                  segmentNeedsFix = true;
                  needsFix = true;
                  return { ...s, frequency: undefined };
                }
                return s;
              }
            );
          }

          // Fix basedOnSurveyCount
          if (!isValidCount(sanitizedSegment.basedOnSurveyCount)) {
            details.push(
              `Project ${project._id} segment ${segment.relationshipType}: Fixed basedOnSurveyCount ${sanitizedSegment.basedOnSurveyCount}`
            );
            segmentNeedsFix = true;
            needsFix = true;
            sanitizedSegment.basedOnSurveyCount = 0;
          }

          return sanitizedSegment;
        });

        if (needsFix) {
          await ctx.db.patch(project._id, {
            analysis: sanitized,
            segmentedAnalysis: sanitizedSegments,
          });
          fixed++;
        }
      } else if (needsFix) {
        await ctx.db.patch(project._id, { analysis: sanitized });
        fixed++;
      }
    }

    return {
      processed,
      fixed,
      details: details.slice(0, 50), // Limit output to first 50 fixes
      message:
        fixed > 0
          ? `Fixed ${fixed} projects with corrupt numbers`
          : "No corrupt numbers found",
    };
  },
});

/**
 * Dry run version - just reports what would be fixed without making changes
 */
export const dryRun = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    const issues: string[] = [];

    for (const project of projects) {
      if (!project.analysis) continue;

      // Check strengths frequency
      if (project.analysis.strengths) {
        for (const s of project.analysis.strengths) {
          if (s.frequency !== undefined && !isValidFrequency(s.frequency)) {
            issues.push(
              `Project ${project._id}: Invalid strength frequency: ${s.frequency}`
            );
          }
        }
      }

      // Check coverage
      if (project.analysis.coverage) {
        if (!isValidCount(project.analysis.coverage.totalInterviews)) {
          issues.push(
            `Project ${project._id}: Invalid totalInterviews: ${project.analysis.coverage.totalInterviews}`
          );
        }
        if (project.analysis.coverage.breakdown) {
          for (const [key, value] of Object.entries(
            project.analysis.coverage.breakdown
          )) {
            if (!isValidCount(value as number)) {
              issues.push(
                `Project ${project._id}: Invalid breakdown[${key}]: ${value}`
              );
            }
          }
        }
      }

      // Check segmented analysis
      if (project.segmentedAnalysis) {
        for (const segment of project.segmentedAnalysis) {
          if (segment.strengths) {
            for (const s of segment.strengths) {
              if (s.frequency !== undefined && !isValidFrequency(s.frequency)) {
                issues.push(
                  `Project ${project._id} segment ${segment.relationshipType}: Invalid frequency: ${s.frequency}`
                );
              }
            }
          }
          if (!isValidCount(segment.basedOnSurveyCount)) {
            issues.push(
              `Project ${project._id} segment ${segment.relationshipType}: Invalid basedOnSurveyCount: ${segment.basedOnSurveyCount}`
            );
          }
        }
      }
    }

    return {
      totalProjects: projects.length,
      issuesFound: issues.length,
      issues: issues.slice(0, 100), // Limit to first 100
      message:
        issues.length > 0
          ? `Found ${issues.length} issues that need fixing`
          : "No issues found - all data looks clean!",
    };
  },
});

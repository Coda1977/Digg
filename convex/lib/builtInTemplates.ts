import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const PERSONAL_360_PERSONA = `TEMPLATE: Personal 360 Feedback
Focus on getting specific, behavioral examples. When feedback is vague, drill down to see what the person actually did and how it impacted others.
Aim to collect both what they do exceptionally well and where they could grow.`;

const TEAM_PERSONA = `TEMPLATE: Team Feedback
You're understanding team dynamics and health. Pay attention to how team members interact, their processes, and collaboration patterns.
Balance exploring what the team does well with understanding obstacles and friction points.`;

const CROSS_FUNCTIONAL_PERSONA = `TEMPLATE: Cross-Functional Collaboration
You're assessing how well two teams or departments work together. Focus on communication patterns, handoffs, and where friction emerges.
Explore both what works well in the partnership and where collaboration breaks down.`;

const ORGANIZATIONAL_PERSONA = `TEMPLATE: Organizational Health
You're gauging the broader health and culture of the organization. Listen for patterns about how work gets done, how decisions are made, and how people feel.
Look for systemic issues and cultural signals in their responses.`;

type BuiltInTemplate = Pick<
  Doc<"templates">,
  | "type"
  | "name"
  | "description"
  | "questions"
  | "relationshipOptions"
  | "systemPromptTemplate"
>;

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: "Personal 360 Feedback",
    description:
      "Collect feedback about an individual from their colleagues, managers, and reports",
    type: "personal_360",
    questions: [
      {
        id: "strengths",
        text: "What does {{subjectName}} do really well?",
        collectMultiple: true,
        order: 0,
      },
      {
        id: "improvements",
        text: "How could {{subjectName}} improve?",
        collectMultiple: true,
        order: 1,
      },
    ],
    relationshipOptions: [
      { id: "manager", label: "Direct Manager" },
      { id: "peer", label: "Peer/Colleague" },
      { id: "report", label: "Direct Report" },
      { id: "other", label: "Other" },
    ],
    systemPromptTemplate: PERSONAL_360_PERSONA,
  },
  {
    name: "Team Feedback",
    description: "Understand how a team functions and collaborates internally",
    type: "team",
    questions: [
      {
        id: "teamwork",
        text: "How well does this team work together?",
        collectMultiple: false,
        order: 0,
      },
      {
        id: "strengths",
        text: "What's the team's biggest strength?",
        collectMultiple: true,
        order: 1,
      },
      {
        id: "obstacles",
        text: "What's holding the team back?",
        collectMultiple: true,
        order: 2,
      },
    ],
    relationshipOptions: [
      { id: "member", label: "Team Member" },
      { id: "leader", label: "Team Leader" },
      { id: "stakeholder", label: "Stakeholder" },
    ],
    systemPromptTemplate: TEAM_PERSONA,
  },
  {
    name: "Cross-Functional Collaboration",
    description: "Assess collaboration between two teams or departments",
    type: "cross_functional",
    questions: [
      {
        id: "effectiveness",
        text: "How effective is collaboration between the teams?",
        collectMultiple: false,
        order: 0,
      },
      {
        id: "works_well",
        text: "What works well in the partnership?",
        collectMultiple: true,
        order: 1,
      },
      {
        id: "friction",
        text: "What friction points exist?",
        collectMultiple: true,
        order: 2,
      },
      {
        id: "improvements",
        text: "What would improve the collaboration?",
        collectMultiple: true,
        order: 3,
      },
    ],
    relationshipOptions: [
      { id: "team_a", label: "Team A Member" },
      { id: "team_b", label: "Team B Member" },
      { id: "stakeholder", label: "Shared Stakeholder" },
    ],
    systemPromptTemplate: CROSS_FUNCTIONAL_PERSONA,
  },
  {
    name: "Organizational Survey",
    description: "Gauge overall organizational health and culture",
    type: "organizational",
    questions: [
      {
        id: "effectiveness",
        text: "How well does the organization function overall?",
        collectMultiple: false,
        order: 0,
      },
      {
        id: "works_well",
        text: "What works well about how the organization operates?",
        collectMultiple: true,
        order: 1,
      },
      {
        id: "improvements",
        text: "What needs to improve in the organization?",
        collectMultiple: true,
        order: 2,
      },
    ],
    relationshipOptions: [
      { id: "employee", label: "Employee" },
      { id: "manager", label: "Manager" },
      { id: "executive", label: "Executive" },
    ],
    systemPromptTemplate: ORGANIZATIONAL_PERSONA,
  },
];

export const BUILT_IN_TEMPLATE_TYPES = new Set<BuiltInTemplate["type"]>([
  "personal_360",
  "team",
  "cross_functional",
  "organizational",
]);

export function getBuiltInTemplateByType(type: BuiltInTemplate["type"]) {
  return BUILT_IN_TEMPLATES.find((template) => template.type === type);
}

export async function upsertBuiltInTemplates(ctx: MutationCtx) {
  const now = Date.now();
  const results = [];

  for (const template of BUILT_IN_TEMPLATES) {
    const existing = await ctx.db
      .query("templates")
      .withIndex("by_type", (q) => q.eq("type", template.type))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...template,
        isBuiltIn: true,
        updatedAt: now,
      });
      results.push({ type: template.type, action: "updated", id: existing._id });
    } else {
      const id = await ctx.db.insert("templates", {
        ...template,
        isBuiltIn: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ type: template.type, action: "inserted", id });
    }
  }

  return { updatedAt: now, results };
}

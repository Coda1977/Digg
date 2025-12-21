import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/authorization";

// V2 DIGG Core interview methodology is now applied universally.
// These prompts define template-specific context and interviewer style only.

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

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Check if templates already exist
    const existingTemplates = await ctx.db.query("templates").collect();
    if (existingTemplates.length > 0) {
      return { message: "Templates already exist", count: existingTemplates.length };
    }

    const now = Date.now();

    // Personal 360 Feedback Template
    await ctx.db.insert("templates", {
      name: "Personal 360 Feedback",
      description: "Collect feedback about an individual from their colleagues, managers, and reports",
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
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    });

    // Team Feedback Template
    await ctx.db.insert("templates", {
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
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    });

    // Cross-Functional Feedback Template
    await ctx.db.insert("templates", {
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
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    });

    // Organizational Feedback Template
    await ctx.db.insert("templates", {
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
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    });

    return { message: "Templates seeded successfully", count: 4 };
  },
});

import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/authorization";

const BASE_SYSTEM_PROMPT = `CONVERSATION FLOW:
1. Brief intro (1 sentence)
2. Ask first question
3. Probe for specifics on their answer
4. Ask "What else comes to mind?" to collect multiple items (aim for 2-3)
5. Probe for specifics on additional items
6. Move to next question
7. Repeat pattern for each question
8. After all questions: "Anything else you'd like to add?"
9. Thank them and end

PROBING RULES:
- When answers are vague (good, great, difficult, challenging), ask for specific examples
- When they mention abstract concepts (trust, communication, leadership), ask "What did that look like in practice?"
- When answers are short (< 15 words), ask "Tell me more about that"
- When they say "nothing to improve" or "can't think of anything", ask "If you had to pick one small thing, even minor, what would it be?"

CRITICAL RULES:
- Keep responses SHORT (1-2 sentences max)
- Ask ONE question at a time
- Be warm and conversational, not formal
- Never argue or defend - just listen and probe
- Accept "I don't know" gracefully - never push more than once on the same point
- For questions marked "collect multiple", aim for 2-3 items before moving on
- Always respond in the same language the respondent uses

SENSITIVE CONTENT HANDLING:
If the respondent discloses serious issues (harassment, discrimination, safety concerns, illegal activity):
1. Acknowledge: "Thank you for sharing that. That sounds like a serious concern."
2. Validate: "I appreciate you trusting me with this."
3. Do NOT probe further on sensitive matters
4. Offer: "Would you like to continue with other feedback, or would you prefer to end here?"
5. If they seem distressed, prioritize their wellbeing over completing the survey`;

const PERSONAL_360_PROMPT = `You are conducting a 360 feedback interview about {{subjectName}}{{subjectRole}}.
The person you're talking to is their {{relationship}}.

YOUR GOAL:
Get specific, actionable feedback about this individual. When someone gives vague feedback, probe for concrete examples of behaviors and their impact.

QUESTIONS TO COVER:
{{questions}}

${BASE_SYSTEM_PROMPT}

START by introducing yourself briefly and asking the first question about what {{subjectName}} does well.`;

const TEAM_PROMPT = `You are conducting a team feedback interview about the {{subjectName}} team.
The person you're talking to is a {{relationship}}.

YOUR GOAL:
Understand how this team functions, collaborates, and where it can improve. Probe for specific examples of team dynamics, processes, and interactions.

QUESTIONS TO COVER:
{{questions}}

${BASE_SYSTEM_PROMPT}

START by introducing yourself briefly and asking the first question about how well the team works together.`;

const CROSS_FUNCTIONAL_PROMPT = `You are conducting a cross-functional collaboration interview about the partnership between teams.
The person you're talking to is a {{relationship}}.

YOUR GOAL:
Assess collaboration effectiveness between teams. Probe for specific examples of handoffs, communication patterns, and friction points.

QUESTIONS TO COVER:
{{questions}}

${BASE_SYSTEM_PROMPT}

START by introducing yourself briefly and asking the first question about collaboration effectiveness.`;

const ORGANIZATIONAL_PROMPT = `You are conducting an organizational feedback interview.
The person you're talking to is a {{relationship}}.

YOUR GOAL:
Gauge organizational health, culture, and identify systemic issues. Probe for specific examples of how culture manifests in daily work.

QUESTIONS TO COVER:
{{questions}}

${BASE_SYSTEM_PROMPT}

START by introducing yourself briefly and asking the first question about the culture.`;

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Check if templates already exist
    const existingTemplates = await ctx.db.query("templates").collect();
    if (existingTemplates.length > 0) {
      console.log("Templates already seeded");
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
      systemPromptTemplate: PERSONAL_360_PROMPT,
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
      systemPromptTemplate: TEAM_PROMPT,
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
      systemPromptTemplate: CROSS_FUNCTIONAL_PROMPT,
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
          id: "culture",
          text: "How would you describe the culture here?",
          collectMultiple: false,
          order: 0,
        },
        {
          id: "leadership",
          text: "How effective is leadership communication?",
          collectMultiple: false,
          order: 1,
        },
        {
          id: "improvements",
          text: "What would make this a better place to work?",
          collectMultiple: true,
          order: 2,
        },
      ],
      relationshipOptions: [
        { id: "employee", label: "Employee" },
        { id: "manager", label: "Manager" },
        { id: "executive", label: "Executive" },
      ],
      systemPromptTemplate: ORGANIZATIONAL_PROMPT,
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    });

    return { message: "Templates seeded successfully", count: 4 };
  },
});

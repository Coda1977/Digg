import { describe, it, expect, vi } from "vitest";

vi.mock("../../../convex/lib/authorization", () => ({
  requireAdmin: vi.fn(async () => ({
    userId: "user_1",
    user: { _id: "user_1", email: "admin@example.com" },
  })),
}));

import { remove as removeSurvey } from "../../../convex/surveys";
import { remove as removeProject } from "../../../convex/projects";

type Row = { _id: string; [key: string]: any };
type Tables = {
  projects: Row[];
  surveys: Row[];
  messages: Row[];
};

class QueryBuilder {
  private filters: Array<{ field: string; value: unknown }> = [];

  constructor(private records: Row[]) {}

  withIndex(_index: string, callback: (q: { eq: (field: string, value: unknown) => any }) => void) {
    const builder = {
      eq: (field: string, value: unknown) => {
        this.filters.push({ field, value });
        return builder;
      },
    };
    callback(builder);
    return this;
  }

  collect() {
    return this.records.filter((record) =>
      this.filters.every((filter) => record[filter.field] === filter.value)
    );
  }
}

function createMockDb(seed: Partial<Tables>) {
  const tables: Tables = {
    projects: [...(seed.projects ?? [])],
    surveys: [...(seed.surveys ?? [])],
    messages: [...(seed.messages ?? [])],
  };

  function findTable(id: string) {
    return (Object.keys(tables) as Array<keyof Tables>).find((key) =>
      tables[key].some((row) => row._id === id)
    );
  }

  return {
    tables,
    query(table: keyof Tables) {
      return new QueryBuilder(tables[table]);
    },
    get(id: string) {
      const table = findTable(id);
      return table ? tables[table].find((row) => row._id === id) : null;
    },
    delete(id: string) {
      const table = findTable(id);
      if (!table) return;
      const index = tables[table].findIndex((row) => row._id === id);
      if (index >= 0) {
        tables[table].splice(index, 1);
      }
    },
  };
}

describe("Convex removal mutations", () => {
  it("surveys.remove deletes the survey and its messages", async () => {
    const surveyId = "survey_1";
    const otherSurveyId = "survey_2";
    const db = createMockDb({
      surveys: [
        { _id: surveyId, projectId: "project_1" },
        { _id: otherSurveyId, projectId: "project_1" },
      ],
      messages: [
        { _id: "message_1", surveyId },
        { _id: "message_2", surveyId },
        { _id: "message_3", surveyId: otherSurveyId },
      ],
    });

    await (removeSurvey as any)._handler({ db }, { id: surveyId });

    expect(db.tables.surveys.map((row) => row._id)).toEqual([otherSurveyId]);
    expect(db.tables.messages.map((row) => row._id)).toEqual(["message_3"]);
  });

  it("projects.remove deletes child surveys and messages", async () => {
    const projectId = "project_1";
    const otherProjectId = "project_2";
    const surveyA = "survey_a";
    const surveyB = "survey_b";
    const surveyC = "survey_c";

    const db = createMockDb({
      projects: [
        { _id: projectId, name: "Project A" },
        { _id: otherProjectId, name: "Project B" },
      ],
      surveys: [
        { _id: surveyA, projectId },
        { _id: surveyB, projectId },
        { _id: surveyC, projectId: otherProjectId },
      ],
      messages: [
        { _id: "message_a1", surveyId: surveyA },
        { _id: "message_a2", surveyId: surveyA },
        { _id: "message_b1", surveyId: surveyB },
        { _id: "message_c1", surveyId: surveyC },
      ],
    });

    await (removeProject as any)._handler({ db }, { id: projectId });

    expect(db.tables.projects.map((row) => row._id)).toEqual([otherProjectId]);
    expect(db.tables.surveys.map((row) => row._id)).toEqual([surveyC]);
    expect(db.tables.messages.map((row) => row._id)).toEqual(["message_c1"]);
  });
});

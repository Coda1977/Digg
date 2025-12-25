import type { z } from "zod";

import { errorResponseSchema, validateSchema } from "@/lib/schemas";

function extractApiError(body: unknown): string | null {
  try {
    return validateSchema(errorResponseSchema, body).error;
  } catch {
    return null;
  }
}

async function fetchJson<T>(
  url: string,
  init: RequestInit | undefined,
  schema: z.ZodSchema<T>
): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const apiError = extractApiError(body);
    throw new Error(apiError ?? `Request failed (${res.status})`);
  }

  return validateSchema(schema, body);
}

export async function postJson<T>(
  url: string,
  payload: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  return fetchJson(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    schema
  );
}


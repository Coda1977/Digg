const LEGACY_PLACEHOLDERS = [
  "{{questions}}",
  "{{subjectName}}",
  "{{subjectRole}}",
  "{{relationship}}",
];

export function findLegacyPlaceholders(systemPromptTemplate: string) {
  return LEGACY_PLACEHOLDERS.filter((placeholder) =>
    systemPromptTemplate.includes(placeholder)
  );
}

export function assertNoLegacyPlaceholders(systemPromptTemplate: string) {
  const found = findLegacyPlaceholders(systemPromptTemplate);
  if (found.length > 0) {
    throw new Error(
      `Legacy placeholders are no longer supported: ${found.join(", ")}`
    );
  }
}

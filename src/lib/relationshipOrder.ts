/**
 * Relationship ordering utility
 * Defines the hierarchy for displaying respondents in reports
 */

/**
 * Standard relationship order for displaying feedback
 * Manager → Peer → Direct Report → Other roles
 */
export const RELATIONSHIP_ORDER = [
  "manager",       // Direct Manager
  "peer",          // Peer/Colleague
  "report",        // Direct Report
  "leader",        // Team Leader
  "member",        // Team Member
  "stakeholder",   // Stakeholder
  "executive",     // Executive
  "employee",      // Employee
  "team_a",        // Team A Member
  "team_b",        // Team B Member
  "other",         // Other (always last)
];

/**
 * Get the sort order for a relationship ID
 * @param relationshipId The relationship ID to look up
 * @returns A number representing the sort order (lower = first)
 */
export function getRelationshipOrder(relationshipId: string): number {
  const index = RELATIONSHIP_ORDER.indexOf(relationshipId);
  // If not found, put at the end (after "other")
  return index === -1 ? RELATIONSHIP_ORDER.length : index;
}

/**
 * Sort items by their relationship property
 * @param items Array of items to sort
 * @param getRelationship Function to extract the relationship ID from each item
 * @returns Sorted array (does not mutate original)
 */
export function sortByRelationship<T>(
  items: T[],
  getRelationship: (item: T) => string | undefined
): T[] {
  return [...items].sort((a, b) => {
    const relA = getRelationship(a) ?? "other";
    const relB = getRelationship(b) ?? "other";
    return getRelationshipOrder(relA) - getRelationshipOrder(relB);
  });
}

/**
 * Group items by relationship
 * @param items Array of items to group
 * @param getRelationship Function to extract the relationship ID from each item
 * @returns Map of relationship ID to items in that group, sorted by relationship order
 */
export function groupByRelationship<T>(
  items: T[],
  getRelationship: (item: T) => string | undefined
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const rel = getRelationship(item) ?? "other";
    if (!groups.has(rel)) {
      groups.set(rel, []);
    }
    groups.get(rel)!.push(item);
  });

  // Sort the map by relationship order
  const sortedGroups = new Map<string, T[]>();
  const sortedKeys = Array.from(groups.keys()).sort(
    (a, b) => getRelationshipOrder(a) - getRelationshipOrder(b)
  );

  sortedKeys.forEach((key) => {
    sortedGroups.set(key, groups.get(key)!);
  });

  return sortedGroups;
}

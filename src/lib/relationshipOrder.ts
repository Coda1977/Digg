/**
 * Relationship ordering utility
 * Defines the hierarchy for displaying respondents in reports
 */

/**
 * Standard relationship order for displaying feedback
 * Manager → Peer → Direct Report → Other roles
 */
const RELATIONSHIP_ORDER = [
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
function getRelationshipOrder(relationshipId: string): number {
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


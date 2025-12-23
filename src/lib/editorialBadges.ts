/**
 * Utility functions for formatting labels.
 * Note: Status and sentiment badges have been consolidated into StatusBadge component.
 * @see @/components/editorial/StatusBadge
 */

export function formatEnumLabel(value: string) {
  return value.replace(/_/g, " ");
}

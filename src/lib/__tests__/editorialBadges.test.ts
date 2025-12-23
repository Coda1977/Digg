import { describe, it, expect } from 'vitest';
import { formatEnumLabel } from '../editorialBadges';

describe('formatEnumLabel', () => {
    it('converts underscores to spaces', () => {
        expect(formatEnumLabel('in_progress')).toBe('in progress');
    });

    it('handles values without underscores', () => {
        expect(formatEnumLabel('active')).toBe('active');
    });

    it('handles multiple underscores', () => {
        expect(formatEnumLabel('not_yet_started')).toBe('not yet started');
    });
});

// Note: statusBadgeClass and sentimentBadgeClass tests removed.
// Badge styling is now handled by the StatusBadge component.
// See: @/components/editorial/StatusBadge

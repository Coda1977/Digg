import { describe, it, expect } from 'vitest';
import {
    formatEnumLabel,
    statusBadgeClass,
    sentimentBadgeClass,
} from '../editorialBadges';

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

describe('statusBadgeClass', () => {
    it('returns completed style for completed status', () => {
        const result = statusBadgeClass('completed');
        expect(result).toContain('border-ink');
        expect(result).toContain('bg-ink');
        expect(result).toContain('text-paper');
    });

    it('returns active style for active status', () => {
        const result = statusBadgeClass('active');
        expect(result).toContain('border-accent-red');
        expect(result).toContain('bg-accent-red');
    });

    it('returns default style for unknown status', () => {
        const result = statusBadgeClass('unknown');
        expect(result).toContain('bg-paper');
        expect(result).toContain('text-ink');
    });
});

describe('sentimentBadgeClass', () => {
    it('returns negative style for negative sentiment', () => {
        const result = sentimentBadgeClass('negative');
        expect(result).toContain('border-accent-red');
        expect(result).toContain('text-accent-red');
    });

    it('returns positive style for positive sentiment', () => {
        const result = sentimentBadgeClass('positive');
        expect(result).toContain('bg-ink');
        expect(result).toContain('text-paper');
    });

    it('returns mixed/default style for mixed sentiment', () => {
        const result = sentimentBadgeClass('mixed');
        expect(result).toContain('border-ink');
        expect(result).toContain('text-ink');
    });
});

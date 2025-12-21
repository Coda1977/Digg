import { describe, it, expect } from 'vitest';
import { DIGG_INTERVIEWER_CORE } from '../../lib/diggCore';

describe('DIGG_INTERVIEWER_CORE', () => {
    it('is a non-empty string', () => {
        expect(typeof DIGG_INTERVIEWER_CORE).toBe('string');
        expect(DIGG_INTERVIEWER_CORE.length).toBeGreaterThan(100);
    });

    it('contains conversation flow instructions', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('CONVERSATION FLOW');
        expect(DIGG_INTERVIEWER_CORE).toContain('Brief intro');
    });

    it('contains probing rules', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('PROBING RULES');
        expect(DIGG_INTERVIEWER_CORE).toContain('specific examples');
    });

    it('contains critical rules', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('CRITICAL RULES');
        expect(DIGG_INTERVIEWER_CORE).toContain('Keep responses SHORT');
        expect(DIGG_INTERVIEWER_CORE).toContain('ONE question at a time');
    });

    it('contains sensitive content handling', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('SENSITIVE CONTENT');
        expect(DIGG_INTERVIEWER_CORE).toContain('harassment');
    });

    it('contains format requirements to prevent theatrical responses', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('FORMAT');
        expect(DIGG_INTERVIEWER_CORE).toContain('Stage directions');
        expect(DIGG_INTERVIEWER_CORE).toContain('*nods*');
    });

    it('emphasizes this is a real conversation, not a play', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('real conversation');
        expect(DIGG_INTERVIEWER_CORE).toContain('not a play');
    });
});

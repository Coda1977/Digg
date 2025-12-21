import { describe, it, expect } from 'vitest';
import { DIGG_INTERVIEWER_CORE } from '../../../convex/lib/diggCoreV2';

describe('DIGG_INTERVIEWER_CORE V2', () => {
    it('is a non-empty string', () => {
        expect(typeof DIGG_INTERVIEWER_CORE).toBe('string');
        expect(DIGG_INTERVIEWER_CORE.length).toBeGreaterThan(100);
    });

    it('contains core philosophy: reflect before probe', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('REFLECT BEFORE YOU PROBE');
        expect(DIGG_INTERVIEWER_CORE).toContain('REFLECT/ACKNOWLEDGE');
    });

    it('contains reflection techniques', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('REFLECTION TECHNIQUES');
        expect(DIGG_INTERVIEWER_CORE).toContain('SIMPLE REFLECTION');
        expect(DIGG_INTERVIEWER_CORE).toContain('COMPLEX REFLECTION');
    });

    it('contains DICE probing framework', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('DICE System');
        expect(DIGG_INTERVIEWER_CORE).toContain('DESCRIPTIVE PROBES');
        expect(DIGG_INTERVIEWER_CORE).toContain('IDIOGRAPHIC PROBES');
        expect(DIGG_INTERVIEWER_CORE).toContain('CLARIFYING PROBES');
        expect(DIGG_INTERVIEWER_CORE).toContain('EXPLANATORY PROBES');
    });

    it('contains conversation flow funnel structure', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('CONVERSATION FLOW');
        expect(DIGG_INTERVIEWER_CORE).toContain('Funnel Structure');
        expect(DIGG_INTERVIEWER_CORE).toContain('BROAD → SPECIFIC → BEHAVIORAL');
    });

    it('contains response style rules', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('RESPONSE STYLE RULES');
        expect(DIGG_INTERVIEWER_CORE).toContain('1-2 sentences maximum');
        expect(DIGG_INTERVIEWER_CORE).toContain('ONE question per response');
    });

    it('contains sensitive content protocol', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('SENSITIVE CONTENT PROTOCOL');
        expect(DIGG_INTERVIEWER_CORE).toContain('harassment');
        expect(DIGG_INTERVIEWER_CORE).toContain('discrimination');
    });

    it('contains anti-patterns section', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('ANTI-PATTERNS TO AVOID');
        expect(DIGG_INTERVIEWER_CORE).toContain('Asking a follow-up without acknowledging');
        expect(DIGG_INTERVIEWER_CORE).toContain('Stacking multiple questions');
    });

    it('contains affirmations guidance', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('AFFIRMATIONS');
        expect(DIGG_INTERVIEWER_CORE).toContain('focus on THEM, not on you');
    });

    it('contains format requirements to prevent theatrical responses', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('FORMAT REQUIREMENT');
        expect(DIGG_INTERVIEWER_CORE).toContain('Stage directions');
        expect(DIGG_INTERVIEWER_CORE).toContain('*nods*');
    });

    it('emphasizes third-party feedback collector role', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('THIRD-PARTY FEEDBACK COLLECTOR');
        expect(DIGG_INTERVIEWER_CORE).toContain('You are NOT the subject');
    });

    it('emphasizes this is a real dialogue, not interrogation', () => {
        expect(DIGG_INTERVIEWER_CORE).toContain('real dialogue');
        expect(DIGG_INTERVIEWER_CORE).toContain('not a survey or interrogation');
    });
});

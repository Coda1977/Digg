import { describe, it, expect } from 'vitest';
import {
    BUILT_IN_TEMPLATES,
    BUILT_IN_TEMPLATE_TYPES,
} from '../../../convex/lib/builtInTemplates';
import { findLegacyPlaceholders } from '../../../convex/lib/templateValidation';

describe('built-in templates', () => {
    it('defines four built-in templates', () => {
        expect(BUILT_IN_TEMPLATES).toHaveLength(4);
    });

    it('uses persona-only prompts', () => {
        for (const template of BUILT_IN_TEMPLATES) {
            expect(template.systemPromptTemplate).toMatch(/^TEMPLATE:/);
            expect(template.systemPromptTemplate).not.toContain('DIGG INTERVIEWER CORE');
            expect(findLegacyPlaceholders(template.systemPromptTemplate)).toHaveLength(0);
        }
    });

    it('covers all built-in template types', () => {
        const definedTypes = new Set(
            BUILT_IN_TEMPLATES.map((template) => template.type)
        );
        for (const type of BUILT_IN_TEMPLATE_TYPES) {
            expect(definedTypes.has(type)).toBe(true);
        }
    });
});

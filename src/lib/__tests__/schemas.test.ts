import { describe, it, expect } from 'vitest';
import {
    messageSchema,
    chatRequestSchema,
    summarizeRequestSchema,
    analyzeRequestSchema,
    validateSchema,
} from '../schemas';

describe('messageSchema', () => {
    it('accepts valid assistant message', () => {
        const result = messageSchema.safeParse({ role: 'assistant', content: 'Hello' });
        expect(result.success).toBe(true);
    });

    it('accepts valid user message', () => {
        const result = messageSchema.safeParse({ role: 'user', content: 'Hi there' });
        expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
        const result = messageSchema.safeParse({ role: 'system', content: 'Hello' });
        expect(result.success).toBe(false);
    });

    it('rejects empty content', () => {
        const result = messageSchema.safeParse({ role: 'user', content: '' });
        expect(result.success).toBe(false);
    });
});

describe('chatRequestSchema', () => {
    it('accepts valid chat request', () => {
        const result = chatRequestSchema.safeParse({
            uniqueId: 'abc123',
            messages: [{ role: 'user', content: 'Hello' }],
        });
        expect(result.success).toBe(true);
    });

    it('accepts chat request with optional prompt', () => {
        const result = chatRequestSchema.safeParse({
            uniqueId: 'abc123',
            messages: [],
            prompt: 'Start the conversation',
        });
        expect(result.success).toBe(true);
    });

    it('rejects missing uniqueId', () => {
        const result = chatRequestSchema.safeParse({
            messages: [],
        });
        expect(result.success).toBe(false);
    });
});

describe('summarizeRequestSchema', () => {
    it('accepts valid summarize request', () => {
        const result = summarizeRequestSchema.safeParse({
            subjectName: 'John Doe',
            messages: [{ role: 'user', content: 'He is great' }],
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty messages array', () => {
        const result = summarizeRequestSchema.safeParse({
            subjectName: 'John Doe',
            messages: [],
        });
        expect(result.success).toBe(false);
    });
});

describe('analyzeRequestSchema', () => {
    it('accepts valid analyze request', () => {
        const result = analyzeRequestSchema.safeParse({
            subjectName: 'Jane Smith',
            interviews: [{ transcript: 'The interview content' }],
        });
        expect(result.success).toBe(true);
    });

    it('rejects too many interviews', () => {
        const interviews = Array.from({ length: 51 }, (_, i) => ({
            transcript: `Interview ${i}`,
        }));
        const result = analyzeRequestSchema.safeParse({
            subjectName: 'Jane Smith',
            interviews,
        });
        expect(result.success).toBe(false);
    });
});

describe('validateSchema', () => {
    it('returns parsed data for valid input', () => {
        const data = validateSchema(messageSchema, { role: 'user', content: 'Test' });
        expect(data).toEqual({ role: 'user', content: 'Test' });
    });

    it('throws error for invalid input', () => {
        expect(() => validateSchema(messageSchema, { role: 'invalid', content: '' })).toThrow(
            'Validation failed'
        );
    });
});

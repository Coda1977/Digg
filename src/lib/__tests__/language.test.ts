import { describe, it, expect } from 'vitest';
import { containsHebrew, isPrimaryHebrew, getTextDirection, detectLanguageFromMessages } from '../language';

describe('Language Utilities', () => {
    describe('containsHebrew', () => {
        it('identifies Hebrew characters in text', () => {
            expect(containsHebrew('שלום')).toBe(true);
            expect(containsHebrew('Hello שלום')).toBe(true);
            expect(containsHebrew('Hello')).toBe(false);
            expect(containsHebrew('123')).toBe(false);
        });
    });

    describe('isPrimaryHebrew', () => {
        it('detects when Hebrew is the primary language (>30%)', () => {
            expect(isPrimaryHebrew('שלום עולם')).toBe(true);
            expect(isPrimaryHebrew('Hello שלום')).toBe(true); // "שלום" is 4 chars, "Hello" is 5. 4/9 > 0.3
            expect(isPrimaryHebrew('Hello world שלום')).toBe(false);
            expect(isPrimaryHebrew('')).toBe(false);
        });
    });

    describe('getTextDirection', () => {
        it('returns rtl for primarily Hebrew text', () => {
            expect(getTextDirection('שלום')).toBe('rtl');
            expect(getTextDirection('Hello שלום')).toBe('rtl');
        });

        it('returns ltr for primarily English/other text', () => {
            expect(getTextDirection('Hello')).toBe('ltr');
            expect(getTextDirection('123')).toBe('ltr');
        });
    });

    describe('detectLanguageFromMessages', () => {
        it('detects he from Hebrew message history', () => {
            const messages = [
                { content: 'Hello' },
                { content: 'מה נשמע?' }
            ];
            expect(detectLanguageFromMessages(messages)).toBe('he');
        });

        it('detects en from English message history', () => {
            const messages = [
                { content: 'Hello' },
                { content: 'How are you?' }
            ];
            expect(detectLanguageFromMessages(messages)).toBe('en');
        });

        it('defaults to en for empty history', () => {
            expect(detectLanguageFromMessages([])).toBe('en');
        });

        it('checks the last 3 messages', () => {
            const messages = [
                { content: 'שלום' },
                { content: 'What?' },
                { content: 'Hello' },
                { content: 'Hi' }
            ];
            // Last 3 are all English
            expect(detectLanguageFromMessages(messages)).toBe('en');
        });
    });
});

import { describe, it, expect } from 'vitest';
import { extractResponsesByQuestion } from '../responseExtraction';

describe('extractResponsesByQuestion - Rating Statistics', () => {
  const relationshipOptions = [
    { id: 'manager', label: 'Manager' },
    { id: 'peer', label: 'Peer' },
  ];

  const templateQuestions = [
    { id: 'q1', text: 'Text question', type: 'text' as const },
    { id: 'q2', text: 'Rating question', type: 'rating' as const, ratingScale: { max: 10 } },
  ];

  it('calculates average and distribution correctly', () => {
    const surveys = [
      {
        _id: 's1',
        respondentName: 'User 1',
        relationship: 'manager',
        messages: [
          { role: 'user' as const, content: '8', questionId: 'q2', questionText: 'Rating question', ratingValue: 8 },
        ],
      },
      {
        _id: 's2',
        respondentName: 'User 2',
        relationship: 'peer',
        messages: [
          { role: 'user' as const, content: '6', questionId: 'q2', questionText: 'Rating question', ratingValue: 6 },
        ],
      },
    ];

    const result = extractResponsesByQuestion(surveys, relationshipOptions, templateQuestions);
    const ratingQuestion = result.find(q => q.questionId === 'q2');

    expect(ratingQuestion?.ratingStats).toEqual({
      average: 7,
      distribution: { 6: 1, 8: 1 },
    });
  });

  it('handles duplicate rating values correctly', () => {
    const surveys = [
      {
        _id: 's1',
        respondentName: 'User 1',
        relationship: 'manager',
        messages: [
          { role: 'user' as const, content: '7', questionId: 'q2', questionText: 'Rating question', ratingValue: 7 },
        ],
      },
      {
        _id: 's2',
        respondentName: 'User 2',
        relationship: 'manager',
        messages: [
          { role: 'user' as const, content: '7', questionId: 'q2', questionText: 'Rating question', ratingValue: 7 },
        ],
      },
    ];

    const result = extractResponsesByQuestion(surveys, relationshipOptions, templateQuestions);
    const ratingQuestion = result.find(q => q.questionId === 'q2');

    expect(ratingQuestion?.ratingStats).toEqual({
      average: 7,
      distribution: { 7: 2 },
    });
  });

  it('does not calculate stats for text questions', () => {
    const surveys = [
      {
        _id: 's1',
        respondentName: 'User 1',
        relationship: 'manager',
        messages: [
          { role: 'user' as const, content: 'Text response', questionId: 'q1', questionText: 'Text question' },
        ],
      },
    ];

    const result = extractResponsesByQuestion(surveys, relationshipOptions, templateQuestions);
    const textQuestion = result.find(q => q.questionId === 'q1');

    expect(textQuestion?.ratingStats).toBeUndefined();
  });
});

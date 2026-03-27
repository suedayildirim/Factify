import { describe, expect, it } from 'vitest';
import { computeScore } from './analyze';

describe('computeScore', () => {
  it('returns higher score for low severity findings', () => {
    const score = computeScore({
      language: [{ title: 'x', explanation: 'x', severity: 0 }],
      logic: [{ title: 'x', explanation: 'x', severity: 0 }],
      context: [{ title: 'x', explanation: 'x', severity: 0 }],
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('returns lower score for high severity logic findings', () => {
    const score = computeScore({
      language: [],
      logic: [
        { title: 'x', explanation: 'x', severity: 3 },
        { title: 'y', explanation: 'y', severity: 3 },
        { title: 'z', explanation: 'z', severity: 3 },
      ],
      context: [],
    });
    expect(score).toBeLessThanOrEqual(60);
  });

  it('clamps between 0 and 100', () => {
    const score = computeScore({
      language: [{ title: 'x', explanation: 'x', severity: 3 }],
      logic: [{ title: 'x', explanation: 'x', severity: 3 }],
      context: [{ title: 'x', explanation: 'x', severity: 3 }],
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});


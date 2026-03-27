import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/analyze', () => {
  it('returns 400 for too short text', async () => {
    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'kısa' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBeTruthy();
  });

  it('returns structured response when Gemini returns valid JSON', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    const geminiPayload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  language: [{ title: 'Dil', explanation: 'Açıklama', severity: 1 }],
                  logic: [{ title: 'Mantık', explanation: 'Açıklama', severity: 2 }],
                  context: [{ title: 'Bağlam', explanation: 'Açıklama', severity: 1 }],
                }),
              },
            ],
          },
        },
      ],
    };

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(geminiPayload), { status: 200 });
    });
    // @ts-expect-error test override
    globalThis.fetch = fetchMock;

    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': '50' },
      body: JSON.stringify({ text: 'Bu metin yeterince uzun bir iddia örneğidir.' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(typeof data.score).toBe('number');
    expect(Array.isArray(data.language)).toBe(true);
    expect(Array.isArray(data.logic)).toBe(true);
    expect(Array.isArray(data.context)).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
  });
});


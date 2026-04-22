import { StudentInput, AIResponse } from '@/lib/types/ai';

/**
 * Fetches AI suggestions from the /api/ai endpoint
 */
export async function fetchAISuggestions(input: StudentInput): Promise<AIResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: AIResponse = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'Failed to fetch AI suggestions',
    };
  }

  return data;
}

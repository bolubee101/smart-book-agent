import { callLlmApi } from '../services/llmClient';
import { stripCodeBlock } from '../utils/cleanLLMResponse';

interface EnrichedBookData {
    summary: string;
    relevance_score: number;
}

export const enrichBook = async (title: string, description: string, theme: string): Promise<EnrichedBookData> => {
    const prompt = `
You are a helpful assistant.
Given the title and description of a book, do the following:
1. Generate a concise 1–2 sentence summary of the book.
2. Score how relevant the book is to the theme "${theme}" on a scale of 0–100.

Return your result strictly in the following JSON format:
{
  "summary": "...",
  "relevance_score": 87
}

Book Title: ${title}
Book Description: ${description}
`;

    const { content } = await callLlmApi([{ role: 'user', content: prompt }]);

    try {
        const clean = stripCodeBlock(content);
        const parsed = JSON.parse(clean);
        return {
            summary: parsed.summary,
            relevance_score: parsed.relevance_score
        };
    } catch (err) {
        console.error('Failed to parse enrichment response:', err, '\nRaw reply:', content);
        return {
            summary: 'N/A',
            relevance_score: 0
        };
    }
};

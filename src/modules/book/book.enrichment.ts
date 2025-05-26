import { callLlmApi, LlmMessage } from "../../services/llmClient";
import { Book } from "../../types/book";
import { stripCodeBlock } from "../../utils/helpers";

interface EnrichedBookData {
    summary: string;
    relevance_score: number;
    author: string;
}

export const enrichBook = async (
    title: string,
    description: string,
    theme: string
): Promise<EnrichedBookData> => {
    const messages: LlmMessage[] = [
        {
            role: 'system',
            content:
                'You are a helpful assistant that summarizes books, evaluates their relevance to a theme, and extracts the author name if it is mentioned in the description.'
        },
        {
            role: 'user',
            content: `
                Book Title: ${title}
                Book Description: ${description}
                Theme: ${theme}

                Respond strictly in the following JSON format:
                {
                "summary": "Brief summary of the book",
                "relevance_score": 0-100,
                "author": "Author Name or 'Unknown'"
                }
                    `.trim()
        }
    ];

    try {
        const { content } = await callLlmApi(messages);
        const clean = stripCodeBlock(content);
        const parsed = JSON.parse(clean);

        return {
            summary: parsed.summary || 'N/A',
            relevance_score: typeof parsed.relevance_score === 'number' ? parsed.relevance_score : 0,
            author: parsed.author || 'Unknown'
        };
    } catch (err) {
        console.error('Failed to parse enrichment response:', err);
        return {
            summary: 'N/A',
            relevance_score: 0,
            author: 'Unknown'
        };
    }
};

export const computeBookMetrics = (book: Book): Book => {
    const {
        original_price,
        current_price,
        relevance_score = 0
    } = book;

    const enrichedBook: Book = { ...book };

    if (original_price && original_price > current_price) {
        enrichedBook.discount_amount = parseFloat((original_price - current_price).toFixed(2));
        enrichedBook.discount_percentage = parseFloat(((enrichedBook.discount_amount / original_price) * 100).toFixed(2));
    }

    if (current_price > 0 && relevance_score > 0) {
        enrichedBook.value_score = parseFloat((relevance_score / current_price).toFixed(2));
    } else {
        enrichedBook.value_score = 0;
    }

    return {
        title: book.title,
        author: book.author,
        current_price: book.current_price,
        original_price: book.original_price,
        description: book.description,
        product_url: book.product_url,
        summary: book.summary,
        relevance_score: book.relevance_score,
        discount_amount: enrichedBook.discount_amount,
        discount_percentage: enrichedBook.discount_percentage,
        value_score: enrichedBook.value_score
    };
};
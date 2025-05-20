import { Book } from '../types/book';

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
    }

    return enrichedBook;
};

import { scrapeBooks } from './scraper/bookScraper';
import { enrichBook } from './llm/enrichmentHelper';
import { computeBookMetrics } from './utils/bookCalculations';
(async () => {


  const theme = 'cs lewis';
  const books = await scrapeBooks(theme);

  const enrichedBooks = [];

  for (const book of books) {
    const enrichment = await enrichBook(book.title, book.description, theme);

    const enriched = {
      ...book,
      ...enrichment
    };

    const final = computeBookMetrics(enriched);
    enrichedBooks.push(final);
  }

  console.log(enrichedBooks);

})();

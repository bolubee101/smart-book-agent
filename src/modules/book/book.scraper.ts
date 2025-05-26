import { chromium, Page } from 'playwright';
import { Book } from '../../types/book';
import { redisConnection } from '../../configs/redis';
import { sendToMakeWebhook } from '../../services/webHookSender';
import { computeBookMetrics, enrichBook } from './book.enrichment';

const getThemeCacheKey = (theme: string) => `cache:theme:${theme.toLowerCase().replace(/\s+/g, '_')}`;

export const scrapeBooks = async (theme: string): Promise<Book[]> => {
    const cacheKey = getThemeCacheKey(theme);

    const cached = await redisConnection.get(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
                console.log(`Cache Hit — Skipping scrape for theme "${theme}"`);
                return parsed as Book[];
            }
        } catch (err) {
            console.warn(`[Cache Error] Could not parse cached data for "${theme}"`);
        }
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const baseUrl = 'https://bookdp.com.au';
    const searchQuery = theme.replace(/\s+/g, '+');
    const results: Book[] = [];

    try {
        const searchUrls = [1, 2].map((pageNumber) =>
            pageNumber === 1
                ? `${baseUrl}/?s=${searchQuery}`
                : `${baseUrl}/page/${pageNumber}/?s=${searchQuery}`
        );

        const searchPageResults = await Promise.all(
            searchUrls.map(async (url) => {
                const page = await context.newPage();
                await page.goto(url, { waitUntil: 'domcontentloaded' });

                const productUrls: string[] = await page.$$eval(
                    'main#main.site-main article a.post-thumbnail',
                    (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href)
                );

                await page.close();
                return productUrls;
            })
        );

        const allProductUrls = searchPageResults.flat();

        if (allProductUrls.length === 0) {
            console.warn(`No results found for theme "${theme}"`);
            return [];
        }

        const bookPromises = allProductUrls.map(async (url) => {
            const productPage = await context.newPage();
            const book = await scrapeProductPage(productPage, url);
            await productPage.close();
            return book;
        });

        const books = await Promise.all(bookPromises);
        results.push(...(books.filter(Boolean) as Book[]));


        await redisConnection.set(cacheKey, JSON.stringify(results), 'EX', 60 * 60);
    } catch (err) {
        console.error(`Error during scrape for theme "${theme}":`, err);
    } finally {
        await browser.close();
    }

    return results;
};

const scrapeProductPage = async (page: Page, url: string): Promise<Book | null> => {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            const title = await page.$eval(
                'h1.product_title',
                (el: HTMLElement) => el.textContent?.trim() || ''
            );

            const description = await page.$eval(
                '.woocommerce-tabs--description-content p',
                (el: HTMLElement) => el.textContent?.trim() || ''
            );

            const currentPriceStr = await page.$eval(
                'p.price ins .woocommerce-Price-amount bdi',
                (el: HTMLElement) => el.textContent?.replace(/[^\d.]/g, '') || '0'
            );

            const originalPriceStr = await page.$eval(
                'p.price del .woocommerce-Price-amount bdi',
                (el: HTMLElement) => el.textContent?.replace(/[^\d.]/g, '')
            ).catch(() => undefined);

            const current_price = parseFloat(currentPriceStr);
            const original_price = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

            return {
                title,
                current_price,
                original_price,
                description,
                product_url: url,
            };
        } catch (err) {
            attempts++;
            console.warn(`Attempt ${attempts} failed for ${url}`);
            if (attempts >= maxRetries) {
                console.error(`Failed to scrape ${url} after ${maxRetries} attempts`);
                return null;
            }
        }
    }

    return null;
};

export const scrapeAndEnrich = async (theme: string, jobId: string) => {
    try {
        const books = await scrapeBooks(theme);
        const enrichedBooks: any[] = [];

        const batchSize = 2; // Adjust batch size as needed;
        for (let i = 0; i < books.length; i += batchSize) {
            const batch = books.slice(i, i + batchSize);
            const enrichedBatch = await Promise.all(
                batch.map(async (book) => {
                    const enriched = await enrichBook(book.title, book.description, theme);
                    const combined = computeBookMetrics({ ...book, ...enriched });
                    return combined;
                })
            );

            enrichedBooks.push(...enrichedBatch);
        }

        sendToMakeWebhook({
            books: enrichedBooks,
        })
        await redisConnection.set(`job:${jobId}:status`, 'completed');
        await redisConnection.set(`job:${jobId}:result`, JSON.stringify(enrichedBooks));
    } catch (error) {
        console.log(error)
        await redisConnection.set(`job:${jobId}:status`, 'failed');
        await redisConnection.set(`job:${jobId}:error`, (error as Error).message);
    }
};
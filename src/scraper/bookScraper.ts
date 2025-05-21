import { chromium, Page } from 'playwright';
import { Book } from '../types/book';

export const scrapeBooks = async (theme: string): Promise<Book[]> => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const baseUrl = 'https://bookdp.com.au';
    const searchQuery = theme.replace(/\s+/g, '+');
    const results: Book[] = [];

    try {
        for (let pageNumber = 1; pageNumber <= 2; pageNumber++) {
            const searchUrl =
                pageNumber === 1
                    ? `${baseUrl}/?s=${searchQuery}`
                    : `${baseUrl}/page/${pageNumber}/?s=${searchQuery}`;

            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            const productUrls: string[] = await page.$$eval(
                'main#main.site-main article a.post-thumbnail',
                (anchors) =>
                    anchors.map((a) => (a as HTMLAnchorElement).href)
            );

            if (productUrls.length === 0) break;

            for (const productUrl of productUrls) {
                const book = await scrapeProductPage(page, productUrl);
                if (book) results.push(book);
            }
        }
    } finally {
        await browser.close();
    }

    return results;
};

const scrapeProductPage = async (page: Page, url: string): Promise<Book | null> => {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

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
            (el: HTMLElement) => el.textContent?.replace(/[^\d.]/g, ''),
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
        console.error(`Failed to scrape ${url}`, err);
        return null;
    }
};

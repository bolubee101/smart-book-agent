# Smart Book Discovery Agent

Smart Book Discovery Agent is a TypeScript-based automation tool that scrapes book data from BookDP.com.au based on a search theme, enriches it using a Large Language Model (LLM), performs value-based calculations, and sends results to a productivity tool via Make.com.

## Project Overview

- Scrapes the first two pages of BookDP.com.au search results based on a keyword
- Enriches each book with an AI-generated summary and relevance score
- Calculates:
  - Discount amount and percentage
  - Value score (relevance score / current price)
- Uses a Redis-backed job queue (via BullMQ) to process scraping tasks
- Limits scraping concurrency to 5 (configurable in Redis)
- Provides a RESTful API for job submission and retrieval
- Sends results to Make.com using a webhook

---

## Documentation
[Postman Documentation](https://documenter.getpostman.com/view/45145690/2sB2qZFNbX)

## Instructions for Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/bolubee101/smart-book-agent.git
cd smart-book-agent
```

### 2. Set up the environment file
```env
PORT=3000
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-url
REDIS_HOST=redis
REDIS_PORT=6379
```

> Optional Redis setting (for controlling concurrency):
```bash
redis-cli set settings:scrape_queue_concurrency 5
```

### 3. Start everything using Docker Compose

```bash
docker compose up --build
```

This spins up:
- `smart-book-agent` (Node.js + TypeScript backend with Playwright)
- `redis` (as job tracker and queue backend)

> Note: The Dockerfile automatically installs Playwright and required browser dependencies using `npx playwright install --with-deps`.


## Architecture and Approach

### System diagram
![system architecture jpeg](https://github.com/user-attachments/assets/b19d20b0-bf54-43ab-8ca0-b0cc32898484)

### System Flow

#### baseurl
`localhost:3000/api`

The Smart Book Discovery Agent is architected around four core functional domains:

1. Scraping
Uses Playwright to search BookDP.com.au for the specified theme, navigating and scraping the first two pages of results. Each product page is opened in its own browser tab for parallel scraping. A single browser context is reused to minimize overhead.

2. Enrichment
For every scraped book, a Large Language Model (OpenAI or DeepSeek) generates a concise summary, assigns a relevance score (0–100), and attempts to infer the book's author from the description. Prompting uses system and user roles for clarity and structure. The model provider is configurable via the LLM_PROVIDER environment variable.

3. Computation
Computes discount amount, discount percentage (if applicable), and a value_score based on relevance and price.

4. Delivery
Once enrichment and computation are complete, the full result is:

- Stored in Redis (job:{id}:result)
- POSTed to a configured Make.com webhook for automation (e.g., to Google Sheets)

#### End-to-End Execution Flow
1. POST /scrape
Accepts a theme from the client and returns a jobId. The theme is validated and added to a queue for processing.

2. Job Queuing (BullMQ)
The job is enqueued using BullMQ, with Redis serving as the backing store. Concurrency is managed by a Redis-configurable setting (settings:scrape_queue_concurrency) which defaults to 5. This prevents overwhelming the server with simultaneous browser instances.

3. Scraping with Playwright
A pool of worker processes scrape the first two pages of search results from BookDP. Book links are extracted and scraped concurrently across multiple tabs.

4. AI Enrichment (OpenAI / DeepSeek)
Each book is enriched with AI-generated content: a short summary, relevance score, and inferred author(if available).

5. Metric Calculation
The system computes discount information and a value score for each book.

6. Data Storage & Delivery
Once all books are processed:

- The result is cached in Redis for quick access
- If a MAKE_WEBHOOK_URL is configured, the full enriched dataset is sent to the webhook

7. Client Polling

- GET /status/:jobId returns the current job status: processing, completed, or failed
- GET /results/:jobId returns the final enriched dataset (if complete), or an appropriate error message

#### System Optimizations
- Retries and Timeout
Each product page scraping attempt is retried up to 3 times in case of failure or timeout (15 seconds). Failures are logged per page but do not stop the entire job.

- Theme Caching
Themes are cached for 1 hour using Redis (cache:theme:<slug>), avoiding redundant scraping on repeated queries.


## Make.com Integration

This project integrates with [Make.com](https://make.com) via a custom webhook.

1. Go to **Make.com** and create a new scenario.
2. Add the First Module – Webhook. 
 ![Screenshot (33)](https://github.com/user-attachments/assets/e0df9c73-f46d-4516-84fb-2bdb17464374)
   - When creating the webhook, there is an option to specify expected structure. The generate button
     ![Screenshot (36)](https://github.com/user-attachments/assets/c33e821b-ac48-4c69-926d-3880fcfcde68)     
   - Use the sample data below when prompted:

```json
{
  "books": [
    {
      "title": "C.S. Lewis’ Little Book Of Wisdom: Meditations on Faith, Life, Love and Literature",
      "author": "C.S Lewis",
      "current_price": 13.08,
      "original_price": 17.56,
      "description": "C. S. Lewis’ Little Book of Wisdom offers more than 300 bite-size nuggets of inspiration and wisdom...",
      "product_url": "https://bookdp.com.au/products/c-s-lewis-little-book-wisdom-0008282471/",
      "summary": "C.S. Lewis’ Little Book of Wisdom is a collection of over 300 quotes and insights...",
      "relevance_score": 95,
      "discount_amount": 4.48,
      "discount_percentage": 25.51,
      "value_score": 7.26
    }
  ]
}
```

3. Copy the generated webhook URL and add it to your `.env`:
   ![Screenshot (38)](https://github.com/user-attachments/assets/e8d5c375-1210-4657-a142-c3e241cdb750)
```env
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-url
```

4. Add a second step (Google Sheets) to receive the data.
   - Preferably use the “bulk add rows” option to handle arrays.
   - Select or create a Google Sheets connection
   - Use the ID Finder to choose your spreadsheet
   - Select the sheet, column range, and the rows. For rows, select the mapping you created for the webhook to directly map the output of the webhook to the sheet.
     ![Screenshot (40)](https://github.com/user-attachments/assets/062c008f-9a24-4b22-9b7b-6d43d13f2907)
     ![Screenshot (41)](https://github.com/user-attachments/assets/098be35f-e04b-46e9-acbf-d4efcf86dcf0)
     ![image](https://github.com/user-attachments/assets/0c91c3f5-970c-46e9-9f48-bd347869fa8f)


5. Activate your scenario and call the scrape API — results will be delivered automatically on completion.

## Assumptions and Limitations

- Only the first two pages of BookDP results are scraped
- Book author information is not available directly; inferred via AI
- AI-generated JSON must be clean and parseable (handled defensively)
- Redis is used for job tracking; durable across restarts
- Redis TTL is fixed (1 hour) for both jobs and cache.
- Concurrency is configurable via Redis key `settings:scrape_queue_concurrency`
- The spreadsheet must already exist with the expected structure

### Screenshots
- Scrapped data
![Scraped data1](https://github.com/user-attachments/assets/60700582-d43e-452d-893e-8f0bec482887)
![Scraped data2](https://github.com/user-attachments/assets/df5a5f4a-406e-4e1a-b8c5-d580a6bb90af)

- AI summary and score
![AI summary and score](https://github.com/user-attachments/assets/656e326b-2df0-4493-ad12-daa4cd835a69)

- Make config
![Make config1](https://github.com/user-attachments/assets/71da6734-97bc-4aed-9532-54e803a312cb)

- Make Webhook config
![Webhook config](https://github.com/user-attachments/assets/fbfe5804-6085-4254-bc5e-b2052fe5b3ef)
![Webhook data structure](https://github.com/user-attachments/assets/b86a8764-1766-4a7d-9ae8-2cde43da7b89)

- Make Google sheet config
![Google sheet config](https://github.com/user-attachments/assets/6b419ae1-3306-4c93-ba1f-20fe715ac7c0)

- Google sheet result
<img width="791" alt="Google sheet webhook result" src="https://github.com/user-attachments/assets/22c0a3de-d2ba-4a8f-85c3-087cc837710a" />

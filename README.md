# Smart Book Discovery Agent

Smart Book Discovery Agent is a TypeScript-based automation tool that scrapes book data from BookDP.com.au based on a search theme, enriches it using a Large Language Model (LLM), performs value-based calculations, and sends results to a productivity tool via Make.com.

## Project Overview

- Scrapes the first two pages of BookDP.com.au search results based on a keyword
- Enriches each book with an AI-generated summary and relevance score
- Calculates:
  - Discount amount and percentage
  - Value score (relevance score / current price)
- Uses a Redis-backed job queue (via BullMQ) to process scraping tasks
- Limits scraping concurrency to 10 (configurable in Redis)
- Provides a RESTful API for job submission and retrieval
- Sends results to Make.com using a webhook

---

## Instructions for Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/your-username/smart-book-agent.git
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
redis-cli set settings:scrape_queue_concurrency 10
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
![system diagram png](https://github.com/user-attachments/assets/37081662-f313-4129-87fc-7d2f72ccdef9)

### System Flow

1. `POST /api/scrape` accepts a `theme` and returns a `jobId`
2. The job is queued using BullMQ (backed by Redis)
3. A pool of up to 20 workers (configurable) scrape BookDP results
4. Each book is enriched using OpenAI or DeepSeek
5. Discount and value metrics are calculated
6. Final result is stored in Redis and sent to Make.com (if configured)
7. Client polls:
   - `GET /api/status/:jobId` for current status
   - `GET /api/results/:jobId` for final results


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
- Concurrency is configurable via Redis key `settings:scrape_queue_concurrency`
- The spreadsheet must already exist with the expected structure

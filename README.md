# Smart Book Discovery Agent

Smart Book Discovery Agent is a TypeScript-based automation tool that scrapes book data from BookDP.com.au based on a search theme, enriches it using a Large Language Model (LLM), performs value-based calculations, and sends results to a productivity tool via Make.com.

## Project Overview

- Scrapes the first two pages of BookDP.com.au search results based on a keyword
- Enriches each book with an AI-generated summary and relevance score
- Calculates:
  - Discount amount and percentage
  - Value score (relevance score / current price)
- Provides a RESTful API with job-based processing
- Sends results to Make.com using a webhook

---

## Instructions for Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/your-username/smart-book-agent.git
cd smart-book-agent
```

### 2. Install dependencies
```bash
yarn
```

### 3. Create a `.env` file
```env
PORT=3000
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-url
```

### 4. Run the app locally
```bash
yarn dev          # Development mode
yarn build && yarn start    # Production build
```

### 5. Run with Docker (Optional)
```bash
docker build -t smart-book-agent .
docker run -p 3000:3000 --env-file .env smart-book-agent
```

---

## Architecture and Approach

1. The API exposes three endpoints:
   - `POST /api/scrape` — Accepts a theme, starts a scraping + enrichment job
   - `GET /api/status/:jobId` — Returns the status of a job
   - `GET /api/results/:jobId` — Returns the results of a completed job
2. Scraping is handled by Playwright to fetch books from BookDP.
3. AI enrichment is performed using OpenAI or DeepSeek to generate a summary and relevance score.
4. The application calculates additional metrics like discount and value score.
5. Job results are stored in an in-memory `Map` and returned via polling.
6. Once complete, the results are POSTed to a Make.com webhook if configured.

---

## Make.com Integration

This project integrates with [Make.com](https://make.com) via a custom webhook.

1. Go to **Make.com** and create a new scenario.
2. Add a **Webhooks → Custom Webhook** module.
   - When creating the webhook, there is an option to specify expected structure.
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
```env
MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-url
```

4. Add a second step (Google Sheets) to receive the data.
   - Preferably use the “bulk add rows” option to handle arrays.
5. Activate your scenario and call the scrape API — results will be delivered automatically on completion.

---

## Assumptions and Limitations

- Only the first two pages of BookDP results are scraped
- Book author information is not available on the BookDP website, so as part of the AI enhancements, the author is inferred from the description.
- AI-generated data assumes the LLM returns clean JSON (errors may be caught and defaulted)
- Job tracking is done in memory using a `Map` — not persistent across server restarts
- Integration assumes webhook and downstream automation are properly configured

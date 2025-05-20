export interface Book {
  title: string;
  author: string;
  current_price: number;
  original_price?: number;
  description: string;
  product_url: string;

  // AI enrichment fields
  summary?: string;
  relevance_score?: number;

  // Computed fields
  discount_amount?: number;
  discount_percentage?: number;
  value_score?: number;
}
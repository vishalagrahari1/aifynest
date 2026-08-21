/* src/utils/trendingAlgorithm.ts */
import type { Tool, AnalyticsEvent, Review } from './seedData';

export interface TrendingConfig {
  weightView: number;
  weightClick: number;
  weightReview: number;
  weightRating: number;
  weightRecency: number;
  decayDays: number;
}

const DEFAULT_CONFIG: TrendingConfig = {
  weightView: 1.0,
  weightClick: 2.5,
  weightReview: 4.0,
  weightRating: 8.0,
  weightRecency: 15.0,
  decayDays: 7, // focus analytics in the last 7 days
};

export function calculateTrendingScores(
  tools: Tool[],
  events: AnalyticsEvent[],
  reviews: Review[],
  config: TrendingConfig = DEFAULT_CONFIG
): { toolId: string; score: number }[] {
  const now = new Date().getTime();
  const decayTime = config.decayDays * 24 * 60 * 60 * 1000;

  // Pre-calculate recent event weights
  const toolViewsMap: Record<string, number> = {};
  const toolClicksMap: Record<string, number> = {};

  events.forEach((event) => {
    if (!event.toolId) return;
    const eventTime = new Date(event.timestamp).getTime();
    const timeDiff = now - eventTime;
    
    // Skip events older than decay limit
    if (timeDiff > decayTime) return;

    // Linear time decay factor (newer events have more weight, close to 1, older close to 0)
    const decayFactor = Math.max(0, 1 - timeDiff / decayTime);

    if (event.eventType === 'tool_view') {
      toolViewsMap[event.toolId] = (toolViewsMap[event.toolId] || 0) + decayFactor;
    } else if (event.eventType === 'tool_click') {
      toolClicksMap[event.toolId] = (toolClicksMap[event.toolId] || 0) + decayFactor;
    }
  });

  // Pre-calculate recent review weights
  const toolReviewsMap: Record<string, number> = {};
  reviews.forEach((review) => {
    const reviewTime = new Date(review.date).getTime();
    const timeDiff = now - reviewTime;
    if (timeDiff > decayTime) return;
    const decayFactor = Math.max(0, 1 - timeDiff / decayTime);
    toolReviewsMap[review.toolId] = (toolReviewsMap[review.toolId] || 0) + decayFactor;
  });

  return tools.map((tool) => {
    const viewsWeight = (toolViewsMap[tool.id] || 0) * config.weightView;
    const clicksWeight = (toolClicksMap[tool.id] || 0) * config.weightClick;
    const reviewsWeight = (toolReviewsMap[tool.id] || 0) * config.weightReview;
    const ratingWeight = tool.rating * config.weightRating;

    // Recency factor based on tool lastUpdated or launch date
    const updatedTime = new Date(tool.lastUpdated).getTime();
    const timeSinceUpdate = now - updatedTime;
    const recencyFactor = Math.max(0, 1 - timeSinceUpdate / (30 * 24 * 60 * 60 * 1000)); // 30-day window for updates
    const recencyWeight = recencyFactor * config.weightRecency;

    const finalScore = viewsWeight + clicksWeight + reviewsWeight + ratingWeight + recencyWeight;

    return {
      toolId: tool.id,
      score: Math.round(finalScore * 10) / 10,
    };
  });
}

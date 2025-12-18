import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Ratelimiter for LLM and auth requests
const redis = Redis.fromEnv();;

// Stricter limit for LLM usage - 10 requests per hour
export const llmRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'rl:llm',
});

// Auth limit to prevent brute force - 10 request per minute
export const authRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'rl:auth',
});
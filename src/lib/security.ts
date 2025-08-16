/**
 * Security Configuration and Utilities
 * Centralized security settings for the application
 */

// Rate limiting configuration
export const RATE_LIMITS = {
  SCHEDULE_API: { max: 10, window: 60 * 1000 }, // 10 requests per minute
  MAPS_PROXY: { max: 20, window: 60 * 1000 },  // 20 requests per minute
  OPTIMIZE_API: { max: 5, window: 60 * 1000 },  // 5 requests per minute
  PRICING_API: { max: 15, window: 60 * 1000 },  // 15 requests per minute
} as const;

// Allowed origins for CORS
export const ALLOWED_ORIGINS = [
  'localhost:3000',
  'localhost:3001', 
  '127.0.0.1:3000',
  '127.0.0.1:3001',
  // Add your production domain here
  // 'yourdomain.com',
  // 'www.yourdomain.com',
] as const;

// Suspicious user agents to block
export const BLOCKED_USER_AGENTS = [
  'bot',
  'crawler',
  'scraper',
  'spider',
  'curl',
  'wget',
  'python-requests',
  'node-fetch',
  'axios',
] as const;

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

/**
 * Validate request origin
 */
export function isValidOrigin(origin: string | null, requestOrigin: string): boolean {
  if (!origin) return true; // Same-origin request
  
  // Check if origin is in allowed list
  const isAllowed = ALLOWED_ORIGINS.some(allowed => origin.includes(allowed));
  const isSameOrigin = origin === requestOrigin;
  
  return isAllowed || isSameOrigin;
}

/**
 * Check if user agent is suspicious
 */
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  return BLOCKED_USER_AGENTS.some(blocked => 
    userAgent.toLowerCase().includes(blocked.toLowerCase())
  );
}

/**
 * Generate rate limit key
 */
export function getRateLimitKey(request: Request): string {
  // In production, use a more sophisticated method like:
  // - JWT token validation
  // - API key validation
  // - User session validation
  
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  return forwardedFor?.split(',')[0] || realIP || clientIP || 'unknown';
}

/**
 * Validate API key presence (server-side only)
 */
export function validateApiKey(apiKey: string | undefined, keyName: string): boolean {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
    console.error(`❌ ${keyName} not configured or invalid`);
    return false;
  }
  
  // Basic validation - ensure it's not a placeholder
  if (apiKey.length < 10) {
    console.error(`❌ ${keyName} appears to be invalid (too short)`);
    return false;
  }
  
  return true;
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLogging(data: string): string {
  if (!data) return 'NOT_FOUND';
  
  // Show only first 10 characters for debugging
  return `${data.substring(0, 10)}...`;
}

/**
 * Security middleware for API routes
 */
export function createSecurityMiddleware() {
  return {
    validateOrigin: (request: Request) => {
      const origin = request.headers.get('origin');
      const requestOrigin = new URL(request.url).origin;
      
      if (!isValidOrigin(origin, requestOrigin)) {
        throw new Error('Unauthorized origin');
      }
    },
    
    validateUserAgent: (request: Request) => {
      const userAgent = request.headers.get('user-agent');
      
      if (isSuspiciousUserAgent(userAgent)) {
        throw new Error('Suspicious user agent detected');
      }
    },
    
    getClientIP: (request: Request) => getRateLimitKey(request),
  };
}

# Security Documentation

## API Key Security

This application uses a secure architecture to protect API keys from client-side exposure.

### Environment Variables

**SECURE (Server-side only):**
```bash
# These variables are only accessible server-side
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SCHEDULE_API_KEY=your_schedule_api_key
DATABASE_URL=your_database_url
```

**CLIENT-SAFE (Can be exposed to client):**
```bash
# These can use NEXT_PUBLIC_ prefix
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_analytics_id
```

### Security Architecture

1. **Maps Proxy (`/api/maps-proxy`)**
   - Google Maps API key stays server-side only
   - Client requests maps configuration via secure proxy
   - Prevents API key exposure in browser

2. **Rate Limiting**
   - All API endpoints have rate limits
   - IP-based throttling
   - Suspicious user agent blocking

3. **Origin Validation**
   - Strict CORS policies
   - Origin header validation
   - Referer checking

4. **Security Headers**
   - CSP, XSS protection
   - Frame options
   - Content type validation

### Deployment Security

**For Vercel:**
1. Add environment variables in Vercel dashboard
2. Use **server-side only** variables (no NEXT_PUBLIC_ prefix)
3. Variables are automatically encrypted

**For other platforms:**
1. Set environment variables in platform dashboard
2. Never commit `.env.local` files
3. Use platform-specific secret management

### Testing Security

To verify API keys are not exposed:

1. **Check browser Network tab** - API keys should not appear in any requests
2. **Check browser Console** - No API keys in console output
3. **View page source** - No API keys in HTML
4. **Check bundle** - No API keys in built JavaScript files

### Google Maps API Security

**Configure Domain Restrictions:**
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Select your Maps API key
4. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your production domain: `https://25for25.ai/*`
   - Add development domains: `http://localhost:3000/*`
5. Under "API restrictions":
   - Select "Restrict key"
   - Enable only: Maps JavaScript API
6. Save changes

This prevents unauthorized use of your Google Maps quota.

### Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No `NEXT_PUBLIC_` prefix on sensitive variables
- [ ] API keys work through proxy endpoints only
- [ ] Rate limiting is configured
- [ ] Security headers are applied
- [ ] Origin validation is active
- [ ] Google Maps API has domain restrictions configured
- [ ] All pricing API keys use server-side only variables

### Emergency Response

If API keys are accidentally exposed:

1. **Immediately rotate the exposed keys**
2. **Check git history** for committed keys
3. **Review access logs** for unauthorized usage
4. **Update environment variables** in all environments
5. **Redeploy application** to ensure changes take effect

### Monitoring

- Monitor API usage in provider dashboards
- Set up alerts for unusual traffic patterns
- Review server logs for security events
- Track rate limit violations
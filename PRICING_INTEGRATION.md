# Flight Pricing Integration - JetBlue 25for25 Route Optimizer

## Overview
This document describes the flight pricing integration for the JetBlue 25for25 Route Optimizer, which adds real-time pricing data and booking links to flight routes.

## Features
- **Real-time Pricing**: Dynamic pricing from multiple flight search APIs
- **Booking Links**: Direct links to book flights through partner sites
- **Cost Analysis**: Total route cost and average cost per flight
- **Multiple Providers**: Fallback options with Amadeus, Skyscanner, and Google Flights
- **Caching**: Intelligent caching to reduce API calls and improve performance

## API Options

### 1. **Amadeus API** (Recommended)
**Pros:**
- Comprehensive flight data
- Real-time pricing
- Good documentation
- Reliable service
- Booking links included

**Cons:**
- Requires registration
- Rate limits on free tier
- API keys needed

**Setup:**
1. Register at [Amadeus for Developers](https://developers.amadeus.com/)
2. Create a new application
3. Get API key and secret
4. Add to environment variables:
   ```
   NEXT_PUBLIC_AMADEUS_API_KEY=your_api_key
   NEXT_PUBLIC_AMADEUS_API_SECRET=your_api_secret
   ```

**Rate Limits:**
- Free tier: 1,000 requests/month
- Paid tiers available for higher usage

### 2. **Skyscanner API** (Alternative)
**Pros:**
- Good coverage
- Includes booking links
- Competitive pricing

**Cons:**
- Limited free tier
- Requires partnership for commercial use
- More complex setup

**Setup:**
1. Apply for partnership at [Skyscanner Partners](https://www.partners.skyscanner.net/)
2. Get API key
3. Add to environment variables:
   ```
   NEXT_PUBLIC_SKYSCANNER_API_KEY=your_api_key
   ```

### 3. **Google Flights API** (Limited)
**Pros:**
- Free to use
- Good data quality
- No API key required

**Cons:**
- Limited endpoints
- No direct booking
- Basic functionality only

## Implementation Architecture

### Backend API Routes
```
/api/pricing
├── GET /api/pricing?origin=JFK&destination=LAX&departureDate=2025-08-15
└── POST /api/pricing/route
    └── Body: { flights: Flight[] }
```

### Frontend Components
- **ResultsPage**: Displays pricing data and booking links
- **FlightCard**: Individual flight with pricing information
- **PricingSummary**: Route cost analysis

### Data Flow
1. User optimizes route
2. Backend returns flight path
3. Frontend requests pricing for each flight
4. Pricing service calls external APIs
5. Results displayed with costs and booking links

## Environment Variables

Create a `.env.local` file in your project root:

```env
# Amadeus API (Primary)
NEXT_PUBLIC_AMADEUS_API_KEY=your_amadeus_api_key
NEXT_PUBLIC_AMADEUS_API_SECRET=your_amadeus_api_secret

# Skyscanner API (Fallback)
NEXT_PUBLIC_SKYSCANNER_API_KEY=your_skyscanner_api_key

# Google Flights API (Limited)
NEXT_PUBLIC_GOOGLE_FLIGHTS_API_KEY=your_google_api_key
```

## API Usage Examples

### Get Single Flight Pricing
```typescript
import { getFlightPricing } from '../lib/apiService';

const pricing = await getFlightPricing(
  'JFK',           // Origin
  'LAX',           // Destination
  '2025-08-15',    // Departure date
  'B6123'          // Flight number (optional)
);

if (pricing) {
  console.log(`Price: ${pricing.price} ${pricing.currency}`);
  console.log(`Booking link: ${pricing.bookingLink}`);
}
```

### Get Route Pricing
```typescript
import { getRoutePricing } from '../lib/apiService';

const routePricing = await getRoutePricing(flights);

if (routePricing) {
  console.log(`Total cost: ${routePricing.totalCost}`);
  console.log(`Average cost: ${routePricing.averageCost}`);
  console.log(`Flights with pricing: ${routePricing.pricing.length}`);
}
```

## Pricing Data Structure

```typescript
interface FlightPricing {
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  airline: string;
  cabinClass: string;
  bookingLink?: string;
  lastUpdated: string;
}
```

## Caching Strategy

### Backend Caching
- **Flight pricing**: 1 hour cache
- **Route pricing**: 30 minutes cache
- **API responses**: HTTP cache headers

### Frontend Caching
- **Pricing data**: Stored in component state
- **Route results**: Cached until new optimization

## Error Handling

### API Failures
- Graceful fallback to alternative providers
- User-friendly error messages
- Partial pricing display when available

### Rate Limiting
- Automatic retry with exponential backoff
- Fallback to cached data
- User notification of limited pricing data

## Cost Considerations

### API Costs
- **Amadeus**: Free tier (1K requests/month), then $0.10-0.50 per request
- **Skyscanner**: Partnership required, costs vary
- **Google Flights**: Free (limited functionality)

### Optimization
- Batch pricing requests
- Intelligent caching
- Fallback providers
- Request deduplication

## Security Considerations

### API Key Protection
- Keys stored in environment variables
- Backend proxy prevents client-side exposure
- Rate limiting on API endpoints

### Data Privacy
- No personal information sent to pricing APIs
- Flight data only (origin, destination, date)
- Secure HTTPS communication

## Performance Optimization

### Request Optimization
- Parallel pricing requests
- Request batching
- Intelligent caching
- Fallback providers

### UI Optimization
- Loading states for pricing
- Progressive disclosure
- Skeleton loading
- Error boundaries

## Future Enhancements

### Planned Features
1. **Price Alerts**: Notify users of price changes
2. **Price History**: Track pricing trends
3. **Alternative Routes**: Show cheaper alternatives
4. **Multi-Currency**: Support for different currencies
5. **Loyalty Programs**: Integration with airline loyalty programs

### Additional APIs
1. **Kiwi.com API**: More comprehensive pricing
2. **ITA Matrix**: Google's flight search engine
3. **Sabre API**: Enterprise-level flight data
4. **Travelport**: Multi-GDS access

## Troubleshooting

### Common Issues

**API Key Errors:**
- Verify environment variables are set
- Check API key permissions
- Ensure keys are not expired

**Rate Limiting:**
- Implement exponential backoff
- Use multiple API providers
- Increase caching duration

**No Pricing Data:**
- Check flight availability
- Verify airport codes
- Try alternative providers

**Booking Link Issues:**
- Links may expire
- Provider availability varies
- Fallback to airline websites

### Debug Mode
Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG_PRICING=true
```

## Support

For issues with pricing integration:
1. Check API provider status
2. Verify environment variables
3. Review rate limits
4. Check network connectivity
5. Review error logs

## Legal Considerations

- **Terms of Service**: Comply with each API provider's ToS
- **Attribution**: Credit API providers as required
- **Usage Limits**: Respect rate limits and usage quotas
- **Data Usage**: Follow data usage guidelines 
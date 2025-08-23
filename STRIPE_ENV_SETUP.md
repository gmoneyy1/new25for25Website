# Stripe Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys

# Public key (starts with pk_test_ or pk_live_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RzInyGhUzE5HAXoH7CxjLHGjBtf3Qd2Rw6SveF12zawhFJltGv1Ct4qNC1WuOeCspNb2koj0Z08NmUxvcTC852C00YJ8Ae6nM

# Secret key (starts with sk_test_ or sk_live_)
STRIPE_SECRET_KEY=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

# Webhook secret (optional, for production webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## How to Get Your Stripe Keys

1. **Sign up/Login to Stripe**: Go to [stripe.com](https://stripe.com)
2. **Go to Dashboard**: Navigate to your Stripe Dashboard
3. **API Keys Section**: Go to Developers → API Keys
4. **Copy Keys**: 
   - Copy the "Publishable key" (starts with `pk_test_`)
   - Copy the "Secret key" (starts with `sk_test_`)

## Test vs Live Keys

- **Test Keys** (start with `pk_test_` and `sk_test_`): Use these for development and testing
- **Live Keys** (start with `pk_live_` and `sk_live_`): Use these for production

## Security Notes

- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose in the browser
- ❌ `STRIPE_SECRET_KEY` must be kept secret and only used on the server
- ❌ Never commit `.env.local` to version control
- ✅ Add `.env.local` to your `.gitignore` file

## Testing

Once configured, you can test with Stripe's test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

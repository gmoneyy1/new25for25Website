# Production Setup Guide

## 🚀 **Going Live with Stripe**

### **Step 1: Get Your Live Stripe Keys**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **LIVE mode** (toggle in top right)
3. Navigate to **Developers → API Keys**
4. Copy your live keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

### **Step 2: Update Environment Variables**

Replace your test keys in `.env.local` with live keys:

```bash
# Replace these test keys with your live keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_live_key_here
STRIPE_SECRET_KEY=sk_live_your_actual_live_key_here
```

### **Step 3: Test with Small Amounts**

- Start with $1 donations to verify everything works
- Check your Stripe dashboard for live transactions
- Ensure donor information is captured correctly

### **Step 4: Deploy to Production**

- Push your code to production
- Ensure environment variables are set
- Test the complete donation flow

## ⚠️ **Live Mode Considerations**

- **Real Money**: Live mode processes actual payments
- **Customer Support**: Be ready to handle real customer issues
- **Compliance**: Ensure you meet payment regulations
- **Security**: Keep your live keys secure

## 🔒 **Security Checklist**

- [ ] Live keys are in `.env.local` (not committed to git)
- [ ] `.env.local` is in `.gitignore`
- [ ] Tested with small amounts first
- [ ] Verified donor information capture
- [ ] Checked Stripe dashboard for live transactions

## 📊 **What to Expect in Live Mode**

- **Real customer accounts** in Stripe
- **Actual payment processing**
- **Live transaction history**
- **Real donor information**
- **Production webhook events** (if configured)

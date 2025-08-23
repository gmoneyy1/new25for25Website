import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG, validateStripeConfig } from '../../../lib/stripe';

// Helper function to create or get a Stripe customer
async function createOrGetCustomer(stripe: Stripe, email: string, name?: string): Promise<string> {
  // First, try to find existing customer
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer if none exists
  const customer = await stripe.customers.create({
    email: email,
    name: name,
    metadata: {
      source: '25for25_donations'
    }
  });

  return customer.id;
}

export interface DonationRequest {
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail: string;
  message?: string;
  paymentMethod: 'stripe' | 'paypal' | 'apple_pay' | 'other';
  isRecurring?: boolean;
}

export interface DonationResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  subscriptionId?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DonationRequest = await request.json();
    
    // Validate the request
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation amount' },
        { status: 400 }
      );
    }
    
    if (!body.donorEmail || !body.donorEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    if (!body.currency) {
      body.currency = 'USD';
    }
    
    // Validate Stripe configuration
    try {
      validateStripeConfig();
    } catch (error) {
      console.error('Stripe configuration error:', error);
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: '2023-10-16',
    });
    


    if (body.isRecurring) {
      // For now, create a payment intent for recurring donations
      // We'll implement proper subscriptions in the next iteration
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(body.amount * 100), // Convert to cents
        currency: body.currency.toLowerCase(),
        metadata: {
          donorName: body.donorName || '',
          donorEmail: body.donorEmail,
          message: body.message || '',
          type: 'recurring_donation_intent',
          recurring: 'true'
        },
        receipt_email: body.donorEmail,
        description: `Recurring Donation to 25for25 - $${body.amount} (Monthly)`,
      });
      
      console.log('Stripe recurring donation intent created:', {
        paymentIntentId: paymentIntent.id,
        amount: body.amount,
        currency: body.currency,
        donorName: body.donorName,
        donorEmail: body.donorEmail,
        message: body.message,
        recurring: true,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Recurring donation intent created successfully',
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });
    } else {
      // Create one-time payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(body.amount * 100), // Convert to cents
        currency: body.currency.toLowerCase(),
        metadata: {
          donorName: body.donorName || '',
          donorEmail: body.donorEmail,
          message: body.message || ''
        },
        receipt_email: body.donorEmail,
        description: `Donation to 25for25 - $${body.amount}`,
      });
      
      console.log('Stripe payment intent created:', {
        paymentIntentId: paymentIntent.id,
        amount: body.amount,
        currency: body.currency,
        donorName: body.donorName,
        donorEmail: body.donorEmail,
        message: body.message,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Payment intent created successfully',
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });
    }
    
  } catch (error) {
    console.error('Error processing donation:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while processing donation' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return donation statistics (in production, fetch from database)
  return NextResponse.json({
    totalDonations: 0,
    totalAmount: 0,
    recentDonations: []
  });
}

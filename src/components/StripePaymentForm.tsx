'use client';

import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface StripePaymentFormProps {
  amount: number;
  donorEmail: string;
  donorName?: string;
  message?: string;
  isRecurring: boolean;
  onSuccess: (paymentIntentId: string, subscriptionId?: string) => void;
  onError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export function StripePaymentForm({ 
  amount, 
  donorEmail,
  donorName,
  message,
  isRecurring,
  onSuccess, 
  onError
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('StripePaymentForm mounted:', { stripe: !!stripe, elements: !!elements, amount });
  }, [stripe, elements, amount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe has not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Create payment intent or subscription on the server
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'USD',
          donorEmail,
          donorName,
          message,
          paymentMethod: 'stripe',
          isRecurring,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        result.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        setCardError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message || 'There was an error processing your payment.',
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        const successMessage = isRecurring 
          ? `Thank you for your $${amount} monthly recurring donation!`
          : `Thank you for your $${amount} donation!`;
        
        toast({
          title: "Payment Successful!",
          description: successMessage,
        });
        
        // Pass subscription ID if this was a recurring payment
        const subscriptionId = result.subscriptionId;
        onSuccess(paymentIntent.id, subscriptionId);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          {!stripe || !elements ? (
            <div className="text-gray-500 text-center py-4">
              Loading payment form...
            </div>
          ) : (
            <CardElement options={cardElementOptions} />
          )}
        </div>
        {cardError && (
          <p className="text-red-600 text-sm">{cardError}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </Button>
    </form>
  );
}

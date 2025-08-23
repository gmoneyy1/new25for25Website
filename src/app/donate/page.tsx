'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Heart, Gift, Star, Coffee, CreditCard, RefreshCw } from 'lucide-react';
import { useDonations } from '../../hooks/useDonations';
import { useToast } from '../../components/ui/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';
import { StripePaymentForm } from '../../components/StripePaymentForm';

import { Switch } from '../../components/ui/switch';

const DONATION_AMOUNTS = [
  { value: '5', label: '$5', icon: Coffee, description: 'Buy us a coffee' },
  { value: '10', label: '$10', icon: Heart, description: 'Show your support' },
  { value: '25', label: '$25', icon: Star, description: 'Premium supporter' },
  { value: '50', label: '$50', icon: Gift, description: 'Generous donor' },
  { value: '100', label: '$100', icon: Gift, description: 'Major supporter' },
];

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState('25');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  
  const { isProcessing, error, submitDonation, clearError } = useDonations();
  const { toast } = useToast();

  const handleDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Get the final amount (either selected or custom)
    const finalAmount = customAmount || selectedAmount;
    
    // Validate required fields
    if (!donorEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Set the current amount and show Stripe form
    setCurrentAmount(parseFloat(finalAmount));
    setShowStripeForm(true);
  };

  const handleStripeSuccess = (paymentIntentId: string, subscriptionId?: string) => {
    // Reset form
    setDonorName('');
    setDonorEmail('');
    setMessage('');
    setCustomAmount('');
    setSelectedAmount('25');
    setShowStripeForm(false);
    setIsRecurring(false);
    
    const successMessage = subscriptionId 
      ? `Thank you for your $${currentAmount} monthly recurring donation! Subscription ID: ${subscriptionId}`
      : `Thank you for your $${currentAmount} donation! Transaction ID: ${paymentIntentId}`;
    
    toast({
      title: "Donation Successful!",
      description: successMessage,
    });
  };

  const handleStripeError = (error: string) => {
    console.error('Stripe payment error:', error);
    setShowStripeForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Support 25for25
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us continue improving the experience for all travelers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Donation Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="text-red-500" />
                Make a Donation
              </CardTitle>
              <CardDescription>
                Choose an amount or enter a custom donation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDonation} className="space-y-6">
                {/* Donation Amount Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Amount</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DONATION_AMOUNTS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant={selectedAmount === option.value ? "default" : "outline"}
                          className="h-auto py-4 px-3 flex flex-col items-center gap-2"
                          onClick={() => setSelectedAmount(option.value)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{option.label}</span>
                          <span className="text-xs text-gray-600">{option.description}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-2">
                  <Label htmlFor="customAmount">Or enter a custom amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="customAmount"
                      type="number"
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Recurring Payment Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                  <div className="flex-1">
                    <Label htmlFor="recurring" className="text-base font-medium text-blue-900">
                      Make this a recurring monthly donation
                    </Label>
                    <p className="text-sm text-blue-700 mt-1">
                      {isRecurring 
                        ? `You'll be charged $${customAmount || selectedAmount} monthly until you cancel.`
                        : 'One-time donation only.'
                      }
                    </p>
                  </div>
                  {isRecurring && (
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                {/* Donor Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="donorName">Your Name (Optional)</Label>
                    <Input
                      id="donorName"
                      placeholder="Enter your name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="donorEmail">Email Address</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Leave us a message..."
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-3 text-lg"
                  disabled={!donorEmail || (!customAmount && !selectedAmount)}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Continue to Payment
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stripe Payment Form */}
          {showStripeForm && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CreditCard className="text-blue-600" />
                  Complete Your Donation
                </CardTitle>
                <CardDescription>
                  Secure payment powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Donation Amount:</span>
                    <span className="text-xl font-bold text-blue-700">${currentAmount}</span>
                  </div>
                  {donorName && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">From:</span>
                      <span className="text-sm font-medium">{donorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{donorEmail}</span>
                  </div>
                </div>
                
                {/* Payment Options */}
                <div className="space-y-4">

                  
                  {/* Stripe Payment Form */}
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={currentAmount}
                      donorEmail={donorEmail}
                      donorName={donorName}
                      message={message}
                      isRecurring={isRecurring}
                      onSuccess={handleStripeSuccess}
                      onError={handleStripeError}
                    />
                  </Elements>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Right Column - Information */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Why Donate?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Improve Features</h3>
                    <p className="text-sm text-gray-600">Fund new features including cost optimization</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Gift className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Support Development</h3>
                    <p className="text-sm text-gray-600">Help cover server costs and development time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Improve Data Quality</h3>
                    <p className="text-sm text-gray-600">Fund better flight data sources and real-time updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>




          </div>
        </div>
      </div>
    </div>
  );
}

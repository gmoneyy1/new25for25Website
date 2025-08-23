'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Heart, Gift } from 'lucide-react';
import { useDonations } from '../hooks/useDonations';
import { useToast } from './ui/use-toast';

interface DonationWidgetProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function DonationWidget({ variant = 'compact', className = '' }: DonationWidgetProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('25');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorName, setDonorName] = useState('');
  
  const { isProcessing, error, submitDonation, clearError } = useDonations();
  const { toast } = useToast();

  const quickAmounts = ['5', '10', '25', '50'];

  const handleQuickDonation = (quickAmount: string) => {
    // Redirect to donate page with amount pre-selected
    const url = `/donate?amount=${quickAmount}`;
    window.location.href = url;
  };

  if (variant === 'compact') {
    return (
      <Card className={`shadow-md ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Support 25for25
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Help us keep this tool free and continue improving the experience.
          </p>
          
          {!showForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDonation(quickAmount)}
                    disabled={isProcessing}
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => setShowForm(true)}
              >
                Custom Amount
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Your email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="Your name (optional)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleQuickDonation(amount)}
                  disabled={isProcessing || !donorEmail}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing...' : 'Donate'}
                </Button>
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-red-600 text-xs">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant - redirect to donate page
  return (
    <Card className={`shadow-md ${className}`}>
      <CardContent className="p-6 text-center">
        <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Support 25for25</h3>
        <p className="text-gray-600 mb-4">
          Help us keep this route optimization tool free and continue improving the experience for all travelers.
        </p>
        <Button
          onClick={() => window.location.href = '/donate'}
          className="w-full"
        >
          <Gift className="w-4 h-4 mr-2" />
          Make a Donation
        </Button>
      </CardContent>
    </Card>
  );
}

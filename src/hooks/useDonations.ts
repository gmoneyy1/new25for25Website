import { useState } from 'react';

export interface DonationData {
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail: string;
  message?: string;
  paymentMethod: 'stripe' | 'paypal' | 'other';
}

export interface DonationResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  error?: string;
}

export interface DonationStats {
  totalDonations: number;
  totalAmount: number;
  recentDonations: Array<{
    amount: number;
    donorName?: string;
    timestamp: string;
  }>;
}

export function useDonations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDonation = async (donationData: DonationData): Promise<DonationResponse> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
      });

      const result: DonationResponse = await response.json();

      if (!result.success) {
        setError(result.error || 'Donation failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const getDonationStats = async (): Promise<DonationStats | null> => {
    try {
      const response = await fetch('/api/donations');
      const stats: DonationStats = await response.json();
      return stats;
    } catch (err) {
      console.error('Failed to fetch donation stats:', err);
      return null;
    }
  };

  const clearError = () => setError(null);

  return {
    isProcessing,
    error,
    submitDonation,
    getDonationStats,
    clearError,
  };
}

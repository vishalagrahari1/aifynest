/* src/services/payments/paymentProvider.ts */

export type PaymentMode = 'disabled' | 'test' | 'live';

export interface CheckoutSessionRequest {
  toolId: string;
  planId: string;
}

export interface CheckoutSessionResponse {
  status: 'disabled' | 'test' | 'live' | 'error';
  message: string;
  checkoutUrl?: string;
  sponsorshipId?: string;
}

class PaymentProviderService {
  private paymentMode: PaymentMode = 'disabled';

  constructor() {
    // Read environment payment mode (defaults to 'disabled')
    let mode = 'disabled';
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SPONSORSHIP_PAYMENT_MODE) {
        mode = import.meta.env.VITE_SPONSORSHIP_PAYMENT_MODE;
      } else if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITE_SPONSORSHIP_PAYMENT_MODE) {
        mode = (globalThis as any).process.env.VITE_SPONSORSHIP_PAYMENT_MODE;
      }
    } catch (e) {
      mode = 'disabled';
    }

    mode = (mode || 'disabled').toLowerCase();
    if (mode === 'test' || mode === 'live') {
      this.paymentMode = mode as PaymentMode;
    } else {
      this.paymentMode = 'disabled';
    }
  }

  public getPaymentMode(): PaymentMode {
    return this.paymentMode;
  }

  public isPaymentsEnabled(): boolean {
    return this.paymentMode !== 'disabled';
  }

  public async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    if (this.paymentMode === 'disabled') {
      return {
        status: 'disabled',
        message: 'Payments Coming Soon: Online sponsorship payments are currently being configured. You can review sponsorship plans now.',
      };
    }

    // Future Stripe integration handler for test / live mode
    try {
      // Calls trusted backend Edge Function when Stripe is configured
      const response = await fetch('/api/create-sponsorship-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: request.toolId, plan_id: request.planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate checkout session');
      }

      const data = await response.json();
      return {
        status: this.paymentMode,
        message: 'Checkout session created successfully.',
        checkoutUrl: data.checkout_url,
        sponsorshipId: data.sponsorship_id,
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message || 'Payment service error',
      };
    }
  }
}

export const paymentProvider = new PaymentProviderService();

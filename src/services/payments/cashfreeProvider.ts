/* src/services/payments/cashfreeProvider.ts */

export interface CashfreeOrderRequest {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  planId: string;
  planName: string;
}

export interface CashfreeOrderResponse {
  success: boolean;
  paymentSessionId?: string;
  orderId: string;
  message?: string;
  environmentMode?: 'sandbox' | 'production';
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

class CashfreeService {
  private environment: 'sandbox' | 'production' = 'sandbox';
  private appId: string = '';

  constructor() {
    this.appId = import.meta.env.VITE_CASHFREE_APP_ID || '';
    const env = (import.meta.env.VITE_CASHFREE_ENV || 'sandbox').toLowerCase();
    this.environment = env === 'production' ? 'production' : 'sandbox';
  }

  public getEnvironment() {
    return this.environment;
  }

  public getAppId() {
    return this.appId;
  }

  // Load Cashfree JS SDK dynamically
  public async loadCashfreeSDK(): Promise<boolean> {
    if (window.Cashfree) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Cashfree SDK script.');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  // Initiate Cashfree Order Session
  public async createOrderSession(req: CashfreeOrderRequest): Promise<CashfreeOrderResponse> {
    try {
      // In production backend, this calls Cashfree POST /pg/orders API endpoint
      const response = await fetch('/api/cashfree-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: req.orderId,
          order_amount: req.orderAmount,
          order_currency: req.orderCurrency || 'USD',
          customer_details: {
            customer_id: req.customerEmail.replace(/[^a-zA-Z0-9]/g, '_'),
            customer_name: req.customerName || 'Tool Owner',
            customer_email: req.customerEmail,
            customer_phone: req.customerPhone || '9999999999',
          },
          order_meta: {
            return_url: `${window.location.origin}/pricing?cashfree_order_id=${req.orderId}`,
          },
        }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok && data && data.payment_session_id) {
          return {
            success: true,
            paymentSessionId: data.payment_session_id,
            orderId: req.orderId,
            environmentMode: data.environment_mode || this.environment,
          };
        } else if (data && data.message) {
          return {
            success: false,
            orderId: req.orderId,
            message: data.message,
          };
        }
      }
    } catch (e: any) {
      console.warn('Backend Cashfree order session endpoint error:', e);
    }

    // Client fallback session response ONLY for local localhost dev test mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return {
        success: true,
        paymentSessionId: `cs_test_${Math.random().toString(36).substring(2, 12)}`,
        orderId: req.orderId,
        message: 'Cashfree Order Created (Local Dev Mode)',
        environmentMode: 'sandbox',
      };
    }

    return {
      success: false,
      orderId: req.orderId,
      message: 'Could not connect to Cashfree payment server. Please try again.',
    };
  }

  // Launch Cashfree Payment Checkout Modal
  public async launchCheckout(
    paymentSessionId: string, 
    onSuccess?: () => void, 
    onFailure?: (err: any) => void,
    envMode?: 'sandbox' | 'production'
  ) {
    // For local prototype / test mode with client mock session IDs:
    if (paymentSessionId.startsWith('cs_test_')) {
      console.log('Simulating Cashfree Sandbox checkout completion for test session:', paymentSessionId);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
      return;
    }

    const isLoaded = await this.loadCashfreeSDK();
    if (!isLoaded || !window.Cashfree) {
      if (onFailure) onFailure('Cashfree SDK failed to initialize');
      return;
    }

    try {
      const activeMode = envMode || this.environment;
      console.log('Initializing Cashfree SDK Checkout with mode:', activeMode);

      const cashfree = typeof window.Cashfree === 'function' 
        ? window.Cashfree({ mode: activeMode }) 
        : new window.Cashfree({ mode: activeMode });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal',
      }).then((result: any) => {
        if (result.error) {
          console.error('Cashfree Payment Error:', result.error);
          if (onFailure) onFailure(result.error);
        } else if (result.redirect) {
          console.log('Cashfree Redirecting...');
        } else if (result.paymentDetails) {
          console.log('Cashfree Payment Completed:', result.paymentDetails);
          if (onSuccess) onSuccess();
        }
      });
    } catch (err: any) {
      console.error('Error during Cashfree checkout:', err);
      if (onFailure) onFailure(err);
    }
  }
}

export const cashfreeService = new CashfreeService();

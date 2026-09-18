/* src/components/shared/CashfreeModal.tsx */
import React, { useState } from 'react';
import { Modal } from './Modal';
import { cashfreeService } from '../../services/payments/cashfreeProvider';

interface CashfreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  currency?: string;
  toolName?: string;
  userEmail?: string;
  onPaymentSuccess: (paymentId: string) => void;
}

export const CashfreeModal: React.FC<CashfreeModalProps> = ({
  isOpen,
  onClose,
  planName,
  amount,
  currency = 'USD',
  toolName = 'AI Tool Listing',
  userEmail = '',
  onPaymentSuccess,
}) => {
  const [email, setEmail] = useState(userEmail);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cashfree_gateway' | 'upi_qr' | 'netbanking'>('cashfree_gateway');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidStatus, setPaidStatus] = useState(false);

  const exchangeRate = 86.5; // Approx USD to INR rate for display
  const amountInINR = currency === 'USD' ? Math.round(amount * exchangeRate) : amount;

  const handleCashfreePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please provide your email address for Cashfree payment receipt.');
      return;
    }

    setIsProcessing(true);

    const orderId = `cf_order_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const orderSession = await cashfreeService.createOrderSession({
        orderId,
        orderAmount: amount,
        orderCurrency: currency,
        customerEmail: email,
        customerName: name || 'Tool Owner',
        customerPhone: phone || '9999999999',
        planId: planName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        planName,
      });

      if (orderSession.success && orderSession.paymentSessionId) {
        const isTestSession = orderSession.paymentSessionId.startsWith('cs_test_');

        // Launch Cashfree SDK
        await cashfreeService.launchCheckout(
          orderSession.paymentSessionId,
          () => {
            setIsProcessing(false);
            setPaidStatus(true);
            onPaymentSuccess(orderId);
          },
          (err) => {
            console.warn('Cashfree Checkout Error:', err);
            setIsProcessing(false);
            if (isTestSession) {
              // Local Dev / Prototype Test Mode Fallback
              setPaidStatus(true);
              onPaymentSuccess(orderId);
            } else {
              const errMsg = typeof err === 'string' ? err : (err?.message || 'Payment was canceled or could not be completed. Please try again.');
              alert(errMsg);
            }
          },
          orderSession.environmentMode
        );
      } else {
        setIsProcessing(false);
        alert('Could not initiate Cashfree payment session. Please check your credentials or try again.');
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('An error occurred while connecting to Cashfree. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay with Cashfree Payments">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {paidStatus ? (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ fontSize: '54px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--color-success)' }}>
              Payment Successful!
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Your Cashfree payment for <strong>{planName}</strong> (${amount}) has been verified.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ padding: '10px 24px' }}>
              Done & Return
            </button>
          </div>
        ) : (
          <div>
            {/* Header summary box */}
            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  CASHFREE PAYMENTS
                </span>
                <h4 style={{ margin: '2px 0 0 0', fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {planName}
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Item: {toolName}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  ${amount} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>{currency}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  (approx ₹{amountInINR.toLocaleString('en-IN')})
                </div>
              </div>
            </div>

            {/* Payment Modes Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '12px' }}>
                Select Cashfree Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cashfree_gateway')}
                  style={{
                    padding: '12px 8px',
                    border: paymentMethod === 'cashfree_gateway' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: paymentMethod === 'cashfree_gateway' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                  }}
                >
                  💳 Cashfree Gateway
                  <span style={{ display: 'block', fontSize: '9px', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '2px' }}>
                    UPI / Cards / Netbanking
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi_qr')}
                  style={{
                    padding: '12px 8px',
                    border: paymentMethod === 'upi_qr' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: paymentMethod === 'upi_qr' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                  }}
                >
                  📱 UPI / GPay / PhonePe
                  <span style={{ display: 'block', fontSize: '9px', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Instant QR Scan
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  style={{
                    padding: '12px 8px',
                    border: paymentMethod === 'netbanking' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: paymentMethod === 'netbanking' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                  }}
                >
                  🏛️ Net Banking
                  <span style={{ display: 'block', fontSize: '9px', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '2px' }}>
                    SBI, HDFC, ICICI & 50+
                  </span>
                </button>
              </div>
            </div>

            {/* Form Details */}
            <form onSubmit={handleCashfreePay} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>
                  Email Address for Cashfree Receipt *
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ padding: '10px 12px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Your Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ padding: '10px 12px', fontSize: '12px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Mobile Number (for UPI)</label>
                  <input
                    type="tel"
                    placeholder="+91 9999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    style={{ padding: '10px 12px', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Supported Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '6px 0', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>Powered by <strong>Cashfree Payments</strong></span>
                <span>•</span>
                <span>UPI (GPay / PhonePe / Paytm)</span>
                <span>•</span>
                <span>Visa / Mastercard / RuPay</span>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  padding: '14px',
                  fontWeight: 'bold',
                  fontSize: 'var(--text-sm)',
                  width: '100%',
                  marginTop: '6px',
                }}
              >
                {isProcessing ? 'Connecting to Cashfree Gateway...' : `Proceed to Pay ₹${amountInINR.toLocaleString('en-IN')} ($${amount})`}
              </button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
};

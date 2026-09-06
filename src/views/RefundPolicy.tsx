/* src/views/RefundPolicy.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="Refund & Cancellation Policy — AIFynest"
        description="Review the official Refund and Cancellation Policy for AIFynest promotional sponsorships, eligibility terms, request procedures, and processing windows."
      />

      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Refund & Cancellation Policy
          </h1>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Last Updated: September 3, 2026
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              1. Overview & Scope
            </h2>
            <p style={{ margin: 0 }}>
              This Refund & Cancellation Policy applies to all promotional sponsorship purchases made on {BUSINESS_CONFIG.name} ("{BUSINESS_CONFIG.siteUrl}"). We strive for complete transparency regarding our payment processing, activation rules, and refund eligibility.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              2. Sponsorship Lifecycle & Payment Activation
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Before Payment:</strong> No sponsorship or promotional placement exists. Browsing plans creates no financial obligation.</li>
              <li><strong>Payment Processing:</strong> Payments are processed securely via our PCI-compliant payment gateway provider (Stripe).</li>
              <li><strong>Successful Payment & Activation:</strong> A sponsorship becomes active ONLY after verified payment completion and automated signature validation.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              3. Refund Eligibility & Exclusions
            </h2>
            <p style={{ margin: '0 0 8px 0' }}>
              Refund requests are evaluated based on sponsorship status:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Eligible for Full Refund (100%):</strong> If a payment is processed but a technical system error prevents sponsorship activation.</li>
              <li><strong>Eligible for Full Refund (100%):</strong> If a sponsorship order is cancelled or rejected by our moderation team prior to promotional placement activation.</li>
              <li><strong>Non-Refundable:</strong> Once a promotional sponsorship has been successfully activated and has entered its active placement period, payment fees for that period are non-refundable except where required by applicable consumer law.</li>
              <li><strong>No Traffic Guarantees:</strong> Sponsorship provides promotional placement within designated directory sections. Because external visitor engagement depends on product market demand, refunds are not granted based on performance metrics (*such as number of impressions, website clicks, leads, or software sales*).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              4. Sponsorship Cancellation
            </h2>
            <p style={{ margin: 0 }}>
              Tool owners may request cancellation of an active sponsorship at any time through their owner dashboard or by contacting support. Cancellation removes the tool's sponsored placement badge upon request, but previously activated promotional days are non-refundable.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              5. How to Request a Refund
            </h2>
            <p style={{ margin: '0 0 8px 0' }}>
              To request a refund, please follow these steps:
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Submit a request via our <Link to="/contact" style={{ color: 'var(--color-primary)' }}>Contact Page</Link> or email <strong>{BUSINESS_CONFIG.supportEmail}</strong>.</li>
              <li>Include your **Tool Name**, **Sponsorship ID**, **Payment Transaction/Invoice Reference**, and the reason for your refund request.</li>
              <li>Our support team will review your request within 24-48 business hours.</li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              6. Refund Processing Window
            </h2>
            <p style={{ margin: 0 }}>
              Approved refunds will be processed back to the original payment method used during checkout within **5 to 10 business days**, depending on your credit card issuer or bank processing times.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              7. Contact Us
            </h2>
            <p style={{ margin: 0 }}>
              If you have any questions regarding refunds or payments, please contact our billing support team at <strong>{BUSINESS_CONFIG.supportEmail}</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

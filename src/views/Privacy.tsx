/* src/views/Privacy.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const Privacy: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="Privacy Policy — AIFynest"
        description="Learn how AIFynest collects, uses, protects, and handles user account data, tool submission info, analytics, and privacy rights."
      />

      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Privacy Policy
          </h1>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Last Updated: September 3, 2026
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              1. Introduction
            </h2>
            <p style={{ margin: 0 }}>
              This Privacy Policy explains how {BUSINESS_CONFIG.name} ("we", "us", or "our") collects, uses, stores, and protects personal information when you visit or interact with our platform at {BUSINESS_CONFIG.siteUrl}. We respect user privacy and are committed to transparent data practices.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              2. Information We Collect
            </h2>
            <p style={{ margin: '0 0 8px 0' }}>
              We collect information that you voluntarily provide when using our services, as well as technical data automatically generated during visits:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Account Credentials:</strong> Email address, user ID, role assignment, and password hash (handled securely via Supabase Auth).</li>
              <li><strong>Tool Submission Data:</strong> Software name, description, website URL, pricing plans, features, logo, and media provided by tool owners.</li>
              <li><strong>User Interactions:</strong> Product star ratings, written reviews, saved favorites, and support inquiries.</li>
              <li><strong>Usage Analytics:</strong> Page views, outbound website referral clicks, device classification (*Desktop, Mobile, Tablet*), browser type, and referrer URL.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              3. How We Use Your Information
            </h2>
            <p style={{ margin: '0 0 8px 0' }}>
              We use collected information to:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Provide, maintain, and improve the AI tool directory catalog.</li>
              <li>Moderate tool submissions, claims, edits, and verification requests.</li>
              <li>Authenticate user sessions and enforce account security controls.</li>
              <li>Generate anonymous traffic analytics reports for tool owners.</li>
              <li>Process optional sponsorship orders through PCI-compliant payment gateways.</li>
              <li>Respond to support, legal, or refund inquiry requests.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              4. Local Storage & Session Cookies
            </h2>
            <p style={{ margin: 0 }}>
              {BUSINESS_CONFIG.name} utilizes local browser storage and standard session identifiers to maintain user login authentication state, store anonymous session tokens for analytics event tracking, and preserve UI preferences (*such as dark mode settings*).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              5. Payment Processing & Gateway Security
            </h2>
            <p style={{ margin: 0 }}>
              When payment features are enabled, online payment processing is handled exclusively by authorized PCI-DSS compliant third-party payment providers (e.g., Stripe). {BUSINESS_CONFIG.name} never stores credit card numbers, CVVs, or full payment credentials on our servers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              6. Data Sharing & Third-Party Services
            </h2>
            <p style={{ margin: 0 }}>
              We do not sell or rent personal information. Data may be processed by trusted infrastructure providers (such as Supabase for database hosting and Stripe for billing) solely for operational service delivery.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              7. Data Protection & Security Controls
            </h2>
            <p style={{ margin: 0 }}>
              We implement industry-standard security safeguards, including HTTPS encryption, database Row Level Security (RLS) policies, and server-side privilege scoping, to protect stored data against unauthorized access or alteration.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              8. Your Rights & Data Choices
            </h2>
            <p style={{ margin: 0 }}>
              You have the right to access, update, or request deletion of your account data or submitted tool listings. You may submit a privacy request anytime via our <Link to="/contact" style={{ color: 'var(--color-primary)' }}>Contact Page</Link>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              9. Contact Us
            </h2>
            <p style={{ margin: 0 }}>
              For questions regarding this Privacy Policy or data protection practices, please contact us at <strong>{BUSINESS_CONFIG.supportEmail}</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

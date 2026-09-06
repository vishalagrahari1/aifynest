/* src/views/Terms.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const Terms: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="Terms & Conditions — AIFynest"
        description="Read the official Terms & Conditions governing your use of AIFynest, tool listings, user accounts, and promotional sponsorships."
      />

      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Terms & Conditions
          </h1>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Last Updated: September 3, 2026
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          
          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              1. Platform Overview
            </h2>
            <p style={{ margin: 0 }}>
              Welcome to {BUSINESS_CONFIG.name} ("{BUSINESS_CONFIG.siteUrl}"). {BUSINESS_CONFIG.name} is an artificial intelligence software discovery and directory platform designed to help individuals, professionals, and enterprise buyers discover, compare, and evaluate AI tools and software applications.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              2. User Accounts & Acceptable Use
            </h2>
            <p style={{ margin: 0 }}>
              To submit tools, claim listings, save favorites, or post reviews, users may register an account. You are responsible for maintaining the confidentiality of your account credentials. You agree not to engage in unauthorized access, automated scraping, posting deceptive content, or manipulating platform rankings.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              3. AI Tool Listings & Editorial Moderation
            </h2>
            <p style={{ margin: 0 }}>
              AI tool creators and owners may submit software products for cataloging. All submissions are subject to editorial moderation. {BUSINESS_CONFIG.name} reserves the right to approve, request modifications to, reject, or unlist any submission that fails to satisfy product completeness, pricing accuracy, or safety standards.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              4. Tool Owner Responsibilities
            </h2>
            <p style={{ margin: 0 }}>
              Tool owners claiming or managing product profiles guarantee that all submitted information (descriptions, website URLs, features, pricing plans, and media) is accurate, lawful, and does not infringe third-party intellectual property or privacy rights.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              5. Promotional Sponsorship Program
            </h2>
            <p style={{ margin: 0 }}>
              {BUSINESS_CONFIG.name} offers optional, paid fixed-duration promotional sponsorships for approved AI tools listed in the directory. Sponsorship provides additional promotional placement within designated directory sections.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              6. Sponsorship Plans & Pricing
            </h2>
            <p style={{ margin: '0 0 12px 0' }}>
              The authoritative promotional sponsorship plans are:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>Starter Plan:</strong> 30 Days — $25.00 USD</li>
              <li><strong>Growth Plan:</strong> 90 Days — $49.00 USD</li>
              <li><strong>Long-Term Plan:</strong> 180 Days — $79.00 USD</li>
              <li><strong>Annual Plan:</strong> 365 Days — $99.00 USD (BEST VALUE)</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              7. Sponsorship Activation
            </h2>
            <p style={{ margin: 0 }}>
              A sponsorship becomes active ONLY after successful, verified payment processing through our authorized payment gateway provider. In payment-disabled mode, no payments are collected and no sponsorships are activated.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              8. Placement & Traffic Visibility Disclaimers
            </h2>
            <p style={{ margin: 0 }}>
              Sponsorship guarantees fixed-duration placement within designated directory areas. Sponsorship does **NOT** guarantee any specific volume of impressions, website clicks, user leads, software sales, conversions, or revenue.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              9. Transparent Sponsored Labeling
            </h2>
            <p style={{ margin: 0 }}>
              All sponsored listings are clearly identified to visitors with a prominent “SPONSORED” label to maintain editorial integrity and user trust.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              10. Payment Processing
            </h2>
            <p style={{ margin: 0 }}>
              Payments for sponsorships are processed securely through PCI-compliant payment provider infrastructure (e.g., Stripe) when active. {BUSINESS_CONFIG.name} does not store credit card or payment credential details on our servers.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              11. Refund & Cancellation Terms
            </h2>
            <p style={{ margin: 0 }}>
              Sponsorship purchases are governed by our dedicated <Link to="/refund-policy" style={{ color: 'var(--color-primary)' }}>Refund & Cancellation Policy</Link>. Active sponsorships can be cancelled at any time, but fees paid for active promotional periods are non-refundable once activated except as required by law.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              12. Prohibited Content & Software Guidelines
            </h2>
            <p style={{ margin: 0 }}>
              Submissions containing malware, phishing tools, deceptive software, illegal content, hateful material, or unauthorized trademark usage are strictly prohibited and will be removed immediately.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              13. Account Suspension & Termination
            </h2>
            <p style={{ margin: 0 }}>
              {BUSINESS_CONFIG.name} reserves the right to suspend or terminate accounts and unlist products that violate these Terms or present security risks to platform users.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              14. Intellectual Property
            </h2>
            <p style={{ margin: 0 }}>
              All trademarks, product logos, and software titles listed on {BUSINESS_CONFIG.name} remain the property of their respective owners. Platform design, codebase, and curated metadata structure are protected under intellectual property laws.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              15. Limitation of Liability
            </h2>
            <p style={{ margin: 0 }}>
              {BUSINESS_CONFIG.name} is provided on an "as is" and "as available" basis without warranties of any kind. {BUSINESS_CONFIG.name} shall not be liable for direct, indirect, or consequential damages resulting from product decisions, directory listings, or external software usage.
            </p>
          </section>

          {/* Section 16 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              16. Modifications to Terms
            </h2>
            <p style={{ margin: 0 }}>
              We reserve the right to update these Terms at any time. Continued use of the platform following published updates constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Section 17 */}
          <section>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              17. Contact Information
            </h2>
            <p style={{ margin: 0 }}>
              For legal or terms inquiry assistance, please reach out via our <Link to="/contact" style={{ color: 'var(--color-primary)' }}>Contact Page</Link> or email us directly at <strong>{BUSINESS_CONFIG.supportEmail}</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

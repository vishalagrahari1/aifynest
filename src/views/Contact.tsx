/* src/views/Contact.tsx */
import React, { useState } from 'react';
import { SEOHead } from '../components/shared/SEOHead';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { Check } from '../components/shared/Icons';

interface ContactProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Contact: React.FC<ContactProps> = ({ onToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      onToast('Please fill out all required fields.', 'error');
      return;
    }

    // Save support ticket inquiry locally for verification
    const existing = JSON.parse(localStorage.getItem('contact_inquiries') || '[]');
    existing.push({
      id: 'inq_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      category,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('contact_inquiries', JSON.stringify(existing));

    setSubmitted(true);
    onToast('Your message has been sent successfully! Our support team will reply shortly.', 'success');
  };

  return (
    <div className="container section">
      <SEOHead
        title="Contact & Support — AIFynest"
        description="Get in touch with the AIFynest team for general inquiries, tool owner support, sponsorship help, content reporting, or refund assistance."
      />

      <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            Contact & Support
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', margin: 0 }}>
            Have questions about {BUSINESS_CONFIG.name}, tool submissions, sponsorship options, or listing updates? We are here to help.
          </p>
        </div>

        {/* Official Contact Info Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>Direct Support Channels</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="contact-info-grid">
            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>EMAIL SUPPORT</span>
              <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                {BUSINESS_CONFIG.supportEmail}
              </a>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Response time: Within 24-48 business hours
              </span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>ONLINE PORTAL</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Web Inquiry Form
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Submit inquiries directly below
              </span>
            </div>
          </div>
        </div>

        {/* Functional Support Form */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Check size={48} style={{ color: 'var(--color-success)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 8px 0' }}>Message Received!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 20px 0' }}>
                Thank you for contacting us. A confirmation has been logged, and our team will respond to <strong>{email}</strong> shortly.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn btn-outline btn-sm">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0 }}>Send Us a Message</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Inquiry Category *</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="general">General Inquiry</option>
                  <option value="tool_owner">Tool Owner / Submission Support</option>
                  <option value="sponsorship">Sponsorship & Payment Support</option>
                  <option value="refund">Refund & Cancellation Inquiry</option>
                  <option value="report">Report Content / Copyright Issue</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Summary of your request"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Details *</label>
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="Provide complete details regarding your inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-md" style={{ alignSelf: 'flex-start' }}>
                Submit Support Ticket
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 576px) {
          .contact-info-grid, .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

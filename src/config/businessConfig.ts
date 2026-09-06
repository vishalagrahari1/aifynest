/* src/config/businessConfig.ts */

export const BUSINESS_CONFIG = {
  name: 'AIFynest Directory',
  legalName: 'AIFynest Directory Platform',
  siteUrl: 'https://aifynest.com',
  supportEmail: 'support@aifynest.com',
  businessAddress: null, // Configurable placeholder: populate when official business address is available
  companyRegistration: null, // Configurable placeholder: populate when official company registration ID is available
  sponsorshipPlans: [
    { id: 'plan_starter', name: 'Starter', durationDays: 30, price: 25.00, currency: 'USD' },
    { id: 'plan_growth', name: 'Growth', durationDays: 90, price: 49.00, currency: 'USD' },
    { id: 'plan_longterm', name: 'Long-Term', durationDays: 180, price: 79.00, currency: 'USD' },
    { id: 'plan_annual', name: 'Annual', durationDays: 365, price: 99.00, currency: 'USD', isBestValue: true },
  ],
};

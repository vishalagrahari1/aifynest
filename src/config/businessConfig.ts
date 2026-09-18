/* src/config/businessConfig.ts */

export const BUSINESS_CONFIG = {
  name: 'AIFynest Directory',
  legalName: 'AIFynest Directory Platform',
  siteUrl: 'https://aifynest.com',
  supportEmail: 'contact@aifynest.com',
  contactEmail: 'contact@aifynest.com',
  officialEmail: 'aifynestofficial@gmail.com',
  businessAddress: null, // Configurable placeholder: populate when official business address is available
  companyRegistration: null, // Configurable placeholder: populate when official company registration ID is available
  sponsorshipPlans: [
    { id: 'plan_popular', name: 'Popular Tools Spot', durationDays: 90, price: 69.00, currency: 'USD', description: 'Guaranteed high-visibility placement in the Popular Tools grid on the Homepage.' },
    { id: 'plan_featured', name: 'Featured Tools Spot', durationDays: 90, price: 99.00, currency: 'USD', description: 'Guaranteed high-visibility placement in the Featured Tools grid on the Homepage.' },
    { id: 'plan_growth', name: 'Growth Featured Pack', durationDays: 90, price: 149.00, currency: 'USD', isRecommended: true, badge: 'RECOMMENDED', description: 'Promote your tool across Popular Tools and Featured section for 3 months.' },
    { id: 'plan_featured_article', name: 'Featured + Article Package', durationDays: 90, price: 199.00, currency: 'USD', isBestValue: true, badge: '🔥 BEST VALUE', description: 'Get your AI tool listed in the Featured section for 90 days and get a dedicated editorial article published on the site.' },
    { id: 'plan_annual', name: 'Annual Pass', durationDays: 365, price: 299.00, currency: 'USD', isEnterprise: true, badge: 'ENTERPRISE', description: 'Keep your AI tool continuously promoted in Popular & Featured sections all year with a dedicated editorial article published on the site.' },
  ],
};

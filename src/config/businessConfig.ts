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
    { id: 'plan_popular', name: 'Popular Tools Spot', durationDays: 90, price: 19.00, currency: 'USD', description: 'Guaranteed high-visibility placement in Popular Tools & Trending section for 90 days.' },
    { id: 'plan_featured', name: 'Featured Tools Spot', durationDays: 90, price: 29.00, currency: 'USD', description: 'Guaranteed high-visibility placement in Featured Tools & Trending section for 90 days.' },
    { id: 'plan_growth', name: 'Growth Featured Pack', durationDays: 90, price: 59.00, currency: 'USD', isRecommended: true, badge: 'RECOMMENDED', description: 'Promote your tool across Popular Tools, Featured section, and Trending section for 3 months.' },
    { id: 'plan_guest_post', name: 'Guest Post Article Package', durationDays: 90, price: 99.00, currency: 'USD', isBestValue: true, badge: '🔥 BEST VALUE', description: 'Dedicated guest post editorial article published on site + Featured listing + Citation in LLMs & AI Search Engines.' },
  ],
};

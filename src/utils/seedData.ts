/* src/utils/seedData.ts */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'user';
  password?: string;
  interests?: string[];
  notificationsCount?: number;
  emailConfirmedAt?: string | null;
}

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  billingPeriod: 'monthly' | 'yearly' | 'one-time' | 'free';
}

export interface ToolSubmission {
  id: string;
  toolId: string | null;
  submitterId: string;
  name: string;
  tagline: string;
  description: string;
  categorySlug: string;
  subCategory: string;
  pricing: string;
  pricingUrl?: string;
  platforms: string[];
  features: string[];
  useCases: string[];
  logoUrl: string;
  screenshotUrls: string[];
  videoUrl?: string;
  websiteUrl: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes' | 'draft';
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  categorySlug: string;
  subCategory: string;
  pricing: 'free' | 'freemium' | 'paid' | 'free-trial' | 'contact-sales';
  pricingUrl: string;
  platforms: ('Web' | 'Windows' | 'Mac' | 'iOS' | 'Android' | 'Chrome Extension' | 'API')[];
  pricingPlans: PricingPlan[];
  features: string[];
  useCases: string[];
  pros: string[];
  cons: string[];
  logoUrl: string;
  screenshotUrls: string[];
  videoUrl?: string;
  websiteUrl: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  status: 'draft' | 'pending' | 'needs_changes' | 'approved' | 'rejected' | 'suspended' | 'archived';
  ownerId: string | null;
  claimStatus: 'unclaimed' | 'pending' | 'claimed';
  lastUpdated: string;
  tags: string[];
  
  // New Admin, SEO and Affiliate fields
  approvedAt?: string | null;
  approvedBy?: string | null;
  adminNotes?: string;
  rejectionReason?: string;
  seoTitle?: string;
  metaDescription?: string;
  h1Title?: string;
  canonicalUrl?: string;
  socialImage?: string;
  faq?: { q: string; a: string }[];
  affiliateUrl?: string;
  affiliateStatus?: 'active' | 'inactive';
  affiliateNetwork?: string;
  affiliateProgramName?: string;
  pendingChanges?: Partial<Tool> & {
    status?: 'draft' | 'pending' | 'needs_changes' | 'rejected' | 'approved';
    adminNotes?: string;
    rejectionReason?: string;
    submittedAt?: string;
  };
}

export interface AffiliateLink {
  id: string;
  toolId: string;
  originalUrl: string;
  affiliateUrl: string;
  network: string; // PartnerStack, Impact, CJ, etc.
  programName: string;
  trackingId: string;
  campaignId?: string;
  status: 'active' | 'inactive';
  startDate: string;
  endDate?: string;
  notes?: string;
  commissionPercent?: number;
  commissionFixed?: number;
  cookieDuration?: number; // days
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'submission' | 'claim' | 'review' | 'payment' | 'system';
}

export interface Category {
  name: string;
  slug: string;
  subcategories: string[];
  iconName: string;
  description: string;
}

export interface ReviewRatingDimensions {
  easeOfUse: number;
  valueForMoney: number;
  features: number;
  performance: number;
}

export interface Review {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  rating: number;
  ratingDimensions: ReviewRatingDimensions;
  title: string;
  comment: string;
  pros: string;
  cons: string;
  date: string;
  status: 'approved' | 'pending' | 'flagged';
  replies?: {
    userId: string;
    userName: string;
    comment: string;
    date: string;
  }[];
}

export interface Campaign {
  id: string;
  toolId: string;
  campaignName: string;
  placement: 'featured' | 'sponsored-search' | 'homepage-featured' | 'category' | 'newsletter';
  startDate: string;
  endDate: string;
  budget: number;
  remainingBudget: number;
  spent: number;
  cpc: number; // Cost Per Click
  cpm: number; // Cost Per Mille (impressions)
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'completed' | 'pending-payment';
}

export interface Payment {
  id: string;
  campaignId: string | null;
  userId: string;
  amount: number;
  date: string;
  status: 'success' | 'failed';
  invoiceNumber: string;
  couponCode?: string;
  type: 'sponsorship' | 'premium-profile' | 'api-access' | 'other';
  description: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'tool_view' | 'tool_click' | 'tool_save' | 'search' | 'compare' | 'sponsored_impression' | 'sponsored_click' | 'category_view' | 'affiliate_click' | 'website_click' | 'favorite' | 'review_submitted' | 'search_impression' | 'tool_share';
  toolId?: string;
  categorySlug?: string;
  query?: string;
  timestamp: string;
  referrer?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  country?: string;
  campaignId?: string;
  value?: string;
  revenue?: number;
  commission?: number;
  // Future postgresql/supabase session/security mapping parameters
  sessionId?: string;
  userId?: string;
  browser?: string;
  path?: string;
}

export interface Claim {
  id: string;
  toolId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationEmail: string;
  domain: string;
  message: string;
  date: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  image: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  tools: string[]; // Tool IDs
  dateCreated: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

// Initial Core Categories
export const initialCategories: Category[] = [
  { name: 'AI Writing', slug: 'writing', subcategories: ['Copywriting', 'AI Email', 'AI Summarization', 'Blogging'], iconName: 'Edit', description: 'Enhance your content creation, emails, summaries, and copy with AI.' },
  { name: 'AI Image Generation', slug: 'image-generation', subcategories: ['Image Creators', 'Photo Editing', 'AI Design', 'Text to Image'], iconName: 'Image', description: 'Generate custom graphics, realistic photos, and artistic templates.' },
  { name: 'AI Video', slug: 'video', subcategories: ['Video Generation', 'Video Editing', 'Avatars', 'Animations'], iconName: 'Video', description: 'Create high-quality AI videos, adjust clips, and generate human avatars.' },
  { name: 'AI Audio', slug: 'audio', subcategories: ['Voiceovers', 'Music Generation', 'Audio Editing', 'Transcription'], iconName: 'Mic', description: 'Convert text to natural speech, produce custom audio tracks, and transcribe voice logs.' },
  { name: 'AI Coding', slug: 'coding', subcategories: ['Coding Assistant', 'Code Generation', 'Testing & QA', 'DevOps'], iconName: 'Code', description: 'Autogenerate syntax, review repositories, and test apps with intelligent compilers.' },
  { name: 'AI Marketing', slug: 'marketing', subcategories: ['SEO Optimizers', 'Social Media Ads', 'Analytics', 'Email Marketing'], iconName: 'TrendingUp', description: 'Automate marketing campaigns, research search engine keyphrases, and build ad copies.' },
  { name: 'AI Productivity', slug: 'productivity', subcategories: ['Task Automation', 'Note Taking', 'Meeting Assistants', 'Time Trackers'], iconName: 'CheckSquare', description: 'Optimize your workflows, record notes, and automate administrative tasks.' },
  { name: 'AI Design', slug: 'design', subcategories: ['UI/UX Prototyping', 'Vector Generation', 'Logo Design', 'Interior Styling'], iconName: 'Compass', description: 'Generate brand logos, construct website mockups, and draw vector assets.' },
  { name: 'AI Research', slug: 'research', subcategories: ['Literature Review', 'Data Extraction', 'Fact Checking', 'Scientific Analysis'], iconName: 'BookOpen', description: 'Synthesize academic publications, extract datasets, and speed up research paper analysis.' },
  { name: 'AI Education', slug: 'education', subcategories: ['Tutoring', 'Course Creation', 'Flashcards', 'Language Learning'], iconName: 'Award', description: 'AI learning aids, virtual tutors, flashcard study tools, and customized curriculum outlines.' },
  { name: 'AI Business', slug: 'business', subcategories: ['Contract Analysis', 'HR & Recruiting', 'Customer Feedback', 'Presentation Builders'], iconName: 'Briefcase', description: 'Automate contracts reviews, draft client presentations, and manage human resources.' },
  { name: 'AI Finance', slug: 'finance', subcategories: ['Market Analysis', 'Tax Planning', 'Expense Tracking', 'Algorithmic Trading'], iconName: 'DollarSign', description: 'Forecast expense reports, audit taxes, and evaluate stock markets.' },
];

// Initial preloaded Tools
export const initialTools: Tool[] = [
  {
    id: '1',
    name: 'ChatGPT',
    slug: 'chatgpt',
    tagline: 'Leading conversational AI model for text generation and reasoning',
    description: 'ChatGPT is a state-of-the-art conversational AI developed by OpenAI. It excels in a wide array of activities including writing essays, coding scripts, brainstorming product ideas, summarizing complex articles, and simulating detailed scenarios. Backed by advanced GPT-4o and o1 reasoning models, it offers a fast, conversational layout that adapts to customer inquiries instantly.',
    categorySlug: 'writing',
    subCategory: 'AI Summarization',
    pricing: 'freemium',
    pricingUrl: 'https://openai.com/chatgpt/pricing',
    platforms: ['Web', 'iOS', 'Android', 'Mac', 'Windows'],
    pricingPlans: [
      { name: 'Free', price: '$0', billingPeriod: 'free', features: ['Access to GPT-4o mini', 'Basic voice chat', 'Web search integration'] },
      { name: 'Plus', price: '$20', billingPeriod: 'monthly', features: ['Access to GPT-4o and o1 reasoning', 'DALL-E 3 image creation', 'Advanced Voice Mode', 'Custom GPT creation'] },
      { name: 'Pro', price: '$200', billingPeriod: 'monthly', features: ['Unlimited access to o1 reasoning', 'Priority API limits', 'Highest quality code generation'] }
    ],
    features: ['Real-time Web Search', 'Advanced Data Analysis', 'Image Generation (DALL-E)', 'Custom GPT Builders', 'Voice Mode'],
    useCases: ['Drafting emails and long-form blogs', 'Debugging complex code blocks', 'Summarizing meeting minutes or pdf files', 'Learning new academic subjects interactively'],
    pros: ['Very intuitive chat workspace', 'Supports multiple file uploads', 'Active community and plugins', 'Highly versatile across tasks'],
    cons: ['Occasional hallucination of facts', 'Advanced models capped in free tier', 'Privacy concerns on training data'],
    logoUrl: 'https://images.unsplash.com/photo-1678787150117-cdca2776c5b0?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://chatgpt.com',
    rating: 4.8,
    reviewCount: 3,
    isVerified: true,
    isFeatured: true,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-15',
    tags: ['conversational ai', 'writing assistant', 'gpt-4', 'openai']
  },
  {
    id: '2',
    name: 'Midjourney',
    slug: 'midjourney',
    tagline: 'High-fidelity text-to-image generator with superior artistic flair',
    description: 'Midjourney is a text-to-image generator that translates natural text descriptions into highly stylized, photo-realistic, and artistic pictures. Accessible through its web canvas and Discord server, Midjourney is trusted by designers, creative artists, and advertisers for producing cinematic concepts, web vectors, and gorgeous backgrounds.',
    categorySlug: 'image-generation',
    subCategory: 'Text to Image',
    pricing: 'paid',
    pricingUrl: 'https://www.midjourney.com/plans',
    platforms: ['Web'],
    pricingPlans: [
      { name: 'Basic Plan', price: '$10', billingPeriod: 'monthly', features: ['3.3 hours of Fast GPU time', 'Personal gallery', 'General commercial terms'] },
      { name: 'Standard Plan', price: '$30', billingPeriod: 'monthly', features: ['15 hours of Fast GPU time', 'Unlimited Relax GPU time', 'Personal gallery'] },
      { name: 'Pro Plan', price: '$60', billingPeriod: 'monthly', features: ['30 hours of Fast GPU time', 'Stealth mode (hide images)', 'Unlimited Relax GPU time'] }
    ],
    features: ['Aspect Ratio Adjustment', 'Style Tuning and Presets', 'Image-to-Image Generation', 'Inpainting & Outpainting (Zoom/Pan)', 'Character Consistency'],
    useCases: ['Concept art generation for games and films', 'Social media marketing graphics', 'UI design illustrations', 'Prototyping brand assets'],
    pros: ['Industry-leading aesthetic qualities', 'High resolution image exports', 'Vastly versatile prompt interpretations', 'Consistent character updates'],
    cons: ['No free tier available anymore', 'Prompt adjustment has a steep learning curve', 'Discord interface is overwhelming for beginners'],
    logoUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://www.midjourney.com',
    rating: 4.6,
    reviewCount: 2,
    isVerified: true,
    isFeatured: false,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-10',
    tags: ['text to image', 'design generator', 'artwork', 'concept art']
  },
  {
    id: '3',
    name: 'Synthesia',
    slug: 'synthesia',
    tagline: 'Produce high-quality AI videos with lifelike digital avatars',
    description: 'Synthesia is an enterprise-grade AI video creation platform. It allows users to convert text scripts into professional videos with photorealistic digital avatars speaking in over 120 languages. Trusted by global brands for customer onboarding, training presentations, and marketing advertisements, Synthesia eliminates the need for expensive actors, cameras, and physical recording studios.',
    categorySlug: 'video',
    subCategory: 'Avatars',
    pricing: 'paid',
    pricingUrl: 'https://www.synthesia.io/pricing',
    platforms: ['Web'],
    pricingPlans: [
      { name: 'Starter', price: '$22', billingPeriod: 'monthly', features: ['1 avatar', '120 mins of video per year', 'Over 120 languages'] },
      { name: 'Creator', price: '$59', billingPeriod: 'monthly', features: ['3 custom avatars', '360 mins of video per year', 'Audio uploads', 'Custom templates'] },
      { name: 'Enterprise', price: 'Custom', billingPeriod: 'monthly', features: ['Unlimited video creation', 'Brand safety moderation', 'Custom digital avatar matching', 'Dedicated support'] }
    ],
    features: ['140+ Photorealistic Avatars', 'Text-to-Speech in 120+ languages', 'Custom Avatar Creation', 'Screen Recording Integration', 'Powerpoint to Video conversion'],
    useCases: ['Corporate training and learning lessons', 'Customer support onboarding scripts', 'Multi-language content localization', 'Scalable video advertisements'],
    pros: ['Extremely natural digital avatars', 'Huge language support and voices', 'Easy to use slide-deck editor interface', 'Saves thousands of dollars on actor fees'],
    cons: ['Strict AI safety review triggers', 'Basic plan has very limited minutes', 'Limited character movements'],
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://www.synthesia.io',
    rating: 4.5,
    reviewCount: 2,
    isVerified: true,
    isFeatured: true,
    isSponsored: true, // Sponsored listing
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-18',
    tags: ['ai avatar', 'video generator', 'training video', 'translation']
  },
  {
    id: '4',
    name: 'Cursor',
    slug: 'cursor',
    tagline: 'An AI-powered fork of VS Code designed for rapid coding and refactoring',
    description: 'Cursor is a software development IDE built as a fork of VS Code. It embeds advanced LLMs directly into the coding workflow. Developers can query their entire codebase, generate functional code blocks using terminal commands, edit multiple files simultaneously, and predict the next edits using Cursor Tab. It supports complete vscode extension parity, making migration instantaneous.',
    categorySlug: 'coding',
    subCategory: 'Coding Assistant',
    pricing: 'freemium',
    pricingUrl: 'https://www.cursor.com/pricing',
    platforms: ['Windows', 'Mac'],
    pricingPlans: [
      { name: 'Hobby', price: '$0', billingPeriod: 'free', features: ['50 slow GPT-4 queries', '2000 Cursor Tab auto-completes', 'Basic chat sidebar'] },
      { name: 'Pro', price: '$20', billingPeriod: 'monthly', features: ['500 fast premium GPT-4/Claude 3.5 queries', 'Unlimited slow queries', 'Unlimited Cursor Tab', 'Composer (multi-file edit)'] },
      { name: 'Business', price: '$40', billingPeriod: 'monthly', features: ['Enforced zero data retention policies', 'SAML SSO logins', 'Centralized admin billings'] }
    ],
    features: ['Composer (Multi-file writing)', 'Codebase Search & Indexing', 'Cursor Tab (Smart Predict Edit)', 'Inline Prompt Code Generation', 'Terminal Command Generation'],
    useCases: ['Refactoring legacy repositories', 'Quickly generating boilers and tests', 'Scanning codebases for architectural bugs', 'Explaining intricate class functions'],
    pros: ['Native VS Code extension support', 'Extremely fast autocomplete models', 'Multi-file edits speed up refactoring', 'Privacy settings for company repositories'],
    cons: ['Subscription cost adds up for hobbyists', 'Composer edits can sometimes introduce conflicts', 'High computing specs required for large repo indexing'],
    logoUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://www.cursor.com',
    rating: 4.9,
    reviewCount: 4,
    isVerified: true,
    isFeatured: true,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-20',
    tags: ['coding assistant', 'vs code', 'claude-3.5', 'ide']
  },
  {
    id: '5',
    name: 'Jasper',
    slug: 'jasper',
    tagline: 'Enterprise marketing writing platform for consistent brand voice',
    description: 'Jasper is a copywriting platform tailored for marketers and scaling enterprises. Unlike general text tools, Jasper learns your company brand style guide, products details, and active tone of voice. It automates drafting blog posts, social captions, SEO descriptions, and marketing emails while guaranteeing consistency across your global teams.',
    categorySlug: 'marketing',
    subCategory: 'Social Media Ads',
    pricing: 'paid',
    pricingUrl: 'https://www.jasper.ai/pricing',
    platforms: ['Web', 'Chrome Extension'],
    pricingPlans: [
      { name: 'Creator', price: '$39', billingPeriod: 'monthly', features: ['1 brand voice', '50+ templates', 'SEO mode integration', 'Chrome Extension access'] },
      { name: 'Pro', price: '$59', billingPeriod: 'monthly', features: ['3 brand voices', '10 campaign builds', 'Jasper Art image generation', 'Collaboration workspace'] },
      { name: 'Business', price: 'Custom', billingPeriod: 'monthly', features: ['Unlimited brand voices', 'Custom API access', 'SSO security login', 'Dedicated success partner'] }
    ],
    features: ['Brand Voice Training', 'Campaign Generator', 'Marketing Templates', 'SEO Surfer Integration', 'Multi-Language translations'],
    useCases: ['Creating multi-channel ad copy campaigns', 'Drafting long-form blog articles', 'Repurposing contents (e.g. YouTube scripts to blogs)', 'Standardizing emails styles across departments'],
    pros: ['Excellent brand customization options', 'Includes robust content template library', 'Integrates with SEO and Google Drive tools', 'Reduces drafting time significantly'],
    cons: ['Pricing is high compared to raw LLMs', 'Steep learning curve for Campaigns builder', 'Must be fact-checked as content can be repetitive'],
    logoUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://www.jasper.ai',
    rating: 4.4,
    reviewCount: 1,
    isVerified: true,
    isFeatured: false,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-05',
    tags: ['copywriting', 'marketing tools', 'brand voice', 'seo content']
  },
  {
    id: '6',
    name: 'Julius AI',
    slug: 'julius-ai',
    tagline: 'An advanced AI data analyst for graphing and modeling',
    description: 'Julius AI is a conversational data analyst platform. Users can upload raw databases, spreadsheets, CSVs, and Excel sheets, and use simple prompts to generate graphs, execute regressions, clean datasets, and write python scripts. It acts as an autonomous data scientist, visualizer, and modeling assistant.',
    categorySlug: 'finance',
    subCategory: 'Market Analysis',
    pricing: 'freemium',
    pricingUrl: 'https://julius.ai/pricing',
    platforms: ['Web', 'iOS', 'Android'],
    pricingPlans: [
      { name: 'Free', price: '$0', billingPeriod: 'free', features: ['15 messages per month', 'Basic data visualizations', 'Single file upload'] },
      { name: 'Pro', price: '$20', billingPeriod: 'monthly', features: ['Unlimited messages', 'Python environment execution', 'Large multi-dataset uploads', 'Priority response speed'] },
      { name: 'Team', price: '$45', billingPeriod: 'monthly', features: ['Shared team workspace', 'API access for database feeds', 'Dedicated accounts manager'] }
    ],
    features: ['Python Code Execution', 'Automated Visualizations', 'Regression & Modeling', 'Data Cleaning algorithms', 'PDF/Excel processing'],
    useCases: ['Analyzing company financial spreadsheets', 'Plotting scientific experiments data', 'Converting unstructured tables to clean CSVs', 'Generating database summaries'],
    pros: ['Very powerful charting engines', 'Writes and executes actual Python sandbox code', 'Handles messy data formats intelligently', 'Clear step-by-step analytical reasoning'],
    cons: ['Free limits are very restrictive', 'Advanced queries require basic math understanding to verify', 'Can be slow when processing massive datasets'],
    logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://julius.ai',
    rating: 4.7,
    reviewCount: 1,
    isVerified: false,
    isFeatured: false,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-01',
    tags: ['data science', 'spreadsheets', 'charts', 'python scripts']
  },
  {
    id: '7',
    name: 'ElevenLabs',
    slug: 'elevenlabs',
    tagline: 'Ultra-realistic AI voice generator and text-to-speech engine',
    description: 'ElevenLabs is the world\'s leading text-to-speech, voice cloning, and audio generator engine. Using deep learning models, it reproduces human speech with unmatched emotional nuances, intonation, and pitch levels. It allows users to clone their own voices, build artificial voice actors, design cinematic sound effects, and translate audio files while preserving speaker voices.',
    categorySlug: 'audio',
    subCategory: 'Voiceovers',
    pricing: 'freemium',
    pricingUrl: 'https://elevenlabs.io/pricing',
    platforms: ['Web', 'API'],
    pricingPlans: [
      { name: 'Free', price: '$0', billingPeriod: 'free', features: ['10,000 characters per month', '3 custom voices creation', 'Attribution required'] },
      { name: 'Starter', price: '$5', billingPeriod: 'monthly', features: ['30,000 characters per month', '10 custom voices', 'Instant Voice Cloning', 'Commercial license'] },
      { name: 'Creator', price: '$22', billingPeriod: 'monthly', features: ['100,000 characters per month', '30 custom voices', 'Professional voice clone matching'] }
    ],
    features: ['Voice Cloning (Instant & Professional)', 'Speech-to-Speech Converter', 'Multilingual Translation dubbing', 'Sound Effects Generator', 'Voice Design Customizer'],
    useCases: ['Narrating audiobooks and articles', 'Generating voiceovers for YouTube and podcasts', 'Dubbing content in 29+ languages', 'Creating sound effects for games'],
    pros: ['Most natural emotional ranges in speech', 'Cloning accuracy is outstanding', 'Wide public voice library marketplace', 'Easy-to-integrate API'],
    cons: ['Character consumption rate is high for long texts', 'API billing can scale quickly', 'Deepfake ethical security risks'],
    logoUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://elevenlabs.io',
    rating: 4.8,
    reviewCount: 2,
    isVerified: true,
    isFeatured: false,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-19',
    tags: ['text to speech', 'voice cloning', 'sound effects', 'translation']
  },
  {
    id: '8',
    name: 'Phind',
    slug: 'phind',
    tagline: 'An AI search engine built specifically for developers and software engineers',
    description: 'Phind is an intelligent search engine tailored for developers. It scans documentation repositories, forums, and codebases to answer developer queries directly with complete explanations and code samples, rather than returning lists of link files. It utilizes customized models optimized to solve syntax errors and architecture topics.',
    categorySlug: 'coding',
    subCategory: 'Code Generation',
    pricing: 'free',
    pricingUrl: 'https://www.phind.com',
    platforms: ['Web', 'Chrome Extension'],
    pricingPlans: [
      { name: 'Free Plan', price: '$0', billingPeriod: 'free', features: ['Unlimited searches on Phind Model', 'Web browsing capabilities', 'Syntax summaries'] },
      { name: 'Phind Pro', price: '$20', billingPeriod: 'monthly', features: ['Access to Claude 3.5 Sonnet & GPT-4o', '500 high-priority searches', 'Longer context files support'] }
    ],
    features: ['Web-connected search code', 'VS Code Plugin integration', 'Fast Code Interpretation', 'Custom developer documentation indexes'],
    useCases: ['Looking up obscure API endpoints', 'Debugging stack traces', 'Comparing development frameworks', 'Explaining configuration parameters'],
    pros: ['Completely free for standard usage', 'Provides working code scripts with citations', 'Saves time compared to standard search engines', 'Excellent VS Code integration'],
    cons: ['Sometimes includes outdated library version codes', 'Complex logic debugging requires Pro models', 'Chat interface is fairly basic'],
    logoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop'
    ],
    websiteUrl: 'https://www.phind.com',
    rating: 4.5,
    reviewCount: 1,
    isVerified: false,
    isFeatured: false,
    isSponsored: false,
    status: 'approved',
    ownerId: null,
    claimStatus: 'unclaimed',
    lastUpdated: '2026-08-11',
    tags: ['developer search', 'programming engine', 'code solutions', 'syntax search']
  }
];

// Initial reviews seed
export const initialReviews: Review[] = [
  {
    id: 'r1',
    toolId: '1',
    userId: 'u2',
    userName: 'Jane Dev',
    rating: 5,
    ratingDimensions: { easeOfUse: 5, valueForMoney: 4, features: 5, performance: 5 },
    title: 'An indispensable tool for coding and writing',
    comment: 'I use ChatGPT Plus daily for writing technical reports and designing boilerplate code. The new o1 models provide excellent logical breakdowns that save me hours of research time. The DALL-E integration is also great for draft sketches.',
    pros: 'Amazing logic depth, extremely responsive, code templates work 90% of the time.',
    cons: 'Plus limit on reasoning models can be restrictive during peak times.',
    date: '2026-08-18',
    status: 'approved'
  },
  {
    id: 'r2',
    toolId: '1',
    userId: 'u3',
    userName: 'Mark Marketer',
    rating: 4,
    ratingDimensions: { easeOfUse: 5, valueForMoney: 4, features: 4, performance: 4 },
    title: 'Great general assistant, but watch out for hallucinations',
    comment: 'Perfect for drafting marketing social copies. However, you must proofread every fact or stat it provides as it sometimes writes false parameters confidently. Otherwise, the Custom GPT builds are incredibly useful.',
    pros: 'Custom templates, fast speeds, versatile writing styles.',
    cons: 'Hallucinates statistics, data security settings are difficult to customize.',
    date: '2026-08-14',
    status: 'approved'
  },
  {
    id: 'r3',
    toolId: '4',
    userId: 'u2',
    userName: 'Jane Dev',
    rating: 5,
    ratingDimensions: { easeOfUse: 5, valueForMoney: 5, features: 5, performance: 5 },
    title: 'Light years ahead of standard autocomplete extensions',
    comment: 'Cursor has completely replaced VS Code for me. The Composer feature is pure magic, allowing me to modify a script and its corresponding tests in one go. The codebase semantic search also makes exploring massive setups effortless.',
    pros: 'Full VS Code extension compat, Composer multi-file edit is flawless, semantic index.',
    cons: 'Pro subscription can be expensive for independent devs, but it is worth every cent.',
    date: '2026-08-21',
    status: 'approved'
  },
  {
    id: 'r4',
    toolId: '2',
    userId: 'u4',
    userName: 'Alice Designer',
    rating: 4,
    ratingDimensions: { easeOfUse: 3, valueForMoney: 4, features: 5, performance: 5 },
    title: 'Outstanding image output, but Discord is a pain',
    comment: 'The rendering aesthetic quality is incredible, far ahead of DALL-E. But setting up prompts in Discord or searching through personal catalogs is a bit clunky. The web alpha workspace is much better.',
    pros: 'Stunning cinematic renders, fine-grained control parameters.',
    cons: 'Discord interface is complex, no free credits anymore.',
    date: '2026-08-12',
    status: 'approved'
  }
];

// Initial Sponsor Campaigns
export const initialCampaigns: Campaign[] = [
  {
    id: 'c1',
    toolId: '3', // Synthesia
    campaignName: 'Synthesia Video Launch Promo',
    placement: 'homepage-featured',
    startDate: '2026-08-01',
    endDate: '2026-09-01',
    budget: 500.0,
    remainingBudget: 345.5,
    spent: 154.5,
    cpc: 1.5,
    cpm: 12.0,
    impressions: 12875,
    clicks: 103,
    status: 'active'
  },
  {
    id: 'c2',
    toolId: '3', // Synthesia
    campaignName: 'Synthesia Search Ads',
    placement: 'sponsored-search',
    startDate: '2026-08-10',
    endDate: '2026-09-10',
    budget: 300.0,
    remainingBudget: 220.0,
    spent: 80.0,
    cpc: 1.0,
    cpm: 8.0,
    impressions: 10000,
    clicks: 80,
    status: 'active'
  }
];

// Initial Payment Records
export const initialPayments: Payment[] = [
  {
    id: 'p1',
    campaignId: 'c1',
    userId: 'u100', // Tool owner
    amount: 500.0,
    date: '2026-08-01 10:15:30',
    status: 'success',
    invoiceNumber: 'INV-2026-001',
    type: 'sponsorship',
    description: 'Synthesia Video Launch Promo (Homepage Featured)'
  },
  {
    id: 'p2',
    campaignId: 'c2',
    userId: 'u100',
    amount: 300.0,
    date: '2026-08-10 14:22:11',
    status: 'success',
    invoiceNumber: 'INV-2026-002',
    type: 'sponsorship',
    description: 'Synthesia Search Ads (Sponsored Search Placement)'
  }
];

// Initial Blog Posts
export const initialBlogPosts: BlogPost[] = [
  {
    slug: 'best-ai-writing-tools-2026',
    title: 'The Best AI Writing Tools in 2026: Features, Pricing & Comparison',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=400&fit=crop',
    excerpt: 'Looking for the best AI writing assistant? We review the top software tools for blogs, copywriting, emails, and notes, including ChatGPT, Jasper, Copy.ai, and more.',
    content: `Choosing the right AI writing tool can feel overwhelming. With hundreds of generative models hitting the market, developers, marketers, and researchers need custom fits. In this guide, we evaluate the best tools based on speed, brand tone support, pricing, and integration ecosystems.

### 1. ChatGPT (OpenAI)
ChatGPT remains the gold standard for conversational drafting. Its advanced GPT-4o and o1 reasoning capabilities make it suitable for research compilation, outline generation, and complex programming scripts.
- **Best for**: General purpose writing, code assistance, and reasoning.
- **Pricing**: Free tier, Plus costs $20/month.

### 2. Jasper AI
Jasper is specifically tailored for enterprise marketers. It trains on your brand guide and active voice models to ensure consistency across emails, press releases, and campaign files.
- **Best for**: Consistent marketing campaigns and multi-user setups.
- **Pricing**: Plans start at $39/month.

### Conclusion
For general creative drafting, ChatGPT is unmatched. If you run a high-volume marketing department, Jasper offers the brand safety integrations you need. Try out their free trials to see what works best!`,
    category: 'Guides',
    author: 'Editorial Team',
    date: '2026-08-18',
    readTime: '5 min read'
  },
  {
    slug: 'how-to-use-ai-coding-assistants',
    title: 'How AI Coding Assistants Are Speeding Up Development Workflows',
    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=400&fit=crop',
    excerpt: 'AI coding tools are refactoring the way developers work. Find out how Cursor, Copilot, and Phind can help you debug syntax and write clean components faster.',
    content: `The development landscape is shifting rapidly. With the rise of tools like Cursor, GitHub Copilot, and Phind, software engineers are writing components in fractions of the time. 

### What are coding assistants?
These tools embed large language models directly into your IDE (like VS Code). They scan your workspace and context files to provide inline code suggestions, generate boilerplate classes, and explain complex algorithmic flows.

### Top Assistants
1. **Cursor**: A fork of VS Code that supports composer multi-file edits.
2. **GitHub Copilot**: Excellent line-by-line autocompletion.
3. **Phind**: Connects developer search to documentation index tags.

By adopting these tools, teams report a 40% reduction in debugging times. Start leveraging semantic context searches to streamline your sprints!`,
    category: 'Tutorials',
    author: 'Tech Writer',
    date: '2026-08-20',
    readTime: '4 min read'
  }
];

// Initial Collections
export const initialCollections: Collection[] = [
  {
    id: 'col1',
    userId: 'admin-id',
    name: 'Essential Developer Tools',
    description: 'Curated list of AI tools every software engineer and programmer should adopt to write, test, and debug code faster.',
    isPublic: true,
    tools: ['4', '8'], // Cursor, Phind
    dateCreated: '2026-08-15'
  },
  {
    id: 'col2',
    userId: 'admin-id',
    name: 'Top Content Creator Kit',
    description: 'Transform your writing, graphics, and video production workflow with these powerful AI assistants.',
    isPublic: true,
    tools: ['1', '2', '3', '7'], // ChatGPT, Midjourney, Synthesia, ElevenLabs
    dateCreated: '2026-08-19'
  }
];

// Preloaded user profiles
export const seedUsers: User[] = [
  { id: 'admin-id', name: 'System Admin', email: 'mevishal1130@gmail.com', role: 'admin', password: 'password123', interests: [] },
  { id: 'owner-id', name: 'Synthesia Owner', email: 'owner@synthesia.io', role: 'owner', password: 'password123', interests: [] },
  { id: 'user-id', name: 'John Doe', email: 'john@gmail.com', role: 'user', password: 'password123', interests: ['writing', 'coding'] }
];

// Seed initial audit log
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log1',
    userId: 'admin-id',
    userName: 'System Admin',
    action: 'Seed Database',
    details: 'Preloaded initial categories, tools, reviews, and blog articles into local storage.',
    timestamp: '2026-08-21 12:00:00'
  }
];

export const initialAffiliateLinks: AffiliateLink[] = [
  {
    id: 'aff1',
    toolId: '3', // Synthesia
    originalUrl: 'https://synthesia.io',
    affiliateUrl: 'https://synthesia.io/?ref=aifynest',
    network: 'PartnerStack',
    programName: 'Synthesia Affiliate Program',
    trackingId: 'aif_syn_09',
    status: 'active',
    startDate: '2026-08-01',
    notes: 'Primary video sponsor channel',
    commissionPercent: 20,
    cookieDuration: 60,
    clicks: 142,
    conversions: 8,
    revenue: 160
  },
  {
    id: 'aff2',
    toolId: '1', // ChatGPT
    originalUrl: 'https://chatgpt.com',
    affiliateUrl: 'https://openai.com/chatgpt/?ref=aifynest_exclusive',
    network: 'Direct Program',
    programName: 'OpenAI Enterprise Affiliate',
    trackingId: 'aif_gpt_plus',
    status: 'active',
    startDate: '2026-08-05',
    notes: 'Premium chat referral integration',
    commissionPercent: 10,
    cookieDuration: 30,
    clicks: 284,
    conversions: 12,
    revenue: 240
  }
];

export const initialNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'admin-id',
    title: 'New AI Tool Submission',
    message: 'A builder submitted PDFWriter for review in the AI Writing category.',
    date: '2026-08-21',
    read: false,
    type: 'submission'
  },
  {
    id: 'notif2',
    userId: 'owner-id',
    title: 'Tool Approved! 🎉',
    message: 'Your listing "Synthesia" has been verified and published to AIFynest.',
    date: '2026-08-21',
    read: false,
    type: 'submission'
  },
  {
    id: 'notif3',
    userId: 'owner-id',
    title: 'Sponsorship Active',
    message: 'Your campaign "Synthesia Launch Boost" is now live and tracking clicks.',
    date: '2026-08-21',
    read: true,
    type: 'payment'
  }
];

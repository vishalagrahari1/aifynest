/* migrate_to_supabase.js */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read environment variables or load from file
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-placeholder';

if (supabaseUrl.includes('placeholder') || supabaseServiceKey.includes('placeholder')) {
  console.log('WARNING: Set process.env.VITE_SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY first.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const backupFilePath = './localstorage_backup.json';

const runMigration = async () => {
  console.log('Starting data migration to Supabase PostgreSQL...');

  if (!fs.existsSync(backupFilePath)) {
    console.error(`Error: Backup file "${backupFilePath}" not found. Please export your localStorage data and place it here.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupFilePath, 'utf8');
  const backup = JSON.parse(raw);

  const usersList = backup.ai_users || [];
  const toolsList = backup.ai_tools || [];
  const categoriesList = backup.ai_categories || [];
  const claimsList = backup.ai_claims || [];
  const reviewsList = backup.ai_reviews || [];
  const campaignsList = backup.ai_campaigns || [];
  const paymentsList = backup.ai_payments || [];
  const auditLogsList = backup.ai_audit_logs || [];
  const eventsList = backup.ai_analytics_events || [];
  const notificationsList = backup.ai_notifications || [];

  // Mappings dictionary: legacy_user_id -> supabase_auth_id (UUID)
  const userMap = {};

  // 1. Migrate Users & Profiles
  console.log(`\n1. Migrating ${usersList.length} users...`);
  for (const user of usersList) {
    const legacyId = user.id;
    // Check if user already exists in auth.users by email
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    let authUser = existingUser?.users?.find(u => u.email.toLowerCase() === user.email.toLowerCase());

    if (!authUser) {
      console.log(`Creating auth user: ${user.email}`);
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password || 'password123',
        email_confirm: true,
        user_metadata: { name: user.name, role: user.role }
      });
      if (error) {
        console.error(`Failed to create auth user ${user.email}:`, error.message);
        continue;
      }
      authUser = created.user;
    }

    userMap[legacyId] = authUser.id;

    // Verify profile exists in public.profiles (trigger should handle it, but update optional metadata just in case)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: user.name,
        role: user.role,
        interests: user.interests || []
      })
      .eq('id', authUser.id);

    if (profileError) {
      console.error(`Error updating profile metadata for ${user.email}:`, profileError.message);
    }
  }

  // 2. Migrate Categories
  console.log(`\n2. Migrating ${categoriesList.length} categories...`);
  for (const cat of categoriesList) {
    const { error } = await supabase.from('categories').upsert({
      slug: cat.slug,
      name: cat.name,
      icon_name: cat.iconName,
      description: cat.description,
      subcategories: cat.subcategories || []
    });
    if (error) console.error(`Error migrating category ${cat.slug}:`, error.message);
  }

  // Mappings dictionary: legacy_tool_id -> supabase_tool_id (UUID)
  const toolMap = {};

  // 3. Migrate Tools
  console.log(`\n3. Migrating ${toolsList.length} tools...`);
  for (const tool of toolsList) {
    const mappedOwnerId = tool.ownerId ? (userMap[tool.ownerId] || null) : null;
    const { data: inserted, error } = await supabase
      .from('tools')
      .upsert({
        name: tool.name,
        slug: tool.slug,
        tagline: tool.tagline,
        description: tool.description,
        category_slug: tool.categorySlug,
        sub_category: tool.subCategory,
        pricing: tool.pricing || 'free',
        pricing_url: tool.pricingUrl || '',
        platforms: tool.platforms || ['Web'],
        pricing_plans: tool.pricingPlans || [],
        features: tool.features || [],
        use_cases: tool.useCases || [],
        pros: tool.pros || [],
        cons: tool.cons || [],
        logo_url: tool.logoUrl,
        screenshot_urls: tool.screenshotUrls || [],
        video_url: tool.videoUrl || null,
        website_url: tool.websiteUrl,
        rating: tool.rating || 0.0,
        review_count: tool.reviewCount || 0,
        is_verified: tool.isVerified || false,
        is_featured: tool.isFeatured || false,
        is_sponsored: tool.isSponsored || false,
        status: tool.status || 'approved',
        owner_id: mappedOwnerId,
        claim_status: tool.claimStatus || 'unclaimed',
        last_updated: tool.lastUpdated || new Date().toISOString().split('T')[0],
        tags: tool.tags || []
      })
      .select('id, slug')
      .single();

    if (error) {
      console.error(`Error migrating tool ${tool.name}:`, error.message);
    } else if (inserted) {
      toolMap[tool.id] = inserted.id;
    }
  }

  // 4. Migrate Claims
  console.log(`\n4. Migrating ${claimsList.length} claim requests...`);
  for (const claim of claimsList) {
    const mappedToolId = toolMap[claim.toolId];
    const mappedClaimantId = userMap[claim.claimantId];
    if (!mappedToolId || !mappedClaimantId) {
      console.log(`Skipping claim ${claim.id}: missing references`);
      continue;
    }

    const { error } = await supabase.from('tool_claims').insert({
      tool_id: mappedToolId,
      claimant_id: mappedClaimantId,
      company_name: claim.companyName,
      work_email: claim.workEmail,
      verification_info: claim.verificationInfo,
      proof_url: claim.proofUrl || null,
      status: claim.status || 'pending',
      submitted_at: claim.submittedAt || new Date().toISOString(),
      reviewed_at: claim.reviewedAt || null,
      reviewed_by: claim.reviewedBy ? (userMap[claim.reviewedBy] || null) : null
    });
    if (error) console.error(`Error migrating claim ${claim.id}:`, error.message);
  }

  // 5. Migrate Reviews
  console.log(`\n5. Migrating ${reviewsList.length} reviews...`);
  for (const rev of reviewsList) {
    const mappedToolId = toolMap[rev.toolId];
    const mappedUserId = userMap[rev.userId];
    if (!mappedToolId || !mappedUserId) {
      console.log(`Skipping review ${rev.id}: missing references`);
      continue;
    }

    const { error } = await supabase.from('reviews').insert({
      tool_id: mappedToolId,
      user_id: mappedUserId,
      content: rev.content,
      rating: rev.rating,
      ease_of_use: rev.rating, // default mapping values
      value_for_money: rev.rating,
      features: rev.rating,
      performance: rev.rating,
      status: rev.status || 'approved',
      created_at: rev.createdAt || new Date().toISOString()
    });
    if (error) console.error(`Error migrating review ${rev.id}:`, error.message);
  }

  // 6. Migrate Favorites (lookup mapping)
  console.log('\n6. Migrating favorites...');
  // Read unique collections representing favorites
  const favoritesDone = new Set();
  const collectionsList = backup.ai_collections || [];
  for (const col of collectionsList) {
    const mappedUserId = userMap[col.userId];
    if (!mappedUserId || col.name !== 'My Favorites') continue;

    for (const legacyToolId of (col.tools || [])) {
      const mappedToolId = toolMap[legacyToolId];
      if (!mappedToolId) continue;

      const fKey = `${mappedUserId}_${mappedToolId}`;
      if (favoritesDone.has(fKey)) continue;

      const { error } = await supabase.from('favorites').insert({
        user_id: mappedUserId,
        tool_id: mappedToolId
      });
      if (error) {
        if (!error.message.includes('unique_user_favorite')) {
          console.error(`Error migrating favorite ${fKey}:`, error.message);
        }
      } else {
        favoritesDone.add(fKey);
      }
    }
  }

  // 7. Migrate Analytics Events
  console.log(`\n7. Migrating ${eventsList.length} analytics records...`);
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const mappedEvents = eventsList.map(e => {
    return {
      event_type: e.eventType,
      tool_id: toolMap[e.toolId] || null,
      timestamp: e.timestamp || new Date().toISOString(),
      session_id: e.sessionId || 'legacy_migration_session',
      user_id: e.userId ? (userMap[e.userId] || null) : null,
      referrer: e.referrer || 'Direct',
      device: e.device || 'desktop',
      browser: e.browser || 'Unknown',
      path: e.path || '/'
    };
  });

  const eventChunks = chunkArray(mappedEvents, 250);
  let chunkIdx = 1;
  for (const chunk of eventChunks) {
    console.log(`Uploading chunk ${chunkIdx}/${eventChunks.length}...`);
    const { error } = await supabase.from('analytics_events').insert(chunk);
    if (error) console.error(`Error migrating chunk ${chunkIdx}:`, error.message);
    chunkIdx++;
  }

  console.log('\nMigration run completed successfully!');
};

runMigration();

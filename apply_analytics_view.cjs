/* apply_analytics_view.cjs */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://izjpavrrcbglrdvrqeng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

async function runMigration() {
  console.log('Creating database view tools_with_analytics in Supabase...');
  
  try {
    const { error } = await serviceClient.rpc('execute_sql_query', {
      sql_text: `
        CREATE OR REPLACE VIEW public.tools_with_analytics AS
        SELECT t.*,
               COALESCE((SELECT COUNT(*)::integer FROM public.analytics_events WHERE tool_id = t.id AND event_type = 'tool_view'), 0) AS views_count,
               COALESCE((SELECT COUNT(*)::integer FROM public.analytics_events WHERE tool_id = t.id AND event_type = 'website_click'), 0) AS clicks_count
        FROM public.tools t;
      `
    });

    if (error) {
      console.warn('RPC execute failed, trying to execute through SQL query direct client...', error.message);
    } else {
      console.log('Database view tools_with_analytics created successfully.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();

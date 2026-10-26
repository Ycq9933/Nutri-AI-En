// Configure after deployment. Keep keys marked PUBLIC only here; never place OpenAI or Supabase service-role keys in browser code.
window.NUTRIAI_CONFIG = {
  API_BASE: '', // e.g. https://nutriai-api.your-subdomain.workers.dev
  SUPABASE_URL: '', // e.g. https://xxxxx.supabase.co
  SUPABASE_ANON_KEY: '' // Supabase publishable/anon key (NOT service role)
};

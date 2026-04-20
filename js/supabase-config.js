// ============================================================
// NexPulse — Supabase client
// You will fill in SUPABASE_URL and SUPABASE_ANON_KEY after
// creating your Supabase project (see docs/DEPLOY.md step 2).
// ============================================================

// TODO: Replace these with YOUR values from Supabase dashboard
//   (Dashboard → Project Settings → API)
const SUPABASE_URL      = 'https://tckuzseqqfgqnxqnqmxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja3V6c2VxcWZncW54cW5xbXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODAxMDksImV4cCI6MjA5MjI1NjEwOX0.ycqept-UQsrbzPRS041fAOwEDSZpgLTtI329sGUGAnk';

// Load Supabase JS library from CDN (no build tools needed)
// This creates the global `supabase` object from the CDN script tag in HTML
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for other modules
window.sb = sb;

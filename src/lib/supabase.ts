import { createClient } from '@supabase/supabase-js';

// Supabase publishable key is intended for client-side use.
// Data access is protected by Auth and Row Level Security policies.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://sdyqnbwseydwppbejejw.supabase.co';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'sb_publishable_lKrnpLzVW2e88C9DlP8lyw_NHTFitSd';

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url, anonKey) : null;

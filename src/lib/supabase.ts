import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url!, anonKey!) : null;

// Keep service-role keys out of the frontend. Only the public anon key belongs here;
// access is restricted by Row Level Security policies in Supabase.

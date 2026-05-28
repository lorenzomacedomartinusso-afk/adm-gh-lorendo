import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://dojiqamkvlobqqhatdcu.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvamlxYW1rdmxvYnFxaGF0ZGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTc3NzgsImV4cCI6MjA5NTU3Mzc3OH0.QsN8KZo5irJJlSEG1DSzUmFU_u98H_NJNuBzSb0sFR0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseKey = 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchQuestions(difficulty?: string) {
  // Returns hardcoded questions as fallback - Supabase not configured for demo
  return { data: null, error: new Error('Demo mode - using local data') };
}

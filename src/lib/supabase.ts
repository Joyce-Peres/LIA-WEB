/**
 * Supabase Client
 *
 * Configured Supabase client instance for database operations.
 *
 * @module lib/supabase
 * @category Infrastructure
 */

import { createClient } from '@supabase/supabase-js'
import { getRequiredEnv } from './env'

// Get environment variables
const supabaseUrl = getRequiredEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY')

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Since we're using local auth, we might not need persistent sessions
    persistSession: false,
  },
})

// Export client type for TypeScript
export type { SupabaseClient } from '@supabase/supabase-js'

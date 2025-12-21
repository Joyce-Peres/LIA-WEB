import { createClient } from '@supabase/supabase-js'

import { getRequiredEnv } from './env'

const supabaseUrl = getRequiredEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)



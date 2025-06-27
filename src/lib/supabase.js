import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vgkktmfrpprifzpcjvnx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna2t0bWZycHByaWZ6cGNqdm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDA1NDQsImV4cCI6MjA2MzUxNjU0NH0.sos0NRA4OgFoSTsKX7eJxE7h9zEl21frm-I5wcrtLKw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

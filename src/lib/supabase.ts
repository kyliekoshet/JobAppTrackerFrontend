import { createClient } from '@supabase/supabase-js'

// These should match your Supabase project settings
const supabaseUrl = 'https://gdpirggdsuphgtznfvvk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcGlyZ2dkc3VwaGd0em5mdnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTkwODUsImV4cCI6MjA2OTU3NTA4NX0.zJ9ATMtPHj4kP28uoAUJKoFyc0qFBtsIpohnr0zLtTU' // You'll need to get this from Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
} 
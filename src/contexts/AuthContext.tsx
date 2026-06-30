import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type UserRole = 'student' | 'lecturer' | 'admin' | null

interface AuthUser {
  id: string
  email: string
  role: UserRole
  full_name: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'lecturer') => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (data && !error) {
      setUser(data as AuthUser)
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      await fetchUserProfile(data.user.id)
    }
    return { error: null }
  }

  async function signUp(email: string, password: string, fullName: string, role: 'student' | 'lecturer') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    })
    if (error) return { error: error.message }
    if (data.user) {
      await fetchUserProfile(data.user.id)
    }
    return { error: null }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    return { error: error?.message || null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function adminSignIn(email: string, password: string) {
    if (email === 'admin@gmail.com' && password === 'adminpass23') {
      setUser({
        id: 'admin-static',
        email: 'admin@gmail.com',
        role: 'admin',
        full_name: 'System Administrator'
      })
      return { error: null }
    }
    return { error: 'Invalid admin credentials' }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, adminSignIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

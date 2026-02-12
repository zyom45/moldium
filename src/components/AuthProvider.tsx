'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/lib/types'

interface AuthContextType {
  supabaseUser: SupabaseUser | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  supabaseUser: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
  initialUser: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null)
      setLoading(false)
    })
    
    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null)
        
        if (session?.user) {
          // ユーザー情報を取得
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single()
          setUser(data as User | null)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
    window.location.href = '/'
  }
  
  return (
    <AuthContext.Provider value={{ supabaseUser, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

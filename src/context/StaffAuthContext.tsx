import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

export interface StaffPermissions {
  rdv_view: boolean; rdv_confirm: boolean; rdv_cancel: boolean; rdv_edit: boolean
  planning_view: boolean; planning_create: boolean; planning_edit: boolean; planning_delete: boolean
  patients_view: boolean; stats_view: boolean
}

interface StaffUser {
  id: number; name: string; email: string
  roles: string[]
  can_confirm_rdv: boolean; can_cancel_rdv: boolean; can_renvoyer_rdv: boolean
  permissions?: StaffPermissions
}

interface StaffAuthContextType {
  staff: StaffUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const StaffAuthContext = createContext<StaffAuthContextType>({} as StaffAuthContextType)

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [staff,   setStaff]   = useState<StaffUser | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('hgy_staff_token').then(async t => {
      if (t) {
        const s = await SecureStore.getItemAsync('hgy_staff')
        if (s) { setToken(t); setStaff(JSON.parse(s)) }
      }
      setLoading(false)
    })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('Staff login attempt:', email, API)
      const r = await fetch(`${API}/gestion/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const text = await r.text()
      console.log('Staff login response:', r.status, text.slice(0, 200))
      const d = JSON.parse(text)
      if (d.success && d.token) {
        await SecureStore.setItemAsync('hgy_staff_token', d.token)
        await SecureStore.setItemAsync('hgy_staff', JSON.stringify(d.user))
        setToken(d.token); setStaff(d.user)
        return { success: true }
      }
      return { success: false, message: d.message || 'Identifiants incorrects.' }
    } catch (e: any) {
      console.log('Staff login error:', e?.message)
      return { success: false, message: 'Erreur réseau: ' + (e?.message || '') }
    }
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('hgy_staff_token')
    await SecureStore.deleteItemAsync('hgy_staff')
    setToken(null); setStaff(null)
  }

  return (
    <StaffAuthContext.Provider value={{ staff, token, loading, login, logout, isAuthenticated: !!staff }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export const useStaffAuth = () => useContext(StaffAuthContext)

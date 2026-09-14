import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

interface Medecin {
  id: number
  nom_complet: string
  email: string
  specialite?: any
  photo?: string
}

interface MedecinAuthContextType {
  medecin: Medecin | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const MedecinAuthContext = createContext<MedecinAuthContextType>({} as MedecinAuthContextType)

export function MedecinAuthProvider({ children }: { children: React.ReactNode }) {
  const [medecin, setMedecin] = useState<Medecin | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('hgy_medecin_token').then(async t => {
      if (t) {
        const m = await SecureStore.getItemAsync('hgy_medecin')
        if (m) { setToken(t); setMedecin(JSON.parse(m)) }
      }
      setLoading(false)
    })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const r = await fetch(`${API}/medecin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const d = await r.json()
      if (d.success && d.token) {
        await SecureStore.setItemAsync('hgy_medecin_token', d.token)
        await SecureStore.setItemAsync('hgy_medecin', JSON.stringify(d.medecin))
        setToken(d.token); setMedecin(d.medecin)
        return { success: true }
      }
      return { success: false, message: d.message || 'Identifiants incorrects.' }
    } catch { return { success: false, message: 'Erreur réseau.' } }
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('hgy_medecin_token')
    await SecureStore.deleteItemAsync('hgy_medecin')
    setToken(null); setMedecin(null)
  }

  return (
    <MedecinAuthContext.Provider value={{ medecin, token, loading, login, logout, isAuthenticated: !!medecin }}>
      {children}
    </MedecinAuthContext.Provider>
  )
}

export const useMedecinAuth = () => useContext(MedecinAuthContext)

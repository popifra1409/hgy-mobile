import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

interface Patient {
  id: number
  nom: string
  prenom: string
  telephone: string
  email?: string
  code_patient: string
  numero_dossier: string
  actif: boolean
}

interface AuthContextType {
  patient: Patient | null
  token: string | null
  loading: boolean
  loginByPhone: (telephone: string, code: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoredAuth()
  }, [])

  const loadStoredAuth = async () => {
    try {
      const storedToken   = await SecureStore.getItemAsync('hgy_token')
      const storedPatient = await SecureStore.getItemAsync('hgy_patient')
      if (storedToken && storedPatient) {
        setToken(storedToken)
        setPatient(JSON.parse(storedPatient))
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const loginByPhone = async (telephone: string, code: string): Promise<boolean> => {
    try {
      console.log('Patient login attempt:', telephone, API)
      const res = await fetch(`${API}/patient/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ login: telephone, password: code }),
      })
      const text = await res.text()
      console.log('Patient login response:', res.status, text.slice(0, 300))
      const data = JSON.parse(text)
      if (data.success && data.token) {
        await SecureStore.setItemAsync('hgy_token', data.token)
        await SecureStore.setItemAsync('hgy_patient', JSON.stringify(data.patient))
        setToken(data.token)
        setPatient(data.patient)
        return true
      }
      return false
    } catch (e: any) {
      console.log('Patient login error:', e?.message)
      return false
    }
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('hgy_token')
    await SecureStore.deleteItemAsync('hgy_patient')
    setToken(null)
    setPatient(null)
  }

  return (
    <AuthContext.Provider value={{
      patient, token, loading,
      loginByPhone, logout,
      isAuthenticated: !!patient,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

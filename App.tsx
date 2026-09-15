import React, { useEffect, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppNavigator from './src/navigation/AppNavigator'
import { LangProvider } from './src/context/LangContext'
import { AuthProvider } from './src/context/AuthContext'
import { MedecinAuthProvider } from './src/context/MedecinAuthContext'
import { StaffAuthProvider } from './src/context/StaffAuthContext'
import { initNotifications, registerForPushNotifications } from './src/services/notifications'

export default function App() {
  useEffect(() => {
    // Init notifications de façon sécurisée
    initNotifications()
    registerForPushNotifications()
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MedecinAuthProvider>
          <StaffAuthProvider>
            <LangProvider>
              <StatusBar style="light" />
              <AppNavigator />
            </LangProvider>
          </StaffAuthProvider>
        </MedecinAuthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

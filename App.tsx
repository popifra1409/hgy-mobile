import React, { useEffect, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import AppNavigator from './src/navigation/AppNavigator'
import { LangProvider } from './src/context/LangContext'
import { AuthProvider } from './src/context/AuthContext'
import { MedecinAuthProvider } from './src/context/MedecinAuthContext'
import { StaffAuthProvider }   from './src/context/StaffAuthContext'
import { registerForPushNotifications } from './src/services/notifications'

export default function App() {
  const notifListener    = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    // Demande permission au démarrage
    registerForPushNotifications()

    // Écoute notifications reçues
    notifListener.current = Notifications.addNotificationReceivedListener(n => {
      console.log('🔔 Notification:', n.request.content.title)
    })

    // Écoute clics sur notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
      console.log('👆 Clic notification:', r.notification.request.content.data)
    })

    return () => {
      if (notifListener.current?.remove) notifListener.current.remove()
      if (responseListener.current?.remove) responseListener.current.remove()
    }
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

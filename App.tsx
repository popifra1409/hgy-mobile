import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppNavigator from './src/navigation/AppNavigator'
import { LangProvider } from './src/context/LangContext'
import { AuthProvider } from './src/context/AuthContext'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LangProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </LangProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

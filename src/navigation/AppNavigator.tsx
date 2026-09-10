import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text } from 'react-native'
import { COLORS } from '../constants/theme'
import { useAuth } from '../context/AuthContext'

// Screens
import AccueilScreen       from '../screens/AccueilScreen'
import RendezVousScreen    from '../screens/RendezVousScreen'
import SpecialistesScreen  from '../screens/SpecialistesScreen'
import ChatbotScreen       from '../screens/ChatbotScreen'
import MonEspaceScreen     from '../screens/MonEspaceScreen'
import LoginScreen         from '../screens/LoginScreen'
import RdvDetailScreen     from '../screens/RdvDetailScreen'
import ResultatScreen      from '../screens/ResultatScreen'
import MedecinDetailScreen from '../screens/MedecinDetailScreen'
import NotificationsScreen from '../screens/NotificationsScreen'

const Tab   = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10, marginTop: 2,
        color: focused ? COLORS.primary : COLORS.gray400,
        fontWeight: focused ? '700' : '400',
      }}>{label}</Text>
    </View>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray200,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
      }}>
      <Tab.Screen name="Accueil" component={AccueilScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Accueil" focused={focused} /> }} />
      <Tab.Screen name="RendezVous" component={RendezVousScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="RDV" focused={focused} /> }} />
      <Tab.Screen name="Specialistes" component={SpecialistesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👨‍⚕️" label="Médecins" focused={focused} /> }} />
      <Tab.Screen name="MonEspace" component={MonEspaceScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Mon Espace" focused={focused} /> }} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💬" label="HGY" focused={focused} /> }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"           component={MainTabs} />
        <Stack.Screen name="Login"          component={LoginScreen} />
        <Stack.Screen name="RdvDetail"      component={RdvDetailScreen} />
        <Stack.Screen name="Resultat"       component={ResultatScreen} />
        <Stack.Screen name="MedecinDetail"  component={MedecinDetailScreen} />
        <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

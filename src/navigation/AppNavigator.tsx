import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text } from 'react-native'
import { COLORS } from '../constants/theme'

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
import ArticleScreen       from '../screens/ArticleScreen'
import EmissionScreen      from '../screens/EmissionScreen'
import UrgencesScreen      from '../screens/UrgencesScreen'
import BlogScreen          from '../screens/BlogScreen'
import SettingsScreen      from '../screens/SettingsScreen'

const Tab   = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabIcon({ emoji, label, focused }: { emoji:string; label:string; focused:boolean }) {
  return (
    <View style={{ alignItems:'center', paddingTop:2 }}>
      <Text style={{ fontSize:20 }}>{emoji}</Text>
      <Text style={{ fontSize:9, marginTop:1, color: focused ? COLORS.primary : COLORS.gray400, fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  )
}

// Stack interne pour Accueil (permet navigation vers Article/Emission/Urgences)
const AccueilStack = createNativeStackNavigator()
function AccueilStackScreen() {
  return (
    <AccueilStack.Navigator screenOptions={{ headerShown: false }}>
      <AccueilStack.Screen name="AccueilHome"  component={AccueilScreen} />
      <AccueilStack.Screen name="Article"      component={ArticleScreen} getId={({ params }) => (params as any)?.slug} />
      <AccueilStack.Screen name="Emission"     component={EmissionScreen} getId={({ params }) => String((params as any)?.id)} />
      <AccueilStack.Screen name="Urgences"     component={UrgencesScreen} />
      <AccueilStack.Screen name="Blog"         component={BlogScreen} />
      <AccueilStack.Screen name="Settings"     component={SettingsScreen} />
    </AccueilStack.Navigator>
  )
}

// Stack interne pour Mon Espace
const EspaceStack = createNativeStackNavigator()
function EspaceStackScreen() {
  return (
    <EspaceStack.Navigator screenOptions={{ headerShown: false }}>
      <EspaceStack.Screen name="EspaceHome"    component={MonEspaceScreen} />
      <EspaceStack.Screen name="Login"         component={LoginScreen} />
      <EspaceStack.Screen name="RdvDetail"     component={RdvDetailScreen} />
      <EspaceStack.Screen name="Resultat"      component={ResultatScreen} />
      <EspaceStack.Screen name="Notifications" component={NotificationsScreen} />
      <EspaceStack.Screen name="Settings"      component={SettingsScreen} />
    </EspaceStack.Navigator>
  )
}

// Stack interne pour Spécialistes
const SpecStack = createNativeStackNavigator()
function SpecStackScreen() {
  return (
    <SpecStack.Navigator screenOptions={{ headerShown: false }}>
      <SpecStack.Screen name="SpecHome"       component={SpecialistesScreen} />
      <SpecStack.Screen name="MedecinDetail"  component={MedecinDetailScreen} />
      <SpecStack.Screen name="RendezVousFromSpec" component={RendezVousScreen} />
    </SpecStack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: COLORS.white,
          borderTopWidth:1, borderTopColor: COLORS.gray200,
          elevation:12, shadowColor:'#000',
          shadowOpacity:0.1, shadowRadius:16,
          position: 'absolute',
          bottom: 0,
        },
      }}>
      <Tab.Screen name="AccueilTab" component={AccueilStackScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Accueil" focused={focused} /> }} />
      <Tab.Screen name="RendezVous" component={RendezVousScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="RDV" focused={focused} /> }} />
      <Tab.Screen name="SpecialistesTab" component={SpecStackScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👨‍⚕️" label="Médecins" focused={focused} /> }} />
      <Tab.Screen name="MonEspaceTab" component={EspaceStackScreen}
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
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { COLORS, SHADOW } from '../constants/theme'

const MENU_ITEMS = (lang: string, patient: any) => [
  {
    section: lang === 'fr' ? '📱 Services' : '📱 Services',
    items: [
      { icon: '💬', label: lang==='fr'?'Assistant HGY AI':'HGY AI Assistant', screen: 'Chatbot', color: '#7C3AED' },
      { icon: '🔔', label: lang==='fr'?'Notifications':'Notifications',      screen: 'Notifications', color: '#F59E0B' },
      { icon: '🕐', label: lang==='fr'?'Heures de visite':'Visiting hours',  screen: 'HeuresVisite', color: '#059669' },
      { icon: '🚨', label: lang==='fr'?'Urgences':'Emergency',               screen: 'Urgences', color: '#DC2626' },
      { icon: '📰', label: lang==='fr'?'Actualités & Allo HGY':'News & Allo HGY', screen: 'Blog', color: '#2B6CB0' },
    ]
  },
  {
    section: lang === 'fr' ? '⚙️ Préférences' : '⚙️ Preferences',
    items: [
      { icon: '⚙️', label: lang==='fr'?'Paramètres':'Settings', screen: 'Settings', color: '#6B7280' },
    ]
  },
  {
    section: lang === 'fr' ? '🔐 Accès professionnel' : '🔐 Professional access',
    items: [
      { icon: '🩺', label: lang==='fr'?'Espace Médecin':'Doctor Portal',      screen: 'MedecinTab', color: COLORS.primary },
      { icon: '👩‍💼', label: lang==='fr'?'Espace Gestion':'Staff Portal',       screen: 'StaffTab',   color: '#0F766E' },
    ]
  },
]

export default function PlusScreen({ navigation }: any) {
  const { lang } = useLang()
  const { patient } = useAuth()

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>☰ {lang==='fr'?'Menu':'Menu'}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>
        {MENU_ITEMS(lang, patient).map((section, si) => (
          <View key={si} style={{ marginBottom:20 }}>
            <Text style={s.sectionTitle}>{section.section}</Text>
            <View style={s.card}>
              {section.items.map((item, i) => (
                <TouchableOpacity key={i}
                  style={[s.menuRow, i < section.items.length-1 && s.menuRowBorder]}
                  onPress={() => navigation.navigate(item.screen)}>
                  <View style={[s.menuIcon, { backgroundColor: item.color + '18' }]}>
                    <Text style={{ fontSize:22 }}>{item.icon}</Text>
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={{ color:COLORS.gray400, fontSize:18 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Contact rapide */}
        <View style={s.contactCard}>
          <Text style={s.contactTitle}>📞 {lang==='fr'?'Nous contacter':'Contact us'}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:+237657603039')}>
            <Text style={s.contactLink}>🚨 +237 6 57 60 30 39</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/237657603039')}>
            <Text style={[s.contactLink, { color:'#25D366' }]}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.version}>HGY Mobile v1.0 · Excellence · Empathie · Modernisme</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bgAlt },
  header:       { backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  headerTitle:  { fontSize:18, fontWeight:'800', color:'#fff' },
  sectionTitle: { fontSize:11, fontWeight:'700', color:COLORS.gray400, textTransform:'uppercase', letterSpacing:1, marginBottom:8, paddingHorizontal:4 },
  card:         { backgroundColor:'#fff', borderRadius:16, overflow:'hidden', ...SHADOW.sm },
  menuRow:      { flexDirection:'row', alignItems:'center', gap:14, padding:14 },
  menuRowBorder:{ borderBottomWidth:1, borderBottomColor:COLORS.gray100 },
  menuIcon:     { width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center' },
  menuLabel:    { flex:1, fontSize:15, fontWeight:'600', color:COLORS.black },
  contactCard:  { backgroundColor:COLORS.primary, borderRadius:16, padding:20, marginBottom:16 },
  contactTitle: { fontSize:15, fontWeight:'800', color:'#fff', marginBottom:12 },
  contactLink:  { fontSize:15, fontWeight:'700', color:'rgba(255,255,255,.9)', marginBottom:8 },
  version:      { fontSize:11, color:COLORS.gray400, textAlign:'center', fontStyle:'italic' },
})

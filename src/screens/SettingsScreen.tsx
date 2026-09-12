import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { COLORS, SHADOW } from '../constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function SettingsScreen({ navigation }: any) {
  const { lang, toggleLang } = useLang()
  const { logout, isAuthenticated } = useAuth()
  const [darkMode, setDarkMode]     = useState(false)
  const [fontSize, setFontSize]     = useState<'small'|'medium'|'large'>('medium')
  const [notifPush, setNotifPush]   = useState(true)
  const [notifSms, setNotifSms]     = useState(true)

  const fontSizes = [
    { id: 'small',  fr: 'Petite',  en: 'Small',  size: 13 },
    { id: 'medium', fr: 'Normale', en: 'Medium', size: 15 },
    { id: 'large',  fr: 'Grande',  en: 'Large',  size: 18 },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>⚙️ {lang === 'fr' ? 'Paramètres' : 'Settings'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* Langue */}
        <SectionTitle title={lang === 'fr' ? '🌐 Langue' : '🌐 Language'} />
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>{lang === 'fr' ? 'Langue de l\'application' : 'App language'}</Text>
            <View style={s.langToggle}>
              <TouchableOpacity
                style={[s.langBtn, lang === 'fr' && s.langBtnActive]}
                onPress={() => lang !== 'fr' && toggleLang()}>
                <Text style={[s.langBtnTxt, lang === 'fr' && s.langBtnTxtActive]}>FR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.langBtn, lang === 'en' && s.langBtnActive]}
                onPress={() => lang !== 'en' && toggleLang()}>
                <Text style={[s.langBtnTxt, lang === 'en' && s.langBtnTxtActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Apparence */}
        <SectionTitle title={lang === 'fr' ? '🎨 Apparence' : '🎨 Appearance'} />
        <View style={s.card}>
          {/* Dark mode */}
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{lang === 'fr' ? 'Mode sombre' : 'Dark mode'}</Text>
              <Text style={s.rowSub}>{lang === 'fr' ? 'Réduire la luminosité' : 'Reduce brightness'}</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              thumbColor={darkMode ? '#fff' : '#fff'} />
          </View>

          {/* Taille police */}
          <View style={{ paddingTop: 14 }}>
            <Text style={[s.rowLabel, { marginBottom: 12 }]}>
              {lang === 'fr' ? 'Taille de police' : 'Font size'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {fontSizes.map(f => (
                <TouchableOpacity key={f.id}
                  style={[s.fontBtn, fontSize === f.id && s.fontBtnActive]}
                  onPress={() => setFontSize(f.id as any)}>
                  <Text style={[{ fontSize: f.size, color: fontSize === f.id ? '#fff' : COLORS.gray600, fontWeight: '700' }]}>
                    A
                  </Text>
                  <Text style={[s.fontBtnLabel, fontSize === f.id && { color: '#fff' }]}>
                    {lang === 'fr' ? f.fr : f.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <SectionTitle title={lang === 'fr' ? '🔔 Notifications' : '🔔 Notifications'} />
        <View style={s.card}>
          <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{lang === 'fr' ? 'Notifications push' : 'Push notifications'}</Text>
              <Text style={s.rowSub}>{lang === 'fr' ? 'RDV, résultats, rappels' : 'Appointments, results, reminders'}</Text>
            </View>
            <Switch value={notifPush} onValueChange={setNotifPush}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }} thumbColor="#fff" />
          </View>
          <View style={[s.row, { paddingTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>{lang === 'fr' ? 'Notifications SMS' : 'SMS notifications'}</Text>
              <Text style={s.rowSub}>{lang === 'fr' ? 'Confirmations par SMS' : 'SMS confirmations'}</Text>
            </View>
            <Switch value={notifSms} onValueChange={setNotifSms}
              trackColor={{ false: COLORS.gray200, true: COLORS.primary }} thumbColor="#fff" />
          </View>
        </View>

        {/* Compte */}
        <SectionTitle title={lang === 'fr' ? '👤 Compte' : '👤 Account'} />
        <View style={s.card}>
          {isAuthenticated ? (
            <TouchableOpacity style={s.dangerBtn} onPress={logout}>
              <Text style={s.dangerBtnTxt}>🚪 {lang === 'fr' ? 'Se déconnecter' : 'Log out'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={s.primaryBtnTxt}>🔐 {lang === 'fr' ? 'Se connecter' : 'Log in'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* À propos */}
        <SectionTitle title={lang === 'fr' ? 'ℹ️ À propos' : 'ℹ️ About'} />
        <View style={s.card}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: lang === 'fr' ? 'Développé par' : 'Developed by', value: 'CSIS — HGY' },
            { label: 'Site web', value: 'hopitalgeneraldeyaounde.cm' },
            { label: lang === 'fr' ? 'Contact' : 'Contact', value: '+237 6 57 60 30 39' },
          ].map((item, i, arr) => (
            <View key={i} style={[s.row, { borderBottomWidth: i < arr.length-1 ? 1 : 0, borderBottomColor: COLORS.gray100 }]}>
              <Text style={s.rowLabel}>{item.label}</Text>
              <Text style={s.rowValue}>{item.value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 }}>{title}</Text>
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.bgAlt },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 4, ...SHADOW.sm },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel:      { fontSize: 14, fontWeight: '600', color: COLORS.black },
  rowSub:        { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  rowValue:      { fontSize: 13, color: COLORS.gray600 },
  langToggle:    { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: 99, padding: 3 },
  langBtn:       { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99 },
  langBtnActive: { backgroundColor: COLORS.primary },
  langBtnTxt:    { fontSize: 13, fontWeight: '800', color: COLORS.gray600 },
  langBtnTxtActive: { color: '#fff' },
  fontBtn:       { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  fontBtnActive: { backgroundColor: COLORS.primary },
  fontBtnLabel:  { fontSize: 11, color: COLORS.gray600, fontWeight: '600' },
  dangerBtn:     { backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  dangerBtnTxt:  { color: COLORS.danger, fontSize: 14, fontWeight: '800' },
  primaryBtn:    { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  primaryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
})

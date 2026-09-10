import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'
import api from '../services/api'

export default function NotificationsScreen({ navigation }: any) {
  const { lang } = useLang()
  const { patient } = useAuth()
  const [notifs, setNotifs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patient) return setLoading(false)
    api.get(`/patient/notifications?patient_id=${patient.id}`)
      .then(r => setNotifs(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patient])

  const ICONS: Record<string, string> = {
    confirme: '✅', annule: '❌', renvoye: '📅',
    resultat: '🔬', rappel: '⏰', default: '🔔',
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          🔔 {lang === 'fr' ? 'Notifications' : 'Notifications'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : notifs.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray400 }}>
            {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {notifs.map((n, i) => (
            <View key={i} style={[s.card, !n.lu && s.cardUnread]}>
              <View style={s.iconWrap}>
                <Text style={{ fontSize: 22 }}>{ICONS[n.type] || ICONS.default}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{n.titre}</Text>
                <Text style={s.msg}>{n.message}</Text>
                <Text style={s.date}>
                  {new Date(n.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
                </Text>
              </View>
              {!n.lu && <View style={s.dot} />}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bgAlt },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  card:        { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, ...SHADOW.sm },
  cardUnread:  { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconWrap:    { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 3 },
  msg:         { fontSize: 12, color: COLORS.gray600, lineHeight: 18, marginBottom: 4 },
  date:        { fontSize: 11, color: COLORS.gray400 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, alignSelf: 'flex-start', marginTop: 4 },
})

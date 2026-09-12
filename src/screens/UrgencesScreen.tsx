import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'

export default function UrgencesScreen({ navigation }: any) {
  const { lang } = useLang()

  const contacts = [
    { icon: '🚨', label: lang === 'fr' ? 'Urgences / Supervision' : 'Emergency', tel: '+237657603039', color: COLORS.danger },
    { icon: '📞', label: 'Standard', tel: '+237657603039', color: COLORS.primary },
    { icon: '💬', label: 'WhatsApp', tel: 'https://wa.me/237657603039', color: '#25D366' },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🚨 {lang === 'fr' ? 'Urgences' : 'Emergency'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={s.alertBox}>
          <Text style={s.alertTitle}>
            {lang === 'fr' ? '⚠️ En cas d\'urgence médicale' : '⚠️ In case of medical emergency'}
          </Text>
          <Text style={s.alertSub}>
            {lang === 'fr'
              ? 'Contactez immédiatement le service des urgences de l\'HGY disponible 24h/7.'
              : 'Immediately contact the HGY emergency service available 24/7.'
            }
          </Text>
        </View>

        {contacts.map((c, i) => (
          <TouchableOpacity key={i} style={[s.contactCard, { borderLeftColor: c.color }]}
            onPress={() => Linking.openURL(c.tel.startsWith('http') ? c.tel : `tel:${c.tel}`)}>
            <Text style={{ fontSize: 32 }}>{c.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.contactLabel}>{c.label}</Text>
              <Text style={[s.contactTel, { color: c.color }]}>{c.tel}</Text>
            </View>
            <Text style={{ fontSize: 20, color: COLORS.gray400 }}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={s.infoCard}>
          <Text style={s.infoTitle}>📍 {lang === 'fr' ? 'Adresse' : 'Address'}</Text>
          <Text style={s.infoTxt}>Hôpital Général de Yaoundé{'\n'}Yaoundé Centre, Cameroun</Text>
          <TouchableOpacity style={s.mapBtn}
            onPress={() => Linking.openURL('https://maps.google.com/?q=Hopital+General+Yaounde')}>
            <Text style={s.mapBtnTxt}>🗺️ {lang === 'fr' ? 'Voir sur la carte' : 'View on map'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoTitle}>🕐 {lang === 'fr' ? 'Horaires' : 'Hours'}</Text>
          <Text style={s.infoTxt}>
            {lang === 'fr'
              ? 'Urgences : 24h/7 — 7j/7\nConsultations : Lun-Ven 7h30-15h30'
              : 'Emergency: 24/7\nConsultations: Mon-Fri 7:30-15:30'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bgAlt },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.danger, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  alertBox:     { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  alertTitle:   { fontSize: 16, fontWeight: '800', color: COLORS.danger, marginBottom: 6 },
  alertSub:     { fontSize: 13, color: '#7F1D1D', lineHeight: 20 },
  contactCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 4, ...SHADOW.sm },
  contactLabel: { fontSize: 13, fontWeight: '700', color: COLORS.gray600, marginBottom: 3 },
  contactTel:   { fontSize: 16, fontWeight: '800' },
  infoCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, ...SHADOW.sm },
  infoTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  infoTxt:      { fontSize: 14, color: COLORS.gray600, lineHeight: 22 },
  mapBtn:       { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  mapBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
})

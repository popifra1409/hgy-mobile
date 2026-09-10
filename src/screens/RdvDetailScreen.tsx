import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'

const STATUT_CONFIG: Record<string, any> = {
  en_attente: { bg: '#FFFBEB', color: '#D97706', fr: '⏳ En attente',  en: '⏳ Pending' },
  confirme:   { bg: '#F0FDF4', color: '#059669', fr: '✅ Confirmé',    en: '✅ Confirmed' },
  termine:    { bg: '#EFF6FF', color: '#2B6CB0', fr: '🏁 Terminé',    en: '🏁 Done' },
  annule:     { bg: '#FEF2F2', color: '#DC2626', fr: '❌ Annulé',     en: '❌ Cancelled' },
}

export default function RdvDetailScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const rdv = route.params?.rdv
  if (!rdv) return null

  const conf = STATUT_CONFIG[rdv.statut] || STATUT_CONFIG.en_attente
  const date = rdv.date_heure
    ? new Date(rdv.date_heure).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {lang === 'fr' ? 'Détail du RDV' : 'Appointment Detail'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Statut */}
        <View style={[s.statutCard, { backgroundColor: conf.bg }]}>
          <Text style={[s.statutTxt, { color: conf.color }]}>
            {lang === 'fr' ? conf.fr : conf.en}
          </Text>
          {rdv.reference && (
            <Text style={[s.ref, { color: conf.color }]}>#{rdv.reference}</Text>
          )}
        </View>

        {/* Infos */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 {lang === 'fr' ? 'Informations' : 'Information'}</Text>
          {[
            { icon: '📅', label: lang === 'fr' ? 'Date & Heure' : 'Date & Time', value: date },
            { icon: '👨‍⚕️', label: lang === 'fr' ? 'Médecin' : 'Doctor', value: rdv.medecin },
            { icon: '🏥', label: lang === 'fr' ? 'Département' : 'Department', value: rdv.departement },
            { icon: '💬', label: lang === 'fr' ? 'Motif' : 'Reason', value: rdv.motif || '—' },
          ].filter(i => i.value).map((item, i, arr) => (
            <View key={i} style={[s.row, { borderBottomWidth: i < arr.length-1 ? 1 : 0 }]}>
              <Text style={{ fontSize: 18, width: 28 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Avertissement attente */}
        {rdv.statut === 'en_attente' && (
          <View style={s.infoBox}>
            <Text style={s.infoTxt}>
              ℹ️ {lang === 'fr'
                ? 'Votre RDV est en attente de confirmation. Vous serez notifié par SMS/WhatsApp dans les 24h.'
                : 'Your appointment is pending confirmation. You will be notified by SMS/WhatsApp within 24h.'
              }
            </Text>
          </View>
        )}

        {/* Consignes si confirmé */}
        {rdv.statut === 'confirme' && (
          <View style={[s.infoBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Text style={[s.infoTxt, { color: '#15803D' }]}>
              ✅ {lang === 'fr'
                ? 'RDV confirmé ! Présentez-vous 15 min à l\'avance avec votre pièce d\'identité et carnet de santé.'
                : 'Appointment confirmed! Please arrive 15 min early with your ID and health record.'
              }
            </Text>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={s.callBtn}
          onPress={() => Linking.openURL('tel:+237657603039')}>
          <Text style={s.callBtnTxt}>
            📞 {lang === 'fr' ? 'Contacter l\'hôpital' : 'Contact the hospital'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.bgAlt },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '700', color: '#fff' },
  statutCard: { borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statutTxt:  { fontSize: 18, fontWeight: '800' },
  ref:        { fontSize: 13, fontFamily: 'monospace', fontWeight: '700' },
  card:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, ...SHADOW.sm },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
  row:        { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomColor: COLORS.bgAlt },
  rowLabel:   { fontSize: 11, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  rowValue:   { fontSize: 14, fontWeight: '600', color: COLORS.black, lineHeight: 20 },
  infoBox:    { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  infoTxt:    { fontSize: 13, color: '#1D4ED8', lineHeight: 19 },
  callBtn:    { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...SHADOW.md },
  callBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
})

import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'

export default function ResultatScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const r = route.params?.resultat
  if (!r) return null

  const date = new Date(r.date_disponibilite || r.created_at)
    .toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{lang === 'fr' ? 'Résultat' : 'Result'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Type */}
        <View style={s.typeCard}>
          <Text style={{ fontSize: 48 }}>{r.type === 'labo' ? '🔬' : '🩻'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.typeTitle}>{r.titre}</Text>
            <View style={[s.badge, { backgroundColor: r.disponible ? '#F0FDF4' : '#FFFBEB' }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: r.disponible ? COLORS.success : COLORS.warning }}>
                {r.disponible
                  ? (lang === 'fr' ? '✅ Disponible' : '✅ Available')
                  : (lang === 'fr' ? '⏳ En cours' : '⏳ Pending')
                }
              </Text>
            </View>
          </View>
        </View>

        <View style={s.card}>
          {[
            { icon: '📅', label: lang === 'fr' ? 'Date' : 'Date', value: date },
            { icon: '👨‍⚕️', label: lang === 'fr' ? 'Médecin' : 'Doctor', value: r.medecin || '—' },
            { icon: '🏷️', label: 'Type', value: r.type === 'labo' ? 'Laboratoire' : 'Imagerie' },
          ].map((item, i, arr) => (
            <View key={i} style={[s.row, { borderBottomWidth: i < arr.length-1 ? 1 : 0 }]}>
              <Text style={{ fontSize: 18, width: 28 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
          {r.description && (
            <View style={{ paddingTop: 12 }}>
              <Text style={s.rowLabel}>📝 {lang === 'fr' ? 'Description' : 'Description'}</Text>
              <Text style={[s.rowValue, { marginTop: 4 }]}>{r.description}</Text>
            </View>
          )}
        </View>

        {r.fichier_url ? (
          <TouchableOpacity style={s.downloadBtn}
            onPress={() => Linking.openURL(r.fichier_url)}>
            <Text style={s.downloadTxt}>
              📄 {lang === 'fr' ? 'Voir / Télécharger le fichier' : 'View / Download file'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={s.infoBox}>
            <Text style={s.infoTxt}>
              ℹ️ {lang === 'fr'
                ? 'Le fichier n\'est pas encore disponible. Vous serez notifié dès qu\'il sera prêt.'
                : 'The file is not yet available. You will be notified when it is ready.'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bgAlt },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  typeCard:    { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, ...SHADOW.sm },
  typeTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, ...SHADOW.sm },
  row:         { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomColor: COLORS.bgAlt },
  rowLabel:    { fontSize: 11, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  rowValue:    { fontSize: 14, fontWeight: '600', color: COLORS.black },
  downloadBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', ...SHADOW.md },
  downloadTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  infoBox:     { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  infoTxt:     { fontSize: 13, color: '#1D4ED8', lineHeight: 19 },
})

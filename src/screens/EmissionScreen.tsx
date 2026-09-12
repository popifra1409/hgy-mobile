import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'
import axios from 'axios'

const WP = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json/hgy/v1'

export default function EmissionScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const id = route.params?.id
  const [emission, setEmission] = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setEmission(null)
    axios.get(`${WP}/allo-hgy?lang=${lang}&per_page=100`)
      .then(r => {
        const all = r.data?.data || []
        const found = all.find((e: any) => e.id == id || String(e.id) === String(id))
        setEmission(found || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, lang])

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>🎙️ Allo HGY</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : !emission ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>🎙️</Text>
          <Text style={{ color: COLORS.gray400, marginTop: 12 }}>
            {lang === 'fr' ? 'Émission introuvable.' : 'Episode not found.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Image */}
          {emission.image && (
            <View style={s.featuredWrap}>
              <Image source={{ uri: emission.image }}
                style={s.featuredImage} resizeMode="contain" />
            </View>
          )}

          {/* Hero */}
          <View style={[s.hero, !emission.image && { paddingTop: 24 }]}>
            {!emission.image && <Text style={{ fontSize: 48, marginBottom: 10 }}>🎙️</Text>}
            <Text style={s.heroTitle}>{emission.title}</Text>
            {(emission.date_diff || emission.date) && (
              <Text style={s.heroDate}>
                📅 {new Date(emission.date_diff || emission.date).toLocaleDateString(
                  lang === 'fr' ? 'fr-FR' : 'en-GB',
                  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </Text>
            )}
          </View>

          <View style={{ padding: 16 }}>
            {/* Conducteur */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📋 {lang === 'fr' ? 'Conducteur d\'émission' : 'Show rundown'}</Text>
              {[
                { icon: '🎬', label: lang === 'fr' ? 'Présentation' : 'Host',            value: emission.animateur },
                { icon: '👤', label: lang === 'fr' ? 'Invité(e)' : 'Guest',              value: emission.invite },
                { icon: '🏷️', label: lang === 'fr' ? 'Thème' : 'Theme',                 value: emission.theme || emission.themes?.map((t:any)=>t.name).join(', ') },
                { icon: '🕐', label: lang === 'fr' ? 'Tranche horaire' : 'Time slot',    value: emission.tranche_horaire },
                { icon: '📻', label: lang === 'fr' ? 'Diffuseur' : 'Broadcaster',        value: emission.diffuseur },
                { icon: '🎙️', label: lang === 'fr' ? 'Format' : 'Format',               value: emission.format_emission },
                { icon: '⏱',  label: lang === 'fr' ? 'Durée' : 'Duration',              value: emission.duree ? `${emission.duree} min` : null },
                { icon: '🔢', label: lang === 'fr' ? 'N° Émission' : 'Episode #',        value: emission.numero },
              ].filter(i => i.value).map((item, i, arr) => (
                <View key={i} style={[s.row, { borderBottomWidth: i < arr.length-1 ? 1 : 0 }]}>
                  <Text style={{ fontSize: 16, width: 28 }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowLabel}>{item.label}</Text>
                    <Text style={s.rowValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Extrait */}
            {emission.excerpt && (
              <View style={[s.card, { backgroundColor: COLORS.primaryPale }]}>
                <Text style={{ fontSize: 14, color: COLORS.primary, lineHeight: 22, fontStyle: 'italic' }}>
                  {emission.excerpt?.replace(/<[^>]*>/g, '').trim()}
                </Text>
              </View>
            )}

            {/* Médias */}
            {emission.youtube_url && (
              <TouchableOpacity style={s.ytBtn}
                onPress={() => Linking.openURL(emission.youtube_url)}>
                <Text style={s.mediaBtnTxt}>▶️ {lang === 'fr' ? 'Voir sur YouTube' : 'Watch on YouTube'}</Text>
              </TouchableOpacity>
            )}
            {emission.audio_url && (
              <TouchableOpacity style={[s.ytBtn, { backgroundColor: COLORS.success, marginTop: 10 }]}
                onPress={() => Linking.openURL(emission.audio_url)}>
                <Text style={s.mediaBtnTxt}>🎵 {lang === 'fr' ? 'Écouter l\'audio' : 'Listen to audio'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bgAlt },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  featuredWrap: { width: '100%', backgroundColor: '#000' },
  featuredImage:{ width: '100%', height: undefined, aspectRatio: 16/9 },
  hero:         { backgroundColor: COLORS.primary, padding: 20, alignItems: 'center' },
  heroTitle:    { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 26 },
  heroDate:     { fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 8 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, ...SHADOW.sm },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  row:          { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomColor: COLORS.bgAlt },
  rowLabel:     { fontSize: 11, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  rowValue:     { fontSize: 14, fontWeight: '600', color: COLORS.black },
  ytBtn:        { backgroundColor: '#FF0000', borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...SHADOW.md },
  mediaBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800' },
})

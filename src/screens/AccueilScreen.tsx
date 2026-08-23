import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator
} from 'react-native'
import { blogService } from '../services/api'
import { useLang } from '../context/LangContext'

export default function AccueilScreen({ navigation }: any) {
  const { lang } = useLang()
  const [articles, setArticles]   = useState<any[]>([])
  const [emissions, setEmissions] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [art, emi] = await Promise.all([
        blogService.getArticles(lang, 4),
        blogService.getEmissions(lang, 3),
      ])
      setArticles(art.data?.data || [])
      setEmissions(emi.data?.data || [])
    } catch (e) {} finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [lang])

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#1A3D6E" />
    </View>
  )

  return (
    <ScrollView style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}>

      {/* Hero */}
      <View style={s.hero}>
        <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.heroTitle}>Hôpital Général{'\n'}de Yaoundé</Text>
        <Text style={s.heroSub}>{lang === 'fr' ? 'Hôpital de référence au Cameroun' : 'Reference Hospital in Cameroon'}</Text>

        {/* Actions rapides */}
        <View style={s.actions}>
          {[
            { icon: '📅', label: lang === 'fr' ? 'Rendez-vous' : 'Appointment', screen: 'RendezVous' },
            { icon: '👨‍⚕️', label: lang === 'fr' ? 'Spécialistes' : 'Specialists', screen: 'Specialistes' },
            { icon: '🚨', label: 'Urgences', screen: 'Urgences' },
            { icon: '💬', label: 'NEEVA', screen: 'Chatbot' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={s.actionBtn}
              onPress={() => navigation.navigate(a.screen)}>
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dernières actualités */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📰 {lang === 'fr' ? 'Actualités' : 'News'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Blog')}>
            <Text style={s.seeAll}>{lang === 'fr' ? 'Voir tout' : 'See all'}</Text>
          </TouchableOpacity>
        </View>
        {articles.map((a, i) => (
          <TouchableOpacity key={i} style={s.card}
            onPress={() => navigation.navigate('Article', { slug: a.slug })}>
            {a.featured_image_url && (
              <Image source={{ uri: a.featured_image_url }} style={s.cardImg} />
            )}
            <View style={s.cardBody}>
              <Text style={s.cardTitle} numberOfLines={2}>{a.title}</Text>
              <Text style={s.cardExcerpt} numberOfLines={2}>{a.excerpt}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Émissions */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🎙️ Allo HGY</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Blog', { tab: 'allo-hgy' })}>
            <Text style={s.seeAll}>{lang === 'fr' ? 'Voir tout' : 'See all'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {emissions.map((e, i) => (
            <TouchableOpacity key={i} style={s.emissionCard}
              onPress={() => navigation.navigate('Emission', { id: e.id })}>
              {e.image && <Image source={{ uri: e.image }} style={s.emissionImg} />}
              <Text style={s.emissionTitle} numberOfLines={2}>{e.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contact rapide */}
      <View style={[s.section, s.contactBox]}>
        <Text style={s.contactTitle}>📞 {lang === 'fr' ? 'Nous contacter' : 'Contact us'}</Text>
        <Text style={s.contactTel}>Standard : +237 6 57 60 30 39</Text>
        <Text style={s.contactTel}>Urgences : +237 6 99 46 56 86</Text>
        <Text style={s.contactAddr}>📍 Ngousso, Yaoundé, Cameroun</Text>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F7FBFF' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero:        { background: '#1A3D6E', backgroundColor: '#1A3D6E', padding: 24, alignItems: 'center' },
  logo:        { width: 80, height: 80, marginBottom: 12 },
  heroTitle:   { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 32 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 6, textAlign: 'center' },
  actions:     { flexDirection: 'row', marginTop: 24, gap: 12 },
  actionBtn:   { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 14, padding: 14, flex: 1 },
  actionIcon:  { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, color: '#fff', fontWeight: '600', textAlign: 'center' },
  section:     { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A3D6E' },
  seeAll:      { fontSize: 12, color: '#2B6CB0', fontWeight: '600' },
  card:        { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImg:     { width: '100%', height: 160 },
  cardBody:    { padding: 14 },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: '#1A3D6E', marginBottom: 6 },
  cardExcerpt: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  emissionCard: { width: 180, backgroundColor: '#fff', borderRadius: 14, marginRight: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  emissionImg:  { width: '100%', height: 100 },
  emissionTitle: { fontSize: 12, fontWeight: '600', color: '#1A3D6E', padding: 10 },
  contactBox:  { backgroundColor: '#1A3D6E', margin: 20, borderRadius: 16, padding: 20 },
  contactTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10 },
  contactTel:  { fontSize: 13, color: 'rgba(255,255,255,.85)', marginBottom: 4 },
  contactAddr: { fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 6 },
})

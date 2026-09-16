import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator,
  Linking, Platform
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { blogService, rdvService, parametresService } from '../services/api'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'

const JOURS_FR = ['','Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const SOCIAL = [
  { key: 'facebook',  icon: '📘', color: '#1877F2', label: 'Facebook' },
  { key: 'instagram', icon: '📸', color: '#E1306C', label: 'Instagram' },
  { key: 'youtube',   icon: '▶️',  color: '#FF0000', label: 'YouTube' },
  { key: 'twitter',   icon: '🐦', color: '#000',    label: 'X/Twitter' },
  { key: 'whatsapp',  icon: '💬', color: '#25D366', label: 'WhatsApp' },
]

export default function AccueilScreen({ navigation }: any) {
  const { lang } = useLang()
  const { patient } = useAuth()
  const [articles,     setArticles]     = useState<any[]>([])
  const [emissions,    setEmissions]    = useState<any[]>([])
  const [planningJour, setPlanningJour] = useState<any[]>([])
  const [parametres,   setParametres]   = useState<any>({})
  const [metaJour,     setMetaJour]     = useState({ jour: '', date: '' })
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)

  const load = async () => {
    try {
      const [art, emi, plan, params] = await Promise.all([
        blogService.getArticles(lang, 4),
        blogService.getEmissions(lang, 3),
        rdvService.planningJour(),
        parametresService.get(),
      ])
      console.log('Articles:', art.data?.data?.length, 'Emissions:', emi.data?.data?.length)
      setArticles(art.data?.data || [])
      setEmissions(emi.data?.data || [])
      const planData = plan.data?.data || []
      setPlanningJour(planData.filter((p: any) => p.medecin && !p.__spec_vide))
      setMetaJour({ jour: plan.data?.jour || '', date: plan.data?.date || '' })
      setParametres(params.data?.data || {})
    } catch (e: any) {
      console.log('AccueilScreen load error:', e?.message)
    }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [lang])

  // Groupe planning par spécialité
  const planningBySpec: Record<string, any[]> = {}
  planningJour.forEach((p: any) => {
    const spec = p.specialite?.nom?.fr || p.specialite?.nom_fr || 'Autres'
    if (!planningBySpec[spec]) planningBySpec[spec] = []
    planningBySpec[spec].push(p)
  })

  const actions = [
    { icon: '📅', label: lang === 'fr' ? 'Rendez-vous' : 'Appointment', screen: 'RendezVous',     color: '#1A3D6E' },
    { icon: '👨‍⚕️', label: lang === 'fr' ? 'Médecins' : 'Doctors',      screen: 'SpecialistesTab', color: '#2B6CB0' },
    { icon: '🚨', label: lang === 'fr' ? 'Urgences' : 'Emergency',      screen: 'Urgences',        color: '#DC2626' },
    { icon: '💬', label: 'HGY AI',                                        screen: 'Chatbot',         color: '#7C3AED' },
    { icon: '👤', label: lang === 'fr' ? 'Mon Espace' : 'My Portal',    screen: 'MonEspaceTab',    color: '#059669' },
    { icon: '⚙️', label: lang === 'fr' ? 'Paramètres' : 'Settings',     screen: 'Settings',        color: '#6B7280' },
  ]

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  )

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          {/* Logo HGY */}
          <Image
            source={require('../../assets/logo-hgy.png')}
            style={s.logo} resizeMode="contain"
          />
          <Text style={s.heroTitle}>Hôpital Général{'\n'}de Yaoundé</Text>
          <Text style={s.heroSub}>
            {lang === 'fr' ? 'Hôpital de référence au Cameroun' : 'Reference Hospital in Cameroon'}
          </Text>
          <Text style={s.slogan}>✦ Excellence · Empathie · Modernisme ✦</Text>

          {/* Contacts rapides */}
          <View style={s.contactBar}>
            <TouchableOpacity style={s.contactChip}
              onPress={() => Linking.openURL(`tel:${parametres.tel_supervision || '+237657603039'}`)}>
              <Text style={s.contactChipTxt}>🚨 Urgences</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.contactChip}
              onPress={() => Linking.openURL(`tel:${parametres.tel_standard || '+237657603039'}`)}>
              <Text style={s.contactChipTxt}>📞 Standard</Text>
            </TouchableOpacity>
            {parametres.whatsapp && (
              <TouchableOpacity style={[s.contactChip, { backgroundColor: '#25D366' }]}
                onPress={() => Linking.openURL(parametres.whatsapp)}>
                <Text style={s.contactChipTxt}>💬 WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Réseaux sociaux */}
          <View style={s.socialRow}>
            {SOCIAL.filter(s => parametres[s.key]).map((soc, i) => (
              <TouchableOpacity key={i} style={[s.socialBtn, { backgroundColor: soc.color }]}
                onPress={() => Linking.openURL(parametres[soc.key])}>
                <Text style={{ fontSize: 16 }}>{soc.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Bonjour patient ── */}
        {patient && (
          <TouchableOpacity style={s.patientCard}
            onPress={() => navigation.navigate('MonEspaceTab')}>
            <View style={s.patientLeft}>
              <View style={s.patientAvatar}><Text style={{ fontSize: 20 }}>👤</Text></View>
              <View>
                <Text style={s.patientName}>
                  {lang === 'fr' ? 'Bonjour,' : 'Hello,'} {patient.prenom} !
                </Text>
                <Text style={s.patientSub}>
                  🪪 {patient.numero_dossier} · {lang === 'fr' ? 'Voir mon espace' : 'My portal'}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 20, color: COLORS.gray400 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Actions rapides ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚡ {lang === 'fr' ? 'Actions rapides' : 'Quick actions'}</Text>
          <View style={s.actionsGrid}>
            {actions.map((a, i) => (
              <TouchableOpacity key={i} style={s.actionBtn}
                onPress={() => navigation.navigate(a.screen)}>
                <View style={[s.actionIcon, { backgroundColor: a.color + '18' }]}>
                  <Text style={{ fontSize: 26 }}>{a.icon}</Text>
                </View>
                <Text style={s.actionLabel} numberOfLines={2}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Planning du jour ── */}
        {planningJour.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={s.liveDot} />
                <Text style={s.sectionTitle}>
                  {lang === 'fr' ? `Consultations — ${metaJour.jour}` : `Today — ${metaJour.jour}`}
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(planningBySpec).map(([spec, plans]) => (
                <View key={spec} style={s.planCard}>
                  <Text style={s.planSpec}>🔬 {spec}</Text>
                  {(plans as any[]).slice(0, 3).map((p: any, i: number) => (
                    <View key={i} style={[s.planRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#F0FDF4' }]}>
                      <View style={s.planAvatar}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
                          {p.medecin?.nom_complet?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.planDoc} numberOfLines={1}>{p.medecin?.nom_complet}</Text>
                        <Text style={s.planHeure}>🕐 {p.heure_debut?.slice(0, 5)} - {p.heure_fin?.slice(0, 5)}</Text>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={s.planBtn} onPress={() => navigation.navigate('RendezVous')}>
                    <Text style={s.planBtnTxt}>{lang === 'fr' ? 'Prendre RDV →' : 'Book →'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Infos pratiques ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ℹ️ {lang === 'fr' ? 'Infos pratiques' : 'Practical info'}</Text>
          <View style={s.infoGrid}>
            {[
              { icon: '🕐', title: lang === 'fr' ? 'Horaires' : 'Hours', value: lang === 'fr' ? 'Lun-Ven 7h30-15h30' : 'Mon-Fri 7:30-15:30' },
              { icon: '🚨', title: lang === 'fr' ? 'Urgences' : 'Emergency', value: '24h/7 — 7j/7' },
              { icon: '📍', title: lang === 'fr' ? 'Adresse' : 'Address', value: parametres.adresse || 'Yaoundé Centre' },
              { icon: '💳', title: lang === 'fr' ? 'Paiement' : 'Payment', value: lang === 'fr' ? 'Espèces · Mobile Money' : 'Cash · Mobile Money' },
            ].map((item, i) => (
              <View key={i} style={s.infoCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
                <Text style={s.infoTitle}>{item.title}</Text>
                <Text style={s.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Actualités ── */}
        {articles.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>📰 {lang === 'fr' ? 'Actualités' : 'News'}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Blog')}>
                <Text style={s.seeAll}>{lang === 'fr' ? 'Voir tout →' : 'See all →'}</Text>
              </TouchableOpacity>
            </View>
            {articles.map((a: any, i: number) => (
              <TouchableOpacity key={i} style={s.articleCard}
                onPress={() => navigation.navigate('Article', { slug: a.slug })}>
                <View style={s.articleIcon}><Text style={{ fontSize: 22 }}>📰</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.articleTitle} numberOfLines={2}>{a.title}</Text>
                  {a.date && <Text style={s.articleDate}>
                    {new Date(a.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
                  </Text>}
                </View>
                <Text style={{ color: COLORS.gray400, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Allo HGY ── */}
        {emissions.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>🎙️ Allo HGY</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Blog', { tab: 'allo-hgy' })}>
                <Text style={s.seeAll}>{lang === 'fr' ? 'Voir tout →' : 'See all →'}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {emissions.map((e: any, i: number) => (
                <TouchableOpacity key={i} style={s.emissionCard}
                  onPress={() => navigation.navigate('Emission', { id: e.id })}>
                  {e.image
                    ? <Image source={{ uri: e.image }} style={s.emissionImg} resizeMode="cover" />
                    : <View style={s.emissionImgPlaceholder}><Text style={{ fontSize: 28 }}>🎙️</Text></View>
                  }
                  <View style={{ padding: 10 }}>
                    <Text style={s.emissionTitle} numberOfLines={2}>{e.title}</Text>
                    {e.animateur && <Text style={s.emissionHost} numberOfLines={1}>🎤 {e.animateur}</Text>}
                    {e.date_diff && <Text style={s.emissionDate}>
                      📅 {new Date(e.date_diff).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
                    </Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Contact ── */}
        <View style={[s.section, { marginBottom: 0 }]}>
          <View style={s.contactSection}>
            <Text style={s.contactSectionTitle}>📍 {lang === 'fr' ? 'Nous trouver' : 'Find us'}</Text>
            <Text style={s.contactAddr}>{parametres.adresse || 'Yaoundé Centre, Cameroun'}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://maps.google.com/?q=Hopital+General+Yaounde')}>
              <Text style={s.mapLink}>🗺️ {lang === 'fr' ? 'Voir sur la carte' : 'View on map'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Bouton WhatsApp flottant ── */}
      {parametres.whatsapp && (
        <TouchableOpacity style={s.whatsappFab}
          onPress={() => Linking.openURL(parametres.whatsapp)}>
          <Text style={{ fontSize: 28 }}>💬</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.bgAlt },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero:            { backgroundColor: COLORS.primary, padding: 24, paddingTop: 20, alignItems: 'center' },
  logo:            { width: 90, height: 90, marginBottom: 12, borderRadius: 16 },
  heroTitle:       { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 30, marginBottom: 4 },
  heroSub:         { fontSize: 13, color: 'rgba(255,255,255,.7)', textAlign: 'center', marginBottom: 4 },
  slogan:          { fontSize: 11, color: 'rgba(255,255,255,.5)', fontStyle: 'italic', letterSpacing: 1.5, marginBottom: 14 },
  bellBtn:         { position:'absolute', top:12, right:16, width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,.15)', alignItems:'center', justifyContent:'center' },
  contactBar:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  contactChip:     { backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  contactChipTxt:  { fontSize: 12, color: '#fff', fontWeight: '700' },
  socialRow:       { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  socialBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  patientCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 14, borderLeftWidth: 4, borderLeftColor: COLORS.primary, ...SHADOW.sm },
  patientLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientAvatar:   { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center' },
  patientName:     { fontSize: 15, fontWeight: '700', color: COLORS.black },
  patientSub:      { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  section:         { padding: 16, paddingBottom: 0 },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:    { fontSize: 15, fontWeight: '800', color: COLORS.black },
  seeAll:          { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  liveDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  actionsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionBtn:       { width: '30%', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, ...SHADOW.sm },
  actionIcon:      { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel:     { fontSize: 11, fontWeight: '700', color: COLORS.black, textAlign: 'center', lineHeight: 14 },
  planCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginRight: 12, width: 220, ...SHADOW.sm, borderTopWidth: 3, borderTopColor: '#10B981' },
  planSpec:        { fontSize: 11, fontWeight: '800', color: '#15803D', marginBottom: 10, textTransform: 'uppercase' },
  planRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  planAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  planDoc:         { fontSize: 12, fontWeight: '700', color: COLORS.black },
  planHeure:       { fontSize: 10, color: COLORS.gray400, marginTop: 1 },
  planBtn:         { backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginTop: 10 },
  planBtnTxt:      { color: '#fff', fontSize: 11, fontWeight: '800' },
  infoGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 14, ...SHADOW.sm },
  infoTitle:       { fontSize: 12, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  infoValue:       { fontSize: 11, color: COLORS.gray600, lineHeight: 16 },
  articleCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, ...SHADOW.sm },
  articleIcon:     { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  articleTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.black, lineHeight: 20, marginBottom: 4 },
  articleDate:     { fontSize: 11, color: COLORS.gray400 },
  emissionCard:    { backgroundColor: '#fff', borderRadius: 16, marginRight: 12, width: 180, overflow: 'hidden', ...SHADOW.sm },
  emissionImg:     { width: '100%', height: 110 },
  emissionImgPlaceholder: { width: '100%', height: 110, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center' },
  emissionTitle:   { fontSize: 13, fontWeight: '700', color: COLORS.black, lineHeight: 18, marginBottom: 4 },
  emissionHost:    { fontSize: 11, color: COLORS.primary, marginBottom: 3 },
  emissionDate:    { fontSize: 10, color: COLORS.gray400 },
  contactSection:  { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, margin: 16 },
  contactSectionTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  contactAddr:     { fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 10 },
  mapLink:         { fontSize: 13, color: '#90C6F0', fontWeight: '700' },
  whatsappFab:     { position: 'absolute', bottom: 90, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', ...SHADOW.lg },
})

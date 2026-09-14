import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { patientService } from '../services/api'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'

const STATUT_CONFIG: Record<string, { bg: string; color: string; label: { fr: string; en: string } }> = {
  en_attente: { bg: '#FFFBEB', color: '#D97706', label: { fr: '⏳ En attente', en: '⏳ Pending' } },
  confirme:   { bg: '#F0FDF4', color: '#059669', label: { fr: '✅ Confirmé',   en: '✅ Confirmed' } },
  termine:    { bg: '#EFF6FF', color: '#2B6CB0', label: { fr: '🏁 Terminé',   en: '🏁 Done' } },
  annule:     { bg: '#FEF2F2', color: '#DC2626', label: { fr: '❌ Annulé',    en: '❌ Cancelled' } },
}

export default function MonEspaceScreen({ navigation }: any) {
  const { patient, isAuthenticated, logout } = useAuth()
  const { lang } = useLang()
  const [rdvs, setRdvs]           = useState<any[]>([])
  const [resultats, setResultats] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'rdv' | 'resultats' | 'profil'>('rdv')

  const load = async () => {
    if (!patient) return setLoading(false)
    try {
      const [rdvRes, resRes] = await Promise.all([
        patientService.historique(patient.telephone),
        patientService.resultats(patient.telephone),
      ])
      setRdvs(rdvRes.data?.rdvs || [])
      setResultats(resRes.data?.data || [])
    } catch {} finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [patient])

  const handleLogout = () => {
    Alert.alert(
      lang === 'fr' ? 'Déconnexion' : 'Logout',
      lang === 'fr' ? 'Voulez-vous vous déconnecter ?' : 'Do you want to log out?',
      [
        { text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        { text: lang === 'fr' ? 'Déconnexion' : 'Logout', style: 'destructive', onPress: logout },
      ]
    )
  }

  // ── Non connecté ──
  if (!isAuthenticated) return (
    <SafeAreaView style={s.safe}>
      <View style={s.notAuthContainer}>
        <View style={s.notAuthHero}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>👤</Text>
          <Text style={s.notAuthTitle}>
            {lang === 'fr' ? 'Mon Espace Patient' : 'My Patient Portal'}
          </Text>
          <Text style={s.notAuthSub}>
            {lang === 'fr'
              ? 'Accédez à vos rendez-vous, résultats et informations médicales.'
              : 'Access your appointments, results and medical information.'
            }
          </Text>
        </View>
        <View style={s.notAuthCards}>
          {[
            { icon: '📅', fr: 'Mes Rendez-vous', en: 'My Appointments' },
            { icon: '🔬', fr: 'Mes Résultats',   en: 'My Results' },
            { icon: '🔔', fr: 'Notifications',   en: 'Notifications' },
          ].map((f, i) => (
            <View key={i} style={s.featureCard}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</Text>
              <Text style={s.featureLabel}>{lang === 'fr' ? f.fr : f.en}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={s.loginBtnTxt}>
            🔐 {lang === 'fr' ? 'Se connecter' : 'Log in'}
          </Text>
        </TouchableOpacity>
        <Text style={s.loginHint}>
          {lang === 'fr'
            ? 'Votre code est envoyé à la confirmation de votre 1er RDV'
            : 'Your code is sent when your 1st appointment is confirmed'
          }
        </Text>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatar}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </View>
          <View>
            <Text style={s.headerName}>
              {lang === 'fr' ? 'Bonjour,' : 'Hello,'} {patient?.prenom}
            </Text>
            <Text style={s.headerCode}>
              🪪 {patient?.numero_dossier}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={handleLogout}>
            <Text>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { icon: '📅', value: rdvs.length,                                              label: lang === 'fr' ? 'RDV Total' : 'Total' },
          { icon: '⏳', value: rdvs.filter(r => r.statut === 'en_attente').length,       label: lang === 'fr' ? 'En attente' : 'Pending' },
          { icon: '✅', value: rdvs.filter(r => r.statut === 'confirme').length,         label: lang === 'fr' ? 'Confirmés' : 'Confirmed' },
          { icon: '🔬', value: resultats.length,                                          label: lang === 'fr' ? 'Résultats' : 'Results' },
        ].map((st, i) => (
          <View key={i} style={s.statCard}>
            <Text style={{ fontSize: 18, marginBottom: 2 }}>{st.icon}</Text>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {[
          { id: 'rdv',      icon: '📅', fr: 'RDV',       en: 'Appts' },
          { id: 'resultats',icon: '🔬', fr: 'Résultats', en: 'Results' },
          { id: 'profil',   icon: '👤', fr: 'Profil',    en: 'Profile' },
        ].map(t => (
          <TouchableOpacity key={t.id}
            style={[s.tab, activeTab === t.id && s.tabActive]}
            onPress={() => setActiveTab(t.id as any)}>
            <Text style={[s.tabTxt, activeTab === t.id && s.tabTxtActive]}>
              {t.icon} {lang === 'fr' ? t.fr : t.en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}>

          {/* Tab RDV */}
          {activeTab === 'rdv' && (
            <>
              <TouchableOpacity style={s.newRdvBtn} onPress={() => navigation.navigate('RendezVous')}>
                <Text style={s.newRdvTxt}>➕ {lang === 'fr' ? 'Nouveau rendez-vous' : 'New appointment'}</Text>
              </TouchableOpacity>
              {rdvs.length === 0 ? (
                <EmptyState icon="📅" msg={lang === 'fr' ? 'Aucun rendez-vous trouvé.' : 'No appointments found.'} />
              ) : rdvs.map((r, i) => {
                const conf = STATUT_CONFIG[r.statut] || STATUT_CONFIG.en_attente
                const date = r.date_heure
                  ? new Date(r.date_heure).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—'
                return (
                  <TouchableOpacity key={i} style={s.rdvCard}
                    onPress={() => navigation.navigate('RdvDetail', { rdv: r })}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={[s.badge, { backgroundColor: conf.bg }]}>
                        <Text style={[s.badgeTxt, { color: conf.color }]}>
                          {lang === 'fr' ? conf.label.fr : conf.label.en}
                        </Text>
                      </View>
                      {r.reference && (
                        <Text style={s.ref}>#{r.reference}</Text>
                      )}
                    </View>
                    <Text style={s.rdvDate}>📅 {date}</Text>
                    {r.medecin && <Text style={s.rdvDoc}>👨‍⚕️ {r.medecin}</Text>}
                    {r.departement && <Text style={s.rdvSpec}>🏥 {r.departement}</Text>}
                    {r.motif && <Text style={s.rdvMotif}>💬 {r.motif}</Text>}
                  </TouchableOpacity>
                )
              })}
            </>
          )}

          {/* Tab Résultats */}
          {activeTab === 'resultats' && (
            resultats.length === 0 ? (
              <EmptyState icon="🔬" msg={lang === 'fr' ? 'Aucun résultat disponible.' : 'No results available.'} />
            ) : resultats.map((r, i) => (
              <TouchableOpacity key={i} style={s.rdvCard}
                onPress={() => navigation.navigate('Resultat', { resultat: r })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 32 }}>{r.type === 'labo' ? '🔬' : '🩻'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rdvDate}>{r.titre}</Text>
                    <Text style={s.rdvSpec}>
                      📅 {new Date(r.date_disponibilite || r.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
                    </Text>
                    {r.medecin && <Text style={s.rdvDoc}>👨‍⚕️ {r.medecin}</Text>}
                  </View>
                  <View style={[s.badge, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: '700' }}>
                      {r.disponible ? (lang === 'fr' ? '✅ Disponible' : '✅ Available') : (lang === 'fr' ? '⏳ En cours' : '⏳ Pending')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Tab Profil */}
          {activeTab === 'profil' && (
            <View style={s.rdvCard}>
              <View style={s.profilHeader}>
                <View style={[s.avatar, { width: 64, height: 64, borderRadius: 32 }]}>
                  <Text style={{ fontSize: 28 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.profilName}>{patient?.prenom} {patient?.nom}</Text>
                  <Text style={s.profilCode}>🪪 {patient?.numero_dossier}</Text>
                </View>
              </View>
              {[
                { icon: '📞', label: lang === 'fr' ? 'Téléphone' : 'Phone', value: patient?.telephone },
                { icon: '📧', label: 'Email',                               value: patient?.email || '—' },
                { icon: '🔑', label: lang === 'fr' ? 'Code Patient' : 'Patient Code', value: patient?.code_patient },
              ].map((item, i) => (
                <View key={i} style={s.profilRow}>
                  <Text style={{ fontSize: 16, width: 28 }}>{item.icon}</Text>
                  <View>
                    <Text style={s.profilLabel}>{item.label}</Text>
                    <Text style={s.profilValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14, marginBottom: 8 }}
                onPress={() => navigation.navigate('ChangePassword')}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                  🔑 {lang === 'fr' ? 'Changer mon mot de passe' : 'Change my password'}
                </Text>
              </TouchableOpacity>
              <Text style={s.profilHint}>
                {lang === 'fr'
                  ? 'Pour modifier vos informations, contactez l\'accueil au +237 6 57 60 30 39.'
                  : 'To update your information, contact reception at +237 6 57 60 30 39.'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 14, color: COLORS.gray400, textAlign: 'center' }}>{msg}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.bgAlt },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notAuthContainer: { flex: 1, backgroundColor: COLORS.primary },
  notAuthHero:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, paddingBottom: 32 },
  notAuthTitle:     { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10 },
  notAuthSub:       { fontSize: 14, color: 'rgba(255,255,255,.75)', textAlign: 'center', lineHeight: 21 },
  notAuthCards:     { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 32 },
  featureCard:      { flex: 1, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 16, padding: 16, alignItems: 'center' },
  featureLabel:     { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center', marginTop: 4 },
  loginBtn:         { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, paddingVertical: 15, alignItems: 'center', ...SHADOW.md },
  loginBtnTxt:      { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  loginHint:        { fontSize: 12, color: 'rgba(255,255,255,.6)', textAlign: 'center', marginTop: 16, paddingHorizontal: 32 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:           { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' },
  headerName:       { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerCode:       { fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 1 },
  iconBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  statsRow:         { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingBottom: 16, gap: 8 },
  statCard:         { flex: 1, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 12, padding: 10, alignItems: 'center' },
  statValue:        { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel:        { fontSize: 9, color: 'rgba(255,255,255,.65)', marginTop: 2, textAlign: 'center' },
  tabs:             { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  tab:              { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabTxt:           { fontSize: 12, color: COLORS.gray400, fontWeight: '600' },
  tabTxtActive:     { color: COLORS.primary, fontWeight: '800' },
  rdvCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOW.sm },
  badge:            { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  badgeTxt:         { fontSize: 11, fontWeight: '700' },
  ref:              { fontSize: 11, color: COLORS.gray400, fontFamily: 'monospace' },
  rdvDate:          { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 3 },
  rdvDoc:           { fontSize: 13, color: COLORS.primaryLight, marginBottom: 2 },
  rdvSpec:          { fontSize: 12, color: COLORS.gray400 },
  rdvMotif:         { fontSize: 12, color: COLORS.gray600, marginTop: 4, fontStyle: 'italic' },
  newRdvBtn:        { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 16, ...SHADOW.md },
  newRdvTxt:        { color: '#fff', fontSize: 14, fontWeight: '800' },
  profilHeader:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  profilName:       { fontSize: 18, fontWeight: '800', color: COLORS.black },
  profilCode:       { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  profilRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  profilLabel:      { fontSize: 11, color: COLORS.gray400, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  profilValue:      { fontSize: 14, fontWeight: '600', color: COLORS.black },
  profilHint:       { fontSize: 12, color: COLORS.gray400, marginTop: 16, textAlign: 'center', lineHeight: 18 },
})

import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMedecinAuth } from '../context/MedecinAuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'
import api from '../services/api'
import * as SecureStore from 'expo-secure-store'

const STATUT_CONFIG: Record<string,any> = {
  en_attente: { bg:'#FFFBEB', color:'#D97706', fr:'⏳ En attente', en:'⏳ Pending' },
  confirme:   { bg:'#F0FDF4', color:'#059669', fr:'✅ Confirmé',   en:'✅ Confirmed' },
  termine:    { bg:'#EFF6FF', color:'#2B6CB0', fr:'🏁 Terminé',   en:'🏁 Done' },
  annule:     { bg:'#FEF2F2', color:'#DC2626', fr:'❌ Annulé',    en:'❌ Cancelled' },
}

export default function MedecinEspaceScreen({ navigation }: any) {
  const { medecin, isAuthenticated, logout } = useMedecinAuth()
  const { lang } = useLang()
  const [rdvs,      setRdvs]      = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [activeTab, setActiveTab] = useState<'rdv'|'profil'>('rdv')
  const [filter,    setFilter]    = useState<'all'|'en_attente'|'confirme'>('en_attente')

  // Login state
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { login } = useMedecinAuth()

  const load = async () => {
    if (!medecin) return setLoading(false)
    try {
      const token = await SecureStore.getItemAsync('hgy_medecin_token')
      const r = await fetch(
        `https://hopitalgeneraldeyaounde.cm/portail/public/api/v1/medecin/rdvs`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      const d = await r.json()
      setRdvs(d?.data || [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [medecin])

  const handleLogin = async () => {
    if (!email || !password) { setLoginErr(lang==='fr'?'Email et mot de passe requis.':'Email and password required.'); return }
    setLoginLoading(true); setLoginErr('')
    const r = await login(email.trim(), password)
    setLoginLoading(false)
    if (!r.success) setLoginErr(r.message || (lang==='fr'?'Identifiants incorrects.':'Incorrect credentials.'))
  }

  const confirmerRdv = async (rdvId: number) => {
    try {
      const token = await SecureStore.getItemAsync('hgy_medecin_token')
      await fetch(
        `https://hopitalgeneraldeyaounde.cm/portail/public/api/v1/medecin/rdvs/${rdvId}/confirmer`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      load()
    } catch { Alert.alert('Erreur', lang==='fr'?'Impossible de confirmer.':'Cannot confirm.') }
  }

  const annulerRdv = async (rdvId: number) => {
    Alert.alert(
      lang==='fr' ? 'Annuler le RDV ?' : 'Cancel appointment?',
      lang==='fr' ? 'Voulez-vous annuler ce rendez-vous ?' : 'Do you want to cancel this appointment?',
      [
        { text: lang==='fr'?'Non':'No', style:'cancel' },
        { text: lang==='fr'?'Oui, annuler':'Yes, cancel', style:'destructive', onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync('hgy_medecin_token')
            await fetch(
              `https://hopitalgeneraldeyaounde.cm/portail/public/api/v1/medecin/rdvs/${rdvId}/annuler`,
              { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            )
            load()
          } catch {}
        }}
      ]
    )
  }

  // ── Non connecté ──
  if (!isAuthenticated) return (
    <SafeAreaView style={s.safe}>
      <View style={s.loginHero}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>👨‍⚕️</Text>
        <Text style={s.loginTitle}>{lang==='fr'?'Espace Médecin':'Doctor Portal'}</Text>
        <Text style={s.loginSub}>{lang==='fr'?'Hôpital Général de Yaoundé':'Yaoundé General Hospital'}</Text>
      </View>
      <View style={s.loginCard}>
        <View style={s.infoBox}>
          <Text style={s.infoTxt}>
            🔒 {lang==='fr'
              ? 'Connectez-vous avec votre email professionnel HGY et votre mot de passe.'
              : 'Log in with your HGY professional email and password.'
            }
          </Text>
        </View>
        {loginErr ? <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {loginErr}</Text></View> : null}
        <View style={s.field}>
          <Text style={s.label}>Email professionnel *</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="prenom.nom@hgy.cm" placeholderTextColor={COLORS.gray400}
            autoCapitalize="none" keyboardType="email-address" />
        </View>
        <View style={s.field}>
          <Text style={s.label}>{lang==='fr'?'Mot de passe *':'Password *'}</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor={COLORS.gray400} secureTextEntry />
        </View>
        <TouchableOpacity style={[s.btn, loginLoading && { opacity:0.6 }]}
          onPress={handleLogin} disabled={loginLoading}>
          {loginLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>🔐 {lang==='fr'?'Se connecter':'Log in'}</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={s.changePassBtn}
          onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={s.changePassTxt}>🔑 {lang==='fr'?'Changer mon mot de passe':'Change my password'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  const rdvsFiltres = rdvs.filter(r => filter === 'all' || r.statut === filter)

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <View style={s.avatar}><Text style={{ fontSize:20 }}>👨‍⚕️</Text></View>
          <View>
            <Text style={s.headerName}>{medecin?.nom_complet}</Text>
            <Text style={s.headerSpec}>{medecin?.specialite?.fr || medecin?.specialite?.nom_fr}</Text>
          </View>
        </View>
        <View style={{ flexDirection:'row', gap:8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('ChangePassword')}>
            <Text>🔑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={logout}>
            <Text>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { icon:'📅', value: rdvs.length,                                        label:lang==='fr'?'Total':'Total' },
          { icon:'⏳', value: rdvs.filter(r=>r.statut==='en_attente').length,     label:lang==='fr'?'En attente':'Pending' },
          { icon:'✅', value: rdvs.filter(r=>r.statut==='confirme').length,       label:lang==='fr'?'Confirmés':'Confirmed' },
          { icon:'🏁', value: rdvs.filter(r=>r.statut==='termine').length,        label:lang==='fr'?'Terminés':'Done' },
        ].map((st,i) => (
          <View key={i} style={s.statCard}>
            <Text style={{ fontSize:16 }}>{st.icon}</Text>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {[
          { id:'rdv',   icon:'📅', fr:'Mes RDV',  en:'My Appts' },
          { id:'profil',icon:'👤', fr:'Profil',   en:'Profile' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, activeTab===t.id && s.tabActive]}
            onPress={() => setActiveTab(t.id as any)}>
            <Text style={[s.tabTxt, activeTab===t.id && s.tabTxtActive]}>
              {t.icon} {lang==='fr'?t.fr:t.en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); load()}} />}>

          {activeTab === 'rdv' && (
            <>
              {/* Filtres */}
              <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
                {[
                  { id:'en_attente', fr:'⏳ En attente', en:'⏳ Pending' },
                  { id:'confirme',   fr:'✅ Confirmés',  en:'✅ Confirmed' },
                  { id:'all',        fr:'📋 Tous',       en:'📋 All' },
                ].map(f => (
                  <TouchableOpacity key={f.id} style={[s.filterChip, filter===f.id && s.filterChipActive]}
                    onPress={() => setFilter(f.id as any)}>
                    <Text style={[s.filterChipTxt, filter===f.id && { color:'#fff' }]}>
                      {lang==='fr'?f.fr:f.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {rdvsFiltres.length === 0 ? (
                <View style={s.empty}><Text style={{ fontSize:40 }}>📅</Text>
                  <Text style={s.emptyTxt}>{lang==='fr'?'Aucun RDV.':'No appointments.'}</Text>
                </View>
              ) : rdvsFiltres.map((r:any,i:number) => {
                const conf = STATUT_CONFIG[r.statut] || STATUT_CONFIG.en_attente
                const date = r.date_heure
                  ? new Date(r.date_heure).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',
                      { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
                  : '—'
                return (
                  <View key={i} style={s.rdvCard}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <View style={[s.badge, { backgroundColor:conf.bg }]}>
                        <Text style={[s.badgeTxt, { color:conf.color }]}>{lang==='fr'?conf.fr:conf.en}</Text>
                      </View>
                      {r.reference && <Text style={s.ref}>#{r.reference}</Text>}
                    </View>
                    <Text style={s.rdvPatient}>👤 {r.prenom} {r.nom}</Text>
                    {r.telephone && <Text style={s.rdvInfo}>📞 {r.telephone}</Text>}
                    <Text style={s.rdvInfo}>📅 {date}</Text>
                    {r.motif && <Text style={s.rdvMotif}>💬 {r.motif}</Text>}

                    {/* Actions */}
                    {r.statut === 'en_attente' && (
                      <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                        <TouchableOpacity style={s.btnConfirmer}
                          onPress={() => confirmerRdv(r.id)}>
                          <Text style={s.btnConfirmerTxt}>✅ {lang==='fr'?'Confirmer':'Confirm'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.btnAnnuler}
                          onPress={() => annulerRdv(r.id)}>
                          <Text style={s.btnAnnulerTxt}>❌ {lang==='fr'?'Annuler':'Cancel'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )
              })}
            </>
          )}

          {activeTab === 'profil' && (
            <View style={s.rdvCard}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:16 }}>
                <View style={[s.avatar, { width:64, height:64, borderRadius:32 }]}>
                  <Text style={{ fontSize:28 }}>👨‍⚕️</Text>
                </View>
                <View>
                  <Text style={{ fontSize:18, fontWeight:'800', color:COLORS.black }}>{medecin?.nom_complet}</Text>
                  <Text style={{ fontSize:13, color:COLORS.primary }}>{medecin?.specialite?.fr || medecin?.specialite?.nom_fr}</Text>
                </View>
              </View>
              {[
                { icon:'📧', label:'Email', value:medecin?.email },
              ].map((item,i) => (
                <View key={i} style={{ flexDirection:'row', gap:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:COLORS.gray100 }}>
                  <Text style={{ fontSize:16, width:28 }}>{item.icon}</Text>
                  <View>
                    <Text style={{ fontSize:11, color:COLORS.gray400, fontWeight:'700' }}>{item.label}</Text>
                    <Text style={{ fontSize:14, fontWeight:'600', color:COLORS.black }}>{item.value}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={[s.btn, { marginTop:16 }]}
                onPress={() => navigation.navigate('ChangePassword')}>
                <Text style={s.btnTxt}>🔑 {lang==='fr'?'Changer mon mot de passe':'Change password'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:COLORS.bgAlt },
  center:         { flex:1, alignItems:'center', justifyContent:'center' },
  loginHero:      { backgroundColor:COLORS.primary, padding:40, alignItems:'center' },
  loginTitle:     { fontSize:24, fontWeight:'800', color:'#fff', marginBottom:6 },
  loginSub:       { fontSize:13, color:'rgba(255,255,255,.7)' },
  loginCard:      { backgroundColor:'#fff', borderRadius:20, margin:16, padding:20, ...SHADOW.lg },
  infoBox:        { backgroundColor:COLORS.primaryPale, borderRadius:12, padding:12, marginBottom:14 },
  infoTxt:        { fontSize:12, color:COLORS.primary, lineHeight:18 },
  errorBox:       { backgroundColor:'#FEF2F2', borderRadius:10, padding:10, marginBottom:12 },
  errorTxt:       { color:COLORS.danger, fontSize:13 },
  field:          { marginBottom:14 },
  label:          { fontSize:12, fontWeight:'700', color:COLORS.black, marginBottom:6 },
  input:          { backgroundColor:COLORS.bgAlt, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:COLORS.black },
  btn:            { backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:14, alignItems:'center', ...SHADOW.md },
  btnTxt:         { color:'#fff', fontSize:14, fontWeight:'800' },
  changePassBtn:  { marginTop:12, paddingVertical:10, alignItems:'center' },
  changePassTxt:  { color:COLORS.primary, fontSize:13, fontWeight:'600' },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  avatar:         { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,.2)', alignItems:'center', justifyContent:'center' },
  headerName:     { fontSize:15, fontWeight:'700', color:'#fff' },
  headerSpec:     { fontSize:11, color:'rgba(255,255,255,.7)' },
  iconBtn:        { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,.15)', alignItems:'center', justifyContent:'center' },
  statsRow:       { flexDirection:'row', backgroundColor:COLORS.primary, paddingHorizontal:12, paddingBottom:14, gap:8 },
  statCard:       { flex:1, backgroundColor:'rgba(255,255,255,.12)', borderRadius:12, padding:10, alignItems:'center' },
  statValue:      { fontSize:20, fontWeight:'800', color:'#fff' },
  statLabel:      { fontSize:9, color:'rgba(255,255,255,.65)', marginTop:2, textAlign:'center' },
  tabs:           { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  tab:            { flex:1, paddingVertical:13, alignItems:'center' },
  tabActive:      { borderBottomWidth:2, borderBottomColor:COLORS.primary },
  tabTxt:         { fontSize:13, color:COLORS.gray400, fontWeight:'600' },
  tabTxtActive:   { color:COLORS.primary, fontWeight:'800' },
  filterChip:     { paddingHorizontal:12, paddingVertical:7, borderRadius:99, backgroundColor:'#fff', borderWidth:1.5, borderColor:COLORS.gray200 },
  filterChipActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  filterChipTxt:  { fontSize:12, fontWeight:'700', color:COLORS.gray600 },
  rdvCard:        { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12, ...SHADOW.sm },
  badge:          { paddingHorizontal:10, paddingVertical:3, borderRadius:99 },
  badgeTxt:       { fontSize:11, fontWeight:'700' },
  ref:            { fontSize:11, color:COLORS.gray400, fontFamily:'monospace' },
  rdvPatient:     { fontSize:15, fontWeight:'700', color:COLORS.black, marginBottom:3 },
  rdvInfo:        { fontSize:13, color:COLORS.gray600, marginBottom:2 },
  rdvMotif:       { fontSize:12, color:COLORS.gray400, fontStyle:'italic', marginTop:4 },
  btnConfirmer:   { flex:1, backgroundColor:'#F0FDF4', borderRadius:10, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:'#BBF7D0' },
  btnConfirmerTxt:{ color:'#059669', fontSize:13, fontWeight:'800' },
  btnAnnuler:     { flex:1, backgroundColor:'#FEF2F2', borderRadius:10, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:'#FECACA' },
  btnAnnulerTxt:  { color:'#DC2626', fontSize:13, fontWeight:'800' },
  empty:          { alignItems:'center', paddingVertical:40, gap:10 },
  emptyTxt:       { fontSize:14, color:COLORS.gray400 },
})

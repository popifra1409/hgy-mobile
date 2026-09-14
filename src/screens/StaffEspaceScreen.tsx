import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStaffAuth } from '../context/StaffAuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'
import * as SecureStore from 'expo-secure-store'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

const STATUT_CONFIG: Record<string,any> = {
  en_attente: { bg:'#FFFBEB', color:'#D97706', fr:'⏳ En attente', en:'⏳ Pending' },
  confirme:   { bg:'#F0FDF4', color:'#059669', fr:'✅ Confirmé',   en:'✅ Confirmed' },
  termine:    { bg:'#EFF6FF', color:'#2B6CB0', fr:'🏁 Terminé',   en:'🏁 Done' },
  annule:     { bg:'#FEF2F2', color:'#DC2626', fr:'❌ Annulé',    en:'❌ Cancelled' },
}

export default function StaffEspaceScreen({ navigation }: any) {
  const { staff, isAuthenticated, login, logout } = useStaffAuth()
  const { lang } = useLang()
  const [rdvs,       setRdvs]       = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter,     setFilter]     = useState<string>('en_attente')
  const [search,     setSearch]     = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [loginErr,   setLoginErr]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [selectedRdv, setSelectedRdv] = useState<any>(null)
  const [raisonAnnul, setRaisonAnnul] = useState('')

  const load = async () => {
    if (!staff) return setLoading(false)
    try {
      const token = await SecureStore.getItemAsync('hgy_staff_token')
      const r = await fetch(`${API}/staff/rdvs?statut=${filter}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      setRdvs(d?.data || [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [staff, filter])

  const handleLogin = async () => {
    if (!email || !password) { setLoginErr('Email et mot de passe requis.'); return }
    setLoginLoading(true); setLoginErr('')
    const r = await login(email.trim(), password)
    setLoginLoading(false)
    if (!r.success) setLoginErr(r.message || 'Identifiants incorrects.')
  }

  const action = async (rdvId: number, type: 'confirmer'|'annuler'|'renvoyer', raison?: string) => {
    try {
      const token = await SecureStore.getItemAsync('hgy_staff_token')
      await fetch(`${API}/staff/rdvs/${rdvId}/${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raison }),
      })
      setSelectedRdv(null); setRaisonAnnul(''); load()
      Alert.alert('✅', type === 'confirmer' ? 'RDV confirmé.' : type === 'annuler' ? 'RDV annulé.' : 'RDV renvoyé avec alternatives.')
    } catch { Alert.alert('Erreur', 'Impossible d\'effectuer cette action.') }
  }

  const rdvsFiltres = rdvs.filter(r =>
    !search ||
    r.nom?.toLowerCase().includes(search.toLowerCase()) ||
    r.telephone?.includes(search) ||
    r.reference?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Non connecté ──
  if (!isAuthenticated) return (
    <SafeAreaView style={s.safe}>
      <View style={s.loginHero}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🏥</Text>
        <Text style={s.loginTitle}>{lang==='fr'?'Espace Gestion HGY':'HGY Management Portal'}</Text>
        <Text style={s.loginSub}>{lang==='fr'?'Pour le personnel de l\'hôpital':'For hospital staff'}</Text>
      </View>
      <View style={s.loginCard}>
        <View style={s.roleBox}>
          {['👩‍💼 Secrétaire', '👨‍💼 Admin', '👨‍⚕️ Chef de service', '📋 Gestionnaire'].map((r,i) => (
            <View key={i} style={s.roleChip}><Text style={s.roleChipTxt}>{r}</Text></View>
          ))}
        </View>
        <View style={s.infoBox}>
          <Text style={s.infoTxt}>
            🔒 {lang==='fr'
              ? 'Connectez-vous avec vos identifiants HGY pour gérer les rendez-vous.'
              : 'Log in with your HGY credentials to manage appointments.'
            }
          </Text>
        </View>
        {loginErr ? <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {loginErr}</Text></View> : null}
        <View style={s.field}>
          <Text style={s.label}>Email *</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="votre.email@hgy.cm" placeholderTextColor={COLORS.gray400}
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
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerName}>{staff?.name}</Text>
          <Text style={s.headerRole}>{staff?.roles?.join(', ')}</Text>
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
          { label: lang==='fr'?'En attente':'Pending', value: rdvs.filter(r=>r.statut==='en_attente').length, color:'#D97706' },
          { label: lang==='fr'?'Confirmés':'Confirmed', value: rdvs.filter(r=>r.statut==='confirme').length, color:'#059669' },
          { label: lang==='fr'?'Aujourd\'hui':'Today', value: rdvs.filter(r=>new Date(r.date_heure).toDateString()===new Date().toDateString()).length, color:'#2B6CB0' },
          { label: 'Total', value: rdvs.length, color:'#6B7280' },
        ].map((st,i) => (
          <View key={i} style={s.statCard}>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Filtres */}
      <View style={{ backgroundColor:'#fff', padding:12, borderBottomWidth:1, borderBottomColor:COLORS.gray200 }}>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder={lang==='fr'?'🔍 Nom, téléphone, référence…':'🔍 Name, phone, reference…'}
          placeholderTextColor={COLORS.gray400} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:8 }}>
          {[
            { id:'en_attente', fr:'⏳ En attente', en:'⏳ Pending' },
            { id:'confirme',   fr:'✅ Confirmés',  en:'✅ Confirmed' },
            { id:'all',        fr:'📋 Tous',       en:'📋 All' },
          ].map(f => (
            <TouchableOpacity key={f.id} style={[s.filterChip, filter===f.id && s.filterChipActive]}
              onPress={() => setFilter(f.id)}>
              <Text style={[s.filterChipTxt, filter===f.id && { color:'#fff' }]}>
                {lang==='fr'?f.fr:f.en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}>
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
              <TouchableOpacity key={i} style={s.rdvCard} onPress={() => setSelectedRdv(r)}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                  <View style={[s.badge, { backgroundColor:conf.bg }]}>
                    <Text style={[s.badgeTxt, { color:conf.color }]}>{lang==='fr'?conf.fr:conf.en}</Text>
                  </View>
                  {r.reference && <Text style={s.ref}>#{r.reference}</Text>}
                </View>
                <Text style={s.rdvPatient}>👤 {r.prenom} {r.nom}</Text>
                {r.telephone && <Text style={s.rdvInfo}>📞 {r.telephone}</Text>}
                <Text style={s.rdvInfo}>📅 {date}</Text>
                {r.medecin && <Text style={s.rdvInfo}>👨‍⚕️ Dr {r.medecin}</Text>}
                {r.motif && <Text style={s.rdvMotif}>💬 {r.motif}</Text>}

                {r.statut === 'en_attente' && (
                  <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
                    {staff?.can_confirm_rdv && (
                      <TouchableOpacity style={s.btnConfirmer}
                        onPress={() => action(r.id, 'confirmer')}>
                        <Text style={s.btnConfirmerTxt}>✅ {lang==='fr'?'Confirmer':'Confirm'}</Text>
                      </TouchableOpacity>
                    )}
                    {staff?.can_cancel_rdv && (
                      <TouchableOpacity style={s.btnAnnuler}
                        onPress={() => { setSelectedRdv(r); }}>
                        <Text style={s.btnAnnulerTxt}>❌ {lang==='fr'?'Annuler':'Cancel'}</Text>
                      </TouchableOpacity>
                    )}
                    {staff?.can_renvoyer_rdv && (
                      <TouchableOpacity style={s.btnRenvoyer}
                        onPress={() => action(r.id, 'renvoyer', 'Renvoyé depuis l\'app mobile')}>
                        <Text style={s.btnRenvoyerTxt}>🔄</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      {/* Modal annulation avec raison */}
      <Modal visible={!!selectedRdv && selectedRdv?.statut === 'en_attente'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              {lang==='fr'?'Action sur le RDV':'RDV Action'}
            </Text>
            {selectedRdv && (
              <View style={{ marginBottom:14 }}>
                <Text style={{ fontWeight:'700', color:COLORS.black }}>👤 {selectedRdv.prenom} {selectedRdv.nom}</Text>
                <Text style={{ color:COLORS.gray600, fontSize:13 }}>📅 {selectedRdv.date_heure ? new Date(selectedRdv.date_heure).toLocaleString() : ''}</Text>
              </View>
            )}
            <Text style={s.label}>{lang==='fr'?'Raison (optionnel)':'Reason (optional)'}</Text>
            <TextInput style={[s.input, { marginBottom:16 }]}
              value={raisonAnnul} onChangeText={setRaisonAnnul}
              placeholder={lang==='fr'?'Motif d\'annulation…':'Cancellation reason…'}
              placeholderTextColor={COLORS.gray400} multiline />
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:COLORS.gray400 }]}
                onPress={() => { setSelectedRdv(null); setRaisonAnnul('') }}>
                <Text style={s.btnTxt}>{lang==='fr'?'Fermer':'Close'}</Text>
              </TouchableOpacity>
              {staff?.can_confirm_rdv && (
                <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:'#059669' }]}
                  onPress={() => action(selectedRdv.id, 'confirmer')}>
                  <Text style={s.btnTxt}>✅ {lang==='fr'?'Confirmer':'Confirm'}</Text>
                </TouchableOpacity>
              )}
              {staff?.can_cancel_rdv && (
                <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:COLORS.danger }]}
                  onPress={() => action(selectedRdv.id, 'annuler', raisonAnnul)}>
                  <Text style={s.btnTxt}>❌ {lang==='fr'?'Annuler':'Cancel'}</Text>
                </TouchableOpacity>
              )}
            </View>
            {staff?.can_renvoyer_rdv && (
              <TouchableOpacity style={[s.btn, { backgroundColor:'#7C3AED', marginTop:8 }]}
                onPress={() => action(selectedRdv.id, 'renvoyer', raisonAnnul || 'Indisponibilité')}>
                <Text style={s.btnTxt}>🔄 {lang==='fr'?'Renvoyer avec alternatives':'Reschedule with alternatives'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:COLORS.bgAlt },
  center:         { flex:1, alignItems:'center', justifyContent:'center' },
  loginHero:      { backgroundColor:COLORS.primary, padding:40, alignItems:'center' },
  loginTitle:     { fontSize:22, fontWeight:'800', color:'#fff', marginBottom:6 },
  loginSub:       { fontSize:13, color:'rgba(255,255,255,.7)' },
  loginCard:      { backgroundColor:'#fff', borderRadius:20, margin:16, padding:20, ...SHADOW.lg },
  roleBox:        { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 },
  roleChip:       { backgroundColor:COLORS.primaryPale, borderRadius:99, paddingHorizontal:10, paddingVertical:4 },
  roleChipTxt:    { fontSize:11, color:COLORS.primary, fontWeight:'600' },
  infoBox:        { backgroundColor:COLORS.primaryPale, borderRadius:12, padding:12, marginBottom:14 },
  infoTxt:        { fontSize:12, color:COLORS.primary, lineHeight:18 },
  errorBox:       { backgroundColor:'#FEF2F2', borderRadius:10, padding:10, marginBottom:12 },
  errorTxt:       { color:COLORS.danger, fontSize:13 },
  field:          { marginBottom:14 },
  label:          { fontSize:12, fontWeight:'700', color:COLORS.black, marginBottom:6 },
  input:          { backgroundColor:COLORS.bgAlt, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:COLORS.black },
  btn:            { backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:14, alignItems:'center' },
  btnTxt:         { color:'#fff', fontSize:14, fontWeight:'800' },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  headerName:     { fontSize:15, fontWeight:'700', color:'#fff' },
  headerRole:     { fontSize:11, color:'rgba(255,255,255,.7)', textTransform:'capitalize' },
  iconBtn:        { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,.15)', alignItems:'center', justifyContent:'center' },
  statsRow:       { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  statCard:       { flex:1, padding:12, alignItems:'center', borderRightWidth:1, borderRightColor:COLORS.gray200 },
  statValue:      { fontSize:22, fontWeight:'800' },
  statLabel:      { fontSize:10, color:COLORS.gray400, marginTop:2 },
  searchInput:    { backgroundColor:COLORS.bgAlt, borderRadius:10, borderWidth:1, borderColor:COLORS.gray200, paddingHorizontal:12, paddingVertical:9, fontSize:13, color:COLORS.black },
  filterChip:     { paddingHorizontal:12, paddingVertical:6, borderRadius:99, backgroundColor:COLORS.bgAlt, borderWidth:1, borderColor:COLORS.gray200, marginRight:8 },
  filterChipActive:{ backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  filterChipTxt:  { fontSize:12, fontWeight:'700', color:COLORS.gray600 },
  rdvCard:        { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, ...SHADOW.sm },
  badge:          { paddingHorizontal:10, paddingVertical:3, borderRadius:99 },
  badgeTxt:       { fontSize:11, fontWeight:'700' },
  ref:            { fontSize:11, color:COLORS.gray400 },
  rdvPatient:     { fontSize:15, fontWeight:'700', color:COLORS.black, marginBottom:3 },
  rdvInfo:        { fontSize:12, color:COLORS.gray600, marginBottom:2 },
  rdvMotif:       { fontSize:11, color:COLORS.gray400, fontStyle:'italic' },
  btnConfirmer:   { flex:1, backgroundColor:'#F0FDF4', borderRadius:10, paddingVertical:9, alignItems:'center', borderWidth:1, borderColor:'#BBF7D0' },
  btnConfirmerTxt:{ color:'#059669', fontSize:12, fontWeight:'800' },
  btnAnnuler:     { flex:1, backgroundColor:'#FEF2F2', borderRadius:10, paddingVertical:9, alignItems:'center', borderWidth:1, borderColor:'#FECACA' },
  btnAnnulerTxt:  { color:'#DC2626', fontSize:12, fontWeight:'800' },
  btnRenvoyer:    { backgroundColor:'#F5F3FF', borderRadius:10, paddingVertical:9, paddingHorizontal:12, alignItems:'center', borderWidth:1, borderColor:'#DDD6FE' },
  btnRenvoyerTxt: { color:'#7C3AED', fontSize:14, fontWeight:'800' },
  empty:          { alignItems:'center', paddingVertical:40, gap:10 },
  emptyTxt:       { fontSize:14, color:COLORS.gray400 },
  modalOverlay:   { flex:1, backgroundColor:'rgba(0,0,0,.5)', justifyContent:'flex-end' },
  modalCard:      { backgroundColor:'#fff', borderRadius:20, padding:24, margin:12 },
  modalTitle:     { fontSize:18, fontWeight:'800', color:COLORS.black, marginBottom:14 },
})

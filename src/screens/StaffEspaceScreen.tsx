import React, { useState, useEffect, useCallback } from 'react'
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
const JOURS_FR = ['','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const JOURS_EN = ['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const STATUT_CONFIG: Record<string,any> = {
  en_attente: { bg:'#FFFBEB', color:'#D97706', fr:'⏳ En attente', en:'⏳ Pending' },
  confirme:   { bg:'#F0FDF4', color:'#059669', fr:'✅ Confirmé',   en:'✅ Confirmed' },
  termine:    { bg:'#EFF6FF', color:'#2B6CB0', fr:'🏁 Terminé',   en:'🏁 Done' },
  annule:     { bg:'#FEF2F2', color:'#DC2626', fr:'❌ Annulé',    en:'❌ Cancelled' },
}

export default function StaffEspaceScreen({ navigation }: any) {
  const { staff, isAuthenticated, login, logout } = useStaffAuth()
  const { lang } = useLang()
  const [tab,        setTab]        = useState<'rdv'|'planning'|'stats'>('rdv')
  const [rdvs,       setRdvs]       = useState<any[]>([])
  const [planning,   setPlanning]   = useState<any[]>([])
  const [medecins,   setMedecins]   = useState<any[]>([])
  const [perms,      setPerms]      = useState<any>({})
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter,     setFilter]     = useState('en_attente')
  const [search,     setSearch]     = useState('')
  const [selectedRdv,setSelectedRdv]= useState<any>(null)
  const [raisonAnnul,setRaisonAnnul]= useState('')
  const [patients,   setPatients]   = useState<any[]>([])
  const [searchPat,  setSearchPat]  = useState('')
  const [filterPat,  setFilterPat]  = useState('temporaire')
  const [selectedPat,setSelectedPat]= useState<any>(null)
  const [codeOfficiel,setCodeOfficiel]= useState('')
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editPlan,   setEditPlan]   = useState<any>(null)
  const [planForm,   setPlanForm]   = useState({ medecin_id:'', jour_semaine:'1', heure_debut:'07:30', heure_fin:'15:30', nb_patients_max:'20' })

  // Login
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const getToken = async () => await SecureStore.getItemAsync('hgy_staff_token')

  const loadPerms = async () => {
    const token = await getToken()
    const r = await fetch(`${API}/gestion/mes-permissions`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    const d = await r.json()
    if (d.success) setPerms(d.can || {})
  }

  const loadRdvs = async () => {
    const token = await getToken()
    const url = filter === 'all'
      ? `${API}/gestion/rdvs${search ? `?search=${search}` : ''}`
      : `${API}/gestion/rdvs?statut=${filter}${search ? `&search=${search}` : ''}`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    const d = await r.json()
    setRdvs(d?.data || [])
  }

  const loadPatients = async () => {
    const token = await getToken()
    const url = filterPat === 'all'
      ? `${API}/gestion/patients${searchPat ? `?search=${searchPat}` : ''}`
      : `${API}/gestion/patients?statut_dossier=${filterPat}${searchPat ? `&search=${searchPat}` : ''}`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    const d = await r.json()
    setPatients(d?.data || [])
  }

  const loadPlanning = async () => {
    const token = await getToken()
    const r = await fetch(`${API}/gestion/planning`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    const d = await r.json()
    setPlanning(d?.data || [])
  }

  const loadMedecins = async () => {
    const r = await fetch(`${API}/medecins?avec_planning=0&per_page=200`, { headers: { Accept: 'application/json' } })
    const d = await r.json()
    setMedecins(d?.data || [])
  }

  const loadAll = async () => {
    if (!staff) return setLoading(false)
    try {
      await Promise.all([loadPerms(), loadRdvs(), loadPlanning(), loadMedecins(), loadPatients()])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { loadAll() }, [staff, filter])

  const handleLogin = async () => {
    if (!email || !password) { setLoginErr('Email et mot de passe requis.'); return }
    setLoginLoading(true); setLoginErr('')
    const r = await login(email.trim(), password)
    setLoginLoading(false)
    if (!r.success) setLoginErr(r.message || 'Identifiants incorrects.')
  }

  const actionRdv = async (rdvId: number, type: 'confirmer'|'annuler'|'renvoyer', raison?: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`${API}/gestion/rdvs/${rdvId}/${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ raison }),
      })
      const d = await res.json()
      setSelectedRdv(null); setRaisonAnnul('')
      if (d.success) {
        Alert.alert('✅', type === 'confirmer' ? 'RDV confirmé ! Email envoyé au patient.' : type === 'annuler' ? 'RDV annulé.' : 'RDV renvoyé avec alternatives.')
        loadRdvs()
      } else {
        Alert.alert('Erreur', d.message || 'Action impossible.')
      }
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
  }

  const savePlanning = async () => {
    try {
      const token = await getToken()
      const url    = editPlan ? `${API}/gestion/planning/${editPlan.id}` : `${API}/gestion/planning`
      const method = editPlan ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...planForm, medecin_id: parseInt(planForm.medecin_id), jour_semaine: parseInt(planForm.jour_semaine), nb_patients_max: parseInt(planForm.nb_patients_max) }),
      })
      const d = await res.json()
      setShowPlanModal(false); setEditPlan(null)
      if (d.success) { Alert.alert('✅', d.message); loadPlanning() }
      else Alert.alert('Erreur', d.message)
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
  }

  const validerDossier = async () => {
    if (!codeOfficiel.trim()) { Alert.alert('Erreur', 'Le code officiel est requis.'); return }
    try {
      const token = await getToken()
      const res = await fetch(`${API}/gestion/patients/${selectedPat.id}/valider`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code_officiel: codeOfficiel.trim() }),
      })
      const d = await res.json()
      setSelectedPat(null); setCodeOfficiel('')
      if (d.success) { Alert.alert('✅', d.message); loadPatients() }
      else Alert.alert('Erreur', d.message)
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
  }

  const deletePlanning = async (planId: number) => {
    Alert.alert(lang==='fr'?'Désactiver ?':'Deactivate?', lang==='fr'?'Ce créneau sera désactivé.':'This slot will be deactivated.', [
      { text: lang==='fr'?'Annuler':'Cancel', style:'cancel' },
      { text: lang==='fr'?'Désactiver':'Deactivate', style:'destructive', onPress: async () => {
        const token = await getToken()
        await fetch(`${API}/gestion/planning/${planId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        loadPlanning()
      }}
    ])
  }

  // ── LOGIN ──
  if (!isAuthenticated) return (
    <SafeAreaView style={s.safe}>
      <View style={s.loginHero}>
        <Text style={{ fontSize:44, marginBottom:10 }}>🏥</Text>
        <Text style={s.loginTitle}>{lang==='fr'?'Espace Gestion HGY':'HGY Management'}</Text>
        <Text style={s.loginSub}>{lang==='fr'?'Personnel de l\'hôpital':'Hospital staff'}</Text>
      </View>
      <View style={s.loginCard}>
        <View style={s.rolesRow}>
          {['👩‍💼 Secrétaire','👨‍💼 Admin','📋 Gestionnaire'].map((r,i)=>(
            <View key={i} style={s.roleChip}><Text style={s.roleChipTxt}>{r}</Text></View>
          ))}
        </View>
        {loginErr ? <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {loginErr}</Text></View> : null}
        <View style={s.field}>
          <Text style={s.label}>Email *</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="email@hgy.cm" placeholderTextColor={COLORS.gray400}
            autoCapitalize="none" keyboardType="email-address" />
        </View>
        <View style={s.field}>
          <Text style={s.label}>{lang==='fr'?'Mot de passe *':'Password *'}</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor={COLORS.gray400} secureTextEntry />
        </View>
        <TouchableOpacity style={[s.btn, loginLoading && { opacity:0.6 }]} onPress={handleLogin} disabled={loginLoading}>
          {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>🔐 {lang==='fr'?'Se connecter':'Log in'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  const rdvsFiltres = rdvs.filter(r =>
    !search ||
    r.nom?.toLowerCase().includes(search.toLowerCase()) ||
    r.telephone?.includes(search) ||
    r.reference?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    perms.rdv_view    && { id:'rdv',      fr:'📅 RDV',      en:'📅 RDVs' },
    perms.planning_view && { id:'planning', fr:'🗓 Planning',  en:'🗓 Schedule' },
    perms.patients_view && { id:'patients', fr:'👤 Patients', en:'👤 Patients' },
  ].filter(Boolean) as any[]

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

      {/* Stats rapides */}
      <View style={s.statsRow}>
        {[
          { label:lang==='fr'?'En attente':'Pending', value:rdvs.filter(r=>r.statut==='en_attente').length, color:'#D97706' },
          { label:lang==='fr'?'Confirmés':'Confirmed', value:rdvs.filter(r=>r.statut==='confirme').length, color:'#059669' },
          { label:lang==='fr'?'Créneaux':'Slots', value:planning.length, color:'#7C3AED' },
          { label:'Total', value:rdvs.length, color:COLORS.primary },
        ].map((st,i)=>(
          <View key={i} style={[s.statCard, i<3 && { borderRightWidth:1, borderRightColor:COLORS.gray200 }]}>
            <Text style={[s.statValue, { color:st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {tabs.map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, tab===t.id && s.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabTxt, tab===t.id && s.tabTxtActive]}>{lang==='fr'?t.fr:t.en}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll() }} />}>

          {/* ═══ TAB RDV ═══ */}
          {tab === 'rdv' && (
            <>
              <View style={{ gap:8, marginBottom:12 }}>
                <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
                  placeholder={lang==='fr'?'🔍 Nom, téléphone, référence…':'🔍 Name, phone, reference…'}
                  placeholderTextColor={COLORS.gray400} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { id:'en_attente', fr:'⏳ En attente' },
                    { id:'confirme',   fr:'✅ Confirmés' },
                    { id:'annule',     fr:'❌ Annulés' },
                    { id:'all',        fr:'📋 Tous' },
                  ].map(f => (
                    <TouchableOpacity key={f.id} style={[s.filterChip, filter===f.id && s.filterChipActive]}
                      onPress={() => setFilter(f.id)}>
                      <Text style={[s.filterChipTxt, filter===f.id && { color:'#fff' }]}>{f.fr}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {rdvsFiltres.length === 0 ? (
                <View style={s.empty}><Text style={{ fontSize:40 }}>📅</Text>
                  <Text style={s.emptyTxt}>{lang==='fr'?'Aucun RDV.':'No appointments.'}</Text>
                </View>
              ) : rdvsFiltres.map((r:any,i:number) => {
                const conf = STATUT_CONFIG[r.statut] || STATUT_CONFIG.en_attente
                const date = r.date_heure ? new Date(r.date_heure).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',
                  { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'
                return (
                  <TouchableOpacity key={i} style={s.rdvCard} onPress={() => setSelectedRdv(r)}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                      <View style={[s.badge, { backgroundColor:conf.bg }]}>
                        <Text style={[s.badgeTxt, { color:conf.color }]}>{lang==='fr'?conf.fr:conf.en}</Text>
                      </View>
                      <Text style={s.ref}>#{r.reference}</Text>
                    </View>
                    <Text style={s.rdvPatient}>👤 {r.prenom} {r.nom}</Text>
                    {r.telephone && <Text style={s.rdvInfo}>📞 {r.telephone}</Text>}
                    {r.email && <Text style={s.rdvInfo}>📧 {r.email}</Text>}
                    <Text style={s.rdvInfo}>📅 {date}</Text>
                    {r.medecin && <Text style={s.rdvInfo}>👨‍⚕️ Dr {r.medecin}</Text>}
                    {r.specialite && <Text style={s.rdvInfo}>🔬 {r.specialite}</Text>}
                    {r.motif && <Text style={s.rdvMotif}>💬 {r.motif}</Text>}

                    {r.statut === 'en_attente' && (
                      <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
                        {perms.rdv_confirm && (
                          <TouchableOpacity style={s.btnConfirmer} onPress={() => actionRdv(r.id, 'confirmer')}>
                            <Text style={s.btnConfirmerTxt}>✅ {lang==='fr'?'Confirmer':'Confirm'}</Text>
                          </TouchableOpacity>
                        )}
                        {perms.rdv_cancel && (
                          <TouchableOpacity style={s.btnAnnuler} onPress={() => setSelectedRdv(r)}>
                            <Text style={s.btnAnnulerTxt}>❌ {lang==='fr'?'Annuler':'Cancel'}</Text>
                          </TouchableOpacity>
                        )}
                        {perms.rdv_edit && (
                          <TouchableOpacity style={s.btnRenvoyer}
                            onPress={() => Alert.alert(
                              lang==='fr'?'Renvoyer le RDV ?':'Reschedule?',
                              lang==='fr'?'Proposer des alternatives au patient ?':'Suggest alternatives to patient?',
                              [
                                { text: lang==='fr'?'Non':'No', style:'cancel' },
                                { text: lang==='fr'?'Oui':'Yes', onPress: () => actionRdv(r.id,'renvoyer','Indisponibilité') }
                              ]
                            )}>
                            <Text style={{ fontSize:16 }}>🔄</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </>
          )}

          {/* ═══ TAB PATIENTS ═══ */}
          {tab === 'patients' && (
            <>
              <View style={{ gap:8, marginBottom:12 }}>
                <TextInput style={s.searchInput} value={searchPat} onChangeText={setSearchPat}
                  placeholder={lang==='fr'?'🔍 Nom, téléphone, code patient…':'🔍 Name, phone, patient code…'}
                  placeholderTextColor={COLORS.gray400} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { id:'temporaire', fr:'⏳ Temporaires', en:'⏳ Temporary' },
                    { id:'valide',     fr:'✅ Validés',     en:'✅ Validated' },
                    { id:'all',        fr:'📋 Tous',        en:'📋 All' },
                  ].map(f => (
                    <TouchableOpacity key={f.id} style={[s.filterChip, filterPat===f.id && s.filterChipActive]}
                      onPress={() => { setFilterPat(f.id); loadPatients() }}>
                      <Text style={[s.filterChipTxt, filterPat===f.id && { color:'#fff' }]}>{lang==='fr'?f.fr:f.en}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {patients.length === 0 ? (
                <View style={s.empty}><Text style={{ fontSize:40 }}>👤</Text>
                  <Text style={s.emptyTxt}>{lang==='fr'?'Aucun patient.':'No patients.'}</Text>
                </View>
              ) : patients.map((p:any, i:number) => (
                <View key={i} style={s.planCard}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <View style={{ flex:1 }}>
                      <Text style={s.planMedecin}>👤 {p.prenom} {p.nom}</Text>
                      {p.telephone && <Text style={s.planSpec}>📞 {p.telephone}</Text>}
                      {p.email && <Text style={s.planSpec}>📧 {p.email}</Text>}
                      <Text style={s.planHoraire}>
                        🪪 {p.code_patient || '—'}
                        {p.code_patient_officiel && p.code_patient_officiel !== p.code_patient
                          ? ` → ${p.code_patient_officiel}` : ''}
                      </Text>
                      {p.numero_dossier && <Text style={s.planMax}>📋 {p.numero_dossier}</Text>}
                      <View style={[s.badge, {
                        backgroundColor: p.statut_dossier==='valide' ? '#F0FDF4' : '#FFFBEB',
                        alignSelf:'flex-start', marginTop:6
                      }]}>
                        <Text style={[s.badgeTxt, { color: p.statut_dossier==='valide' ? '#059669' : '#D97706' }]}>
                          {p.statut_dossier==='valide' ? '✅ Validé' : '⏳ Temporaire'}
                        </Text>
                      </View>
                    </View>
                    {p.statut_dossier !== 'valide' && perms.patients_edit && (
                      <TouchableOpacity style={[s.editBtn, { backgroundColor:'#F0FDF4' }]}
                        onPress={() => { setSelectedPat(p); setCodeOfficiel('') }}>
                        <Text style={{ fontSize:14 }}>✅</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ═══ TAB PLANNING ═══ */}
          {tab === 'planning' && (
            <>
              {perms.planning_create && (
                <TouchableOpacity style={[s.btn, { marginBottom:14 }]}
                  onPress={() => { setEditPlan(null); setPlanForm({ medecin_id:'', jour_semaine:'1', heure_debut:'07:30', heure_fin:'15:30', nb_patients_max:'20' }); setShowPlanModal(true) }}>
                  <Text style={s.btnTxt}>➕ {lang==='fr'?'Nouveau créneau':'New slot'}</Text>
                </TouchableOpacity>
              )}

              {planning.length === 0 ? (
                <View style={s.empty}><Text style={{ fontSize:40 }}>🗓</Text>
                  <Text style={s.emptyTxt}>{lang==='fr'?'Aucun planning actif.':'No active schedule.'}</Text>
                </View>
              ) : planning.map((p:any, i:number) => (
                <View key={i} style={s.planCard}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <View style={{ flex:1 }}>
                      <Text style={s.planMedecin}>👨‍⚕️ {p.medecin}</Text>
                      {p.specialite && <Text style={s.planSpec}>🔬 {p.specialite}</Text>}
                      <Text style={s.planHoraire}>
                        📅 {lang==='fr' ? JOURS_FR[p.jour_semaine] : JOURS_EN[p.jour_semaine]}
                        {'  '}🕐 {p.heure_debut?.slice(0,5)} - {p.heure_fin?.slice(0,5)}
                      </Text>
                      <Text style={s.planMax}>👥 Max {p.nb_patients_max} patients</Text>
                    </View>
                    <View style={{ flexDirection:'row', gap:8 }}>
                      {perms.planning_edit && (
                        <TouchableOpacity style={s.editBtn} onPress={() => {
                          setEditPlan(p)
                          setPlanForm({
                            medecin_id: String(p.medecin_id),
                            jour_semaine: String(p.jour_semaine),
                            heure_debut: p.heure_debut?.slice(0,5) || '07:30',
                            heure_fin: p.heure_fin?.slice(0,5) || '15:30',
                            nb_patients_max: String(p.nb_patients_max || 20),
                          })
                          setShowPlanModal(true)
                        }}>
                          <Text style={{ fontSize:14 }}>✏️</Text>
                        </TouchableOpacity>
                      )}
                      {perms.planning_delete && (
                        <TouchableOpacity style={s.deleteBtn} onPress={() => deletePlanning(p.id)}>
                          <Text style={{ fontSize:14 }}>🗑</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Modal détail/action RDV ── */}
      <Modal visible={!!selectedRdv} transparent animationType="slide" onRequestClose={() => setSelectedRdv(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>📋 {lang==='fr'?'Gestion du RDV':'RDV Management'}</Text>
            {selectedRdv && (
              <View style={{ marginBottom:14, padding:12, backgroundColor:COLORS.bgAlt, borderRadius:12 }}>
                <Text style={{ fontWeight:'700', color:COLORS.black, marginBottom:2 }}>👤 {selectedRdv.prenom} {selectedRdv.nom}</Text>
                <Text style={{ color:COLORS.gray600, fontSize:13 }}>📞 {selectedRdv.telephone}</Text>
                {selectedRdv.email && <Text style={{ color:COLORS.gray600, fontSize:13 }}>📧 {selectedRdv.email}</Text>}
                <Text style={{ color:COLORS.gray600, fontSize:13 }}>👨‍⚕️ Dr {selectedRdv.medecin}</Text>
                <Text style={{ color:COLORS.gray600, fontSize:13 }}>#{selectedRdv.reference}</Text>
              </View>
            )}
            {perms.rdv_cancel && (
              <>
                <Text style={s.label}>{lang==='fr'?'Raison d\'annulation (optionnel)':'Cancellation reason (optional)'}</Text>
                <TextInput style={[s.input, { marginBottom:12 }]}
                  value={raisonAnnul} onChangeText={setRaisonAnnul}
                  placeholder={lang==='fr'?'Ex: Médecin absent…':'Ex: Doctor absent…'}
                  placeholderTextColor={COLORS.gray400} multiline />
              </>
            )}
            <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
              <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:COLORS.gray400 }]}
                onPress={() => { setSelectedRdv(null); setRaisonAnnul('') }}>
                <Text style={s.btnTxt}>✕ {lang==='fr'?'Fermer':'Close'}</Text>
              </TouchableOpacity>
              {perms.rdv_confirm && selectedRdv?.statut === 'en_attente' && (
                <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:'#059669' }]}
                  onPress={() => actionRdv(selectedRdv.id, 'confirmer')}>
                  <Text style={s.btnTxt}>✅ {lang==='fr'?'Confirmer':'Confirm'}</Text>
                </TouchableOpacity>
              )}
              {perms.rdv_cancel && selectedRdv?.statut === 'en_attente' && (
                <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:COLORS.danger }]}
                  onPress={() => actionRdv(selectedRdv.id, 'annuler', raisonAnnul)}>
                  <Text style={s.btnTxt}>❌ {lang==='fr'?'Annuler':'Cancel'}</Text>
                </TouchableOpacity>
              )}
            </View>
            {perms.rdv_edit && selectedRdv?.statut === 'en_attente' && (
              <TouchableOpacity style={[s.btn, { backgroundColor:'#7C3AED', marginTop:8 }]}
                onPress={() => actionRdv(selectedRdv.id, 'renvoyer', raisonAnnul || 'Indisponibilité')}>
                <Text style={s.btnTxt}>🔄 {lang==='fr'?'Renvoyer avec alternatives':'Reschedule'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal Validation Dossier Patient ── */}
      <Modal visible={!!selectedPat} transparent animationType="slide" onRequestClose={() => setSelectedPat(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>✅ {lang==='fr'?'Valider le dossier patient':'Validate patient file'}</Text>
            {selectedPat && (
              <View style={{ backgroundColor:COLORS.bgAlt, borderRadius:12, padding:12, marginBottom:14 }}>
                <Text style={{ fontWeight:'700', color:COLORS.black }}>👤 {selectedPat.prenom} {selectedPat.nom}</Text>
                <Text style={{ color:COLORS.gray600, fontSize:13 }}>📞 {selectedPat.telephone}</Text>
                <Text style={{ color:COLORS.gray600, fontSize:13 }}>🪪 Code temporaire: {selectedPat.code_patient}</Text>
              </View>
            )}
            <View style={{ backgroundColor:'#FFFBEB', borderRadius:10, padding:10, marginBottom:14 }}>
              <Text style={{ fontSize:12, color:'#92400E', lineHeight:18 }}>
                ⚠️ {lang==='fr'
                  ? "Entrez le code officiel attribué lors de l'enregistrement physique du patient. Ce code remplacera le code temporaire et sera envoyé par email au patient."
                  : "Enter the official code assigned during patient physical registration. This will replace the temporary code."
                }
              </Text>
            </View>
            <Text style={s.label}>{lang==='fr'?'Code officiel *':'Official code *'}</Text>
            <TextInput style={[s.input, { marginBottom:16, fontFamily:'monospace', fontSize:16, fontWeight:'700' }]}
              value={codeOfficiel} onChangeText={setCodeOfficiel}
              placeholder={lang==='fr'?'Ex: 26PA00001':'Ex: 26PA00001'}
              placeholderTextColor={COLORS.gray400}
              autoCapitalize="characters" />
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:COLORS.gray400 }]}
                onPress={() => { setSelectedPat(null); setCodeOfficiel('') }}>
                <Text style={s.btnTxt}>{lang==='fr'?'Annuler':'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:'#059669' }]}
                onPress={validerDossier}>
                <Text style={s.btnTxt}>✅ {lang==='fr'?'Valider':'Validate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Planning ── */}
      <Modal visible={showPlanModal} transparent animationType="slide" onRequestClose={() => setShowPlanModal(false)}>
        <View style={s.modalOverlay}>
          <ScrollView>
            <View style={[s.modalCard, { margin:16 }]}>
              <Text style={s.modalTitle}>
                {editPlan ? (lang==='fr'?'✏️ Modifier créneau':'✏️ Edit slot') : (lang==='fr'?'➕ Nouveau créneau':'➕ New slot')}
              </Text>

              <Text style={s.label}>{lang==='fr'?'Médecin *':'Doctor *'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
                {medecins.map((m:any) => (
                  <TouchableOpacity key={m.id}
                    style={[s.filterChip, planForm.medecin_id===String(m.id) && s.filterChipActive, { marginRight:6 }]}
                    onPress={() => setPlanForm(p => ({ ...p, medecin_id: String(m.id) }))}>
                    <Text style={[s.filterChipTxt, planForm.medecin_id===String(m.id) && { color:'#fff' }]} numberOfLines={1}>
                      {m.nom_complet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.label}>{lang==='fr'?'Jour *':'Day *'}</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                {[1,2,3,4,5,6,7].map(j => (
                  <TouchableOpacity key={j}
                    style={[s.filterChip, planForm.jour_semaine===String(j) && s.filterChipActive]}
                    onPress={() => setPlanForm(p => ({ ...p, jour_semaine: String(j) }))}>
                    <Text style={[s.filterChipTxt, planForm.jour_semaine===String(j) && { color:'#fff' }]}>
                      {lang==='fr' ? JOURS_FR[j].slice(0,3) : JOURS_EN[j].slice(0,3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection:'row', gap:10 }}>
                <View style={{ flex:1 }}>
                  <Text style={s.label}>{lang==='fr'?'Début *':'Start *'}</Text>
                  <TextInput style={s.input} value={planForm.heure_debut}
                    onChangeText={v => setPlanForm(p => ({ ...p, heure_debut: v }))}
                    placeholder="07:30" placeholderTextColor={COLORS.gray400} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.label}>{lang==='fr'?'Fin *':'End *'}</Text>
                  <TextInput style={s.input} value={planForm.heure_fin}
                    onChangeText={v => setPlanForm(p => ({ ...p, heure_fin: v }))}
                    placeholder="15:30" placeholderTextColor={COLORS.gray400} />
                </View>
              </View>

              <Text style={[s.label, { marginTop:10 }]}>{lang==='fr'?'Max patients':'Max patients'}</Text>
              <TextInput style={[s.input, { marginBottom:16 }]} value={planForm.nb_patients_max}
                onChangeText={v => setPlanForm(p => ({ ...p, nb_patients_max: v }))}
                keyboardType="numeric" placeholder="20" placeholderTextColor={COLORS.gray400} />

              <View style={{ flexDirection:'row', gap:10 }}>
                <TouchableOpacity style={[s.btn, { flex:1, backgroundColor:COLORS.gray400 }]}
                  onPress={() => setShowPlanModal(false)}>
                  <Text style={s.btnTxt}>{lang==='fr'?'Annuler':'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { flex:1 }]} onPress={savePlanning}>
                  <Text style={s.btnTxt}>{lang==='fr'?'Enregistrer':'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  rolesRow:       { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 },
  roleChip:       { backgroundColor:COLORS.primaryPale, borderRadius:99, paddingHorizontal:10, paddingVertical:4 },
  roleChipTxt:    { fontSize:11, color:COLORS.primary, fontWeight:'600' },
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
  statCard:       { flex:1, padding:12, alignItems:'center' },
  statValue:      { fontSize:20, fontWeight:'800' },
  statLabel:      { fontSize:10, color:COLORS.gray400, marginTop:2, textAlign:'center' },
  tabs:           { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  tab:            { flex:1, paddingVertical:13, alignItems:'center' },
  tabActive:      { borderBottomWidth:2, borderBottomColor:COLORS.primary },
  tabTxt:         { fontSize:13, color:COLORS.gray400, fontWeight:'600' },
  tabTxtActive:   { color:COLORS.primary, fontWeight:'800' },
  searchInput:    { backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:COLORS.gray200, paddingHorizontal:12, paddingVertical:9, fontSize:13, color:COLORS.black },
  filterChip:     { paddingHorizontal:12, paddingVertical:6, borderRadius:99, backgroundColor:COLORS.bgAlt, borderWidth:1, borderColor:COLORS.gray200, marginRight:6 },
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
  btnRenvoyer:    { backgroundColor:'#F5F3FF', borderRadius:10, paddingVertical:9, paddingHorizontal:12, borderWidth:1, borderColor:'#DDD6FE', alignItems:'center' },
  planCard:       { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, ...SHADOW.sm },
  planMedecin:    { fontSize:14, fontWeight:'700', color:COLORS.black, marginBottom:3 },
  planSpec:       { fontSize:12, color:COLORS.primary, marginBottom:3 },
  planHoraire:    { fontSize:13, color:COLORS.gray600, marginBottom:3 },
  planMax:        { fontSize:11, color:COLORS.gray400 },
  editBtn:        { width:34, height:34, borderRadius:8, backgroundColor:COLORS.primaryPale, alignItems:'center', justifyContent:'center' },
  deleteBtn:      { width:34, height:34, borderRadius:8, backgroundColor:'#FEF2F2', alignItems:'center', justifyContent:'center' },
  empty:          { alignItems:'center', paddingVertical:40, gap:10 },
  emptyTxt:       { fontSize:14, color:COLORS.gray400 },
  modalOverlay:   { flex:1, backgroundColor:'rgba(0,0,0,.5)', justifyContent:'flex-end' },
  modalCard:      { backgroundColor:'#fff', borderRadius:20, padding:20 },
  modalTitle:     { fontSize:17, fontWeight:'800', color:COLORS.black, marginBottom:14 },
})

import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Switch
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStaffAuth } from '../context/StaffAuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'
import * as SecureStore from 'expo-secure-store'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

const STATUT_CONFIG: Record<string,any> = {
  planifiee: { bg:'#EFF6FF', color:'#1D4ED8', label:'📅 Planifiée' },
  en_cours:  { bg:'#F0FDF4', color:'#059669', label:'▶️ En cours' },
  terminee:  { bg:'#F1F5F9', color:'#475569', label:'✅ Terminée' },
}

export default function CampagneGestionScreen({ navigation }: any) {
  const { lang } = useLang()
  const { isAuthenticated } = useStaffAuth()
  const [campagnes,    setCampagnes]    = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [selectedCamp, setSelectedCamp] = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [tab,          setTab]          = useState<'liste'|'inscrits'>('liste')
  const [loadingPart,  setLoadingPart]  = useState(false)
  const [searchCamp,   setSearchCamp]   = useState('')
  const [searchPart,   setSearchPart]   = useState('')

  const getToken = async () => await SecureStore.getItemAsync('hgy_staff_token')

  const loadCampagnes = async () => {
    try {
      const r = await fetch(`${API}/campagnes`, { headers: { Accept:'application/json' } })
      const d = await r.json()
      setCampagnes(d?.data || [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  const loadParticipants = async (campId: number) => {
    setLoadingPart(true)
    try {
      const token = await getToken()
      const r = await fetch(`${API}/campagnes/${campId}/participants`, {
        headers: { Authorization:`Bearer ${token}`, Accept:'application/json' }
      })
      const d = await r.json()
      setParticipants(d?.data || [])
    } catch {}
    finally { setLoadingPart(false) }
  }

  const deleteParticipant = async (campId: number, partId: number) => {
    Alert.alert(
      lang==='fr'?'Supprimer ?':'Delete?',
      lang==='fr'?'Supprimer ce participant définitivement ?':'Delete this participant permanently?',
      [
        { text: lang==='fr'?'Annuler':'Cancel', style:'cancel' },
        { text: lang==='fr'?'Supprimer':'Delete', style:'destructive', onPress: async () => {
          try {
            const token = await getToken()
            await fetch(`${API}/gestion/campagnes/${campId}/participants/${partId}`, {
              method: 'DELETE',
              headers: { Authorization:`Bearer ${token}`, Accept:'application/json' }
            })
            loadParticipants(campId)
          } catch { Alert.alert('Erreur', 'Erreur réseau.') }
        }}
      ]
    )
  }

  const togglePresence = async (campId: number, partId: number) => {
    try {
      const token = await getToken()
      await fetch(`${API}/campagnes/${campId}/participants/${partId}/presence`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${token}`, Accept:'application/json' }
      })
      loadParticipants(campId)
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
  }

  const toggleInscription = async (camp: any) => {
    try {
      const token = await getToken()
      const r = await fetch(`${API}/gestion/campagnes/${camp.id}/toggle-inscription`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${token}`, Accept:'application/json' }
      })
      const d = await r.json()
      if (d.success) loadCampagnes()
      else Alert.alert('Erreur', d.message)
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
  }

  useEffect(() => { loadCampagnes() }, [])

  if (!isAuthenticated) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={{ fontSize:40 }}>🔒</Text>
        <Text style={{ color:COLORS.gray600, marginTop:8 }}>
          {lang==='fr'?'Connectez-vous à l\'espace gestion':'Please log in to staff area'}
        </Text>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize:20, color:'#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🏥 {lang==='fr'?'Campagnes':'Campaigns'}</Text>
        <View style={{ width:36 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCampagnes() }} />}>

          {/* Recherche campagnes */}
          <TextInput
            style={s.searchInput}
            value={searchCamp}
            onChangeText={setSearchCamp}
            placeholder={lang==='fr'?'🔍 Rechercher une campagne…':'🔍 Search campaign…'}
            placeholderTextColor={COLORS.gray400}
          />

          {campagnes.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize:40 }}>📢</Text>
              <Text style={s.emptyTxt}>{lang==='fr'?'Aucune campagne.':'No campaigns.'}</Text>
            </View>
          ) : campagnes.map((c:any, i:number) => {
            const conf = STATUT_CONFIG[c.statut] || STATUT_CONFIG.planifiee
            const dateD = c.date_debut ? new Date(c.date_debut).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'short',year:'numeric'}) : null
            const dateF = c.date_fin   ? new Date(c.date_fin).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'short',year:'numeric'}) : null

            return (
              <View key={i} style={s.card}>
                {/* Header */}
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
                  <View style={[s.badge, { backgroundColor:conf.bg }]}>
                    <Text style={[s.badgeTxt, { color:conf.color }]}>{conf.label}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: c.inscription_ouverte ? '#F0FDF4':'#FEF2F2' }]}>
                    <Text style={[s.badgeTxt, { color: c.inscription_ouverte ? '#059669':'#DC2626' }]}>
                      {c.inscription_ouverte ? '✅ Inscriptions ouvertes' : '🔒 Inscriptions fermées'}
                    </Text>
                  </View>
                </View>

                <Text style={s.campTitle}>{c.titre_fr}</Text>
                {c.lieu && <Text style={s.campInfo}>📍 {c.lieu}</Text>}
                {dateD && <Text style={s.campInfo}>📅 {dateD}{dateF ? ` → ${dateF}` : ''}</Text>}
                {c.nb_inscrits > 0 && (
                  <Text style={s.campInfo}>
                    👥 {c.nb_inscrits} inscrit(s)
                    {c.nb_places_max ? ` / ${c.nb_places_max} places` : ''}
                  </Text>
                )}

                {/* Dates inscription */}
                {(c.date_debut_inscription || c.date_fin_inscription) && (
                  <View style={{ backgroundColor:'#FFF7ED', borderRadius:8, padding:8, marginTop:6 }}>
                    <Text style={{ fontSize:11, color:'#C2410C' }}>
                      ⏰ Inscriptions :
                      {c.date_debut_inscription ? ` du ${new Date(c.date_debut_inscription).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}` : ''}
                      {c.date_fin_inscription ? ` au ${new Date(c.date_fin_inscription).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}` : ''}
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={{ flexDirection:'row', gap:8, marginTop:10, flexWrap:'wrap' }}>
                  {c.inscription_ouverte && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor:'#EFF6FF' }]}
                      onPress={() => {
                        setSelectedCamp(c)
                        setTab('inscrits')
                        loadParticipants(c.id)
                      }}>
                      <Text style={[s.actionBtnTxt, { color:'#1D4ED8' }]}>
                        👥 {lang==='fr'?'Participants':'Participants'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: c.inscription_ouverte ? '#FEF2F2':'#F0FDF4' }]}
                    onPress={() => Alert.alert(
                      c.inscription_ouverte ? '🔒 Fermer les inscriptions ?' : '✅ Ouvrir les inscriptions ?',
                      c.inscription_ouverte
                        ? 'Les nouveaux participants ne pourront plus s\'inscrire.'
                        : 'Les participants pourront s\'inscrire en ligne.',
                      [
                        { text:'Annuler', style:'cancel' },
                        { text:'Confirmer', onPress: () => toggleInscription(c) }
                      ]
                    )}>
                    <Text style={[s.actionBtnTxt, { color: c.inscription_ouverte ? '#DC2626':'#059669' }]}>
                      {c.inscription_ouverte ? '🔒 Fermer' : '✅ Ouvrir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Modal participants */}
      <Modal visible={!!selectedCamp && tab==='inscrits'} animationType="slide"
        onRequestClose={() => { setSelectedCamp(null); setTab('liste') }}>
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => { setSelectedCamp(null); setTab('liste') }} style={s.backBtn}>
              <Text style={{ fontSize:20, color:'#fff' }}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle} numberOfLines={1}>
              👥 {selectedCamp?.titre_fr?.slice(0,25)}
            </Text>
            <View style={{ width:36 }} />
          </View>

          {/* Stats */}
          <View style={{ flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 }}>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color:COLORS.primary }]}>{participants.length}</Text>
              <Text style={s.statLabel}>{lang==='fr'?'Inscrits':'Registered'}</Text>
            </View>
            <View style={[s.statCard, { borderLeftWidth:1, borderLeftColor:COLORS.gray200 }]}>
              <Text style={[s.statValue, { color:'#059669' }]}>{participants.filter(p=>p.present).length}</Text>
              <Text style={s.statLabel}>{lang==='fr'?'Présents':'Present'}</Text>
            </View>
            <View style={[s.statCard, { borderLeftWidth:1, borderLeftColor:COLORS.gray200 }]}>
              <Text style={[s.statValue, { color:'#DC2626' }]}>{participants.filter(p=>!p.present).length}</Text>
              <Text style={s.statLabel}>{lang==='fr'?'Absents':'Absent'}</Text>
            </View>
          </View>

          {/* Recherche participants */}
          <View style={{ padding:12, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 }}>
            <TextInput
              style={s.searchInput}
              value={searchPart}
              onChangeText={setSearchPart}
              placeholder={lang==='fr'?'🔍 Nom, email, structure…':'🔍 Name, email, institution…'}
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {loadingPart ? (
            <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>
          ) : (
            <ScrollView contentContainerStyle={{ padding:12, paddingBottom:40 }}>
              {participants.length === 0 ? (
                <View style={s.empty}>
                  <Text style={{ fontSize:40 }}>👥</Text>
                  <Text style={s.emptyTxt}>{lang==='fr'?'Aucun participant.':'No participants.'}</Text>
                </View>
              ) : participants.filter((p:any) =>
                  !searchPart ||
                  p.nom?.toLowerCase().includes(searchPart.toLowerCase()) ||
                  p.prenom?.toLowerCase().includes(searchPart.toLowerCase()) ||
                  p.email?.toLowerCase().includes(searchPart.toLowerCase()) ||
                  p.structure?.toLowerCase().includes(searchPart.toLowerCase())
                ).map((p:any, i:number) => (
                <View key={i} style={s.partCard}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <View style={{ flex:1 }}>
                      <Text style={s.partName}>
                        {p.titre ? `${p.titre} ` : ''}{p.prenom} {p.nom}
                      </Text>
                      {p.specialite && <Text style={s.partInfo}>🔬 {p.specialite}</Text>}
                      {p.structure  && <Text style={s.partInfo}>🏥 {p.structure}</Text>}
                      {p.telephone  && <Text style={s.partInfo}>📞 {p.telephone}</Text>}
                      <Text style={s.partInfo}>📧 {p.email}</Text>
                      <Text style={s.partDate}>Inscrit le {p.inscrit_le}</Text>
                    </View>
                    <View style={{ gap:6, alignItems:'center' }}>
                    <TouchableOpacity
                      style={[s.presenceBtn, { backgroundColor: p.present ? '#F0FDF4':'#F9FAFB' }]}
                      onPress={() => togglePresence(selectedCamp.id, p.id)}>
                      <Text style={{ fontSize:20 }}>{p.present ? '✅' : '⬜'}</Text>
                      <Text style={[s.presenceTxt, { color: p.present ? '#059669':'#6B7280' }]}>
                        {p.present ? 'Présent' : 'Absent'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.presenceBtn, { backgroundColor:'#FEF2F2', borderColor:'#FECACA' }]}
                      onPress={() => deleteParticipant(selectedCamp.id, p.id)}>
                      <Text style={{ fontSize:16 }}>🗑</Text>
                      <Text style={[s.presenceTxt, { color:'#DC2626' }]}>Suppr.</Text>
                    </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:COLORS.bgAlt },
  center:      { flex:1, alignItems:'center', justifyContent:'center' },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  backBtn:     { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle: { fontSize:15, fontWeight:'700', color:'#fff', flex:1, textAlign:'center' },
  card:        { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, ...SHADOW.sm },
  badge:       { borderRadius:99, paddingHorizontal:10, paddingVertical:3 },
  badgeTxt:    { fontSize:10, fontWeight:'700' },
  campTitle:   { fontSize:14, fontWeight:'800', color:COLORS.black, marginBottom:6 },
  campInfo:    { fontSize:12, color:COLORS.gray600, marginBottom:2 },
  actionBtn:   { borderRadius:10, paddingVertical:8, paddingHorizontal:14, borderWidth:1, borderColor:COLORS.gray200 },
  actionBtnTxt:{ fontSize:12, fontWeight:'700' },
  empty:       { alignItems:'center', paddingVertical:40, gap:10 },
  emptyTxt:    { fontSize:14, color:COLORS.gray400 },
  statCard:    { flex:1, padding:12, alignItems:'center' },
  statValue:   { fontSize:24, fontWeight:'800' },
  statLabel:   { fontSize:10, color:COLORS.gray400, marginTop:2 },
  partCard:    { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:8, ...SHADOW.sm },
  partName:    { fontSize:14, fontWeight:'700', color:COLORS.black, marginBottom:4 },
  partInfo:    { fontSize:12, color:COLORS.gray600, marginBottom:2 },
  partDate:    { fontSize:10, color:COLORS.gray400, marginTop:4 },
  presenceBtn: { alignItems:'center', padding:10, borderRadius:12, borderWidth:1, borderColor:COLORS.gray200, minWidth:70 },
  presenceTxt: { fontSize:10, fontWeight:'700', marginTop:4 },
  searchInput: { backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:COLORS.gray200, paddingHorizontal:12, paddingVertical:9, fontSize:13, color:COLORS.black, marginBottom:10 },
})

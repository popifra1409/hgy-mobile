import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, TextInput, ActivityIndicator, Modal, ScrollView
} from 'react-native'
import { medecinsService, rdvService } from '../services/api'
import { useLang } from '../context/LangContext'

export default function SpecialistesScreen({ navigation }: any) {
  const { lang } = useLang()
  const [medecins, setMedecins]   = useState<any[]>([])
  const [filtered, setFiltered]   = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<any>(null)

  useEffect(() => {
    medecinsService.getAll({ avec_planning: 1, per_page: 200 })
      .then(r => { setMedecins(r.data?.data || []); setFiltered(r.data?.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(medecins.filter(m =>
      m.nom_complet?.toLowerCase().includes(q) ||
      m.specialite?.[lang]?.toLowerCase().includes(q)
    ))
  }, [search, medecins])

  const MedecinCard = ({ m }: { m: any }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('MedecinDetail', { medecin: m, planning: [] })}>
      <View style={s.cardLeft}>
        {m.photo
          ? <Image source={{ uri: m.photo }} style={s.avatar} />
          : <View style={[s.avatarInit, { backgroundColor: m.couleur || '#1A3D6E' }]}>
              <Text style={s.initText}>{m.initiales}</Text>
            </View>
        }
      </View>
      <View style={s.cardRight}>
        <Text style={s.name}>{m.nom_complet}</Text>
        {m.specialite && <Text style={[s.spec, { color: m.couleur || '#2B6CB0' }]}>{m.specialite[lang]}</Text>}
        {m.departement && <Text style={s.dept}>🏥 {m.departement.nom?.[lang]}</Text>}
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  )

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#1A3D6E" /></View>

  return (
    <View style={s.container}>
      {/* Recherche */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={lang === 'fr' ? 'Rechercher un médecin…' : 'Search a doctor…'}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <Text style={s.count}>{filtered.length} {lang === 'fr' ? 'médecin(s)' : 'doctor(s)'}</Text>

      <FlatList
        data={filtered}
        keyExtractor={m => m.id.toString()}
        renderItem={({ item }) => <MedecinCard m={item} />}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Modal fiche médecin */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <ScrollView style={s.modal}>
            {/* Header */}
            <View style={[s.modalHeader, { backgroundColor: selected.couleur || '#1A3D6E' }]}>
              <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
                <Text style={s.closeText}>✕</Text>
              </TouchableOpacity>
              <View style={s.modalTop}>
                {selected.photo
                  ? <Image source={{ uri: selected.photo }} style={s.modalAvatar} />
                  : <View style={[s.modalAvatarInit, { backgroundColor: 'rgba(255,255,255,.2)' }]}>
                      <Text style={s.modalInitText}>{selected.initiales}</Text>
                    </View>
                }
                <View style={s.modalInfo}>
                  <Text style={s.modalName}>{selected.nom_complet}</Text>
                  {selected.specialite && <Text style={s.modalSpec}>{selected.specialite[lang]}</Text>}
                  {selected.departement && <Text style={s.modalDept}>🏥 {selected.departement.nom?.[lang]}</Text>}
                </View>
              </View>
            </View>

            {/* Corps */}
            <View style={s.modalBody}>
              {/* ONMC */}
              {selected.numero_onmc && (
                <View style={s.onmcBox}>
                  <Text style={s.onmcLabel}>🪪 Ordre National des Médecins du Cameroun</Text>
                  <Text style={s.onmcValue}>N° {selected.numero_onmc}</Text>
                </View>
              )}

              {/* Infos */}
              {[
                { icon: '📧', label: 'Email',       value: selected.email },
                { icon: '📞', label: lang === 'fr' ? 'Téléphone' : 'Phone', value: selected.telephone },
                { icon: '🌍', label: lang === 'fr' ? 'Langues' : 'Languages', value: selected.langues },
                { icon: '🎓', label: lang === 'fr' ? 'Formation' : 'Training', value: selected.formation },
                { icon: '📅', label: lang === 'fr' ? 'Expérience' : 'Experience', value: selected.experience ? `${selected.experience} ${lang === 'fr' ? 'ans' : 'years'}` : null },
              ].filter(i => i.value).map((item, i) => (
                <View key={i} style={s.infoRow}>
                  <Text style={s.infoIcon}>{item.icon}</Text>
                  <View>
                    <Text style={s.infoLabel}>{item.label}</Text>
                    <Text style={s.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}

              {/* Biographie */}
              {selected.biographie?.[lang] && (
                <View style={s.bioBox}>
                  <Text style={s.bioTitle}>{lang === 'fr' ? 'Biographie' : 'Biography'}</Text>
                  <Text style={s.bioText}>{selected.biographie[lang]}</Text>
                </View>
              )}

              {/* Bouton RDV */}
              <TouchableOpacity style={[s.rdvBtn, { backgroundColor: selected.couleur || '#1A3D6E' }]}
                onPress={() => {
                  setSelected(null)
                  navigation.navigate('RendezVousFromSpec', {
                    medecinPreselect: selected,
                    specId: selected.specialite_id,
                    specName: selected.specialite?.[lang] || selected.specialite?.nom_fr
                  })
                }}>
                <Text style={s.rdvText}>📅 {lang === 'fr' ? 'Prendre rendez-vous' : 'Book appointment'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F7FBFF' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox:  { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput:{ flex: 1, height: 44, fontSize: 14, color: '#1A202C' },
  count:      { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 16, marginBottom: 4 },
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLeft:   { marginRight: 14 },
  avatar:     { width: 56, height: 56, borderRadius: 28 },
  avatarInit: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  initText:   { color: '#fff', fontWeight: '800', fontSize: 18 },
  cardRight:  { flex: 1 },
  name:       { fontSize: 14, fontWeight: '700', color: '#1A3D6E', marginBottom: 3 },
  spec:       { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  dept:       { fontSize: 11, color: '#9CA3AF' },
  arrow:      { fontSize: 20, color: '#CBD5E0' },
  modal:      { flex: 1, backgroundColor: '#F7FBFF' },
  modalHeader:{ padding: 24, paddingTop: 48 },
  closeBtn:   { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,.2)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  closeText:  { color: '#fff', fontSize: 16 },
  modalTop:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  modalAvatar:{ width: 80, height: 80, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,.3)' },
  modalAvatarInit: { width: 80, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalInitText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  modalInfo:  { flex: 1 },
  modalName:  { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  modalSpec:  { fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 4 },
  modalDept:  { fontSize: 12, color: 'rgba(255,255,255,.65)' },
  modalBody:  { padding: 20 },
  onmcBox:    { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  onmcLabel:  { fontSize: 11, color: '#1D4ED8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  onmcValue:  { fontSize: 16, fontWeight: '800', color: '#1A3D6E' },
  infoRow:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  infoIcon:   { fontSize: 18, marginTop: 2 },
  infoLabel:  { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  infoValue:  { fontSize: 13, color: '#1A202C', fontWeight: '500' },
  bioBox:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  bioTitle:   { fontSize: 14, fontWeight: '700', color: '#1A3D6E', marginBottom: 8 },
  bioText:    { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  rdvBtn:     { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  rdvText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
})

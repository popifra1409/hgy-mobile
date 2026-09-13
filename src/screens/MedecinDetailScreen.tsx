import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'

const JOURS = ['','Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function MedecinDetailScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const { medecin, planning: planningInit } = route.params || {}
  const [planning, setPlanning] = React.useState<any[]>(planningInit || [])

  React.useEffect(() => {
    if (!medecin?.id) return
    if (planning.length > 0) return // déjà chargé
    fetch(`https://hopitalgeneraldeyaounde.cm/portail/public/api/v1/planning/medecin/${medecin.id}`)
      .then(r => r.json())
      .then(d => setPlanning(d?.data || []))
      .catch(() => {})
  }, [medecin?.id])
  if (!medecin) return null

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{lang === 'fr' ? 'Fiche médecin' : 'Doctor profile'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero médecin */}
        <View style={s.hero}>
          {medecin.photo
            ? <Image source={{ uri: medecin.photo }} style={s.photo} />
            : <View style={[s.photo, s.photoPlaceholder]}>
                <Text style={{ fontSize: 36, color: '#fff' }}>👨‍⚕️</Text>
              </View>
          }
          <Text style={s.name}>{medecin.nom_complet}</Text>
          <Text style={s.spec}>{medecin.specialite?.fr || medecin.specialite?.nom_fr}</Text>
          {medecin.numero_onmc && (
            <Text style={s.onmc}>🪪 ONMC: {medecin.numero_onmc}</Text>
          )}
        </View>

        <View style={{ padding: 16 }}>
          {/* Biographie */}
          {(medecin.biographie_fr || medecin.biographie_en) && (
            <View style={s.card}>
              <Text style={s.cardTitle}>📖 {lang === 'fr' ? 'Biographie' : 'Biography'}</Text>
              <Text style={s.bioTxt}>
                {lang === 'fr' ? medecin.biographie_fr : (medecin.biographie_en || medecin.biographie_fr)}
              </Text>
            </View>
          )}

          {/* Planning */}
          {planning && planning.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>📅 {lang === 'fr' ? 'Planning de consultation' : 'Consultation schedule'}</Text>
              {planning.map((p: any, i: number) => (
                <View key={i} style={[s.planRow, { borderBottomWidth: i < planning.length-1 ? 1 : 0 }]}>
                  <View style={s.jourBadge}>
                    <Text style={s.jourTxt}>{JOURS[p.jour_semaine]}</Text>
                  </View>
                  <View>
                    <Text style={s.heures}>🕐 {p.heure_debut?.slice(0,5)} - {p.heure_fin?.slice(0,5)}</Text>
                    <Text style={s.maxPat}>👥 max {p.nb_patients_max || 20} patients</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* RDV */}
          <TouchableOpacity style={s.rdvBtn}
            onPress={() => navigation.navigate('RendezVousFromSpec', { medecinPreselect: medecin, specId: medecin.specialite_id, specName: medecin.specialite?.fr || medecin.specialite?.nom_fr })}>
            <Text style={s.rdvBtnTxt}>
              📅 {lang === 'fr' ? 'Prendre rendez-vous' : 'Book appointment'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.bgAlt },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 16, fontWeight: '700', color: '#fff' },
  hero:            { backgroundColor: COLORS.primary, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  photo:           { width: 100, height: 100, borderRadius: 50, marginBottom: 14, borderWidth: 3, borderColor: 'rgba(255,255,255,.3)' },
  photoPlaceholder:{ backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' },
  name:            { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  spec:            { fontSize: 14, color: '#90C6F0', textAlign: 'center', marginBottom: 4 },
  onmc:            { fontSize: 11, color: 'rgba(255,255,255,.6)', textAlign: 'center' },
  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, ...SHADOW.sm },
  cardTitle:       { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  bioTxt:          { fontSize: 14, color: COLORS.gray600, lineHeight: 22 },
  planRow:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomColor: COLORS.bgAlt },
  jourBadge:       { backgroundColor: COLORS.primaryPale, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 48, alignItems: 'center' },
  jourTxt:         { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  heures:          { fontSize: 14, fontWeight: '600', color: COLORS.black },
  maxPat:          { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  rdvBtn:          { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', ...SHADOW.md },
  rdvBtnTxt:       { color: '#fff', fontSize: 15, fontWeight: '800' },
})

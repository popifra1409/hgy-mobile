import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'
import axios from 'axios'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

export default function HeuresVisiteScreen({ navigation }: any) {
  const { lang } = useLang()
  const [horaires, setHoraires] = useState<any[]>([])
  const [params,   setParams]   = useState<any>({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/horaires-visite`).catch(() => ({ data: { data: [] } })),
      axios.get(`${API}/parametres`).catch(() => ({ data: { data: {} } })),
    ]).then(([h, p]) => {
      setHoraires(h.data?.data || [])
      setParams(p.data?.data || {})
    }).finally(() => setLoading(false))
  }, [])

  const JOURS: Record<number,string> = { 1:'Lundi', 2:'Mardi', 3:'Mercredi', 4:'Jeudi', 5:'Vendredi', 6:'Samedi', 7:'Dimanche' }
  const JOURS_EN: Record<number,string> = { 1:'Monday', 2:'Tuesday', 3:'Wednesday', 4:'Thursday', 5:'Friday', 6:'Saturday', 7:'Sunday' }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize:20, color:'#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🕐 {lang==='fr'?'Heures de visite':'Visiting hours'}</Text>
        <View style={{ width:36 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>

          {/* Urgences - 24h */}
          <View style={s.urgenceCard}>
            <Text style={{ fontSize:32, marginBottom:8 }}>🚨</Text>
            <Text style={s.urgenceTitle}>{lang==='fr'?'Urgences':'Emergency'}</Text>
            <Text style={s.urgenceHoraire}>24h/7 — 7j/7</Text>
            <TouchableOpacity style={s.urgenceBtn}
              onPress={() => Linking.openURL(`tel:${params.tel_supervision || '+237657603039'}`)}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:14 }}>
                📞 {params.tel_supervision || '+237 6 57 60 30 39'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horaires consultation */}
          <Text style={s.sectionTitle}>
            🏥 {lang==='fr'?'Consultations':'Consultations'}
          </Text>
          {horaires.length > 0 ? (
            horaires.map((h: any, i: number) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <View>
                    <Text style={s.jourLabel}>
                      {lang==='fr' ? JOURS[h.jour_semaine] : JOURS_EN[h.jour_semaine]}
                    </Text>
                    {h.service && <Text style={s.serviceLabel}>{h.service}</Text>}
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={s.heureValue}>{h.heure_debut?.slice(0,5)} - {h.heure_fin?.slice(0,5)}</Text>
                    {h.ouvert === false && (
                      <View style={s.fermeBadge}>
                        <Text style={{ fontSize:10, color:'#DC2626', fontWeight:'700' }}>
                          {lang==='fr'?'Fermé':'Closed'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            /* Horaires par défaut si pas d'endpoint */
            [
              { jour: lang==='fr'?'Lundi - Vendredi':'Monday - Friday', heure:'07h30 - 15h30', ouvert:true },
              { jour: lang==='fr'?'Samedi':'Saturday', heure:'07h30 - 12h00', ouvert:true },
              { jour: lang==='fr'?'Dimanche':'Sunday', heure:'—', ouvert:false },
            ].map((h, i) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={s.jourLabel}>{h.jour}</Text>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={[s.heureValue, !h.ouvert && { color:COLORS.gray400 }]}>{h.heure}</Text>
                    {!h.ouvert && (
                      <View style={s.fermeBadge}>
                        <Text style={{ fontSize:10, color:'#DC2626', fontWeight:'700' }}>
                          {lang==='fr'?'Fermé':'Closed'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Horaires visites patients */}
          <Text style={s.sectionTitle}>
            👥 {lang==='fr'?'Visites aux patients hospitalisés':'Patient visiting hours'}
          </Text>
          {[
            { periode: lang==='fr'?'Matin':'Morning', heure:'10h00 - 12h00', icon:'🌅' },
            { periode: lang==='fr'?'Soir':'Evening',  heure:'16h00 - 18h00', icon:'🌆' },
          ].map((v, i) => (
            <View key={i} style={[s.card, { flexDirection:'row', alignItems:'center', gap:14 }]}>
              <Text style={{ fontSize:28 }}>{v.icon}</Text>
              <View>
                <Text style={s.jourLabel}>{v.periode}</Text>
                <Text style={[s.heureValue, { fontSize:16 }]}>{v.heure}</Text>
              </View>
            </View>
          ))}

          {/* Info importantes */}
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>ℹ️ {lang==='fr'?'Informations importantes':'Important information'}</Text>
            {[
              lang==='fr'?'Maximum 2 visiteurs par patient simultanément.':'Maximum 2 visitors per patient at a time.',
              lang==='fr'?'Les enfants de moins de 12 ans ne sont pas autorisés dans les chambres.':'Children under 12 are not allowed in patient rooms.',
              lang==='fr'?'Respectez le calme et la tranquillité des patients.':'Please maintain calm and quiet for patients.',
              lang==='fr'?'Les visites peuvent être restreintes en cas d\'épidémie.':'Visits may be restricted during epidemics.',
            ].map((info, i) => (
              <Text key={i} style={s.infoItem}>• {info}</Text>
            ))}
          </View>

          {/* Contact */}
          <TouchableOpacity style={s.contactCard}
            onPress={() => Linking.openURL(`tel:${params.tel_standard || '+237657603039'}`)}>
            <Text style={{ fontSize:16, fontWeight:'800', color:'#fff', marginBottom:4 }}>
              📞 {lang==='fr'?'Standard de l\'hôpital':'Hospital switchboard'}
            </Text>
            <Text style={{ fontSize:18, fontWeight:'900', color:'#fff' }}>
              {params.tel_standard || '+237 6 57 60 30 39'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bgAlt },
  center:       { flex:1, alignItems:'center', justifyContent:'center' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  backBtn:      { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle:  { fontSize:16, fontWeight:'700', color:'#fff' },
  urgenceCard:  { backgroundColor:COLORS.danger, borderRadius:20, padding:24, alignItems:'center', marginBottom:20 },
  urgenceTitle: { fontSize:20, fontWeight:'800', color:'#fff', marginBottom:4 },
  urgenceHoraire:{ fontSize:16, color:'rgba(255,255,255,.85)', marginBottom:16 },
  urgenceBtn:   { backgroundColor:'rgba(255,255,255,.2)', borderRadius:12, paddingVertical:10, paddingHorizontal:20 },
  sectionTitle: { fontSize:15, fontWeight:'800', color:COLORS.black, marginBottom:10, marginTop:4 },
  card:         { backgroundColor:'#fff', borderRadius:14, padding:16, marginBottom:10, ...SHADOW.sm },
  jourLabel:    { fontSize:15, fontWeight:'700', color:COLORS.black },
  serviceLabel: { fontSize:12, color:COLORS.gray400, marginTop:2 },
  heureValue:   { fontSize:15, fontWeight:'800', color:COLORS.primary },
  fermeBadge:   { backgroundColor:'#FEF2F2', borderRadius:6, paddingHorizontal:8, paddingVertical:2, marginTop:4 },
  infoCard:     { backgroundColor:'#FFFBEB', borderRadius:14, padding:16, marginBottom:12, borderWidth:1, borderColor:'#FDE68A' },
  infoTitle:    { fontSize:14, fontWeight:'700', color:'#92400E', marginBottom:10 },
  infoItem:     { fontSize:13, color:'#78350F', lineHeight:20, marginBottom:4 },
  contactCard:  { backgroundColor:COLORS.primary, borderRadius:14, padding:20, alignItems:'center', ...SHADOW.md },
})

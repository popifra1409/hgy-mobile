import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator
} from 'react-native'
import { medecinsService, specialitesService, rdvService } from '../services/api'
import { useLang } from '../context/LangContext'

export default function RendezVousScreen() {
  const { lang } = useLang()
  const [step, setStep]           = useState(1) // 1:infos, 2:medecin, 3:date, 4:confirm
  const [medecins, setMedecins]   = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '',
    medecin_id: '', date_heure: '', motif: '', type: 'presentiel',
  })
  const [medecinSearch, setMedecinSearch] = useState('')
  const [selectedMedecin, setSelectedMedecin] = useState<any>(null)

  useEffect(() => {
    medecinsService.getAll()
      .then(r => setMedecins(r.data?.data || []))
      .catch(() => {})
  }, [])

  const filteredMedecins = medecins.filter(m =>
    m.nom_complet?.toLowerCase().includes(medecinSearch.toLowerCase()) ||
    m.specialite?.[lang]?.toLowerCase().includes(medecinSearch.toLowerCase())
  )

  const submit = async () => {
    if (!form.nom || !form.telephone || !form.medecin_id || !form.date_heure) {
      Alert.alert(lang === 'fr' ? 'Champs manquants' : 'Missing fields',
        lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires.' : 'Please fill all required fields.')
      return
    }
    setLoading(true)
    try {
      await rdvService.creer(form)
      setSubmitted(true)
    } catch {
      Alert.alert('Erreur', lang === 'fr' ? 'Impossible de créer le RDV. Réessayez.' : 'Could not create appointment.')
    } finally { setLoading(false) }
  }

  if (submitted) return (
    <View style={s.center}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>✅</Text>
      <Text style={s.successTitle}>{lang === 'fr' ? 'Demande envoyée !' : 'Request sent!'}</Text>
      <Text style={s.successSub}>{lang === 'fr' ? 'Vous recevrez une confirmation par email.' : 'You will receive a confirmation by email.'}</Text>
      <TouchableOpacity style={s.btn} onPress={() => { setSubmitted(false); setStep(1); setForm({ nom:'',prenom:'',telephone:'',email:'',medecin_id:'',date_heure:'',motif:'',type:'presentiel' }) }}>
        <Text style={s.btnText}>{lang === 'fr' ? 'Nouveau RDV' : 'New appointment'}</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={s.container}>
      {/* Indicateur étapes */}
      <View style={s.steps}>
        {[1,2,3].map(n => (
          <View key={n} style={[s.step, step >= n && s.stepActive]}>
            <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
          </View>
        ))}
      </View>

      {/* Étape 1 : Infos patient */}
      {step === 1 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 {lang === 'fr' ? 'Vos informations' : 'Your information'}</Text>
          {[
            { key: 'nom',       label: lang === 'fr' ? 'Nom *' : 'Last name *',    kb: 'default' },
            { key: 'prenom',    label: lang === 'fr' ? 'Prénom' : 'First name',    kb: 'default' },
            { key: 'telephone', label: lang === 'fr' ? 'Téléphone *' : 'Phone *',  kb: 'phone-pad' },
            { key: 'email',     label: 'Email',                                     kb: 'email-address' },
            { key: 'motif',     label: lang === 'fr' ? 'Motif de consultation' : 'Reason', kb: 'default' },
          ].map(f => (
            <View key={f.key} style={s.field}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={form[f.key as keyof typeof form]}
                onChangeText={v => setForm(p => ({...p, [f.key]: v}))}
                keyboardType={f.kb as any}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}
          {/* Type */}
          <Text style={s.label}>{lang === 'fr' ? 'Type de consultation' : 'Consultation type'}</Text>
          <View style={s.typeRow}>
            {['presentiel', 'teleconsultation'].map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, form.type === t && s.typeBtnActive]}
                onPress={() => setForm(p => ({...p, type: t}))}>
                <Text style={[s.typeBtnText, form.type === t && s.typeBtnTextActive]}>
                  {t === 'presentiel' ? (lang === 'fr' ? '🏥 Présentiel' : '🏥 In-person') : '💻 Téléconsultation'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
            <Text style={s.btnText}>{lang === 'fr' ? 'Continuer' : 'Continue'} →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Étape 2 : Choix médecin */}
      {step === 2 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>👨‍⚕️ {lang === 'fr' ? 'Choisir un médecin' : 'Choose a doctor'}</Text>
          <TextInput
            style={s.input}
            value={medecinSearch}
            onChangeText={setMedecinSearch}
            placeholder={lang === 'fr' ? '🔍 Rechercher…' : '🔍 Search…'}
            placeholderTextColor="#9CA3AF"
          />
          {filteredMedecins.slice(0, 10).map(m => (
            <TouchableOpacity key={m.id}
              style={[s.medecinRow, selectedMedecin?.id === m.id && s.medecinRowActive]}
              onPress={() => { setSelectedMedecin(m); setForm(p => ({...p, medecin_id: m.id})) }}>
              <View style={[s.medecinDot, { backgroundColor: m.couleur || '#1A3D6E' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.medecinName}>{m.nom_complet}</Text>
                <Text style={s.medecinSpec}>{m.specialite?.[lang]}</Text>
              </View>
              {selectedMedecin?.id === m.id && <Text style={{ color: '#059669', fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
          ))}
          <View style={s.navRow}>
            <TouchableOpacity style={s.btnOutline} onPress={() => setStep(1)}>
              <Text style={s.btnOutlineText}>← {lang === 'fr' ? 'Retour' : 'Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => form.medecin_id ? setStep(3) : Alert.alert('', lang === 'fr' ? 'Choisissez un médecin' : 'Choose a doctor')}>
              <Text style={s.btnText}>{lang === 'fr' ? 'Continuer' : 'Continue'} →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Étape 3 : Date + Confirmation */}
      {step === 3 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 {lang === 'fr' ? 'Date souhaitée' : 'Preferred date'}</Text>
          <View style={s.field}>
            <Text style={s.label}>{lang === 'fr' ? 'Date et heure *' : 'Date and time *'}</Text>
            <TextInput
              style={s.input}
              value={form.date_heure}
              onChangeText={v => setForm(p => ({...p, date_heure: v}))}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Récap */}
          <View style={s.recap}>
            <Text style={s.recapTitle}>📋 {lang === 'fr' ? 'Récapitulatif' : 'Summary'}</Text>
            <Text style={s.recapItem}>👤 {form.nom} {form.prenom}</Text>
            <Text style={s.recapItem}>📞 {form.telephone}</Text>
            {selectedMedecin && <Text style={s.recapItem}>👨‍⚕️ {selectedMedecin.nom_complet}</Text>}
            <Text style={s.recapItem}>🏥 {form.type}</Text>
            {form.date_heure && <Text style={s.recapItem}>📅 {form.date_heure}</Text>}
          </View>

          <View style={s.navRow}>
            <TouchableOpacity style={s.btnOutline} onPress={() => setStep(2)}>
              <Text style={s.btnOutlineText}>← {lang === 'fr' ? 'Retour' : 'Back'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>📨 {lang === 'fr' ? 'Envoyer' : 'Submit'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F7FBFF', padding: 16 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  steps:           { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  step:            { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  stepActive:      { backgroundColor: '#1A3D6E' },
  stepNum:         { color: '#9CA3AF', fontWeight: '700' },
  stepNumActive:   { color: '#fff' },
  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  cardTitle:       { fontSize: 16, fontWeight: '700', color: '#1A3D6E', marginBottom: 16 },
  field:           { marginBottom: 14 },
  label:           { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input:           { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A202C' },
  typeRow:         { flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 6 },
  typeBtn:         { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  typeBtnActive:   { borderColor: '#1A3D6E', backgroundColor: '#EFF6FF' },
  typeBtnText:     { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  typeBtnTextActive: { color: '#1A3D6E' },
  btn:             { backgroundColor: '#1A3D6E', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnText:         { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnOutline:      { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginRight: 8 },
  btnOutlineText:  { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  navRow:          { flexDirection: 'row', marginTop: 8 },
  medecinRow:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, gap: 12 },
  medecinRowActive: { borderColor: '#1A3D6E', backgroundColor: '#EFF6FF' },
  medecinDot:      { width: 10, height: 10, borderRadius: 5 },
  medecinName:     { fontSize: 13, fontWeight: '700', color: '#1A3D6E' },
  medecinSpec:     { fontSize: 11, color: '#9CA3AF' },
  recap:           { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16 },
  recapTitle:      { fontSize: 13, fontWeight: '700', color: '#1A3D6E', marginBottom: 8 },
  recapItem:       { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  successTitle:    { fontSize: 22, fontWeight: '800', color: '#1A3D6E', marginBottom: 8, textAlign: 'center' },
  successSub:      { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
})

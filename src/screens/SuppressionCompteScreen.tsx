import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator, Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { COLORS, SHADOW } from '../constants/theme'
const API_URL = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

const TYPES = [
  { value: 'patient',       fr: 'Patient',                    en: 'Patient' },
  { value: 'medecin',       fr: 'Médecin / Personnel soignant', en: 'Doctor / Medical staff' },
  { value: 'gestionnaire',  fr: 'Gestionnaire / Administratif', en: 'Manager / Administrative' },
  { value: 'autre',         fr: 'Autre',                      en: 'Other' },
]

export default function SuppressionCompteScreen({ navigation }: any) {
  const { lang } = useLang()
  const { patient, logout } = useAuth()

  const [form, setForm] = useState({
    nom:         patient?.nom || '',
    prenom:      patient?.prenom || '',
    email:       patient?.email || '',
    telephone:   patient?.telephone || '',
    type_compte: 'patient',
    raison:      '',
  })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [step, setStep]         = useState(1) // 1: form, 2: confirmation

  const set = (k: string, v: string) => setForm(p => ({...p, [k]: v}))

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      Alert.alert(
        lang === 'fr' ? 'Champs requis' : 'Required fields',
        lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires.' : 'Please fill in all required fields.'
      )
      return
    }

    setLoading(true)
    try {
      const r = await fetch('https://hopitalgeneraldeyaounde.cm/portail/public/api/suppression-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (d.success) {
        setSuccess(true)
      } else {
        Alert.alert(
          lang === 'fr' ? 'Erreur' : 'Error',
          d.message || (lang === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.')
        )
      }
    } catch {
      Alert.alert(
        lang === 'fr' ? 'Erreur réseau' : 'Network error',
        lang === 'fr' ? 'Vérifiez votre connexion.' : 'Check your connection.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    Alert.alert(
      lang === 'fr' ? '⚠️ Confirmer la suppression' : '⚠️ Confirm deletion',
      lang === 'fr'
        ? 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.\n\nVos données médicales seront conservées conformément à la loi.'
        : 'Are you sure you want to delete your account? This action is irreversible.\n\nYour medical data will be retained as required by law.',
      [
        { text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        { text: lang === 'fr' ? 'Oui, supprimer' : 'Yes, delete', style: 'destructive', onPress: handleSubmit },
      ]
    )
  }

  if (success) return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🗑️ {lang === 'fr' ? 'Suppression compte' : 'Delete account'}</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>✅</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginBottom: 12 }}>
          {lang === 'fr' ? 'Demande envoyée !' : 'Request sent!'}
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.gray600, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          {lang === 'fr'
            ? 'Vérifiez votre email et cliquez sur le lien de confirmation. Votre demande sera traitée dans 30 jours maximum.'
            : 'Check your email and click the confirmation link. Your request will be processed within 30 days.'
          }
        </Text>
        <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#FDE68A' }}>
          <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 20 }}>
            ⚠️ {lang === 'fr'
              ? 'Vos données médicales seront conservées conformément à la réglementation camerounaise (20 ans minimum).'
              : 'Your medical data will be retained in accordance with Cameroonian regulations (minimum 20 years).'
            }
          </Text>
        </View>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={s.btnTxt}>{lang === 'fr' ? 'Retour aux paramètres' : 'Back to settings'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🗑️ {lang === 'fr' ? 'Suppression compte' : 'Delete account'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* Avertissement */}
        <View style={s.warning}>
          <Text style={s.warningTitle}>⚠️ {lang === 'fr' ? 'Avant de continuer' : 'Before you continue'}</Text>
          {[
            lang === 'fr' ? 'Votre accès sera définitivement désactivé' : 'Your access will be permanently disabled',
            lang === 'fr' ? 'Vos données de connexion seront supprimées' : 'Your login data will be deleted',
            lang === 'fr' ? 'Vos données médicales seront conservées (loi camerounaise)' : 'Your medical data will be retained (Cameroonian law)',
            lang === 'fr' ? 'Cette action est irréversible' : 'This action is irreversible',
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Text style={{ color: '#DC2626', fontSize: 12 }}>•</Text>
              <Text style={{ color: '#7F1D1D', fontSize: 12, flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Formulaire */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            {lang === 'fr' ? '📋 Vos informations' : '📋 Your information'}
          </Text>

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={s.label}>{lang === 'fr' ? 'Prénom *' : 'First name *'}</Text>
              <TextInput style={s.input} value={form.prenom}
                onChangeText={v => set('prenom', v)}
                placeholder={lang === 'fr' ? 'Votre prénom' : 'Your first name'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{lang === 'fr' ? 'Nom *' : 'Last name *'}</Text>
              <TextInput style={s.input} value={form.nom}
                onChangeText={v => set('nom', v)}
                placeholder="NOM" />
            </View>
          </View>

          <Text style={s.label}>Email *</Text>
          <TextInput style={s.input} value={form.email}
            onChangeText={v => set('email', v)}
            keyboardType="email-address" autoCapitalize="none"
            placeholder="votre@email.com" />

          <Text style={s.label}>{lang === 'fr' ? 'Téléphone' : 'Phone'}</Text>
          <TextInput style={s.input} value={form.telephone}
            onChangeText={v => set('telephone', v)}
            keyboardType="phone-pad"
            placeholder="+237 6XX XXX XXX" />

          <Text style={s.label}>{lang === 'fr' ? 'Type de compte *' : 'Account type *'}</Text>
          <View style={s.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity key={t.value}
                style={[s.typeBtn, form.type_compte === t.value && s.typeBtnActive]}
                onPress={() => set('type_compte', t.value)}>
                <Text style={[s.typeBtnTxt, form.type_compte === t.value && s.typeBtnTxtActive]}>
                  {lang === 'fr' ? t.fr : t.en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>{lang === 'fr' ? 'Raison (optionnel)' : 'Reason (optional)'}</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={form.raison} onChangeText={v => set('raison', v)}
            multiline numberOfLines={3}
            placeholder={lang === 'fr' ? 'Pourquoi souhaitez-vous supprimer votre compte ?' : 'Why do you want to delete your account?'} />
        </View>

        {/* Lien politique */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://hopitalgeneraldeyaounde.cm/suppression-compte')}
          style={{ marginBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 13, textDecorationLine: 'underline', textAlign: 'center' }}>
            📋 {lang === 'fr' ? 'Voir notre politique de suppression de données' : 'View our data deletion policy'}
          </Text>
        </TouchableOpacity>

        {/* Bouton */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#DC2626' }, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>
                🗑️ {lang === 'fr' ? 'Soumettre ma demande' : 'Submit my request'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ textAlign: 'center', color: COLORS.gray600, fontSize: 14 }}>
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bgAlt },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOW.sm },
  warning:      { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  warningTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626', marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.black, marginBottom: 14 },
  row:          { flexDirection: 'row' },
  label:        { fontSize: 11, fontWeight: '700', color: COLORS.gray600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, marginTop: 10 },
  input:        { backgroundColor: COLORS.bgAlt, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.black, borderWidth: 1, borderColor: COLORS.gray200 },
  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5, marginBottom: 5 },
  typeBtn:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.gray200 },
  typeBtnActive:{ backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  typeBtnTxt:   { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
  typeBtnTxtActive: { color: '#DC2626', fontWeight: '800' },
  btn:          { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnTxt:       { color: '#fff', fontSize: 15, fontWeight: '800' },
})

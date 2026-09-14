import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'
import api from '../services/api'

export default function ChangePasswordScreen({ navigation }: any) {
  const { lang } = useLang()
  const { patient, token } = useAuth()
  const [currentPass, setCurrentPass] = useState('')
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)

  const handleChange = async () => {
    setError('')
    if (!currentPass || !newPass || !confirmPass) {
      setError(lang === 'fr' ? 'Tous les champs sont requis.' : 'All fields are required.')
      return
    }
    if (newPass.length < 6) {
      setError(lang === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.')
      return
    }
    if (newPass !== confirmPass) {
      setError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/patient/change-password', {
        current_password:      currentPass,
        password:              newPass,
        password_confirmation: confirmPass,
      })
      Alert.alert(
        lang === 'fr' ? '✅ Succès' : '✅ Success',
        lang === 'fr' ? 'Mot de passe modifié avec succès.' : 'Password changed successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (err: any) {
      const msg = err?.response?.data?.message || (lang === 'fr' ? 'Erreur. Vérifiez votre mot de passe actuel.' : 'Error. Check your current password.')
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🔑 {lang === 'fr' ? 'Changer le mot de passe' : 'Change password'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.infoBox}>
          <Text style={s.infoTxt}>
            ℹ️ {lang === 'fr'
              ? 'Votre mot de passe temporaire est votre code patient (ex: HGY-XXXXXX). Changez-le maintenant pour sécuriser votre compte.'
              : 'Your temporary password is your patient code (ex: HGY-XXXXXX). Change it now to secure your account.'
            }
          </Text>
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {error}</Text></View> : null}

        <View style={s.card}>
          {/* Mot de passe actuel */}
          <View style={s.field}>
            <Text style={s.label}>{lang === 'fr' ? 'Mot de passe actuel *' : 'Current password *'}</Text>
            <View style={s.passWrap}>
              <TextInput style={s.passInput} value={currentPass} onChangeText={setCurrentPass}
                placeholder={lang === 'fr' ? 'Votre mot de passe actuel' : 'Your current password'}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showCurrent} />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={s.eyeBtn}>
                <Text>{showCurrent ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.hint}>
              💡 {lang === 'fr' ? 'Si jamais changé : votre code patient HGY-XXXXXX' : 'If never changed: your patient code HGY-XXXXXX'}
            </Text>
          </View>

          {/* Nouveau mot de passe */}
          <View style={s.field}>
            <Text style={s.label}>{lang === 'fr' ? 'Nouveau mot de passe *' : 'New password *'}</Text>
            <View style={s.passWrap}>
              <TextInput style={s.passInput} value={newPass} onChangeText={setNewPass}
                placeholder={lang === 'fr' ? 'Min. 6 caractères' : 'Min. 6 characters'}
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showNew} />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={s.eyeBtn}>
                <Text>{showNew ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {/* Indicateur force */}
            {newPass.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1,2,3,4].map(i => (
                    <View key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      backgroundColor: newPass.length >= i * 3
                        ? i <= 1 ? '#DC2626' : i <= 2 ? '#D97706' : i <= 3 ? '#2B6CB0' : '#059669'
                        : COLORS.gray200
                    }} />
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 4 }}>
                  {newPass.length < 3 ? (lang==='fr'?'Trop court':'Too short') :
                   newPass.length < 6 ? (lang==='fr'?'Faible':'Weak') :
                   newPass.length < 9 ? (lang==='fr'?'Moyen':'Medium') :
                   (lang==='fr'?'Fort':'Strong')}
                </Text>
              </View>
            )}
          </View>

          {/* Confirmation */}
          <View style={s.field}>
            <Text style={s.label}>{lang === 'fr' ? 'Confirmer le mot de passe *' : 'Confirm password *'}</Text>
            <TextInput style={[s.passInput, { borderWidth: 1.5, borderColor: confirmPass && confirmPass !== newPass ? '#DC2626' : COLORS.gray200, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13 }]}
              value={confirmPass} onChangeText={setConfirmPass}
              placeholder={lang === 'fr' ? 'Répétez le nouveau mot de passe' : 'Repeat new password'}
              placeholderTextColor={COLORS.gray400}
              secureTextEntry />
            {confirmPass && confirmPass !== newPass && (
              <Text style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                ❌ {lang === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match'}
              </Text>
            )}
            {confirmPass && confirmPass === newPass && (
              <Text style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                ✅ {lang === 'fr' ? 'Les mots de passe correspondent' : 'Passwords match'}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleChange} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>🔑 {lang === 'fr' ? 'Modifier le mot de passe' : 'Change password'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.bgAlt },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  infoBox:  { backgroundColor: COLORS.primaryPale, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  infoTxt:  { fontSize: 13, color: COLORS.primary, lineHeight: 20 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 14 },
  errorTxt: { color: COLORS.danger, fontSize: 13 },
  card:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOW.sm },
  field:    { marginBottom: 16 },
  label:    { fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray200 },
  passInput:{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: COLORS.black },
  eyeBtn:   { padding: 12 },
  hint:     { fontSize: 11, color: COLORS.gray400, marginTop: 5 },
  btn:      { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', ...SHADOW.md },
  btnTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
})

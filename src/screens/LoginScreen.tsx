import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'

export default function LoginScreen({ navigation }: any) {
  const { loginByPhone } = useAuth()
  const { lang } = useLang()
  const [telephone, setTelephone] = useState('')
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleLogin = async () => {
    if (!telephone.trim() || !code.trim()) {
      setError(lang === 'fr' ? 'Téléphone et code requis.' : 'Phone and code required.')
      return
    }
    setLoading(true)
    setError('')
    const ok = await loginByPhone(telephone.trim(), code.trim())
    setLoading(false)
    if (ok) {
      navigation.replace('Main')
    } else {
      setError(lang === 'fr'
        ? 'Identifiants incorrects. Vérifiez votre téléphone et code patient.'
        : 'Incorrect credentials. Check your phone and patient code.')
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <View style={s.logoWrap}>
              <Text style={{ fontSize: 48 }}>🏥</Text>
            </View>
            <Text style={s.title}>
              {lang === 'fr' ? 'Mon Espace Patient' : 'My Patient Portal'}
            </Text>
            <Text style={s.subtitle}>
              {lang === 'fr'
                ? 'Connectez-vous avec votre numéro de téléphone et votre code patient'
                : 'Log in with your phone number and patient code'
              }
            </Text>
          </View>

          {/* Formulaire */}
          <View style={s.card}>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorTxt}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={s.field}>
              <Text style={s.label}>📞 {lang === 'fr' ? 'Numéro de téléphone' : 'Phone number'}</Text>
              <TextInput
                style={s.input}
                value={telephone}
                onChangeText={setTelephone}
                placeholder="+237 6XX XXX XXX"
                placeholderTextColor={COLORS.gray400}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>🔑 {lang === 'fr' ? 'Code patient (HGY-XXXXXX)' : 'Patient code (HGY-XXXXXX)'}</Text>
              <TextInput
                style={s.input}
                value={code}
                onChangeText={setCode}
                placeholder="HGY-ABC123"
                placeholderTextColor={COLORS.gray400}
                autoCapitalize="characters"
                secureTextEntry={false}
              />
              <Text style={s.hint}>
                💡 {lang === 'fr'
                  ? 'Reçu par SMS/Email lors de la confirmation de votre 1er RDV'
                  : 'Received by SMS/Email when your 1st appointment was confirmed'
                }
              </Text>
            </View>

            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnTxt}>{lang === 'fr' ? '🔐 Se connecter' : '🔐 Log in'}</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerTxt}>{lang === 'fr' ? 'ou' : 'or'}</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Sans compte */}
            <TouchableOpacity style={s.btnOutline} onPress={() => navigation.replace('Main')}>
              <Text style={s.btnOutlineTxt}>
                {lang === 'fr' ? '👁️ Continuer sans connexion' : '👁️ Continue without login'}
              </Text>
            </TouchableOpacity>

            {/* Info création compte */}
            <View style={s.infoBox}>
              <Text style={s.infoTxt}>
                ℹ️ {lang === 'fr'
                  ? 'Votre compte est créé automatiquement lors de la confirmation de votre premier rendez-vous.'
                  : 'Your account is automatically created when your first appointment is confirmed.'
                }
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={s.contactBox}>
            <Text style={s.contactTxt}>
              {lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}
            </Text>
            <Text style={s.contactPhone}>📞 +237 6 57 60 30 39</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.primary },
  scroll:       { flexGrow: 1, paddingBottom: 32 },
  header:       { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  logoWrap:     { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:        { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 14, color: 'rgba(255,255,255,.75)', textAlign: 'center', lineHeight: 21 },
  card:         { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 16, padding: 24, ...SHADOW.lg },
  errorBox:     { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorTxt:     { color: COLORS.danger, fontSize: 13, lineHeight: 19 },
  field:        { marginBottom: 18 },
  label:        { fontSize: 12, fontWeight: '700', color: COLORS.gray600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray200, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.black },
  hint:         { fontSize: 11, color: COLORS.gray400, marginTop: 6, lineHeight: 16 },
  btn:          { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', ...SHADOW.md },
  btnDisabled:  { opacity: 0.6 },
  btnTxt:       { color: '#fff', fontSize: 15, fontWeight: '800' },
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerTxt:   { fontSize: 12, color: COLORS.gray400, marginHorizontal: 12 },
  btnOutline:   { borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray200, paddingVertical: 13, alignItems: 'center' },
  btnOutlineTxt:{ color: COLORS.gray600, fontSize: 14, fontWeight: '600' },
  infoBox:      { backgroundColor: COLORS.primaryPale, borderRadius: 10, padding: 12, marginTop: 14 },
  infoTxt:      { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  contactBox:   { alignItems: 'center', marginTop: 28, paddingHorizontal: 24 },
  contactTxt:   { fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 4 },
  contactPhone: { fontSize: 15, fontWeight: '700', color: '#fff' },
})

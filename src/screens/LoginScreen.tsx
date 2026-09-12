import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'

export default function LoginScreen({ navigation }: any) {
  const { loginByPhone } = useAuth()
  const { lang } = useLang()
  const [mode, setMode]           = useState<'login'|'register'>('login')
  const [login, setLogin]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // Register fields
  const [regCode, setRegCode]     = useState('')
  const [regEmail, setRegEmail]   = useState('')
  const [regPass, setRegPass]     = useState('')
  const [regPass2, setRegPass2]   = useState('')
  const [regTel, setRegTel]       = useState('')

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      setError(lang === 'fr' ? 'Tous les champs sont requis.' : 'All fields are required.')
      return
    }
    setLoading(true); setError('')
    const ok = await loginByPhone(login.trim(), password.trim())
    setLoading(false)
    if (ok) {
      navigation.replace('Main')
    } else {
      setError(lang === 'fr'
        ? 'Identifiants incorrects. Vérifiez votre email/code et mot de passe.'
        : 'Incorrect credentials. Check your email/code and password.')
    }
  }

  const handleRegister = async () => {
    if (!regCode.trim() || !regEmail.trim() || !regPass.trim()) {
      setError(lang === 'fr' ? 'Remplissez tous les champs.' : 'Fill all fields.')
      return
    }
    if (regPass !== regPass2) {
      setError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.')
      return
    }
    setLoading(true); setError('')
    try {
      const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'
      const r = await fetch(`${API}/patient/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_patient: regCode.toUpperCase().trim(),
          email: regEmail.trim(),
          password: regPass,
          password_confirmation: regPass2,
          telephone: regTel.trim() || undefined,
        })
      })
      const d = await r.json()
      if (d.success || d.token) {
        // Auto-login
        const ok = await loginByPhone(regEmail.trim(), regPass)
        if (ok) navigation.replace('Main')
        else setMode('login')
      } else {
        const msgs = Object.values(d.errors || {}).flat().join('\n')
        setError(msgs || d.message || (lang === 'fr' ? 'Erreur lors de la création.' : 'Registration error.'))
      }
    } catch {
      setError(lang === 'fr' ? 'Erreur réseau.' : 'Network error.')
    } finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <View style={s.logoWrap}><Text style={{ fontSize: 44 }}>🏥</Text></View>
            <Text style={s.title}>{lang === 'fr' ? 'Mon Espace Patient' : 'My Patient Portal'}</Text>
            <Text style={s.subtitle}>
              {lang === 'fr'
                ? 'Hôpital Général de Yaoundé'
                : 'Yaoundé General Hospital'
              }
            </Text>
            <Text style={s.slogan}>✦ Excellence · Empathie · Modernisme ✦</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Tabs */}
            <View style={s.modeTabs}>
              <TouchableOpacity style={[s.modeTab, mode==='login' && s.modeTabActive]}
                onPress={() => { setMode('login'); setError('') }}>
                <Text style={[s.modeTabTxt, mode==='login' && s.modeTabTxtActive]}>
                  🔐 {lang === 'fr' ? 'Se connecter' : 'Log in'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modeTab, mode==='register' && s.modeTabActive]}
                onPress={() => { setMode('register'); setError('') }}>
                <Text style={[s.modeTabTxt, mode==='register' && s.modeTabTxtActive]}>
                  ✅ {lang === 'fr' ? 'Créer mon espace' : 'Create account'}
                </Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorTxt}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <>
                <View style={s.field}>
                  <Text style={s.label}>
                    {lang === 'fr' ? 'Email ou code patient *' : 'Email or patient code *'}
                  </Text>
                  <TextInput style={s.input} value={login} onChangeText={setLogin}
                    placeholder={lang === 'fr' ? 'votre@email.com ou HGY-XXXXXX' : 'your@email.com or HGY-XXXXXX'}
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="none" keyboardType="email-address" />
                  <Text style={s.hint}>
                    {lang === 'fr'
                      ? 'Saisissez votre email ou votre code patient (format: HGY-XXXXXX)'
                      : 'Enter your email or patient code (format: HGY-XXXXXX)'
                    }
                  </Text>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>{lang === 'fr' ? 'Mot de passe *' : 'Password *'}</Text>
                  <View style={s.passWrap}>
                    <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]}
                      value={password} onChangeText={setPassword}
                      placeholder="••••••••" placeholderTextColor={COLORS.gray400}
                      secureTextEntry={!showPass} />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                      <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.hint}>
                    {lang === 'fr'
                      ? 'Mot de passe temporaire = votre code patient (à modifier après connexion)'
                      : 'Temporary password = your patient code (change it after login)'
                    }
                  </Text>
                </View>

                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleLogin} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnTxt}>🔐 {lang === 'fr' ? 'Se connecter' : 'Log in'}</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <>
                <View style={s.infoBox}>
                  <Text style={s.infoTxt}>
                    ℹ️ {lang === 'fr'
                      ? 'Vous aurez besoin de votre code patient (ex: HGY-XXXXXX) fourni par l\'hôpital lors de votre premier rendez-vous confirmé.'
                      : 'You will need your patient code (ex: HGY-XXXXXX) provided by the hospital when your first appointment is confirmed.'
                    }
                  </Text>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>{lang === 'fr' ? 'Code patient *' : 'Patient code *'}</Text>
                  <TextInput style={s.input} value={regCode} onChangeText={setRegCode}
                    placeholder="HGY-XXXXXX" placeholderTextColor={COLORS.gray400}
                    autoCapitalize="characters" />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Email *</Text>
                  <TextInput style={s.input} value={regEmail} onChangeText={setRegEmail}
                    placeholder="votre@email.com" placeholderTextColor={COLORS.gray400}
                    autoCapitalize="none" keyboardType="email-address" />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>{lang === 'fr' ? 'Téléphone' : 'Phone'}</Text>
                  <TextInput style={s.input} value={regTel} onChangeText={setRegTel}
                    placeholder="+237 6XX XXX XXX" placeholderTextColor={COLORS.gray400}
                    keyboardType="phone-pad" />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>{lang === 'fr' ? 'Mot de passe *' : 'Password *'}</Text>
                  <TextInput style={s.input} value={regPass} onChangeText={setRegPass}
                    placeholder="••••••••" placeholderTextColor={COLORS.gray400}
                    secureTextEntry />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>{lang === 'fr' ? 'Confirmer mot de passe *' : 'Confirm password *'}</Text>
                  <TextInput style={s.input} value={regPass2} onChangeText={setRegPass2}
                    placeholder="••••••••" placeholderTextColor={COLORS.gray400}
                    secureTextEntry />
                </View>

                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleRegister} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnTxt}>✅ {lang === 'fr' ? 'Créer mon espace patient' : 'Create my patient portal'}</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* Continuer sans compte */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerTxt}>{lang === 'fr' ? 'ou' : 'or'}</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity style={s.btnOutline} onPress={() => navigation.replace('Main')}>
              <Text style={s.btnOutlineTxt}>
                {lang === 'fr' ? '👁️ Continuer sans connexion' : '👁️ Continue without login'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contact */}
          <View style={s.contactBox}>
            <Text style={s.contactTxt}>{lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}</Text>
            <Text style={s.contactPhone}>📞 +237 6 57 60 30 39</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.primary },
  scroll:        { flexGrow: 1, paddingBottom: 32 },
  header:        { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  logoWrap:      { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:         { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  subtitle:      { fontSize: 13, color: 'rgba(255,255,255,.75)', textAlign: 'center', marginBottom: 4 },
  slogan:        { fontSize: 11, color: 'rgba(255,255,255,.5)', fontStyle: 'italic', letterSpacing: 1 },
  card:          { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 16, padding: 22, ...SHADOW.lg },
  modeTabs:      { flexDirection: 'row', backgroundColor: COLORS.bgAlt, borderRadius: 12, padding: 4, marginBottom: 18 },
  modeTab:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: '#fff', ...SHADOW.sm },
  modeTabTxt:    { fontSize: 12, fontWeight: '600', color: COLORS.gray400 },
  modeTabTxtActive: { color: COLORS.primary, fontWeight: '800' },
  errorBox:      { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 14 },
  errorTxt:      { color: COLORS.danger, fontSize: 13, lineHeight: 19 },
  field:         { marginBottom: 14 },
  label:         { fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  input:         { backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray200, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: COLORS.black },
  passWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgAlt, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray200 },
  eyeBtn:        { padding: 12 },
  hint:          { fontSize: 11, color: COLORS.gray400, marginTop: 5, lineHeight: 16 },
  infoBox:       { backgroundColor: COLORS.primaryPale, borderRadius: 12, padding: 12, marginBottom: 16 },
  infoTxt:       { fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  btn:           { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', ...SHADOW.md },
  btnDisabled:   { opacity: 0.6 },
  btnTxt:        { color: '#fff', fontSize: 15, fontWeight: '800' },
  divider:       { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerTxt:    { fontSize: 12, color: COLORS.gray400, marginHorizontal: 12 },
  btnOutline:    { borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gray200, paddingVertical: 13, alignItems: 'center' },
  btnOutlineTxt: { color: COLORS.gray600, fontSize: 14, fontWeight: '600' },
  contactBox:    { alignItems: 'center', marginTop: 24, paddingHorizontal: 24 },
  contactTxt:    { fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 4 },
  contactPhone:  { fontSize: 15, fontWeight: '700', color: '#fff' },
})

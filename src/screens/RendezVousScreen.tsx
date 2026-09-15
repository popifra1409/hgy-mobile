import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { rdvService } from '../services/api'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'

const JOURS    = ['','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const JOURS_EN = ['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const SPEC_ICONS: Record<string,string> = {
  'Cardiologie':'🫀','Neurologie':'🧠','Pédiatrie':'👶','Gynécologie':'🤱',
  'Chirurgie':'🔪','Dermatologie':'🧴','Ophtalmologie':'👁️','ORL':'👂',
  'Orthopédie':'🦴','Pneumologie':'🫁','Médecine générale':'🩺','Urgences':'🚨',
}

function getProchainsDates(jourSemaine: number) {
  const dates: Date[] = []
  const now  = new Date()
  const min  = new Date(now.getTime() + 72 * 3600000)
  const max  = new Date(now.getTime() +  7 * 86400000)
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i)
    const dow = d.getDay() === 0 ? 7 : d.getDay()
    if (dow === jourSemaine && d >= min && d <= max) dates.push(d)
  }
  return dates
}

function formatDate(d: Date, lang: string) {
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB',
    { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}

function genCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { q: `${a} + ${b}`, r: a + b }
}

export default function RendezVousScreen({ navigation, route }: any) {
  const { lang } = useLang()
  const medecinPreselect = route?.params?.medecinPreselect

  const [step, setStep]             = useState(1)
  const [submitted, setSubmitted]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [reference, setReference]   = useState('')
  const [searchSpec, setSearchSpec] = useState('')

  // Données
  const [specialites, setSpecialites]   = useState<any[]>([])
  const [medecins, setMedecins]         = useState<any[]>([])
  const [planning, setPlanning]         = useState<any[]>([])
  const [planningJour, setPlanningJour] = useState<any[]>([])
  const [loadSpec, setLoadSpec]         = useState(true)
  const [loadMed, setLoadMed]           = useState(false)
  const [loadPlan, setLoadPlan]         = useState(false)

  // Sélections
  const [specId, setSpecId]                   = useState('')
  const [specName, setSpecName]               = useState('')
  const [medecinId, setMedecinId]             = useState('')
  const [selectedMedecin, setSelectedMedecin] = useState<any>(null)
  const [selectedPlanning, setSelectedPlanning] = useState<any>(null)
  const [selectedDate, setSelectedDate]         = useState<Date|null>(null)
  const [selectedHeure, setSelectedHeure]       = useState('')

  // Patient
  const [form, setForm] = useState({ nom:'', prenom:'', telephone:'', email:'', motif:'' })

  // Captcha
  const [captcha, setCaptcha]       = useState(genCaptcha)
  const [captchaRep, setCaptchaRep] = useState('')
  const [captchaErr, setCaptchaErr] = useState(false)

  // Charge spécialités + planning jour
  useEffect(() => {
    Promise.all([
      rdvService.specialites().then(r => setSpecialites(r.data?.data || [])),
      rdvService.planningJour().then(r => {
        const d = r.data?.data || []
        setPlanningJour(d.filter((p: any) => p.medecin && !p.__spec_vide))
      }),
    ]).finally(() => setLoadSpec(false))

    // Préselection médecin si vient de MedecinDetail
    if (medecinPreselect) {
      setMedecinId(medecinPreselect.id)
      setSelectedMedecin(medecinPreselect)
      setSpecId(medecinPreselect.specialite_id || '')
      setSpecName(medecinPreselect.specialite?.fr || medecinPreselect.specialite?.nom_fr || '')
      setStep(3)
    }
  }, [])

  // Charge médecins par spécialité
  useEffect(() => {
    if (!specId) return
    setLoadMed(true)
    rdvService.medecins(Number(specId))
      .then(r => setMedecins(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadMed(false))
  }, [specId])

  // Charge planning médecin
  useEffect(() => {
    if (!medecinId) return
    setLoadPlan(true)
    rdvService.planning(Number(medecinId))
      .then(r => setPlanning(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadPlan(false))
  }, [medecinId])

  const specsFiltered = useMemo(() =>
    specialites.filter(s => {
      const nom = lang === 'fr' ? s.nom?.fr : s.nom?.en
      return !searchSpec || nom?.toLowerCase().includes(searchSpec.toLowerCase())
    }), [specialites, searchSpec, lang])

  // Grouper planning jour par spécialité
  const planningBySpec: Record<string,any[]> = {}
  planningJour.forEach((p: any) => {
    const spec = p.specialite?.nom?.fr || 'Autres'
    if (!planningBySpec[spec]) planningBySpec[spec] = []
    planningBySpec[spec].push(p)
  })

  const goNext = () => { setError(''); setStep(s => s + 1) }
  const goPrev = () => { setError(''); setStep(s => s - 1) }
  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (parseInt(captchaRep) !== captcha.r) {
      setCaptchaErr(true); setCaptcha(genCaptcha()); setCaptchaRep(''); return
    }
    setLoading(true); setError('')
    try {
      const dh = new Date(selectedDate!)
      const [h, m] = selectedHeure.split(':')
      dh.setHours(+h, +m, 0)
      const payload = {
        nom: form.nom, prenom: form.prenom,
        telephone: form.telephone, email: form.email || null,
        motif: form.motif || null, medecin_id: medecinId,
        specialite_id: specId, planning_id: selectedPlanning?.id,
        date_heure: dh.toISOString(), type: 'presentiel',
      }
      console.log('RDV Payload:', JSON.stringify(payload))
      const r = await rdvService.creer(payload)
      setReference(r.data?.reference || r.data?.data?.reference || '')
      setSubmitted(true)
    } catch {
      setError(lang === 'fr' ? 'Erreur réseau. Réessayez.' : 'Network error. Please retry.')
    } finally { setLoading(false) }
  }

  // ── Succès ──
  if (submitted) return (
    <SafeAreaView style={s.safe}>
      <View style={s.successWrap}>
        <View style={s.successIcon}><Text style={{ fontSize: 44 }}>✅</Text></View>
        <Text style={s.successTitle}>{lang === 'fr' ? 'Demande envoyée !' : 'Request sent!'}</Text>
        <Text style={s.successSub}>
          {lang === 'fr'
            ? 'Votre RDV est en attente de confirmation. Vous serez notifié par SMS/WhatsApp sous 24h.'
            : 'Your appointment is pending confirmation. You will be notified by SMS/WhatsApp within 24h.'
          }
        </Text>
        {reference ? (
          <View style={s.refBox}>
            <Text style={s.refLabel}>{lang === 'fr' ? 'Référence' : 'Reference'}</Text>
            <Text style={s.refValue}>#{reference}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={s.primaryBtn} onPress={() => {
          setSubmitted(false); setStep(1); setSpecId(''); setMedecinId('')
          setSelectedMedecin(null); setSelectedPlanning(null)
          setSelectedDate(null); setSelectedHeure('')
          setForm({ nom:'',prenom:'',telephone:'',email:'',motif:'' })
        }}>
          <Text style={s.primaryBtnTxt}>{lang === 'fr' ? '📅 Nouveau RDV' : '📅 New appointment'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📅 {lang === 'fr' ? 'Prendre rendez-vous' : 'Book appointment'}</Text>
      </View>

      {/* Stepper */}
      <View style={s.stepper}>
        {[1,2,3,4,5].map((n, i) => (
          <View key={n} style={{ flexDirection:'row', alignItems:'center', flex: i < 4 ? 1 : 0 }}>
            <View style={[s.stepCircle, step >= n && s.stepActive, step > n && s.stepDone]}>
              <Text style={[s.stepTxt, step >= n && { color:'#fff' }]}>
                {step > n ? '✓' : n}
              </Text>
            </View>
            {i < 4 && <View style={[s.stepLine, step > n && s.stepLineDone]} />}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }} keyboardShouldPersistTaps="handled">

          {error ? (
            <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {error}</Text></View>
          ) : null}

          {/* ═══ ÉTAPE 1 — Spécialité ═══ */}
          {step === 1 && (
            <View>
              <Text style={s.stepTitle}>🔬 {lang==='fr' ? 'Choisissez une spécialité' : 'Choose a specialty'}</Text>

              {/* Planning du jour */}
              {planningJour.length > 0 && (
                <View style={s.planningBox}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
                    <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#10B981' }} />
                    <Text style={{ fontSize:13, fontWeight:'800', color:'#15803D' }}>
                      {lang==='fr' ? 'Consultations aujourd\'hui' : 'Today\'s consultations'}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Object.entries(planningBySpec).map(([spec, plans]) => (
                      <TouchableOpacity key={spec} style={s.planCard}
                        onPress={() => {
                          const sp = specialites.find(s => s.nom?.fr === spec || s.nom?.en === spec)
                          if (sp) { setSpecId(sp.id); setSpecName(lang==='fr'?sp.nom.fr:sp.nom.en||sp.nom.fr); goNext() }
                        }}>
                        <Text style={s.planSpec}>{SPEC_ICONS[spec]||'🏥'} {spec}</Text>
                        {(plans as any[]).slice(0,2).map((p:any, i:number) => (
                          <Text key={i} style={s.planDoc} numberOfLines={1}>
                            • {p.medecin?.nom_complet} {p.heure_debut?.slice(0,5)}
                          </Text>
                        ))}
                        <Text style={s.planRdvBtn}>{lang==='fr'?'RDV →':'Book →'}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Règles */}
              <View style={s.rulesBox}>
                {[
                  { icon:'⏰', txt: lang==='fr'?'Min. 72h à l\'avance':'Min. 72h in advance' },
                  { icon:'📅', txt: lang==='fr'?'Max. 7 jours':'Max. 7 days' },
                  { icon:'👥', txt: lang==='fr'?'Max. 20 patients/créneau':'Max. 20/slot' },
                ].map((r,i) => (
                  <Text key={i} style={s.rulesTxt}>{r.icon} {r.txt}</Text>
                ))}
              </View>

              {/* Recherche */}
              <View style={s.searchWrap}>
                <Text style={{ position:'absolute', left:12, zIndex:1, fontSize:16 }}>🔍</Text>
                <TextInput
                  style={s.searchInput}
                  value={searchSpec} onChangeText={setSearchSpec}
                  placeholder={lang==='fr' ? 'Rechercher une spécialité…' : 'Search specialty…'}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>

              {loadSpec ? <ActivityIndicator color={COLORS.primary} style={{ marginTop:20 }} /> : (
                <View style={s.specGrid}>
                  {specsFiltered.map(sp => {
                    const nom = lang==='fr' ? sp.nom?.fr : (sp.nom?.en || sp.nom?.fr)
                    const icon = SPEC_ICONS[sp.nom?.fr] || '🏥'
                    const isActive = specId === sp.id
                    return (
                      <TouchableOpacity key={sp.id} style={[s.specCard, isActive && s.specCardActive]}
                        onPress={() => { setSpecId(sp.id); setSpecName(nom); setMedecinId(''); setSelectedMedecin(null); goNext() }}>
                        <Text style={{ fontSize:26, marginBottom:6 }}>{icon}</Text>
                        <Text style={[s.specName, isActive && { color:COLORS.primary }]} numberOfLines={2}>{nom}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {/* ═══ ÉTAPE 2 — Médecin ═══ */}
          {step === 2 && (
            <View>
              <View style={s.breadcrumb}>
                <Text style={s.breadcrumbTxt}>🔬 {specName}</Text>
              </View>
              <Text style={s.stepTitle}>👨‍⚕️ {lang==='fr' ? 'Choisissez un médecin' : 'Choose a doctor'}</Text>
              <Text style={s.stepSub}>{lang==='fr' ? 'Médecins disponibles avec planning actif' : 'Doctors with active schedule'}</Text>

              {loadMed ? <ActivityIndicator color={COLORS.primary} style={{ marginTop:20 }} /> :
               medecins.length === 0 ? (
                <View style={s.empty}>
                  <Text style={{ fontSize:40, marginBottom:10 }}>👨‍⚕️</Text>
                  <Text style={s.emptyTxt}>{lang==='fr' ? 'Aucun médecin disponible.' : 'No doctors available.'}</Text>
                </View>
               ) : medecins.map((m:any) => (
                <TouchableOpacity key={m.id} style={[s.medecinCard, medecinId===m.id && s.medecinCardActive]}
                  onPress={() => { setMedecinId(m.id); setSelectedMedecin(m); setSelectedPlanning(null); setSelectedDate(null); goNext() }}>
                  <View style={s.medecinAvatar}>
                    <Text style={{ fontSize:20, color:'#fff' }}>👨‍⚕️</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.medecinName}>{m.nom_complet}</Text>
                    <Text style={s.medecinSpec}>{m.specialite?.fr || m.specialite?.nom_fr}</Text>
                    {m.numero_onmc && <Text style={s.medecinOnmc}>🪪 {m.numero_onmc}</Text>}
                  </View>
                  <Text style={{ fontSize:20, color:COLORS.gray400 }}>›</Text>
                </TouchableOpacity>
              ))}
              <NavBtns onPrev={goPrev} lang={lang} showNext={false} />
            </View>
          )}

          {/* ═══ ÉTAPE 3 — Créneau ═══ */}
          {step === 3 && (
            <View>
              <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                <View style={s.breadcrumb}><Text style={s.breadcrumbTxt}>🔬 {specName}</Text></View>
                <View style={[s.breadcrumb, { backgroundColor:'#F5F3FF' }]}>
                  <Text style={[s.breadcrumbTxt, { color:'#7C3AED' }]}>👨‍⚕️ {selectedMedecin?.nom_complet}</Text>
                </View>
              </View>
              <Text style={s.stepTitle}>📅 {lang==='fr' ? 'Choisissez un créneau' : 'Choose a slot'}</Text>

              {loadPlan ? <ActivityIndicator color={COLORS.primary} style={{ marginTop:20 }} /> :
               planning.length === 0 ? (
                <View style={s.empty}>
                  <Text style={{ fontSize:40, marginBottom:10 }}>📅</Text>
                  <Text style={s.emptyTxt}>{lang==='fr' ? 'Aucun planning disponible.' : 'No schedule available.'}</Text>
                </View>
               ) : planning.map((p:any) => {
                const dates = getProchainsDates(p.jour_semaine)
                return (
                  <View key={p.id} style={s.planningCard}>
                    <View style={s.planningCardHeader}>
                      <View>
                        <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>
                          {lang==='fr' ? JOURS[p.jour_semaine] : JOURS_EN[p.jour_semaine]}
                        </Text>
                        <Text style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>
                          🕐 {p.heure_debut?.slice(0,5)} - {p.heure_fin?.slice(0,5)}
                        </Text>
                      </View>
                      <View style={s.maxBadge}>
                        <Text style={{ fontSize:10, color:'#fff', fontWeight:'700' }}>👥 max {p.nb_patients_max||20}</Text>
                      </View>
                    </View>
                    <View style={{ padding:12 }}>
                      {dates.length === 0 ? (
                        <Text style={s.noDates}>❌ {lang==='fr' ? 'Aucune date dans les 7 prochains jours (min. 72h)' : 'No dates in next 7 days (min. 72h)'}</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {dates.map((d, i) => {
                            const isSel = selectedDate?.getTime()===d.getTime() && selectedPlanning?.id===p.id
                            return (
                              <TouchableOpacity key={i} style={[s.dateChip, isSel && s.dateChipActive]}
                                onPress={() => { setSelectedDate(d); setSelectedPlanning(p); setSelectedHeure(p.heure_debut?.slice(0,5)||'') }}>
                                <Text style={[s.dateChipTxt, isSel && { color:'#fff' }]}>{formatDate(d,lang)}</Text>
                              </TouchableOpacity>
                            )
                          })}
                        </ScrollView>
                      )}
                    </View>
                  </View>
                )
               })}

              {selectedDate && selectedPlanning && (
                <View style={s.heureBox}>
                  <Text style={s.heureLabel}>🕐 {lang==='fr' ? 'Heure souhaitée' : 'Preferred time'}</Text>
                  <TextInput
                    style={s.heureInput}
                    value={selectedHeure}
                    onChangeText={setSelectedHeure}
                    placeholder={selectedPlanning?.heure_debut?.slice(0,5)}
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="numeric"
                  />
                  <Text style={s.heureSub}>
                    {lang==='fr'?`Plage : ${selectedPlanning.heure_debut?.slice(0,5)} - ${selectedPlanning.heure_fin?.slice(0,5)}`
                    :`Range: ${selectedPlanning.heure_debut?.slice(0,5)} - ${selectedPlanning.heure_fin?.slice(0,5)}`}
                  </Text>
                </View>
              )}

              <NavBtns onPrev={goPrev} onNext={goNext} lang={lang} disableNext={!selectedDate || !selectedHeure} />
            </View>
          )}

          {/* ═══ ÉTAPE 4 — Infos patient ═══ */}
          {step === 4 && (
            <View>
              <Text style={s.stepTitle}>👤 {lang==='fr' ? 'Vos informations' : 'Your information'}</Text>
              <Text style={s.stepSub}>{lang==='fr' ? 'Aucun compte requis.' : 'No account required.'}</Text>

              <View style={{ gap:14 }}>
                <View style={{ flexDirection:'row', gap:10 }}>
                  <View style={{ flex:1 }}>
                    <FField label={lang==='fr'?'Nom *':'Last name *'} value={form.nom}
                      onChange={(v: string)=>setField('nom',v)} placeholder="MBALLA" />
                  </View>
                  <View style={{ flex:1 }}>
                    <FField label={lang==='fr'?'Prénom':'First name'} value={form.prenom}
                      onChange={(v: string)=>setField('prenom',v)} placeholder="Jean" />
                  </View>
                </View>
                <FField label={lang==='fr'?'Téléphone *':'Phone *'} value={form.telephone}
                  onChange={(v: string)=>setField('telephone',v)} placeholder="+237 6XX XXX XXX"
                  keyboardType="phone-pad"
                  hint={lang==='fr'?'Obligatoire — pour la confirmation':'Required — for confirmation'} />
                <FField label={`Email ${lang==='fr'?'(recommandé)':'(recommended)'}`} value={form.email}
                  onChange={(v: string)=>setField('email',v)} placeholder="jean@email.com"
                  keyboardType="email-address"
                  hint={lang==='fr'?'Pour recevoir vos résultats d\'examens':'To receive your exam results'} />
                <FField label={lang==='fr'?'Motif (optionnel)':'Reason (optional)'} value={form.motif}
                  onChange={(v: string)=>setField('motif',v)}
                  placeholder={lang==='fr'?'Décrivez brièvement…':'Briefly describe…'}
                  multiline />
              </View>

              {!form.email && (
                <View style={s.warnBox}>
                  <Text style={s.warnTxt}>
                    💡 {lang==='fr'
                      ? 'Sans email, vous ne pourrez pas recevoir vos résultats d\'examens par email.'
                      : 'Without email, you cannot receive exam results by email.'
                    }
                  </Text>
                </View>
              )}

              <NavBtns onPrev={goPrev} onNext={() => {
                if (!form.nom || !form.telephone) {
                  setError(lang==='fr'?'Nom et téléphone sont obligatoires.':'Name and phone are required.'); return
                }
                setError(''); goNext()
              }} lang={lang} />
            </View>
          )}

          {/* ═══ ÉTAPE 5 — Récap + Captcha ═══ */}
          {step === 5 && (
            <View>
              {/* Récap */}
              <Text style={s.stepTitle}>📋 {lang==='fr' ? 'Récapitulatif' : 'Summary'}</Text>
              <View style={s.recapCard}>
                {[
                  { icon:'👤', label:lang==='fr'?'Patient':'Patient', value:`${form.prenom} ${form.nom}` },
                  { icon:'📞', label:lang==='fr'?'Téléphone':'Phone', value:form.telephone },
                  { icon:'📧', label:'Email', value:form.email||(lang==='fr'?'Non renseigné':'Not provided') },
                  { icon:'👨‍⚕️', label:lang==='fr'?'Médecin':'Doctor', value:selectedMedecin?.nom_complet },
                  { icon:'🔬', label:lang==='fr'?'Spécialité':'Specialty', value:specName },
                  { icon:'📅', label:lang==='fr'?'Date':'Date', value:selectedDate?formatDate(selectedDate,lang):'—' },
                  { icon:'🕐', label:lang==='fr'?'Heure':'Time', value:selectedHeure },
                  { icon:'💬', label:lang==='fr'?'Motif':'Reason', value:form.motif||'—' },
                ].filter(i=>i.value).map((item,i,arr)=>(
                  <View key={i} style={[s.recapRow, { borderBottomWidth: i<arr.length-1?1:0 }]}>
                    <Text style={{ fontSize:16, width:26 }}>{item.icon}</Text>
                    <Text style={s.recapLabel}>{item.label}</Text>
                    <Text style={s.recapValue} numberOfLines={2}>{item.value}</Text>
                  </View>
                ))}
              </View>

              <View style={s.infoBox}>
                <Text style={s.infoTxt}>
                  ℹ️ {lang==='fr'
                    ? 'Votre RDV sera confirmé sous 24h par notre équipe via SMS/WhatsApp.'
                    : 'Your appointment will be confirmed within 24h by our team via SMS/WhatsApp.'
                  }
                </Text>
              </View>

              {/* Captcha */}
              <View style={s.captchaCard}>
                <Text style={s.captchaTitle}>🤖 {lang==='fr' ? 'Vérification anti-robot' : 'Anti-robot check'}</Text>
                <Text style={s.captchaSub}>{lang==='fr' ? 'Répondez à cette question :' : 'Answer this question:'}</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginTop:12 }}>
                  <View style={s.captchaQ}>
                    <Text style={{ fontSize:20, fontWeight:'900', color:'#fff', letterSpacing:2 }}>{captcha.q} = ?</Text>
                  </View>
                  <TextInput
                    style={[s.captchaInput, captchaErr && { borderColor:COLORS.danger }]}
                    value={captchaRep}
                    onChangeText={v => { setCaptchaRep(v); setCaptchaErr(false) }}
                    keyboardType="numeric"
                    placeholder="?"
                    placeholderTextColor={COLORS.gray400}
                    maxLength={2}
                  />
                </View>
                {captchaErr && <Text style={{ color:COLORS.danger, fontSize:12, marginTop:8 }}>❌ {lang==='fr'?'Réponse incorrecte':'Wrong answer'}</Text>}
              </View>

              <NavBtns onPrev={goPrev} lang={lang} showNext={false} />

              <TouchableOpacity
                style={[s.submitBtn, (loading||!captchaRep) && s.submitBtnDisabled]}
                onPress={submit}
                disabled={loading||!captchaRep}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnTxt}>
                      📨 {lang==='fr' ? 'Confirmer ma demande de RDV' : 'Confirm my appointment request'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ── Sous-composants ──
function FField({ label, value, onChange, placeholder, hint, keyboardType, multiline }: any) {
  return (
    <View>
      <Text style={{ fontSize:11, fontWeight:'700', color:COLORS.gray400, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{label}</Text>
      {multiline
        ? <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
            placeholderTextColor={COLORS.gray400} multiline numberOfLines={3}
            style={{ backgroundColor:COLORS.bgAlt, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:COLORS.black, textAlignVertical:'top' }} />
        : <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
            placeholderTextColor={COLORS.gray400} keyboardType={keyboardType||'default'}
            style={{ backgroundColor:COLORS.bgAlt, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:COLORS.black }} />
      }
      {hint && <Text style={{ fontSize:11, color:COLORS.gray400, marginTop:4 }}>💡 {hint}</Text>}
    </View>
  )
}

function NavBtns({ onPrev, onNext, lang, showNext=true, disableNext=false }: any) {
  return (
    <View style={{ flexDirection:'row', gap:10, marginTop:20 }}>
      {onPrev && (
        <TouchableOpacity onPress={onPrev}
          style={{ padding:13, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, backgroundColor:'#fff' }}>
          <Text style={{ fontSize:14, fontWeight:'600', color:COLORS.gray600 }}>← {lang==='fr'?'Retour':'Back'}</Text>
        </TouchableOpacity>
      )}
      {showNext && onNext && (
        <TouchableOpacity onPress={onNext} disabled={disableNext}
          style={{ flex:1, padding:13, borderRadius:RADIUS.md, backgroundColor: disableNext ? COLORS.gray200 : COLORS.primary, alignItems:'center' }}>
          <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>{lang==='fr'?'Continuer':'Continue'} →</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  safe:              { flex:1, backgroundColor:COLORS.bgAlt },
  header:            { backgroundColor:COLORS.primary, padding:16, paddingTop:10 },
  headerTitle:       { fontSize:18, fontWeight:'800', color:'#fff' },
  stepper:           { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  stepCircle:        { width:30, height:30, borderRadius:15, backgroundColor:COLORS.gray100, alignItems:'center', justifyContent:'center' },
  stepActive:        { backgroundColor:COLORS.primary },
  stepDone:          { backgroundColor:COLORS.success },
  stepTxt:           { fontSize:12, fontWeight:'800', color:COLORS.gray400 },
  stepLine:          { flex:1, height:2, backgroundColor:COLORS.gray200, marginHorizontal:4 },
  stepLineDone:      { backgroundColor:COLORS.success },
  errorBox:          { backgroundColor:'#FEF2F2', borderRadius:12, padding:12, marginBottom:14 },
  errorTxt:          { color:COLORS.danger, fontSize:13 },
  stepTitle:         { fontSize:18, fontWeight:'800', color:COLORS.black, marginBottom:6 },
  stepSub:           { fontSize:13, color:COLORS.gray400, marginBottom:16 },
  planningBox:       { backgroundColor:'#F0FDF4', borderRadius:14, padding:14, marginBottom:14, borderWidth:1, borderColor:'#BBF7D0' },
  planCard:          { backgroundColor:'#fff', borderRadius:12, padding:12, marginRight:10, width:180, borderTopWidth:3, borderTopColor:'#10B981', ...SHADOW.sm },
  planSpec:          { fontSize:11, fontWeight:'800', color:'#15803D', marginBottom:6 },
  planDoc:           { fontSize:11, color:COLORS.gray600, marginBottom:2 },
  planRdvBtn:        { fontSize:11, fontWeight:'800', color:'#10B981', marginTop:8 },
  rulesBox:          { backgroundColor:COLORS.primaryPale, borderRadius:12, padding:12, marginBottom:14, gap:4 },
  rulesTxt:          { fontSize:12, color:COLORS.primary, fontWeight:'600' },
  searchWrap:        { position:'relative', marginBottom:14 },
  searchInput:       { backgroundColor:'#fff', borderRadius:12, borderWidth:1.5, borderColor:COLORS.gray200, paddingLeft:38, paddingRight:14, paddingVertical:11, fontSize:14, color:COLORS.black },
  specGrid:          { flexDirection:'row', flexWrap:'wrap', gap:10 },
  specCard:          { width:'30%', backgroundColor:'#fff', borderRadius:14, padding:12, alignItems:'center', borderWidth:1.5, borderColor:COLORS.gray200, ...SHADOW.sm },
  specCardActive:    { borderColor:COLORS.primary, backgroundColor:COLORS.primaryPale },
  specName:          { fontSize:11, fontWeight:'700', color:COLORS.black, textAlign:'center', lineHeight:15 },
  breadcrumb:        { backgroundColor:COLORS.primaryPale, borderRadius:99, paddingHorizontal:12, paddingVertical:4, alignSelf:'flex-start', marginBottom:10 },
  breadcrumbTxt:     { fontSize:12, fontWeight:'700', color:COLORS.primary },
  medecinCard:       { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, borderWidth:1.5, borderColor:COLORS.gray200, ...SHADOW.sm },
  medecinCardActive: { borderColor:COLORS.primary, backgroundColor:COLORS.primaryPale },
  medecinAvatar:     { width:48, height:48, borderRadius:24, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', flexShrink:0 },
  medecinName:       { fontSize:14, fontWeight:'700', color:COLORS.black, marginBottom:2 },
  medecinSpec:       { fontSize:12, color:COLORS.primaryLight, marginBottom:2 },
  medecinOnmc:       { fontSize:11, color:COLORS.gray400 },
  planningCard:      { borderRadius:14, overflow:'hidden', marginBottom:14, ...SHADOW.sm },
  planningCardHeader:{ backgroundColor:COLORS.primary, padding:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  maxBadge:          { backgroundColor:'rgba(255,255,255,.2)', borderRadius:99, paddingHorizontal:10, paddingVertical:4 },
  noDates:           { fontSize:12, color:COLORS.danger, backgroundColor:'#FEF2F2', borderRadius:8, padding:10 },
  dateChip:          { paddingHorizontal:14, paddingVertical:9, borderRadius:10, borderWidth:1.5, borderColor:COLORS.gray200, backgroundColor:'#fff', marginRight:8 },
  dateChipActive:    { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  dateChipTxt:       { fontSize:13, fontWeight:'600', color:COLORS.black },
  heureBox:          { backgroundColor:COLORS.primaryPale, borderRadius:14, padding:16, marginTop:14, borderWidth:1.5, borderColor:'#BFDBFE' },
  heureLabel:        { fontSize:13, fontWeight:'700', color:COLORS.primary, marginBottom:10 },
  heureInput:        { backgroundColor:'#fff', borderRadius:12, borderWidth:1.5, borderColor:'#BFDBFE', padding:13, fontSize:16, fontWeight:'700', color:COLORS.primary, textAlign:'center' },
  heureSub:          { fontSize:11, color:COLORS.primary, marginTop:6, textAlign:'center' },
  recapCard:         { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:14, ...SHADOW.sm },
  recapRow:          { flexDirection:'row', alignItems:'flex-start', gap:10, paddingVertical:10, borderBottomColor:COLORS.bgAlt },
  recapLabel:        { fontSize:12, color:COLORS.gray400, width:80, flexShrink:0, paddingTop:1 },
  recapValue:        { fontSize:13, fontWeight:'600', color:COLORS.black, flex:1 },
  infoBox:           { backgroundColor:'#EFF6FF', borderRadius:12, padding:12, marginBottom:14, borderWidth:1, borderColor:'#BFDBFE' },
  infoTxt:           { fontSize:12, color:'#1D4ED8', lineHeight:18 },
  captchaCard:       { backgroundColor:'#fff', borderRadius:14, padding:16, marginBottom:14, ...SHADOW.sm },
  captchaTitle:      { fontSize:15, fontWeight:'800', color:COLORS.black, marginBottom:4 },
  captchaSub:        { fontSize:13, color:COLORS.gray400 },
  captchaQ:          { backgroundColor:COLORS.primary, borderRadius:12, padding:14, ...SHADOW.md },
  captchaInput:      { width:70, height:52, borderRadius:12, borderWidth:2, borderColor:COLORS.gray200, fontSize:20, fontWeight:'800', color:COLORS.black, textAlign:'center', backgroundColor:COLORS.bgAlt },
  warnBox:           { backgroundColor:'#FFFBEB', borderRadius:12, padding:12, marginTop:10, borderWidth:1, borderColor:'#FDE68A' },
  warnTxt:           { fontSize:12, color:'#92400E', lineHeight:18 },
  submitBtn:         { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:16, alignItems:'center', marginTop:12, ...SHADOW.md },
  submitBtnDisabled: { backgroundColor:COLORS.gray200 },
  submitBtnTxt:      { color:'#fff', fontSize:15, fontWeight:'800' },
  empty:             { alignItems:'center', paddingVertical:40 },
  emptyTxt:          { fontSize:14, color:COLORS.gray400 },
  successWrap:       { flex:1, alignItems:'center', justifyContent:'center', padding:32, backgroundColor:COLORS.bgAlt },
  successIcon:       { width:96, height:96, borderRadius:48, backgroundColor:'#F0FDF4', alignItems:'center', justifyContent:'center', marginBottom:20, ...SHADOW.lg },
  successTitle:      { fontSize:26, fontWeight:'800', color:COLORS.black, textAlign:'center', marginBottom:10 },
  successSub:        { fontSize:14, color:COLORS.gray600, textAlign:'center', lineHeight:22, marginBottom:20 },
  refBox:            { backgroundColor:COLORS.primaryPale, borderRadius:14, padding:16, marginBottom:24, alignItems:'center' },
  refLabel:          { fontSize:11, color:COLORS.primary, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  refValue:          { fontSize:22, fontWeight:'900', color:COLORS.primary, fontFamily:'monospace', letterSpacing:2 },
  primaryBtn:        { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:14, paddingHorizontal:32, alignItems:'center', ...SHADOW.md },
  primaryBtnTxt:     { color:'#fff', fontSize:15, fontWeight:'800' },
})

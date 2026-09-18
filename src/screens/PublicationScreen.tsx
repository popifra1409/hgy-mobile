import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, Switch, Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'

const WP_API  = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json/wp/v2'
const WP_AUTH = 'Basic YWRtaW5IR1k6b2ZNd0w0SnV3Y2ljZXdDcFV4b2poQVNy'

type PubType = 'article' | 'emission'

const wpFetch = async (url: string, opts: any = {}) => {
  const r = await fetch(url, {
    ...opts,
    headers: { Authorization: WP_AUTH, ...opts.headers },
  })
  return r.json()
}

export default function PublicationScreen({ navigation }: any) {
  const { lang } = useLang()
  const [activeTab,  setActiveTab]  = useState<PubType>('article')
  const [articles,   setArticles]   = useState<any[]>([])
  const [emissions,  setEmissions]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading,  setUploading]  = useState(false)

  const [artForm, setArtForm] = useState({
    title: '', content: '', excerpt: '',
    featuredImageId: null as number|null,
    featuredImageUri: null as string|null,
    publish: false,
  })

  const [emiForm, setEmiForm] = useState({
    title: '', content: '',
    theme_emission: '', numero_emission: '',
    animateur_emission: '', invite_emission: '',
    duree_emission: '', date_diffusion: '',
    youtube_url: '', audio_url: '',
    featuredImageId: null as number|null,
    featuredImageUri: null as string|null,
    publish: false,
  })

  const load = async () => {
    try {
      let arts: any[] = [], emis: any[] = []
      try { const r = await wpFetch(`${WP_API}/posts?status=any&per_page=20`); arts = Array.isArray(r) ? r : [] } catch {}
      try { const r = await wpFetch(`${WP_API}/allo-hgy?status=any&per_page=20`); emis = Array.isArray(r) ? r : [] } catch {}
      setArticles(arts); setEmissions(emis)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const pickImage = async (type: PubType) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    })
    if (result.canceled) return
    const uri = result.assets[0].uri
    setUploading(true)
    try {
      // Upload image vers WP Media
      const filename = uri.split('/').pop() || 'image.jpg'
      const formData = new FormData()
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any)
      const r = await fetch(`${WP_API}/media`, {
        method: 'POST',
        headers: { Authorization: WP_AUTH, 'Content-Disposition': `attachment; filename="${filename}"` },
        body: formData,
      })
      const d = await r.json()
      if (d.id) {
        if (type === 'article') setArtForm(p => ({ ...p, featuredImageId: d.id, featuredImageUri: uri }))
        else setEmiForm(p => ({ ...p, featuredImageId: d.id, featuredImageUri: uri }))
        Alert.alert('✅', lang==='fr'?'Image uploadée !':'Image uploaded!')
      } else Alert.alert('Erreur', d.message || 'Upload échoué.')
    } catch(e) { Alert.alert('Erreur', 'Impossible d\'uploader l\'image.') }
    finally { setUploading(false) }
  }

  const publishArticle = async () => {
    if (!artForm.title.trim() || !artForm.content.trim()) {
      Alert.alert('Erreur', lang==='fr'?'Titre et contenu requis.':'Title and content required.')
      return
    }
    setSubmitting(true)
    try {
      const body: any = {
        title: artForm.title, content: artForm.content,
        excerpt: artForm.excerpt, status: artForm.publish ? 'publish' : 'draft',
      }
      if (artForm.featuredImageId) body.featured_media = artForm.featuredImageId
      const d = await wpFetch(`${WP_API}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (d.id) {
        Alert.alert('✅', artForm.publish ? 'Article publié !' : 'Brouillon sauvegardé.')
        setShowModal(false)
        setArtForm({ title:'', content:'', excerpt:'', featuredImageId:null, featuredImageUri:null, publish:false })
        load()
      } else Alert.alert('Erreur', d.message || 'Erreur WordPress.')
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
    finally { setSubmitting(false) }
  }

  const publishEmission = async () => {
    if (!emiForm.title.trim()) {
      Alert.alert('Erreur', lang==='fr'?'Le titre est requis.':'Title is required.')
      return
    }
    setSubmitting(true)
    try {
      const body: any = {
        title: emiForm.title,
        content: emiForm.content,
        status: emiForm.publish ? 'publish' : 'draft',
        theme_emission:     emiForm.theme_emission,
        numero_emission:    emiForm.numero_emission,
        animateur_emission: emiForm.animateur_emission,
        invite_emission:    emiForm.invite_emission,
        duree_emission:     emiForm.duree_emission,
        date_diffusion:     emiForm.date_diffusion,
        youtube_url:        emiForm.youtube_url,
        audio_url:          emiForm.audio_url,
      }
      if (emiForm.featuredImageId) body.featured_media = emiForm.featuredImageId
      const d = await wpFetch(`${WP_API}/allo-hgy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (d.id) {
        Alert.alert('✅', emiForm.publish ? 'Émission publiée !' : 'Brouillon sauvegardé.')
        setShowModal(false)
        setEmiForm({ title:'', content:'', theme_emission:'', numero_emission:'', animateur_emission:'', invite_emission:'', duree_emission:'', date_diffusion:'', youtube_url:'', audio_url:'', featuredImageId:null, featuredImageUri:null, publish:false })
        load()
      } else Alert.alert('Erreur', d.message || 'Erreur WordPress.')
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
    finally { setSubmitting(false) }
  }

  const toggleStatus = async (item: any, type: PubType) => {
    const endpoint = type === 'article' ? 'posts' : 'allo-hgy'
    const newStatus = item.status === 'publish' ? 'draft' : 'publish'
    await wpFetch(`${WP_API}/${endpoint}/${item.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    load()
  }

  const getTitle = (item: any) =>
    typeof item.title === 'object' ? item.title?.rendered : (item.title || '—')

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize:20, color:'#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📝 {lang==='fr'?'Publications WP':'WP Publications'}</Text>
        <View style={{ width:36 }} />
      </View>

      <View style={s.tabs}>
        {[
          { id:'article', label:`📰 Articles (${articles.length})` },
          { id:'emission', label:`🎙️ Allo HGY (${emissions.length})` },
        ].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, activeTab===t.id && s.tabActive]}
            onPress={() => setActiveTab(t.id as PubType)}>
            <Text style={[s.tabTxt, activeTab===t.id && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.newBtn} onPress={() => setShowModal(true)}>
        <Text style={s.newBtnTxt}>
          ➕ {activeTab==='article' ? (lang==='fr'?'Nouvel article':'New article') : (lang==='fr'?'Nouvelle émission':'New episode')}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:100 }}>
          {(activeTab==='article' ? articles : emissions).map((item:any, i:number) => (
            <View key={i} style={s.card}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                <View style={{ flex:1, marginRight:10 }}>
                  <Text style={s.cardTitle} numberOfLines={2}>{getTitle(item)}</Text>
                  <Text style={s.cardDate}>{formatDate(item.date)}</Text>
                  {activeTab==='emission' && item.animateur_emission && (
                    <Text style={s.cardMeta}>🎙️ {item.animateur_emission}</Text>
                  )}
                  {activeTab==='emission' && item.theme_emission && (
                    <Text style={s.cardMeta}>📌 {item.theme_emission}</Text>
                  )}
                </View>
                <View style={[s.statusBadge, { backgroundColor: item.status==='publish' ? '#F0FDF4':'#FFFBEB' }]}>
                  <Text style={[s.statusTxt, { color: item.status==='publish' ? '#059669':'#D97706' }]}>
                    {item.status==='publish' ? '🌐' : '📝'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[s.actionBtn, {
                backgroundColor: item.status==='publish' ? '#FFFBEB':'#F0FDF4',
                marginTop:10
              }]} onPress={() => toggleStatus(item, activeTab)}>
                <Text style={[s.actionBtnTxt, { color: item.status==='publish' ? '#D97706':'#059669' }]}>
                  {item.status==='publish' ? '📝 Dépublier' : '🌐 Publier'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Modal Nouveau contenu ── */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={s.backBtn}>
              <Text style={{ fontSize:20, color:'#fff' }}>✕</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>
              {activeTab==='article' ? '📰 Nouvel article' : '🎙️ Nouvelle émission'}
            </Text>
            <View style={{ width:36 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }} keyboardShouldPersistTaps="handled">

            {/* Image de mise en avant */}
            <Text style={s.sectionTitle}>🖼️ {lang==='fr'?'Image de mise en avant':'Featured image'}</Text>
            <TouchableOpacity style={s.imagePicker}
              onPress={() => pickImage(activeTab)} disabled={uploading}>
              {(activeTab==='article' ? artForm.featuredImageUri : emiForm.featuredImageUri) ? (
                <Image source={{ uri: activeTab==='article' ? artForm.featuredImageUri! : emiForm.featuredImageUri! }}
                  style={{ width:'100%', height:160, borderRadius:10 }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems:'center', padding:20 }}>
                  {uploading ? <ActivityIndicator color={COLORS.primary} /> : (
                    <>
                      <Text style={{ fontSize:32 }}>📷</Text>
                      <Text style={{ color:COLORS.gray400, fontSize:13, marginTop:6 }}>
                        {lang==='fr'?'Appuyer pour choisir une image':'Tap to select image'}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {activeTab === 'article' && (
              <>
                <Text style={s.sectionTitle}>📝 {lang==='fr'?'Contenu':'Content'}</Text>
                <Field label="Titre *" value={artForm.title} onChange={(v: string) => setArtForm(p=>({...p,title:v}))} placeholder="Titre de l'article" />
                <Field label="Résumé" value={artForm.excerpt} onChange={(v: string) => setArtForm(p=>({...p,excerpt:v}))} placeholder="Résumé court..." multiline height={70} />
                <Field label="Contenu *" value={artForm.content} onChange={(v: string) => setArtForm(p=>({...p,content:v}))}
                  placeholder="Contenu de l'article... (HTML supporté)" multiline height={200} />
                <PublishSwitch value={artForm.publish} onChange={(v: boolean) => setArtForm(p=>({...p,publish:v}))} lang={lang} />
                <SubmitBtn onPress={publishArticle} loading={submitting} publish={artForm.publish} lang={lang} />
              </>
            )}

            {activeTab === 'emission' && (
              <>
                <Text style={s.sectionTitle}>🎙️ {lang==='fr'?'Informations émission':'Episode info'}</Text>
                <Field label="Titre *" value={emiForm.title} onChange={(v: string) => setEmiForm(p=>({...p,title:v}))} placeholder="Titre de l'émission" />
                <View style={{ flexDirection:'row', gap:10 }}>
                  <View style={{ flex:1 }}>
                    <Field label="N° Émission" value={emiForm.numero_emission} onChange={(v: string) => setEmiForm(p=>({...p,numero_emission:v}))} placeholder="Ex: 045" />
                  </View>
                  <View style={{ flex:1 }}>
                    <Field label="Durée (min)" value={emiForm.duree_emission} onChange={(v: string) => setEmiForm(p=>({...p,duree_emission:v}))} placeholder="30" keyboardType="numeric" />
                  </View>
                </View>
                <Field label="Thème" value={emiForm.theme_emission} onChange={(v: string) => setEmiForm(p=>({...p,theme_emission:v}))} placeholder="Thème de l'émission" />
                <Field label="Animateur(s)" value={emiForm.animateur_emission} onChange={(v: string) => setEmiForm(p=>({...p,animateur_emission:v}))} placeholder="Frédéric MOUTOME" />
                <Field label="Invité(e)" value={emiForm.invite_emission} onChange={(v: string) => setEmiForm(p=>({...p,invite_emission:v}))} placeholder="Dr Louise EJAKE" />
                <Field label="Date de diffusion" value={emiForm.date_diffusion} onChange={(v: string) => setEmiForm(p=>({...p,date_diffusion:v}))} placeholder="YYYY-MM-DD" />

                <Text style={s.sectionTitle}>🔗 {lang==='fr'?'Médias':'Media'}</Text>
                <Field label="URL YouTube" value={emiForm.youtube_url} onChange={(v: string) => setEmiForm(p=>({...p,youtube_url:v}))} placeholder="https://youtube.com/watch?v=..." />
                <Field label="URL Audio" value={emiForm.audio_url} onChange={(v: string) => setEmiForm(p=>({...p,audio_url:v}))} placeholder="https://..." />

                <Text style={s.sectionTitle}>📄 {lang==='fr'?'Description':'Description'}</Text>
                <Field label="Description" value={emiForm.content} onChange={(v: string) => setEmiForm(p=>({...p,content:v}))} placeholder="Description de l'émission..." multiline height={120} />

                <PublishSwitch value={emiForm.publish} onChange={(v: boolean) => setEmiForm(p=>({...p,publish:v}))} lang={lang} />
                <SubmitBtn onPress={publishEmission} loading={submitting} publish={emiForm.publish} lang={lang} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function Field({ label, value, onChange, placeholder, multiline=false, height=48, keyboardType='default' }: any) {
  return (
    <View style={{ marginBottom:12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={[s.input, multiline && { height, textAlignVertical:'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={COLORS.gray400} multiline={multiline}
        keyboardType={keyboardType} />
    </View>
  )
}

function PublishSwitch({ value, onChange, lang }: any) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16, padding:14, backgroundColor:COLORS.bgAlt, borderRadius:12 }}>
      <View>
        <Text style={s.label}>{lang==='fr'?'Publier maintenant':'Publish now'}</Text>
        <Text style={{ fontSize:11, color:COLORS.gray400 }}>{lang==='fr'?'Sinon brouillon':'Otherwise draft'}</Text>
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ false:COLORS.gray200, true:COLORS.primary }} thumbColor="#fff" />
    </View>
  )
}

function SubmitBtn({ onPress, loading, publish, lang }: any) {
  return (
    <TouchableOpacity style={[s.submitBtn, loading && { opacity:0.6 }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> :
        <Text style={s.submitBtnTxt}>{publish ? '🌐 Publier' : '💾 Sauvegarder brouillon'}</Text>
      }
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bgAlt },
  center:       { flex:1, alignItems:'center', justifyContent:'center' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  backBtn:      { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle:  { fontSize:15, fontWeight:'700', color:'#fff', flex:1, textAlign:'center' },
  tabs:         { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  tab:          { flex:1, paddingVertical:13, alignItems:'center' },
  tabActive:    { borderBottomWidth:2, borderBottomColor:COLORS.primary },
  tabTxt:       { fontSize:12, color:COLORS.gray400, fontWeight:'600' },
  tabTxtActive: { color:COLORS.primary, fontWeight:'800' },
  newBtn:       { backgroundColor:COLORS.primary, margin:12, borderRadius:12, paddingVertical:12, alignItems:'center' },
  newBtnTxt:    { color:'#fff', fontSize:14, fontWeight:'800' },
  card:         { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, ...SHADOW.sm },
  cardTitle:    { fontSize:14, fontWeight:'700', color:COLORS.black, marginBottom:3 },
  cardDate:     { fontSize:11, color:COLORS.gray400 },
  cardMeta:     { fontSize:11, color:COLORS.gray600, marginTop:2 },
  statusBadge:  { borderRadius:99, paddingHorizontal:10, paddingVertical:4 },
  statusTxt:    { fontSize:13, fontWeight:'700' },
  actionBtn:    { borderRadius:10, paddingVertical:8, paddingHorizontal:14, borderWidth:1, borderColor:COLORS.gray200, alignItems:'center' },
  actionBtnTxt: { fontSize:12, fontWeight:'700' },
  sectionTitle: { fontSize:14, fontWeight:'800', color:COLORS.black, marginBottom:12, marginTop:8 },
  imagePicker:  { backgroundColor:COLORS.bgAlt, borderRadius:12, borderWidth:1.5, borderColor:COLORS.gray200, borderStyle:'dashed', marginBottom:16, overflow:'hidden', minHeight:80 },
  label:        { fontSize:11, fontWeight:'700', color:COLORS.black, marginBottom:6, textTransform:'uppercase' as any },
  input:        { backgroundColor:COLORS.bgAlt, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, paddingHorizontal:14, paddingVertical:11, fontSize:14, color:COLORS.black },
  submitBtn:    { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:15, alignItems:'center', marginTop:8 },
  submitBtnTxt: { color:'#fff', fontSize:15, fontWeight:'800' },
})

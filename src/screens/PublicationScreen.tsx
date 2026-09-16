import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, Switch
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { useStaffAuth } from '../context/StaffAuthContext'
import { COLORS, SHADOW, RADIUS } from '../constants/theme'
import { wpService } from '../services/api'

type PubType = 'article' | 'emission'

export default function PublicationScreen({ navigation }: any) {
  const { lang } = useLang()
  const { isAuthenticated } = useStaffAuth()
  const [activeTab,  setActiveTab]  = useState<PubType>('article')
  const [articles,   setArticles]   = useState<any[]>([])
  const [emissions,  setEmissions]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Formulaire article
  const [artForm, setArtForm] = useState({
    title: '', content: '', excerpt: '', publish: false
  })

  // Formulaire émission
  const [emiForm, setEmiForm] = useState({
    title: '', content: '', animateur: '', invite: '',
    theme: '', date_diffusion: '', duree: '', publish: false
  })

  const load = async () => {
    try {
      const [arts, emis] = await Promise.all([
        wpService.getArticles('any'),
        wpService.getEmissions('any'),
      ])
      setArticles(Array.isArray(arts) ? arts : [])
      setEmissions(Array.isArray(emis) ? emis : [])
    } catch (e) { console.log('WP load error:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const publishArticle = async () => {
    if (!artForm.title.trim() || !artForm.content.trim()) {
      Alert.alert('Erreur', lang==='fr'?'Titre et contenu requis.':'Title and content required.')
      return
    }
    setSubmitting(true)
    try {
      const d = await wpService.createArticle({
        title:   artForm.title,
        content: artForm.content,
        excerpt: artForm.excerpt,
        status:  artForm.publish ? 'publish' : 'draft',
      })
      if (d.id) {
        Alert.alert('✅', artForm.publish
          ? (lang==='fr'?'Article publié sur le site !':'Article published!')
          : (lang==='fr'?'Article sauvegardé en brouillon.':'Saved as draft.')
        )
        setShowModal(false)
        setArtForm({ title:'', content:'', excerpt:'', publish:false })
        load()
      } else {
        Alert.alert('Erreur', d.message || 'Erreur WordPress.')
      }
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
      const d = await wpService.createEmission({
        title:          emiForm.title,
        content:        emiForm.content,
        animateur:      emiForm.animateur,
        invite:         emiForm.invite,
        theme:          emiForm.theme,
        date_diffusion: emiForm.date_diffusion,
        duree:          emiForm.duree,
        status:         emiForm.publish ? 'publish' : 'draft',
      })
      if (d.id) {
        Alert.alert('✅', emiForm.publish
          ? (lang==='fr'?'Émission publiée sur le site !':'Episode published!')
          : (lang==='fr'?'Émission sauvegardée en brouillon.':'Saved as draft.')
        )
        setShowModal(false)
        setEmiForm({ title:'', content:'', animateur:'', invite:'', theme:'', date_diffusion:'', duree:'', publish:false })
        load()
      } else {
        Alert.alert('Erreur', d.message || 'Erreur WordPress.')
      }
    } catch { Alert.alert('Erreur', 'Erreur réseau.') }
    finally { setSubmitting(false) }
  }

  const toggleStatus = async (item: any, type: PubType) => {
    const newStatus = item.status === 'publish' ? 'draft' : 'publish'
    try {
      await wpService.updateArticle(item.id, { status: newStatus })
      load()
    } catch { Alert.alert('Erreur', 'Impossible de modifier le statut.') }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB')

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize:20, color:'#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📝 {lang==='fr'?'Publications':'Publications'}</Text>
        <View style={{ width:36 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, activeTab==='article' && s.tabActive]}
          onPress={() => setActiveTab('article')}>
          <Text style={[s.tabTxt, activeTab==='article' && s.tabTxtActive]}>
            📰 {lang==='fr'?'Articles':'Articles'} ({articles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab==='emission' && s.tabActive]}
          onPress={() => setActiveTab('emission')}>
          <Text style={[s.tabTxt, activeTab==='emission' && s.tabTxtActive]}>
            🎙️ Allo HGY ({emissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bouton nouveau */}
      <TouchableOpacity style={s.newBtn} onPress={() => setShowModal(true)}>
        <Text style={s.newBtnTxt}>
          ➕ {activeTab==='article'
            ? (lang==='fr'?'Nouvel article':'New article')
            : (lang==='fr'?'Nouvelle émission':'New episode')
          }
        </Text>
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:100 }}>
          {activeTab === 'article' && (
            articles.length === 0 ? (
              <View style={s.empty}><Text style={{ fontSize:40 }}>📰</Text>
                <Text style={s.emptyTxt}>{lang==='fr'?'Aucun article.':'No articles.'}</Text>
              </View>
            ) : articles.map((a:any, i:number) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <View style={{ flex:1, marginRight:10 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>
                      {a.title?.rendered || a.title}
                    </Text>
                    <Text style={s.cardDate}>{a.date ? formatDate(a.date) : '—'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: a.status==='publish' ? '#F0FDF4' : '#FFFBEB' }]}>
                    <Text style={[s.statusTxt, { color: a.status==='publish' ? '#059669' : '#D97706' }]}>
                      {a.status==='publish' ? '🌐 Publié' : '📝 Brouillon'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: a.status==='publish' ? '#FFFBEB' : '#F0FDF4' }]}
                    onPress={() => toggleStatus(a, 'article')}>
                    <Text style={[s.actionBtnTxt, { color: a.status==='publish' ? '#D97706' : '#059669' }]}>
                      {a.status==='publish' ? '📝 Dépublier' : '🌐 Publier'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {activeTab === 'emission' && (
            emissions.length === 0 ? (
              <View style={s.empty}><Text style={{ fontSize:40 }}>🎙️</Text>
                <Text style={s.emptyTxt}>{lang==='fr'?'Aucune émission.':'No episodes.'}</Text>
              </View>
            ) : emissions.map((e:any, i:number) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <View style={{ flex:1, marginRight:10 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>
                      {e.title?.rendered || e.title}
                    </Text>
                    <Text style={s.cardDate}>{e.date ? formatDate(e.date) : '—'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: e.status==='publish' ? '#F0FDF4' : '#FFFBEB' }]}>
                    <Text style={[s.statusTxt, { color: e.status==='publish' ? '#059669' : '#D97706' }]}>
                      {e.status==='publish' ? '🌐 Publié' : '📝 Brouillon'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: e.status==='publish' ? '#FFFBEB' : '#F0FDF4' }]}
                    onPress={() => toggleStatus(e, 'emission')}>
                    <Text style={[s.actionBtnTxt, { color: e.status==='publish' ? '#D97706' : '#059669' }]}>
                      {e.status==='publish' ? '📝 Dépublier' : '🌐 Publier'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal Nouveau contenu */}
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

            {activeTab === 'article' && (
              <>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Titre *':'Title *'}</Text>
                  <TextInput style={s.input} value={artForm.title}
                    onChangeText={v => setArtForm(p => ({ ...p, title:v }))}
                    placeholder={lang==='fr'?'Titre de l\'article…':'Article title…'}
                    placeholderTextColor={COLORS.gray400} />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Résumé':'Excerpt'}</Text>
                  <TextInput style={[s.input, { height:70 }]} value={artForm.excerpt}
                    onChangeText={v => setArtForm(p => ({ ...p, excerpt:v }))}
                    placeholder={lang==='fr'?'Résumé de l\'article…':'Article summary…'}
                    placeholderTextColor={COLORS.gray400} multiline />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Contenu *':'Content *'}</Text>
                  <TextInput style={[s.input, { height:200 }]} value={artForm.content}
                    onChangeText={v => setArtForm(p => ({ ...p, content:v }))}
                    placeholder={lang==='fr'?'Contenu de l\'article…':'Article content…'}
                    placeholderTextColor={COLORS.gray400} multiline textAlignVertical="top" />
                </View>
                <View style={[s.field, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
                  <View>
                    <Text style={s.label}>{lang==='fr'?'Publier maintenant':'Publish now'}</Text>
                    <Text style={{ fontSize:11, color:COLORS.gray400 }}>
                      {lang==='fr'?'Sinon sauvegardé en brouillon':'Otherwise saved as draft'}
                    </Text>
                  </View>
                  <Switch value={artForm.publish}
                    onValueChange={v => setArtForm(p => ({ ...p, publish:v }))}
                    trackColor={{ false:COLORS.gray200, true:COLORS.primary }} thumbColor="#fff" />
                </View>
                <TouchableOpacity style={[s.submitBtn, submitting && { opacity:0.6 }]}
                  onPress={publishArticle} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> :
                    <Text style={s.submitBtnTxt}>
                      {artForm.publish ? '🌐 Publier' : '💾 Sauvegarder brouillon'}
                    </Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {activeTab === 'emission' && (
              <>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Titre *':'Title *'}</Text>
                  <TextInput style={s.input} value={emiForm.title}
                    onChangeText={v => setEmiForm(p => ({ ...p, title:v }))}
                    placeholder={lang==='fr'?'Titre de l\'émission…':'Episode title…'}
                    placeholderTextColor={COLORS.gray400} />
                </View>
                <View style={{ flexDirection:'row', gap:10 }}>
                  <View style={[s.field, { flex:1 }]}>
                    <Text style={s.label}>{lang==='fr'?'Animateur(s)':'Host(s)'}</Text>
                    <TextInput style={s.input} value={emiForm.animateur}
                      onChangeText={v => setEmiForm(p => ({ ...p, animateur:v }))}
                      placeholder="Frédéric MOUTOME…" placeholderTextColor={COLORS.gray400} />
                  </View>
                  <View style={[s.field, { flex:1 }]}>
                    <Text style={s.label}>{lang==='fr'?'Durée (min)':'Duration (min)'}</Text>
                    <TextInput style={s.input} value={emiForm.duree}
                      onChangeText={v => setEmiForm(p => ({ ...p, duree:v }))}
                      placeholder="30" placeholderTextColor={COLORS.gray400} keyboardType="numeric" />
                  </View>
                </View>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Invité(e)':'Guest'}</Text>
                  <TextInput style={s.input} value={emiForm.invite}
                    onChangeText={v => setEmiForm(p => ({ ...p, invite:v }))}
                    placeholder="Dr Louise EJAKE…" placeholderTextColor={COLORS.gray400} />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Thème':'Theme'}</Text>
                  <TextInput style={s.input} value={emiForm.theme}
                    onChangeText={v => setEmiForm(p => ({ ...p, theme:v }))}
                    placeholder={lang==='fr'?'Thème de l\'émission…':'Episode theme…'}
                    placeholderTextColor={COLORS.gray400} />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Date de diffusion':'Broadcast date'}</Text>
                  <TextInput style={s.input} value={emiForm.date_diffusion}
                    onChangeText={v => setEmiForm(p => ({ ...p, date_diffusion:v }))}
                    placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.gray400} />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>{lang==='fr'?'Description':'Description'}</Text>
                  <TextInput style={[s.input, { height:100 }]} value={emiForm.content}
                    onChangeText={v => setEmiForm(p => ({ ...p, content:v }))}
                    placeholder={lang==='fr'?'Description de l\'émission…':'Episode description…'}
                    placeholderTextColor={COLORS.gray400} multiline textAlignVertical="top" />
                </View>
                <View style={[s.field, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
                  <View>
                    <Text style={s.label}>{lang==='fr'?'Publier maintenant':'Publish now'}</Text>
                    <Text style={{ fontSize:11, color:COLORS.gray400 }}>
                      {lang==='fr'?'Sinon sauvegardé en brouillon':'Otherwise saved as draft'}
                    </Text>
                  </View>
                  <Switch value={emiForm.publish}
                    onValueChange={v => setEmiForm(p => ({ ...p, publish:v }))}
                    trackColor={{ false:COLORS.gray200, true:COLORS.primary }} thumbColor="#fff" />
                </View>
                <TouchableOpacity style={[s.submitBtn, submitting && { opacity:0.6 }]}
                  onPress={publishEmission} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> :
                    <Text style={s.submitBtnTxt}>
                      {emiForm.publish ? '🌐 Publier' : '💾 Sauvegarder brouillon'}
                    </Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bgAlt },
  center:       { flex:1, alignItems:'center', justifyContent:'center' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  backBtn:      { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle:  { fontSize:16, fontWeight:'700', color:'#fff' },
  tabs:         { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  tab:          { flex:1, paddingVertical:13, alignItems:'center' },
  tabActive:    { borderBottomWidth:2, borderBottomColor:COLORS.primary },
  tabTxt:       { fontSize:12, color:COLORS.gray400, fontWeight:'600' },
  tabTxtActive: { color:COLORS.primary, fontWeight:'800' },
  newBtn:       { backgroundColor:COLORS.primary, margin:12, borderRadius:12, paddingVertical:12, alignItems:'center' },
  newBtnTxt:    { color:'#fff', fontSize:14, fontWeight:'800' },
  card:         { backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, ...SHADOW.sm },
  cardTitle:    { fontSize:14, fontWeight:'700', color:COLORS.black, marginBottom:4 },
  cardDate:     { fontSize:11, color:COLORS.gray400 },
  statusBadge:  { borderRadius:99, paddingHorizontal:10, paddingVertical:4, alignSelf:'flex-start' },
  statusTxt:    { fontSize:11, fontWeight:'700' },
  actionBtn:    { borderRadius:10, paddingVertical:8, paddingHorizontal:14, borderWidth:1, borderColor:COLORS.gray200 },
  actionBtnTxt: { fontSize:12, fontWeight:'700' },
  empty:        { alignItems:'center', paddingVertical:40, gap:10 },
  emptyTxt:     { fontSize:14, color:COLORS.gray400 },
  field:        { marginBottom:14 },
  label:        { fontSize:12, fontWeight:'700', color:COLORS.black, marginBottom:6 },
  input:        { backgroundColor:COLORS.bgAlt, borderRadius:RADIUS.md, borderWidth:1.5, borderColor:COLORS.gray200, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:COLORS.black },
  submitBtn:    { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:15, alignItems:'center', ...SHADOW.md },
  submitBtnTxt: { color:'#fff', fontSize:15, fontWeight:'800' },
})

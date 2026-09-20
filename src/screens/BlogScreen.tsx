import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { blogService, interviewService } from '../services/api'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'

export default function BlogScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const initTab = route.params?.tab === 'allo-hgy' ? 'emissions' : route.params?.tab === 'interviews' ? 'interviews' : 'articles'
  const [activeTab, setActiveTab] = useState<'articles'|'emissions'|'interviews'>(initTab)
  const [articles,  setArticles]  = useState<any[]>([])
  const [emissions,  setEmissions]  = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)

  const load = async () => {
    try {
      const [art, emi, interv] = await Promise.all([
        blogService.getArticles(lang, 20),
        blogService.getEmissions(lang, 20),
        interviewService.getAll(lang, 20),
      ])
      setArticles(art.data?.data || [])
      setEmissions(emi.data?.data || [])
      setInterviews(Array.isArray(interv.data?.data) ? interv.data.data : [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [lang])

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize:20, color:'#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📰 {lang==='fr' ? 'Actualités HGY' : 'HGY News'}</Text>
        <View style={{ width:36 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, activeTab==='articles' && s.tabActive]}
          onPress={() => setActiveTab('articles')}>
          <Text style={[s.tabTxt, activeTab==='articles' && s.tabTxtActive]}>
            📰 {lang==='fr' ? 'Articles' : 'Articles'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab==='emissions' && s.tabActive]}
          onPress={() => setActiveTab('emissions')}>
          <Text style={[s.tabTxt, activeTab==='emissions' && s.tabTxtActive]}>
            🎙️ Allo HGY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab==='interviews' && s.tabActive]}
          onPress={() => setActiveTab('interviews')}>
          <Text style={[s.tabTxt, activeTab==='interviews' && s.tabTxtActive]}>
            🎤 {lang==='fr'?'Interviews':'Interviews'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding:16, paddingBottom:40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}>

          {activeTab === 'articles' && (
            articles.length === 0 ? (
              <View style={s.empty}><Text style={{ fontSize:40 }}>📰</Text><Text style={s.emptyTxt}>{lang==='fr'?'Aucun article.':'No articles.'}</Text></View>
            ) : articles.map((a:any, i:number) => (
              <TouchableOpacity key={i} style={s.card}
                onPress={() => navigation.navigate('Article', { slug: a.slug })}>
                <View style={s.cardLeft}>
                  <View style={s.icon}><Text style={{ fontSize:22 }}>📰</Text></View>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.cardTitle} numberOfLines={2}>{a.title}</Text>
                  {a.excerpt && <Text style={s.cardExcerpt} numberOfLines={2}>{a.excerpt?.replace(/<[^>]*>/g,'')}</Text>}
                  {a.date && <Text style={s.cardDate}>📅 {new Date(a.date).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB')}</Text>}
                </View>
                <Text style={{ color:COLORS.gray400, fontSize:18 }}>›</Text>
              </TouchableOpacity>
            ))
          )}

          {activeTab === 'emissions' && (
            emissions.length === 0 ? (
              <View style={s.empty}><Text style={{ fontSize:40 }}>🎙️</Text><Text style={s.emptyTxt}>{lang==='fr'?'Aucune émission.':'No episodes.'}</Text></View>
            ) : emissions.map((e:any, i:number) => (
              <TouchableOpacity key={i} style={s.card}
                onPress={() => navigation.navigate('Emission', { id: e.id })}>
                <View style={s.cardLeft}>
                  <View style={[s.icon, { backgroundColor:'#F5F3FF' }]}><Text style={{ fontSize:22 }}>🎙️</Text></View>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.cardTitle} numberOfLines={2}>{e.title}</Text>
                  {e.animateur && <Text style={s.cardExcerpt} numberOfLines={1}>🎤 {e.animateur}</Text>}
                  {e.invite && <Text style={s.cardExcerpt} numberOfLines={1}>👤 {e.invite}</Text>}
                  {e.date_diffusion && <Text style={s.cardDate}>📅 {new Date(e.date_diffusion).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB')}</Text>}
                  {e.tranche_horaire && <Text style={s.cardDate}>🕐 {e.tranche_horaire}</Text>}
                  {e.diffuseur && <Text style={s.cardDate}>📻 {e.diffuseur}</Text>}
                </View>
                <Text style={{ color:COLORS.gray400, fontSize:18 }}>›</Text>
              </TouchableOpacity>
            ))
          )}
          {activeTab === 'interviews' && (
            interviews.length === 0 ? (
              <View style={s.empty}><Text style={{ fontSize:40 }}>🎤</Text>
                <Text style={s.emptyTxt}>{lang==='fr'?'Aucune interview.':'No interviews.'}</Text>
              </View>
            ) : interviews.map((iv:any, i:number) => (
              <TouchableOpacity key={i} style={s.card}
                onPress={() => navigation.navigate('Article', { id: iv.id, type: 'interview' })}>
                <View style={{ flexDirection:'row', gap:12 }}>
                  <View style={{ flex:1 }}>
                    <View style={[s.badge, { backgroundColor:'#F5F3FF', alignSelf:'flex-start', marginBottom:6 }]}>
                      <Text style={[s.badgeTxt, { color:'#7C3AED' }]}>🎤 Interview</Text>
                    </View>
                    <Text style={s.cardTitle} numberOfLines={2}>{iv.titre}</Text>
                    {iv.interviewe && <Text style={s.cardMeta}>👤 {iv.interviewe}</Text>}
                    {iv.titre_interviewe && <Text style={s.cardMeta}>🏅 {iv.titre_interviewe}</Text>}
                    {iv.thematique_interv && <Text style={s.cardMeta}>🏷️ {iv.thematique_interv}</Text>}
                    {iv.date_interview && <Text style={s.cardDate}>{new Date(iv.date_interview).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'long',year:'numeric'})}</Text>}
                    <View style={{ flexDirection:'row', gap:8, marginTop:6 }}>
                      {iv.youtube_interview && <Text style={{ fontSize:11, color:'#DC2626' }}>▶️ YouTube</Text>}
                      {iv.audio_interview && <Text style={{ fontSize:11, color:'#7C3AED' }}>🎵 Audio</Text>}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:COLORS.bgAlt },
  center:     { flex:1, alignItems:'center', justifyContent:'center' },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.primary, paddingHorizontal:16, paddingVertical:14 },
  backBtn:    { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle:{ fontSize:16, fontWeight:'800', color:'#fff' },
  tabs:       { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  tab:        { flex:1, paddingVertical:13, alignItems:'center' },
  tabActive:  { borderBottomWidth:2, borderBottomColor:COLORS.primary },
  tabTxt:     { fontSize:13, color:COLORS.gray400, fontWeight:'600' },
  tabTxtActive:{ color:COLORS.primary, fontWeight:'800' },
  card:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, ...SHADOW.sm },
  cardLeft:   { flexShrink:0 },
  icon:       { width:48, height:48, borderRadius:12, backgroundColor:COLORS.primaryPale, alignItems:'center', justifyContent:'center' },
  cardTitle:  { fontSize:14, fontWeight:'700', color:COLORS.black, lineHeight:20, marginBottom:4 },
  cardExcerpt:{ fontSize:12, color:COLORS.gray600, lineHeight:17, marginBottom:3 },
  cardDate:   { fontSize:11, color:COLORS.gray400 },
  cardMeta:   { fontSize:12, color:COLORS.gray600, marginBottom:2 },
  badge:      { borderRadius:99, paddingHorizontal:8, paddingVertical:3 },
  badgeTxt:   { fontSize:10, fontWeight:'700' as 'bold' },
  empty:      { alignItems:'center', paddingVertical:48, gap:10 },
  emptyTxt:   { fontSize:14, color:COLORS.gray400 },
})

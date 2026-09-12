import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { blogService } from '../services/api'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'

export default function BlogScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const initTab = route.params?.tab === 'allo-hgy' ? 'emissions' : 'articles'
  const [activeTab, setActiveTab] = useState<'articles'|'emissions'>(initTab)
  const [articles,  setArticles]  = useState<any[]>([])
  const [emissions, setEmissions] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)

  const load = async () => {
    try {
      const [art, emi] = await Promise.all([
        blogService.getArticles(lang, 20),
        blogService.getEmissions(lang, 20),
      ])
      setArticles(art.data?.data || [])
      setEmissions(emi.data?.data || [])
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
  empty:      { alignItems:'center', paddingVertical:48, gap:10 },
  emptyTxt:   { fontSize:14, color:COLORS.gray400 },
})

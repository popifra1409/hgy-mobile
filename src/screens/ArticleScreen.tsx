import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'
import axios from 'axios'

const WP = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json/hgy/v1'

export default function ArticleScreen({ route, navigation }: any) {
  const { lang } = useLang()
  const slug = route.params?.slug
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setArticle(null)
    axios.get(`${WP}/articles?lang=${lang}&per_page=100`)
      .then(r => {
        const all = r.data?.data || []
        const found = all.find((a: any) => a.slug === slug || String(a.id) === String(slug))
        setArticle(found || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, lang])

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>📰 Article</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : !article ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📰</Text>
          <Text style={{ color: COLORS.gray400, marginTop: 12 }}>
            {lang === 'fr' ? 'Article introuvable.' : 'Article not found.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Image mise en avant */}
          {article.featured_image_url && (
            <Image source={{ uri: article.featured_image_url }}
              style={s.featuredImage} resizeMode="cover" />
          )}

          <View style={{ padding: 16 }}>
            <Text style={s.title}>{article.title}</Text>
            <View style={s.meta}>
              {article.date && (
                <Text style={s.metaTxt}>
                  📅 {new Date(article.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
                </Text>
              )}
              {article.author_name && <Text style={s.metaTxt}>✍️ {article.author_name}</Text>}
            </View>

            {article.excerpt && (
              <View style={s.excerptBox}>
                <Text style={s.excerptTxt}>{article.excerpt?.replace(/<[^>]*>/g, '').trim()}</Text>
              </View>
            )}

            <TouchableOpacity style={s.webBtn}
              onPress={() => Linking.openURL(article.link || `https://hopitalgeneraldeyaounde.cm/blog/article/${slug}`)}>
              <Text style={s.webBtnTxt}>
                🌐 {lang === 'fr' ? 'Lire l\'article complet' : 'Read full article'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bgAlt },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  featuredImage:{ width: '100%', height: 220 },
  title:        { fontSize: 20, fontWeight: '800', color: COLORS.black, lineHeight: 28, marginBottom: 12, marginTop: 16 },
  meta:         { flexDirection: 'row', gap: 14, marginBottom: 16, flexWrap: 'wrap' },
  metaTxt:      { fontSize: 12, color: COLORS.gray400 },
  excerptBox:   { backgroundColor: COLORS.primaryPale, borderRadius: 12, padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  excerptTxt:   { fontSize: 14, color: COLORS.primary, lineHeight: 22, fontStyle: 'italic' },
  webBtn:       { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...SHADOW.md },
  webBtnTxt:    { color: '#fff', fontSize: 14, fontWeight: '700' },
})

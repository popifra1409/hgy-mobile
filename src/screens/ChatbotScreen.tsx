import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '../context/LangContext'
import { COLORS, SHADOW } from '../constants/theme'
import axios from 'axios'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

interface Message { role: 'user' | 'assistant'; content: string }

export default function ChatbotScreen() {
  const { lang } = useLang()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const welcome = lang === 'fr'
    ? "👋 Bonjour ! Je suis l'assistant virtuel de l'Hôpital Général de Yaoundé. Comment puis-je vous aider ?"
    : "👋 Hello! I'm the virtual assistant of the Yaoundé General Hospital. How can I help you?"

  useEffect(() => {
    setMessages([{ role: 'assistant', content: welcome }])
  }, [lang])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Même format que le web
      const history = newMessages.slice(-8).map(m => ({
        role: m.role, content: m.content
      }))

      const r = await axios.post(`${API}/chatbot`, {
        messages: history,
        lang,
      })

      const reply = r.data?.reply || r.data?.message || 
        (lang === 'fr' ? 'Désolé, je n\'ai pas pu traiter votre demande.' : 'Sorry, I could not process your request.')

      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: lang === 'fr'
          ? '⚠️ Erreur réseau. Appelez le +237 6 57 60 30 39 pour de l\'aide.'
          : '⚠️ Network error. Call +237 6 57 60 30 39 for help.'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const SUGGESTIONS = lang === 'fr'
    ? ['Comment prendre un RDV ?', 'Quels sont les horaires ?', 'Urgences', 'Services disponibles']
    : ['How to book an appointment?', 'What are the hours?', 'Emergency', 'Available services']

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={{ fontSize: 22 }}>🏥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName}>Assistant HGY</Text>
          <Text style={s.headerSub}>Hôpital Général de Yaoundé</Text>
        </View>
        <View style={s.onlineDot} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Messages */}
        <ScrollView ref={scrollRef} style={s.messagesWrap}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

          {messages.map((m, i) => (
            <View key={i} style={[s.msgRow, m.role === 'user' && s.msgRowUser]}>
              {m.role === 'assistant' && (
                <View style={s.msgAvatar}><Text style={{ fontSize: 14 }}>🏥</Text></View>
              )}
              <View style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
                <Text style={[s.bubbleTxt, m.role === 'user' && { color: '#fff' }]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={s.msgRow}>
              <View style={s.msgAvatar}><Text style={{ fontSize: 14 }}>🏥</Text></View>
              <View style={s.bubbleBot}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 16, paddingVertical: 8, maxHeight: 50 }}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} style={ss.chip}
                onPress={() => { setInput(s); }}>
                <Text style={ss.chipTxt}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          ℹ️ {lang === 'fr'
            ? 'L\'assistant ne remplace pas une consultation médicale'
            : 'This assistant does not replace medical consultation'
          }
        </Text>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={lang === 'fr' ? 'Posez votre question…' : 'Ask your question…'}
            placeholderTextColor={COLORS.gray400}
            multiline
            maxLength={500}
            onSubmitEditing={send}
          />
          <TouchableOpacity style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
            onPress={send} disabled={!input.trim() || loading}>
            <Text style={{ fontSize: 20 }}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const ss = StyleSheet.create({
  chip:    { backgroundColor: COLORS.primaryPale, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  chipTxt: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
})

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.bgAlt },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12 },
  avatar:          { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' },
  headerName:      { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerSub:       { fontSize: 11, color: 'rgba(255,255,255,.7)' },
  onlineDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },
  messagesWrap:    { flex: 1, backgroundColor: '#F0F4F8' },
  msgRow:          { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgRowUser:      { flexDirection: 'row-reverse' },
  msgAvatar:       { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble:          { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleBot:       { backgroundColor: '#fff', borderBottomLeftRadius: 4, ...SHADOW.sm },
  bubbleUser:      { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTxt:       { fontSize: 14, color: COLORS.black, lineHeight: 21 },
  disclaimer:      { fontSize: 10, color: COLORS.gray400, textAlign: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.gray200 },
  input:           { flex: 1, backgroundColor: COLORS.bgAlt, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.black, maxHeight: 100, borderWidth: 1, borderColor: COLORS.gray200 },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.gray200 },
})

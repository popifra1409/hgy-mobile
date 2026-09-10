import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native'
import { chatbotService } from '../services/api'
import { useLang } from '../context/LangContext'

interface Message { role: 'user' | 'assistant'; content: string }

export default function ChatbotScreen() {
  const { lang } = useLang()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const listRef = useRef<FlatList>(null)

  const welcome = lang === 'fr'
    ? "👋 Bonjour ! Je suis NEEVA, l'assistant virtuel de l'HGY. Comment puis-je vous aider ?"
    : "👋 Hello! I'm NEEVA, HGY's virtual assistant. How can I help you?"

  useEffect(() => {
    setMessages([{ role: 'assistant', content: welcome }])
  }, [lang])

  const suggestions = lang === 'fr'
    ? ["Je cherche un cardiologue", "Quels sont vos horaires ?", "Urgence médicale", "Prendre rendez-vous"]
    : ["I need a cardiologist", "What are your hours?", "Medical emergency", "Book appointment"]

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const lastMsg = newMessages[newMessages.length - 1]?.content || ''
      const r = await chatbotService.send(lastMsg, lang)
      setMessages([...newMessages, { role: 'assistant', content: r.data?.reply || '...' }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: lang === 'fr' ? 'Erreur réseau. Appelez le +237 6 57 60 30 39.' : 'Network error. Call +237 6 57 60 30 39.' }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[s.msgRow, item.role === 'user' ? s.userRow : s.assistRow]}>
      {item.role === 'assistant' && (
        <View style={s.avatarBox}>
          <Text style={s.avatarEmoji}>🏥</Text>
        </View>
      )}
      <View style={[s.bubble, item.role === 'user' ? s.userBubble : s.assistBubble]}>
        <Text style={[s.bubbleText, item.role === 'user' ? s.userText : s.assistText]}>
          {item.content}
        </Text>
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      {/* Header NEEVA */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerAvatar}>
            <Text style={{ fontSize: 22 }}>🏥</Text>
          </View>
          <View>
            <Text style={s.headerName}>NEEVA</Text>
            <Text style={s.headerSub}>Noel Emmanuel Essomba Virtual Assistant</Text>
          </View>
        </View>
        <View style={s.onlineBtn}>
          <View style={s.onlineDot} />
          <Text style={s.onlineText}>{lang === 'fr' ? 'En ligne' : 'Online'}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={s.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={[s.msgRow, s.assistRow, { paddingHorizontal: 16 }]}>
          <View style={s.avatarBox}><Text style={s.avatarEmoji}>🏥</Text></View>
          <View style={s.assistBubble}>
            <ActivityIndicator size="small" color="#1A3D6E" />
          </View>
        </View>
      )}

      {/* Suggestions */}
      {messages.length <= 1 && (
        <View style={s.suggestions}>
          {suggestions.map((s_, i) => (
            <TouchableOpacity key={i} style={s.suggBtn} onPress={() => send(s_)}>
              <Text style={s.suggText}>{s_}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder={lang === 'fr' ? 'Posez votre question…' : 'Ask your question…'}
          placeholderTextColor="#9CA3AF"
          multiline
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity style={[s.sendBtn, { opacity: input.trim() ? 1 : 0.5 }]} onPress={() => send()}>
          <Text style={s.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.disclaimer}>
        {lang === 'fr' ? 'NEEVA ne remplace pas une consultation médicale' : 'NEEVA does not replace medical consultation'}
      </Text>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F7FBFF' },
  header:       { backgroundColor: '#1A3D6E', padding: 16, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.2)', justifyContent: 'center', alignItems: 'center' },
  headerName:   { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  headerSub:    { color: 'rgba(255,255,255,.6)', fontSize: 9, marginTop: 1 },
  onlineBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlineText:   { color: 'rgba(255,255,255,.7)', fontSize: 11 },
  messages:     { padding: 16, paddingBottom: 8 },
  msgRow:       { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userRow:      { justifyContent: 'flex-end' },
  assistRow:    { justifyContent: 'flex-start' },
  avatarBox:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A3D6E', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarEmoji:  { fontSize: 16 },
  bubble:       { maxWidth: '75%', padding: 12, borderRadius: 18 },
  userBubble:   { backgroundColor: '#1A3D6E', borderBottomRightRadius: 4 },
  assistBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText:   { fontSize: 14, lineHeight: 20 },
  userText:     { color: '#fff' },
  assistText:   { color: '#1A202C' },
  suggestions:  { flexWrap: 'wrap', flexDirection: 'row', padding: 12, gap: 8 },
  suggBtn:      { backgroundColor: '#EFF6FF', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  suggText:     { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  inputRow:     { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  input:        { flex: 1, backgroundColor: '#F7FBFF', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: 120, minHeight: 44, color: '#1A202C' },
  sendBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A3D6E', justifyContent: 'center', alignItems: 'center' },
  sendIcon:     { color: '#fff', fontSize: 18 },
  disclaimer:   { textAlign: 'center', fontSize: 10, color: '#9CA3AF', paddingBottom: 8 },
})

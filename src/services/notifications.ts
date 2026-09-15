import { Platform } from 'react-native'
import Constants from 'expo-constants'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

// Détecte si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo'

export function initNotifications() {
  if (isExpoGo) { console.log('Expo Go: notifications désactivées'); return }
  try {
    const N = require('expo-notifications')
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, shouldShowBanner: true,
        shouldShowList:  true, shouldPlaySound:  true, shouldSetBadge: true,
      }),
    })
  } catch {}
}

export async function registerForPushNotifications(patientId?: number | null): Promise<string | null> {
  if (isExpoGo) return null
  try {
    const Device = require('expo-device')
    const N      = require('expo-notifications')
    if (!Device.isDevice) return null
    const { status: ex } = await N.getPermissionsAsync()
    let final = ex
    if (ex !== 'granted') { const { status } = await N.requestPermissionsAsync(); final = status }
    if (final !== 'granted') return null
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('hgy-rdv', { name:'Rendez-vous HGY', importance: N.AndroidImportance.MAX })
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data: token } = await N.getExpoPushTokenAsync({ projectId })
    if (token && patientId) await savePushToken(token, patientId)
    return token
  } catch (e) { console.log('Push error:', e); return null }
}

export async function savePushToken(token: string, patientId: number): Promise<void> {
  try {
    await fetch(`${API}/patient/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, push_token: token, platform: Platform.OS }),
    })
  } catch {}
}

export async function scheduleRdvReminder(rdv: { id:number; medecin:string; date_heure:string; reference:string }): Promise<void> {
  if (isExpoGo) return
  try {
    const N = require('expo-notifications')
    const reminderDate = new Date(new Date(rdv.date_heure).getTime() - 86400000)
    if (reminderDate <= new Date()) return
    await N.scheduleNotificationAsync({
      content: { title:'📅 Rappel RDV — HGY', body:`RDV demain avec ${rdv.medecin}`, sound:'default' },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: reminderDate },
    })
  } catch {}
}

export async function sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
  if (isExpoGo) return
  try {
    const N = require('expo-notifications')
    await N.scheduleNotificationAsync({ content:{ title, body, data, sound:'default' }, trigger: null })
  } catch {}
}

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const API = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'

// Configure le comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
})

// Demande la permission et récupère le token Expo Push
export async function registerForPushNotifications(patientId?: number | null): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Notifications push uniquement sur appareil physique')
    return null
  }

  // Vérifie/demande la permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Permission notifications refusée')
    return null
  }

  // Canal Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hgy-rdv', {
      name: 'Rendez-vous HGY',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A3D6E',
      sound: 'default',
    })
    await Notifications.setNotificationChannelAsync('hgy-resultats', {
      name: 'Résultats médicaux',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#059669',
    })
    await Notifications.setNotificationChannelAsync('hgy-general', {
      name: 'Informations générales',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  // Récupère le token Expo Push
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const tokenData  = await Notifications.getExpoPushTokenAsync({ projectId })
  const token = tokenData.data

  // Enregistre le token sur le backend
  if (token && patientId) {
    await savePushToken(token, patientId)
  }

  return token
}

// Sauvegarde le token sur le backend Laravel
export async function savePushToken(token: string, patientId: number): Promise<void> {
  try {
    await fetch(`${API}/patient/push-token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id:  patientId,
        push_token:  token,
        platform:    Platform.OS,
      }),
    })
    console.log('Push token enregistré:', token)
  } catch (e) {
    console.warn('Erreur sauvegarde push token:', e)
  }
}

// Planifie une notification locale (rappel RDV)
export async function scheduleRdvReminder(rdv: {
  id: number
  medecin: string
  date_heure: string
  reference: string
}): Promise<void> {
  const rdvDate = new Date(rdv.date_heure)
  const reminderDate = new Date(rdvDate.getTime() - 24 * 60 * 60 * 1000) // 24h avant

  if (reminderDate <= new Date()) return // Trop tard

  await Notifications.scheduleNotificationAsync({
    content: {
      title:    '📅 Rappel RDV — HGY',
      body:     `Votre rendez-vous avec ${rdv.medecin} est demain à ${rdvDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      data:     { rdvId: rdv.id, reference: rdv.reference },
      sound:    'default',
      badge:    1,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
  })
}

// Notification locale immédiate
export async function sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
    trigger: null, // immédiat
  })
}

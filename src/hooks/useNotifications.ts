import { useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications } from '../services/notifications'
import { useAuth } from '../context/AuthContext'

export function useNotifications(navigation?: any) {
  const { patient } = useAuth()
  const [pushToken, setPushToken] = useState<string | null>(null)
  const notifListener    = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    // Enregistre pour les notifications push
    registerForPushNotifications(patient?.id ?? undefined)
      .then(token => {
        if (token) setPushToken(token)
      })

    // Écoute les notifications reçues (app ouverte)
    notifListener.current = Notifications.addNotificationReceivedListener(notif => {
      console.log('Notification reçue:', notif)
    })

    // Écoute les clics sur les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      if (navigation) {
        if (data?.rdvId) {
          navigation.navigate('MonEspaceTab')
        } else if (data?.resultatId) {
          navigation.navigate('MonEspaceTab')
        }
      }
    })

    return () => {
      Notifications.removeNotificationSubscription(notifListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [patient?.id])

  return { pushToken }
}

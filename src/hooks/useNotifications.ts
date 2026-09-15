import { useEffect, useRef, useState } from 'react'
import { registerForPushNotifications } from '../services/notifications'
import { useAuth } from '../context/AuthContext'

export function useNotifications(navigation?: any) {
  const { patient } = useAuth()
  const [pushToken, setPushToken] = useState<string | null>(null)
  const notifListener    = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    registerForPushNotifications(patient?.id ?? null)
      .then(token => { if (token) setPushToken(token) })

    try {
      const Notifications = require('expo-notifications')
      notifListener.current = Notifications.addNotificationReceivedListener((n: any) => {
        console.log('Notification reçue:', n.request.content.title)
      })
      responseListener.current = Notifications.addNotificationResponseReceivedListener((r: any) => {
        const data = r.notification.request.content.data
        if (navigation && data?.rdvId) navigation.navigate('MonEspaceTab')
      })
    } catch {}

    return () => {
      try {
        notifListener.current?.remove()
        responseListener.current?.remove()
      } catch {}
    }
  }, [patient?.id])

  return { pushToken }
}

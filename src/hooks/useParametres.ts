import { useState, useEffect } from 'react'
import { parametresService } from '../services/api'

export function useParametres() {
  const [parametres, setParametres] = useState<any>({})
  useEffect(() => {
    parametresService.get()
      .then(r => setParametres(r.data?.data || {}))
      .catch(() => {})
  }, [])
  return { parametres }
}

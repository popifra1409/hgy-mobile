import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'
const WP_URL   = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json/hgy/v1'

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 })

// Intercepteur token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('hgy_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

// ── Services ──
export const patientService = {
  login:      (telephone: string, password: string) =>
    api.post('/patient/login', { telephone, password }),
  me:         () => api.get('/patient/me'),
  historique: (telephone: string) =>
    api.get(`/patient/historique?telephone=${encodeURIComponent(telephone)}`),
  resultats:  (telephone: string) =>
    api.get(`/mes-resultats?telephone=${encodeURIComponent(telephone)}`),
}

export const rdvService = {
  creer:       (data: any) => api.post('/rendez-vous', data),
  specialites: () => api.get('/specialites'),
  medecins:    (specId: number) =>
    api.get(`/medecins?specialite_id=${specId}&avec_planning=1`),
  planning:    (medecinId: number) =>
    api.get(`/planning/medecin/${medecinId}`),
  planningJour: () => api.get('/planning/aujourd-hui'),
}

export const blogService = {
  getArticles: (lang: string, limit = 5) =>
    axios.get(`${WP_URL}/articles?per_page=${limit}&lang=${lang}`),
  getEmissions: (lang: string, limit = 5) =>
    axios.get(`${WP_URL}/allo-hgy?per_page=${limit}&lang=${lang}`),
}

export const parametresService = {
  get: () => api.get('/parametres'),
}

export const departementService = {
  getAll: () => api.get('/departements'),
}

export const chatbotService = {
  send: (message: string, lang: string) =>
    api.post('/chatbot', { message, lang }),
}

export const medecinsService = {
  getAll:     (params?: any) => api.get('/medecins', { params }),
  getById:    (id: number)   => api.get(`/medecins/${id}`),
  getPlanning:(id: number)   => api.get(`/planning/medecin/${id}`),
}

export const specialitesService = {
  getAll: () => api.get('/specialites'),
}

export default api

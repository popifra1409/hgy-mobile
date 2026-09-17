import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'
const WP_URL   = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json/hgy/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
})

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

// ── WordPress Publication ──
const WP_API  = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json/wp/v2'
const WP_AUTH = 'Basic YWRtaW5IR1k6b2ZNd0w0SnV3Y2ljZXdDcFV4b2poQVNy' // adminHGY:ofMwL4JuwcicewCpUxojhASr

export const wpService = {
  // Articles
  createArticle: (data: { title: string; content: string; excerpt?: string; status?: string }) =>
    fetch(`${WP_API}/posts`, {
      method: 'POST',
      headers: { 'Authorization': WP_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: data.title, content: data.content, excerpt: data.excerpt || '', status: data.status || 'draft' }),
    }).then(r => r.json()),

  updateArticle: (id: number, data: any) =>
    fetch(`${WP_API}/posts/${id}`, {
      method: 'POST',
      headers: { 'Authorization': WP_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getArticles: (status = 'any') =>
    fetch(`${WP_API}/posts?status=${status}&per_page=20`, {
      headers: { 'Authorization': WP_AUTH },
    }).then(r => r.json()),

  // Emissions Allo HGY
  createEmission: (data: {
    title: string; content?: string; status?: string;
    animateur?: string; invite?: string; theme?: string;
    date_diffusion?: string; duree?: string;
  }) =>
    fetch(`${WP_API}/allo-hgy`, {
      method: 'POST',
      headers: { 'Authorization': WP_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title, content: data.content || '',
        status: data.status || 'draft',
        meta: {
          animateur: data.animateur, invite: data.invite,
          theme: data.theme, date_diffusion: data.date_diffusion,
          duree: data.duree,
        }
      }),
    }).then(r => r.json()),

  getEmissions: (status = 'any') =>
    fetch(`${WP_API}/allo-hgy?status=${status}&per_page=20`, {
      headers: { 'Authorization': WP_AUTH },
    }).then(r => r.json()),

  deletePost: (id: number) =>
    fetch(`${WP_API}/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': WP_AUTH },
    }).then(r => r.json()),
}

import axios from 'axios'

const API_BASE = 'https://hopitalgeneraldeyaounde.cm/portail/public/api/v1'
const WP_BASE  = 'https://hopitalgeneraldeyaounde.cm/wpblog/wp-json'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const wpApi = axios.create({
  baseURL: WP_BASE,
  timeout: 10000,
})

// Services
export const medecinsService = {
  getAll: () => api.get('/medecins?per_page=100'),
  getById: (id: number) => api.get(`/medecins/${id}`),
}

export const specialitesService = {
  getAll: () => api.get('/specialites'),
}

export const departementsService = {
  getAll: () => api.get('/departements'),
}

export const blogService = {
  getArticles: (lang = 'fr', perPage = 6) =>
    wpApi.get(`/hgy/v1/articles?per_page=${perPage}&lang=${lang}`),
  getEmissions: (lang = 'fr', perPage = 6) =>
    wpApi.get(`/hgy/v1/allo-hgy?per_page=${perPage}&lang=${lang}`),
}

export const chatbotService = {
  send: (messages: any[], lang = 'fr') =>
    api.post('/chatbot', { messages, lang }),
}

export const rdvService = {
  create: (data: any) => api.post('/rendez-vous', data),
  getCreneaux: (medecinId: number, date: string) =>
    api.get(`/planning/creneaux?medecin_id=${medecinId}&date=${date}`),
}

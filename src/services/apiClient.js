import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout: 8000,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token')
            // El backend exige JWT para /api/** (lectura y escritura); si expira
            // o no existe, mandamos al usuario a loguearse de nuevo.
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(err)
    },
)

// El backend envuelve todo en { code, message, data }
const unwrap = (res) => res.data.data

const apiclient = {
    async getAll() {
        const res = await api.get('/api/v1/blueprints')
        return unwrap(res)
    },
    async getByAuthor(author) {
        const res = await api.get(`/api/v1/blueprints/${encodeURIComponent(author)}`)
        return unwrap(res)
    },
    async getByAuthorAndName(author, name) {
        const res = await api.get(
            `/api/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
        )
        return unwrap(res)
    },
    async create(payload) {
        const res = await api.post('/api/v1/blueprints', payload)
        return unwrap(res)
    },
}

export default apiclient
export { api }
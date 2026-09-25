import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/apiclient.js'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.access_token)
      navigate('/')
    } catch (e) {
      setError('Credenciales inválidas o servidor no disponible')
    }
  }

  return (
      <form className="card" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <div className="grid cols-2">
          <div>
            <label htmlFor="login-username">Usuario</label>
            <input
                id="login-username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="login-password">Contraseña</label>
            <input
                id="login-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        <button className="btn primary" style={{ marginTop: 12 }}>
          Ingresar
        </button>
      </form>
  )
}

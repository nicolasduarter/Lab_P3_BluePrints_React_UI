import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import NewBlueprintPage from './pages/NewBlueprintPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

function LogoutButton() {
    const navigate = useNavigate()
    const hasToken = !!localStorage.getItem('token')
    if (!hasToken) return null

    const logout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    return (
        <button className="btn" onClick={logout}>
            Cerrar sesión
        </button>
    )
}

export default function App() {
    return (
        <div className="container">
            <header>
                <h1>ECI - Laboratorio de Blueprints en React</h1>
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <NavLink to="/" end>
                        Blueprints
                    </NavLink>
                    <NavLink to="/blueprints/new">Nuevo Blueprint</NavLink>
                    <NavLink to="/login">Login</NavLink>
                    <LogoutButton />
                </nav>
            </header>
            <Routes>
                {/*
                  El backend exige JWT para TODO /api/**, incluidos los GET
                  (ver SecurityConfig: requestMatchers("/api/**").hasAnyAuthority(...)),
                  así que listar y ver blueprints también requiere sesión iniciada.
                */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <BlueprintsPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/blueprints/:author/:name"
                    element={
                        <PrivateRoute>
                            <BlueprintDetailPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/blueprints/new"
                    element={
                        <PrivateRoute>
                            <NewBlueprintPage />
                        </PrivateRoute>
                    }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </div>
    )
}

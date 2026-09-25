import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '../src/components/PrivateRoute.jsx'

function Protected() {
    return <p>Contenido protegido</p>
}
function Login() {
    return <p>Login page</p>
}

function renderWithRoute(initialPath) {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/private"
                    element={
                        <PrivateRoute>
                            <Protected />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('PrivateRoute', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('redirige a /login si no hay token', () => {
        renderWithRoute('/private')
        expect(screen.getByText(/Login page/i)).toBeInTheDocument()
    })

    it('muestra el contenido si hay token', () => {
        localStorage.setItem('token', 'abc123')
        renderWithRoute('/private')
        expect(screen.getByText(/Contenido protegido/i)).toBeInTheDocument()
    })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../src/pages/LoginPage.jsx'
import { api } from '../src/services/apiclient.js'

vi.mock('../src/services/apiclient.js', () => ({
    api: { post: vi.fn() },
}))

describe('LoginPage', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
        window.alert = vi.fn()
    })

    it('guarda el token en localStorage si el login es exitoso', async () => {
        api.post.mockResolvedValueOnce({ data: { access_token: 'abc123' } })

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>,
        )

        fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'student' } })
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'student123' } })
        fireEvent.submit(screen.getByText(/Ingresar/i))

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('abc123')
        })
    })

    it('muestra un error si las credenciales son inválidas', async () => {
        api.post.mockRejectedValueOnce(new Error('401'))

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>,
        )

        fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'bad' } })
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'bad' } })
        fireEvent.submit(screen.getByText(/Ingresar/i))

        expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument()
    })
})
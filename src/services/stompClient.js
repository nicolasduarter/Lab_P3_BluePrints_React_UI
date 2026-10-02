import { Client } from '@stomp/stompjs'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// ws://localhost:8080/ws-blueprints (deriva del mismo host de la API REST)
const STOMP_URL =
    import.meta.env.VITE_STOMP_URL || `${API_BASE.replace(/^http/, 'ws').replace(/\/$/, '')}/ws-blueprints`

export const topicOf = (author, name) => `/topic/blueprints.${author}.${name}`

/**
 * Crea un cliente STOMP autenticado con el mismo JWT de la API REST
 * (el backend lo valida en el frame CONNECT).
 */
export function createStompClient(token, { onConnect, onDisconnect, onError } = {}) {
    return new Client({
        brokerURL: STOMP_URL,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 2000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect,
        onWebSocketClose: () => onDisconnect?.(),
        onStompError: (frame) => onError?.(frame.headers.message || 'Error STOMP'),
        onWebSocketError: () => onError?.('No se pudo conectar al servidor de tiempo real'),
    })
}

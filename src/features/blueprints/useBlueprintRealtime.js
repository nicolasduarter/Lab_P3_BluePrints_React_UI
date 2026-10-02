import { useCallback, useEffect, useRef, useState } from 'react'
import { createStompClient, topicOf } from '../../services/stompClient.js'

/**
 * Conecta el plano abierto (author/name) al tiempo real.
 *
 * - tech === 'stomp': se conecta con JWT, se suscribe a /topic/blueprints.{author}.{name}
 *   y a /user/queue/errors. Cada mensaje recibido se entrega a `onUpdate`.
 * - tech === 'none' (o sin plano abierto): no hay conexión.
 *
 * Devuelve el estado de la conexión y `publishPoint`, que envía un punto a /app/draw.
 */
export default function useBlueprintRealtime({ tech, author, name, onUpdate }) {
    const [status, setStatus] = useState('disconnected') // disconnected | connecting | connected | error
    const [error, setError] = useState(null)
    const clientRef = useRef(null)
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate

    useEffect(() => {
        if (tech !== 'stomp' || !author || !name) {
            setStatus('disconnected')
            setError(null)
            return undefined
        }

        const token = localStorage.getItem('token')
        setStatus('connecting')
        setError(null)

        // Al cambiar de plano/tecnología el cliente anterior se cierra de forma asíncrona;
        // sus callbacks tardíos no deben pisar el estado del cliente nuevo.
        let active = true

        const client = createStompClient(token, {
            onConnect: () => {
                if (!active) return
                setStatus('connected')
                setError(null)
                console.info(`[RT] conectado, suscrito a ${topicOf(author, name)}`)
                client.subscribe(topicOf(author, name), (msg) => {
                    const upd = JSON.parse(msg.body)
                    console.debug('[RT] actualización recibida', upd)
                    onUpdateRef.current?.(upd)
                })
                client.subscribe('/user/queue/errors', (msg) => {
                    const { error: err } = JSON.parse(msg.body)
                    console.warn('[RT] el servidor rechazó el punto:', err)
                    setError(err)
                })
            },
            onDisconnect: () => {
                if (active) setStatus((s) => (s === 'error' ? s : 'connecting'))
            },
            onError: (msg) => {
                if (!active) return
                console.error('[RT] error:', msg)
                setStatus('error')
                setError(msg)
            },
        })
        clientRef.current = client
        client.activate()

        return () => {
            active = false
            clientRef.current = null
            client.deactivate()
            console.info('[RT] desconectado')
        }
    }, [tech, author, name])

    const publishPoint = useCallback(
        (point) => {
            const client = clientRef.current
            if (!client?.connected) return false
            client.publish({
                destination: '/app/draw',
                body: JSON.stringify({ author, name, point }),
            })
            return true
        },
        [author, name],
    )

    return { status, error, publishPoint }
}

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { fetchBlueprint, clearCurrent } from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'

export default function BlueprintDetailPage() {
    const { author, name } = useParams()
    const dispatch = useDispatch()
    const { current: bp, currentStatus, currentError } = useSelector((s) => s.blueprints)

    useEffect(() => {
        dispatch(fetchBlueprint({ author, name }))
        // Evita mostrar por un instante el blueprint anterior mientras carga el nuevo
        return () => dispatch(clearCurrent())
    }, [author, name, dispatch])

    if (currentStatus === 'loading' || currentStatus === 'idle') {
        return (
            <div className="card">
                <p>Cargando...</p>
            </div>
        )
    }

    if (currentStatus === 'failed') {
        const isUnauthorized = /401/.test(currentError || '')
        const isNotFound = /404/.test(currentError || '')
        return (
            <div className="card" style={{ borderColor: '#f87171' }}>
                <p style={{ color: '#f87171' }}>
                    {isUnauthorized && 'No autorizado: inicia sesión para ver este blueprint.'}
                    {isNotFound && `No existe el blueprint "${name}" de "${author}".`}
                    {!isUnauthorized && !isNotFound && `Error al cargar: ${currentError}`}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn" onClick={() => dispatch(fetchBlueprint({ author, name }))}>
                        Reintentar
                    </button>
                    <Link to="/" className="btn">
                        Volver a Blueprints
                    </Link>
                </div>
            </div>
        )
    }

    if (!bp) {
        // succeeded pero sin datos (defensivo, no debería pasar)
        return (
            <div className="card">
                <p>No se encontró información del blueprint.</p>
            </div>
        )
    }

    return (
        <div className="card">
            <h2 style={{ marginTop: 0 }}>{bp.name}</h2>
            <p>
                <strong>Autor:</strong> {bp.author}
            </p>
            <p>
                <strong>Puntos:</strong> {bp.points?.length || 0}
            </p>
            <BlueprintCanvas points={bp.points || []} />
        </div>
    )
}

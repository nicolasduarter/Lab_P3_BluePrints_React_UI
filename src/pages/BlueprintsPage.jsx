import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  pointAdded,
  blueprintUpdated,
} from '../features/blueprints/blueprintsSlice.js'
import useBlueprintRealtime from '../features/blueprints/useBlueprintRealtime.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'

const RT_LABELS = {
  connected: { text: 'Conectado', color: '#22c55e' },
  connecting: { text: 'Conectando...', color: '#f59e0b' },
  error: { text: 'Error', color: '#f87171' },
  disconnected: { text: 'Sin tiempo real', color: '#94a3b8' },
}

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { byAuthor, current, byAuthorStatus, byAuthorError, saveStatus, saveError, dirty } =
    useSelector((s) => s.blueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [newName, setNewName] = useState('')
  const [tech, setTech] = useState('stomp')
  const [notice, setNotice] = useState(null)
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  // ---- Tiempo real ----
  const onRealtimeUpdate = useCallback((upd) => dispatch(blueprintUpdated(upd)), [dispatch])
  const rt = useBlueprintRealtime({
    tech,
    author: current?.author,
    name: current?.name,
    onUpdate: onRealtimeUpdate,
  })

  const getBlueprints = () => {
    if (!authorInput) return
    setSelectedAuthor(authorInput)
    dispatch(fetchByAuthor(authorInput))
  }

  const retry = () => {
    if (selectedAuthor) dispatch(fetchByAuthor(selectedAuthor))
  }

  const openBlueprint = (bp) => {
    setNotice(null)
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  // ---- Acciones: Create / Save / Delete ----
  const create = async () => {
    const author = selectedAuthor || authorInput
    if (!author || !newName) {
      setNotice('Escribe un autor (y busca sus planos) y el nombre del nuevo plano.')
      return
    }
    try {
      await dispatch(createBlueprint({ author, name: newName, points: [] })).unwrap()
      setSelectedAuthor(author)
      setNewName('')
      setNotice(`Plano "${newName}" creado.`)
      dispatch(fetchByAuthor(author))
      dispatch(fetchBlueprint({ author, name: newName }))
    } catch (err) {
      setNotice(`No se pudo crear: ${err.message || 'error desconocido'}`)
    }
  }

  const save = async () => {
    if (!current) return
    try {
      await dispatch(
        updateBlueprint({ author: current.author, name: current.name, points: current.points || [] }),
      ).unwrap()
      setNotice(`Plano "${current.name}" guardado.`)
    } catch (err) {
      setNotice(`No se pudo guardar: ${err.message || 'error desconocido'}`)
    }
  }

  const remove = async () => {
    if (!current || !window.confirm(`¿Eliminar el plano "${current.name}"?`)) return
    const { name } = current
    try {
      await dispatch(deleteBlueprint({ author: current.author, name })).unwrap()
      setNotice(`Plano "${name}" eliminado.`)
    } catch (err) {
      setNotice(`No se pudo eliminar: ${err.message || 'error desconocido'}`)
    }
  }

  // ---- Dibujo por clic ----
  const onPointClick = (point) => {
    if (!current) return
    if (tech === 'stomp') {
      // El servidor guarda el punto y lo difunde a todas las pestañas del plano
      if (!rt.publishPoint(point)) setNotice('Sin conexión de tiempo real: el punto no se envió.')
    } else {
      dispatch(pointAdded(point)) // local, se guarda con Save
    }
  }

  const isUnauthorized = /401/.test(byAuthorError || '')
  const rtLabel = RT_LABELS[current && tech === 'stomp' ? rt.status : 'disconnected']

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      <section className="grid" style={{ gap: 16, alignContent: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              placeholder="Author"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <button className="btn primary" onClick={getBlueprints}>
              Get blueprints
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>

          {byAuthorStatus === 'loading' && <p>Cargando...</p>}

          {byAuthorStatus === 'failed' && !items.length && (
            <div className="card" style={{ borderColor: '#f87171', marginBottom: 12 }}>
              <p style={{ color: '#f87171', margin: 0 }}>
                {isUnauthorized
                  ? 'No autorizado: inicia sesión para ver los blueprints.'
                  : `Error al cargar: ${byAuthorError}`}
              </p>
              {!isUnauthorized && (
                <button className="btn" style={{ marginTop: 8 }} onClick={retry}>
                  Reintentar
                </button>
              )}
            </div>
          )}

          {!items.length && byAuthorStatus !== 'loading' && byAuthorStatus !== 'failed' && (
            <p>Sin resultados.</p>
          )}

          {!!items.length && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #334155' }}>
                      Blueprint name
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #334155' }}>
                      Number of points
                    </th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #334155' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => {
                    const isOpen = current?.author === bp.author && current?.name === bp.name
                    return (
                      <tr key={bp.name} style={isOpen ? { background: '#1e293b' } : undefined}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>{bp.name}</td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #1f2937' }}>
                          {bp.points?.length || 0}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                          <button className="btn" onClick={() => openBlueprint(bp)}>
                            Open
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Nuevo plano</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              placeholder="Nombre del plano"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="btn primary" onClick={create}>
              Create
            </button>
          </div>
          <p style={{ opacity: 0.7, marginBottom: 0 }}>
            Se crea vacío para el autor {selectedAuthor || authorInput || '—'} y se abre para dibujar.
          </p>
        </div>
      </section>

      <section className="card" style={{ alignSelf: 'start' }}>
        <h3 style={{ marginTop: 0 }}>
          Current blueprint: {current?.name || '—'}
          {dirty && <span style={{ color: '#f59e0b', fontSize: 14 }}> (sin guardar)</span>}
        </h3>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <label htmlFor="rt-tech">Tiempo real:</label>
          <select id="rt-tech" className="input" style={{ width: 'auto' }} value={tech} onChange={(e) => setTech(e.target.value)}>
            <option value="none">Ninguno (solo REST)</option>
            <option value="stomp">STOMP (Spring)</option>
            <option value="socketio" disabled>
              Socket.IO (no implementado)
            </option>
          </select>
          <span data-testid="rt-status" style={{ color: rtLabel.color, fontWeight: 600 }}>
            ● {rtLabel.text}
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn primary" onClick={save} disabled={!current || saveStatus === 'loading'}>
            Save/Update
          </button>
          <button className="btn" onClick={remove} disabled={!current || saveStatus === 'loading'} style={{ borderColor: '#f87171' }}>
            Delete
          </button>
        </div>

        <BlueprintCanvas points={current?.points || []} onPointClick={current ? onPointClick : undefined} />

        <p style={{ opacity: 0.7 }}>
          {!current
            ? 'Abre o crea un plano para dibujar.'
            : tech === 'stomp'
              ? 'Haz clic para agregar puntos: se guardan y se replican en vivo en las demás pestañas.'
              : 'Haz clic para agregar puntos y luego pulsa Save/Update para guardarlos.'}
        </p>
        {notice && <p style={{ color: '#93c5fd' }}>{notice}</p>}
        {(rt.error || saveError) && <p style={{ color: '#f87171' }}>{rt.error || saveError}</p>}
      </section>
    </div>
  )
}

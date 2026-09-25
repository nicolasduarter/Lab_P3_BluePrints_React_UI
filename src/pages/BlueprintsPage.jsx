import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { byAuthor, current, byAuthorStatus, byAuthorError } = useSelector((s) => s.blueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  const totalPoints = useMemo(
      () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
      [items],
  )

  const getBlueprints = () => {
    if (!authorInput) return
    setSelectedAuthor(authorInput)
    dispatch(fetchByAuthor(authorInput))
  }

  const retry = () => {
    if (selectedAuthor) dispatch(fetchByAuthor(selectedAuthor))
  }

  const openBlueprint = (bp) => {
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  const isUnauthorized = /401/.test(byAuthorError || '')

  return (
      <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
        <section className="grid" style={{ gap: 16 }}>
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

            {byAuthorStatus === 'failed' && (
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
                      <th
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            borderBottom: '1px solid #334155',
                          }}
                      >
                        Blueprint name
                      </th>
                      <th
                          style={{
                            textAlign: 'right',
                            padding: '8px',
                            borderBottom: '1px solid #334155',
                          }}
                      >
                        Number of points
                      </th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #334155' }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((bp) => (
                        <tr key={bp.name}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                            {bp.name}
                          </td>
                          <td
                              style={{
                                padding: '8px',
                                textAlign: 'right',
                                borderBottom: '1px solid #1f2937',
                              }}
                          >
                            {bp.points?.length || 0}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                            <button className="btn" onClick={() => openBlueprint(bp)}>
                              Open
                            </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
            <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
          </div>
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Current blueprint: {current?.name || '—'}</h3>
          <BlueprintCanvas points={current?.points || []} />
        </section>
      </div>
  )
}

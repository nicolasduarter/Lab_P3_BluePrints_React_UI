import { describe, it, expect } from 'vitest'
import reducer, {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  pointAdded,
  blueprintUpdated,
} from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
    expect(state.byAuthor).toEqual({})
    expect(state.current).toBeNull()
    expect(state.status).toBe('idle')
  })

  it('fetchAuthors.pending pone status en loading', () => {
    const state = reducer(undefined, { type: fetchAuthors.pending.type })
    expect(state.status).toBe('loading')
  })

  it('fetchAuthors.fulfilled guarda los autores', () => {
    const state = reducer(undefined, {
      type: fetchAuthors.fulfilled.type,
      payload: ['john', 'maria'],
    })
    expect(state.status).toBe('succeeded')
    expect(state.authors).toEqual(['john', 'maria'])
  })

  it('fetchAuthors.rejected guarda el error', () => {
    const state = reducer(undefined, {
      type: fetchAuthors.rejected.type,
      error: { message: 'boom' },
    })
    expect(state.status).toBe('failed')
    expect(state.error).toBe('boom')
  })

  it('fetchByAuthor.fulfilled guarda los items por autor', () => {
    const state = reducer(undefined, {
      type: fetchByAuthor.fulfilled.type,
      payload: { author: 'john', items: [{ name: 'house', points: [] }] },
    })
    expect(state.byAuthor.john).toEqual([{ name: 'house', points: [] }])
  })

  it('fetchBlueprint.fulfilled guarda el blueprint actual', () => {
    const bp = { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] }
    const state = reducer(undefined, {
      type: fetchBlueprint.fulfilled.type,
      payload: bp,
    })
    expect(state.current).toEqual(bp)
  })

  it('createBlueprint.fulfilled agrega el blueprint a byAuthor si ya existe la lista', () => {
    const initial = {
      authors: [],
      byAuthor: { john: [{ name: 'house', points: [] }] },
      current: null,
      status: 'idle',
      error: null,
    }
    const newBp = { author: 'john', name: 'garage', points: [] }
    const state = reducer(initial, {
      type: createBlueprint.fulfilled.type,
      payload: newBp,
    })
    expect(state.byAuthor.john).toHaveLength(2)
    expect(state.byAuthor.john[1]).toEqual(newBp)
  })

  it('pointAdded agrega el punto al plano actual y lo marca sin guardar', () => {
    const initial = reducer(undefined, {
      type: fetchBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] },
    })
    const state = reducer(initial, pointAdded({ x: 5, y: 6 }))
    expect(state.current.points).toEqual([{ x: 1, y: 1 }, { x: 5, y: 6 }])
    expect(state.dirty).toBe(true)
  })

  it('blueprintUpdated (tiempo real) reemplaza los puntos del plano actual y de la tabla', () => {
    let state = reducer(undefined, {
      type: fetchByAuthor.fulfilled.type,
      payload: { author: 'john', items: [{ author: 'john', name: 'house', points: [] }] },
    })
    state = reducer(state, {
      type: fetchBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house', points: [] },
    })
    const points = [{ x: 10, y: 10 }, { x: 20, y: 20 }]
    state = reducer(state, blueprintUpdated({ author: 'john', name: 'house', points }))
    expect(state.current.points).toEqual(points)
    expect(state.byAuthor.john[0].points).toEqual(points)
  })

  it('blueprintUpdated de otro plano no toca el plano actual', () => {
    let state = reducer(undefined, {
      type: fetchBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] },
    })
    state = reducer(state, blueprintUpdated({ author: 'john', name: 'garage', points: [] }))
    expect(state.current.points).toEqual([{ x: 1, y: 1 }])
  })

  it('updateBlueprint.fulfilled guarda los puntos y limpia dirty', () => {
    let state = reducer(undefined, {
      type: fetchBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house', points: [] },
    })
    state = reducer(state, pointAdded({ x: 3, y: 3 }))
    state = reducer(state, {
      type: updateBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house', points: [{ x: 3, y: 3 }] },
    })
    expect(state.dirty).toBe(false)
    expect(state.saveStatus).toBe('succeeded')
  })

  it('deleteBlueprint.fulfilled lo quita de la tabla y cierra el plano actual', () => {
    let state = reducer(undefined, {
      type: fetchByAuthor.fulfilled.type,
      payload: {
        author: 'john',
        items: [
          { author: 'john', name: 'house', points: [] },
          { author: 'john', name: 'garage', points: [] },
        ],
      },
    })
    state = reducer(state, {
      type: fetchBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house', points: [] },
    })
    state = reducer(state, {
      type: deleteBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house' },
    })
    expect(state.byAuthor.john.map((b) => b.name)).toEqual(['garage'])
    expect(state.current).toBeNull()
  })
})

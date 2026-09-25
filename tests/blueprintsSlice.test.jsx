import { describe, it, expect } from 'vitest'
import reducer, {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
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
})
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
    const data = await blueprintsService.getAll()
    const authors = [...new Set(data.map((bp) => bp.author))]
    return authors
})

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
    const items = await blueprintsService.getByAuthor(author)
    return { author, items }
})

export const fetchBlueprint = createAsyncThunk(
    'blueprints/fetchBlueprint',
    async ({ author, name }) => {
        const data = await blueprintsService.getByAuthorAndName(author, name)
        return data
    },
)

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
    const data = await blueprintsService.create(payload)
    return data
})

export const updateBlueprint = createAsyncThunk(
    'blueprints/updateBlueprint',
    async ({ author, name, points }) => {
        const data = await blueprintsService.update(author, name, points)
        return data
    },
)

export const deleteBlueprint = createAsyncThunk(
    'blueprints/deleteBlueprint',
    async ({ author, name }) => {
        await blueprintsService.remove(author, name)
        return { author, name }
    },
)

// Reemplaza los puntos de un plano en `current` y en la tabla del autor
function applyPoints(s, { author, name, points }) {
    if (s.current && s.current.author === author && s.current.name === name) {
        s.current.points = points
    }
    const bp = s.byAuthor[author]?.find((b) => b.name === name)
    if (bp) bp.points = points
}

const slice = createSlice({
    name: 'blueprints',
    initialState: {
        authors: [],
        byAuthor: {},
        current: null,
        // status/error generales (fetchAuthors) - se mantienen por compatibilidad
        status: 'idle',
        error: null,
        // estados dedicados para no perder feedback en cada operación
        byAuthorStatus: 'idle',
        byAuthorError: null,
        currentStatus: 'idle',
        currentError: null,
        createStatus: 'idle',
        createError: null,
        // Save/Update y Delete
        saveStatus: 'idle',
        saveError: null,
        // hay puntos dibujados localmente que aún no se guardaron (modo sin tiempo real)
        dirty: false,
    },
    reducers: {
        clearCurrent(s) {
            s.current = null
            s.currentStatus = 'idle'
            s.currentError = null
            s.dirty = false
        },
        // Clic en el canvas sin tiempo real: el punto queda local hasta Save
        pointAdded(s, a) {
            if (!s.current) return
            s.current.points = [...(s.current.points || []), a.payload]
            s.dirty = true
        },
        // Estado del plano recibido por tiempo real (STOMP): ya viene guardado en el servidor
        blueprintUpdated(s, a) {
            applyPoints(s, a.payload)
            if (s.current?.author === a.payload.author && s.current?.name === a.payload.name) {
                s.dirty = false
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchAuthors
            .addCase(fetchAuthors.pending, (s) => {
                s.status = 'loading'
                s.error = null
            })
            .addCase(fetchAuthors.fulfilled, (s, a) => {
                s.status = 'succeeded'
                s.authors = a.payload
            })
            .addCase(fetchAuthors.rejected, (s, a) => {
                s.status = 'failed'
                s.error = a.error.message
            })
            // fetchByAuthor
            .addCase(fetchByAuthor.pending, (s) => {
                s.byAuthorStatus = 'loading'
                s.byAuthorError = null
            })
            .addCase(fetchByAuthor.fulfilled, (s, a) => {
                s.byAuthorStatus = 'succeeded'
                s.byAuthor[a.payload.author] = a.payload.items
            })
            .addCase(fetchByAuthor.rejected, (s, a) => {
                s.byAuthorStatus = 'failed'
                s.byAuthorError = a.error.message
            })
            // fetchBlueprint
            .addCase(fetchBlueprint.pending, (s) => {
                s.currentStatus = 'loading'
                s.currentError = null
            })
            .addCase(fetchBlueprint.fulfilled, (s, a) => {
                s.currentStatus = 'succeeded'
                s.current = a.payload
                s.dirty = false
            })
            .addCase(fetchBlueprint.rejected, (s, a) => {
                s.currentStatus = 'failed'
                s.currentError = a.error.message
            })
            // createBlueprint
            .addCase(createBlueprint.pending, (s) => {
                s.createStatus = 'loading'
                s.createError = null
            })
            .addCase(createBlueprint.fulfilled, (s, a) => {
                s.createStatus = 'succeeded'
                const bp = a.payload
                if (s.byAuthor[bp.author]) s.byAuthor[bp.author].push(bp)
            })
            .addCase(createBlueprint.rejected, (s, a) => {
                s.createStatus = 'failed'
                s.createError = a.error.message
            })
            // updateBlueprint (Save/Update)
            .addCase(updateBlueprint.pending, (s) => {
                s.saveStatus = 'loading'
                s.saveError = null
            })
            .addCase(updateBlueprint.fulfilled, (s, a) => {
                s.saveStatus = 'succeeded'
                applyPoints(s, a.payload)
                s.dirty = false
            })
            .addCase(updateBlueprint.rejected, (s, a) => {
                s.saveStatus = 'failed'
                s.saveError = a.error.message
            })
            // deleteBlueprint
            .addCase(deleteBlueprint.pending, (s) => {
                s.saveStatus = 'loading'
                s.saveError = null
            })
            .addCase(deleteBlueprint.fulfilled, (s, a) => {
                s.saveStatus = 'succeeded'
                const { author, name } = a.payload
                if (s.byAuthor[author]) {
                    s.byAuthor[author] = s.byAuthor[author].filter((b) => b.name !== name)
                }
                if (s.current?.author === author && s.current?.name === name) {
                    s.current = null
                    s.dirty = false
                }
            })
            .addCase(deleteBlueprint.rejected, (s, a) => {
                s.saveStatus = 'failed'
                s.saveError = a.error.message
            })
    },
})

export const { clearCurrent, pointAdded, blueprintUpdated } = slice.actions
export default slice.reducer
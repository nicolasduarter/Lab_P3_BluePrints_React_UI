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
    },
    reducers: {
        clearCurrent(s) {
            s.current = null
            s.currentStatus = 'idle'
            s.currentError = null
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
    },
})

export const { clearCurrent } = slice.actions
export default slice.reducer
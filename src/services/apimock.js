const MOCK_DATA = [
    {
        author: 'john',
        name: 'house',
        points: [
            { x: 10, y: 10 },
            { x: 100, y: 10 },
            { x: 100, y: 80 },
        ],
    },
    {
        author: 'john',
        name: 'garage',
        points: [
            { x: 5, y: 5 },
            { x: 60, y: 5 },
        ],
    },
    {
        author: 'maria',
        name: 'tower',
        points: [
            { x: 20, y: 20 },
            { x: 20, y: 120 },
            { x: 80, y: 120 },
        ],
    },
]

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const apimock = {
    async getAll() {
        await delay()
        return MOCK_DATA
    },
    async getByAuthor(author) {
        await delay()
        return MOCK_DATA.filter((bp) => bp.author === author)
    },
    async getByAuthorAndName(author, name) {
        await delay()
        const bp = MOCK_DATA.find((b) => b.author === author && b.name === name)
        if (!bp) throw new Error('Blueprint no encontrado')
        return bp
    },
    async create(payload) {
        await delay()
        MOCK_DATA.push(payload)
        return payload
    },
}

export default apimock
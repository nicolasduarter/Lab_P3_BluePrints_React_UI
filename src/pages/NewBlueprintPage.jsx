import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import BlueprintForm from '../components/BlueprintForm.jsx'
import { createBlueprint } from '../features/blueprints/blueprintsSlice.js'

export default function NewBlueprintPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleSubmit = async (payload) => {
        try {
            await dispatch(createBlueprint(payload)).unwrap()
            alert('Blueprint creado correctamente')
            navigate('/')
        } catch (err) {
            alert('Error al crear el blueprint: ' + (err.message || 'desconocido'))
        }
    }

    return (
        <div>
            <h2>Nuevo Blueprint</h2>
            <BlueprintForm onSubmit={handleSubmit} />
        </div>
    )
}
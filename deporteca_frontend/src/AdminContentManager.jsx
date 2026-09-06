import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { X, Save, Trash2, Edit } from 'lucide-react';

const AdminContentManager = ({
    db, 
    appId, 
    data, 
    closeModals, 
    editingContentType, 
    setEditingContentType, 
    editingContentItem, 
    setEditingContentItem,
    handleAdminContentSubmit,
    handleDeleteContentItem,
    submissionMessage,
    setSubmissionMessage
}) => {
    // Definimos el estado local para los campos del formulario de cada tipo de contenido.
    const [contentName, setContentName] = useState('');
    const [contentDescription, setContentDescription] = useState('');
    const [contentOpcion, setContentOpcion] = useState(''); // Para sexos
    const [comunidadAutonomaId, setComunidadAutonomaId] = useState(''); // Para provincias

    const [isSaving, setIsSaving] = useState(false);
    
    // Estado para los ítems cargados
    const [items, setItems] = useState([]);

    // UseEffect para poblar los campos del formulario cuando se selecciona un elemento para editar.
    useEffect(() => {
        if (editingContentItem) {
            setContentName(editingContentItem.nombre || editingContentItem.opcion || '');
            setContentDescription(editingContentItem.descripcion || '');
            setContentOpcion(editingContentItem.opcion || '');
            setComunidadAutonomaId(editingContentItem.comunidadAutonomaId || '');
        } else {
            // Limpiar los campos si no se está editando nada
            setContentName('');
            setContentDescription('');
            setContentOpcion('');
            setComunidadAutonomaId('');
        }
    }, [editingContentItem]);

    // Carga los ítems de la colección seleccionada
    useEffect(() => {
        if (!db || !editingContentType) return;
        const type = contentTypes.find(t => t.key === editingContentType);
        if (!type) return;
        const ref = collection(db, 'artifacts', appId, 'public/data', type.collection);
        const unsubscribe = onSnapshot(ref, snapshot => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, appId, editingContentType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSubmissionMessage('');

        if (!db) {
            setSubmissionMessage('Error: Firestore DB no está inicializado.');
            setIsSaving(false);
            return;
        }

        let newDocData = {};
        const collectionName = editingContentType;

        switch (collectionName) {
            case 'deportes':
                newDocData = { nombre: contentName.trim(), descripcion: contentDescription.trim() };
                break;
            case 'provincias':
                if (!comunidadAutonomaId) {
                    setSubmissionMessage('Error: La provincia debe tener una Comunidad Autónoma asignada.');
                    setIsSaving(false);
                    return;
                }
                newDocData = { nombre: contentName.trim(), comunidadAutonomaId: comunidadAutonomaId.trim() };
                break;
            case 'categoriasEdad':
                newDocData = { nombre: contentName.trim() };
                break;
            case 'sexos':
                newDocData = { nombre: contentName.trim() };
                break;
            case 'comunidadesAutonomas':
                newDocData = { nombre: contentName.trim() };
                break;
            case 'tiposCompeticion':
                newDocData = { nombre: contentName.trim() };
                break;
            case 'tiposServicio':
                newDocData = { nombre: contentName.trim() };
                break;
            case 'tiposLugar':
                newDocData = { nombre: contentName.trim() };
                break;
            default:
                setSubmissionMessage('Error: Tipo de contenido no válido.');
                setIsSaving(false);
                return;
        }

        try {
            // Aquí se guarda el tipo de competición en la colección 'tiposCompeticion'
            await handleAdminContentSubmit(collectionName, newDocData, editingContentItem?.id);
            setSubmissionMessage('¡Contenido guardado con éxito!');
            setEditingContentItem(null);
            setContentName('');
            setContentDescription('');
            setContentOpcion('');
            setComunidadAutonomaId('');
        } catch (error) {
            console.error('Error al guardar el contenido:', error);
            setSubmissionMessage(`Error al guardar el contenido: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const renderFormFields = () => {
        switch (editingContentType) {
            case 'deportes':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Nombre del Deporte</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Baloncesto"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <label htmlFor="contentDescription" className="block text-sm font-medium text-gray-700 mt-4">Descripción (opcional)</label>
                        <textarea
                            id="contentDescription"
                            value={contentDescription}
                            onChange={(e) => setContentDescription(e.target.value)}
                            placeholder="Descripción del deporte"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                        ></textarea>
                    </>
                );
            case 'provincias':
                const comunidadesAutonomas = data.comunidadesAutonomas || [];
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Nombre de la Provincia</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Madrid"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <label htmlFor="comunidadAutonomaId" className="block text-sm font-medium text-gray-700 mt-4">Comunidad Autónoma</label>
                        <select
                            id="comunidadAutonomaId"
                            value={comunidadAutonomaId}
                            onChange={(e) => setComunidadAutonomaId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Selecciona una Comunidad Autónoma</option>
                            {comunidadesAutonomas.map(ca => (
                                <option key={ca.id} value={ca.id}>{ca.nombre}</option>
                            ))}
                        </select>
                    </>
                );
            case 'categoriasEdad':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Categoría de Edad</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Cadete (15-16 años)"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </>
                );
            case 'sexos':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Opción de Sexo</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Femenino"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </>
                );
            case 'comunidadesAutonomas':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Nombre de la Comunidad Autónoma</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Comunidad de Madrid"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </>
                );
            case 'tiposCompeticion':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Tipo de Competición</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Liga, Copa, Torneo..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </>
                );
            case 'tiposServicio':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Tipo de Servicio</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Entrenamiento, Asesoría..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </>
                );
            case 'tiposLugar':
                return (
                    <>
                        <label htmlFor="contentName" className="block text-sm font-medium text-gray-700">Tipo de Lugar</label>
                        <input
                            type="text"
                            id="contentName"
                            value={contentName}
                            onChange={(e) => setContentName(e.target.value)}
                            placeholder="Ej. Gimnasio, Cancha, Estadio..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </>
                );
            default:
                return null;
        }
    };

    const getCollectionDisplayName = (type) => {
        switch (type) {
            case 'deportes': return 'Deportes';
            case 'provincias': return 'Provincias';
            case 'categoriasEdad': return 'Categorías de Edad';
            case 'sexos': return 'Sexos';
            case 'comunidadesAutonomas': return 'Comunidades Autónomas';
            case 'tiposCompeticion': return 'Tipos de Competición';
            case 'tiposServicio': return 'Tipos de Servicio';
            case 'tiposLugar': return 'Tipos de Lugar';
            default: return 'Contenido';
        }
    };
    
    const getContentList = (type) => {
        switch (type) {
            case 'deportes': return data.deportes || [];
            case 'provincias': return data.provincias || [];
            case 'categoriasEdad': return data.edades || [];
            case 'sexos': return data.sexos || [];
            case 'comunidadesAutonomas': return data.comunidadesAutonomas || [];
            case 'tiposCompeticion': return data.tiposCompeticion || [];
            case 'tiposServicio': return data.tiposServicio || [];
            case 'tiposLugar': return data.tiposLugar || [];
            default: return [];
        }
    };

    const displayPropertyName = (type) => {
        switch (type) {
            case 'sexos': return 'nombre';
            default: return 'nombre';
        }
    };

    const contentTypes = [
        { key: 'deportes', label: 'Deportes', collection: 'deportes', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }, { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false }] },
        { key: 'provincias', label: 'Provincias', collection: 'provincias', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }, { name: 'comunidadAutonomaId', label: 'Comunidad Autónoma', type: 'select', required: true }] },
        { key: 'categoriasEdad', label: 'Categorías de Edad', collection: 'categoriasEdad', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }] },
        { key: 'sexos', label: 'Sexos', collection: 'sexos', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }] },
        { key: 'comunidadesAutonomas', label: 'Comunidades Autónomas', collection: 'comunidadesAutonomas', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }] },
        { key: 'tiposCompeticion', label: 'Tipos de Competición', collection: 'tiposCompeticion', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }] },
        { key: 'tiposServicio', label: 'Tipo de Servicio', collection: 'tiposServicio', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }] },
        { key: 'tiposLugar', label: 'Tipo de Lugar', collection: 'tiposLugar', fields: [{ name: 'nombre', label: 'Nombre', type: 'text', required: true }] },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto" onClick={closeModals}>
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-3xl w-full relative" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900" onClick={closeModals}><X size={24} /></button>
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Gestión de Contenido (Admin)</h2>
                <p className="text-gray-700 mb-4">
                    Aquí puedes añadir, editar y eliminar los datos que alimentan los filtros de la aplicación.
                    Selecciona un tipo de contenido para empezar.
                </p>

                {/* Selección del tipo de contenido */}
                <div className="mb-6">
                    <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">Seleccionar Tipo de Contenido</label>
                    <select
                        id="contentType"
                        value={editingContentType}
                        onChange={(e) => {
                            setEditingContentType(e.target.value);
                            setEditingContentItem(null); // Reset item when content type changes
                            setSubmissionMessage('');
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">-- Selecciona --</option>
                        <option value="deportes">Deportes</option>
                        <option value="provincias">Provincias</option>
                        <option value="categoriasEdad">Categorías de Edad</option>
                        <option value="sexos">Sexos</option>
                        <option value="comunidadesAutonomas">Comunidades Autónomas</option>
                        <option value="tiposCompeticion">Tipos de Competición</option>
                        <option value="tiposServicio">Tipo de Servicio</option>
                        <option value="tiposLugar">Tipo de Lugar</option>
                    </select>
                </div>

                {editingContentType && (
                    <div>
                        {/* Panel de Formulario */}
                        <div>
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">{editingContentItem ? 'Editar' : 'Añadir Nuevo'} {getCollectionDisplayName(editingContentType)}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {renderFormFields()}
                                {submissionMessage && (
                                    <div className={`mt-4 p-3 rounded-md text-sm ${submissionMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {submissionMessage}
                                    </div>
                                )}
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        disabled={isSaving || !contentName}
                                    >
                                        <Save size={20} className="mr-2" />
                                        {isSaving ? 'Guardando...' : editingContentItem ? 'Actualizar' : 'Añadir'}
                                    </button>
                                    {editingContentItem && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingContentItem(null);
                                                setSubmissionMessage('');
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <X size={20} className="mr-2" />
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                        {/* Contenido actual debajo del formulario */}
                        <div className="mt-8">
                            <h3 className="font-bold mb-4 text-blue-900 text-lg whitespace-nowrap">Contenido actual</h3>
                            <div className="overflow-y-auto max-h-[400px]">
                                {items.length > 0 ? (
                                    <ul className="space-y-2">
                                        {items.map(item => (
                                            <li key={item.id} className="bg-gray-100 rounded p-2 flex items-center">
                                                <div className="flex-1 min-w-[250px] max-w-[calc(100%-60px)] pr-0 overflow-x-auto">
                                                    <span className="block text-gray-900 font-medium whitespace-nowrap">{item.nombre}</span>
                                                </div>
                                                <div className="flex gap-0 flex-shrink-0">
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full bg-white hover:bg-blue-50 transition-colors"
                                                        onClick={() => setEditingContentItem(item)}
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-900 p-2 rounded-full bg-white hover:bg-red-50 transition-colors"
                                                        onClick={() => handleDeleteContentItem(
                                                            contentTypes.find(t => t.key === editingContentType)?.collection,
                                                            item.id
                                                        )}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">No hay ítems registrados.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContentManager;

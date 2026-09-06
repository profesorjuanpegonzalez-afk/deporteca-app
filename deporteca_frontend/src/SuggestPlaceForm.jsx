import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, MapPin } from 'lucide-react';

// ...existing code...

/**
 * SuggestPlaceForm Component
 *
 * This component provides a form for users to suggest a new place.
 * It is a modal that collects information such as the place name, address,
 * contact details, and comments. It also allows the user to suggest
 * which sports are available at the new location.
 *
 * @param {Object} props
 * @param {Function} props.setShowSuggestPlaceModal - State setter to close the modal.
 * @param {Function} props.handleSuggestPlace - The handler to submit the suggested place data.
 * @param {Object} props.deporteIdToNameMap - A map from sport ID to name.
 * @param {Array<Object>} props.uniqueSports - A list of all unique sports.
 * @param {Object} props.comunidadAutonomaIdToNameMap - A map from community ID to name.
 * @param {Object} props.provinciaIdToNameMap - A map from province ID to name.
 * @param {Array<Object>} props.uniqueComunidadesAutonomas - A list of all unique autonomous communities.
 * @param {Array<Object>} props.filteredProvinciasByComunidad - The list of provinces filtered by the selected community.
 * @param {string} props.suggestedPlaceName - State for the suggested place's name.
 * @param {Function} props.setSuggestedPlaceName - Setter for suggestedPlaceName.
 * @param {string} props.suggestedPlaceAddress - State for the suggested place's address.
 * @param {Function} props.setSuggestedPlaceAddress - Setter for suggestedPlaceAddress.
 * @param {string} props.suggestedPlaceContact - State for the suggested place's contact info.
 * @param {Function} props.setSuggestedPlaceContact - Setter for suggestedPlaceContact.
 * @param {string} props.suggestedPlacePhone - State for the suggested place's phone number.
 * @param {Function} props.setSuggestedPlacePhone - Setter for suggestedPlacePhone.
 * @param {Array<string>} props.suggestedPlaceSports - State for the selected sports for the suggested place.
 * @param {Function} props.setSuggestedPlaceSports - Setter for suggestedPlaceSports.
 * @param {string} props.suggestedPlaceComments - State for the comments about the suggested place.
 * @param {Function} props.setSuggestedPlaceComments - Setter for suggestedPlaceComments.
 * @param {string} props.selectedComunidad - State for the selected autonomous community.
 * @param {Function} props.setSelectedComunidad - Setter for selectedComunidad.
 * @param {string} props.selectedProvincia - State for the selected province.
 * @param {Function} props.setSelectedProvincia - Setter for selectedProvincia.
 */
function SuggestPlaceForm({
    setShowSuggestPlaceModal,
    handleSuggestPlace,
    deporteIdToNameMap,
    uniqueSports = [],
    comunidadAutonomaIdToNameMap,
    provinciaIdToNameMap,
    uniqueComunidadesAutonomas = [],
    filteredProvinciasByComunidad = [],
    suggestedPlaceName,
    setSuggestedPlaceName,
    suggestedPlaceLocation,
    setSuggestedPlaceLocation,
    suggestedPlaceContact,
    setSuggestedPlaceContact,
    suggestedPlacePhone,
    setSuggestedPlacePhone,
    suggestedPlaceSports,
    setSuggestedPlaceSports,
    suggestedPlaceComments,
    setSuggestedPlaceComments,
    selectedComunidad,
    setSelectedComunidad,
    selectedProvincia,
    setSelectedProvincia,
    onClose,
    locationCoordinates,
    setLocationCoordinates,
    addressSuggestions = [],
    showSuggestions = false,
    setAddressSuggestions,
    setShowSuggestions,
    handleAddLugar, // <-- Recibe la función para guardar el lugar real
    deportes = [], // <-- debe llegar el array de deportes desde App/MainContent
    tipoCompeticionOptions = [],
    edadOptions = [],
    sexoOptions = [],
    provincias = [], // <-- Añade valor por defecto para evitar el error
    comunidadesAutonomas = [], // <-- Añade valor por defecto para evitar el error
    // ...existing props...
    suggestedPlaceWeb = '', // <-- valor por defecto para evitar el error
    setSuggestedPlaceWeb = () => {},
    suggestedPlaceInstagram = '',
    setSuggestedPlaceInstagram = () => {},
    suggestedPlaceTwitter = '',
    setSuggestedPlaceTwitter = () => {},
    // ...existing props...
    style = {}, // <-- Añade esto
}) {
    const [submissionMessage, setSubmissionMessage] = useState({ type: '', text: '' });
    const [logoUrl, setLogoUrl] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [logoError, setLogoError] = useState('');
    const locationInputRef = useRef(null);

    const handleSportChange = (sportId) => {
        setSuggestedPlaceSports(prevSports =>
            prevSports.includes(sportId)
                ? prevSports.filter(id => id !== sportId)
                : [...prevSports, sportId]
        );
    };

    // --- NUEVO: Manejador para el input de dirección ---
    const handleLocationInputChange = (e) => {
        setSuggestedPlaceLocation(e.target.value);
    };

    // Preview del archivo seleccionado
    useEffect(() => {
        if (logoFile) {
            const reader = new FileReader();
            reader.onload = e => setLogoPreview(e.target.result);
            reader.readAsDataURL(logoFile);
        } else {
            setLogoPreview('');
        }
    }, [logoFile]);

    // Maneja el cambio de archivo
    const handleLogoFileChange = (e) => {
        setLogoError('');
        const file = e.target.files[0];
        if (file) {
            if (file.size > 90 * 1024) {
                setLogoError('El archivo supera los 90kb.');
                setLogoFile(null);
                setLogoPreview('');
                return;
            }
            setLogoFile(file);
        } else {
            setLogoFile(null);
        }
    };

    // Guardar archivo en /public/images/logos y devolver la ruta relativa
    const saveLogoFile = async () => {
        if (!logoFile) return '';
        // NOTA: En producción deberías subir a un backend o storage, aquí solo simulamos la ruta.
        // El usuario debe mover manualmente el archivo a /public/images/logos si no hay backend.
        const filename = `${Date.now()}_${logoFile.name.replace(/\s+/g, '_')}`;
        return `/images/logos/${filename}`;
    };

    // --- NUEVO: Guardar lugar real en Firebase ---
    // (Mantén solo UNA definición de handleSubmit, elimina las duplicadas)
    
    // Reset message when modal is opened or closed
    useEffect(() => {
      setSubmissionMessage({ type: '', text: '' });
    }, [suggestedPlaceName, suggestedPlaceLocation, suggestedPlaceSports, suggestedPlaceComments]);
    
    // Autocompletado de dirección usando Nominatim (OpenStreetMap)
    // Eliminado autocompletado con Nominatim por CORS. Usa Google Places.
    
    const handleSuggestionClick = (suggestion) => {
        setSuggestedPlaceLocation(suggestion.display_name);
        setLocationCoordinates({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
        setShowSuggestions(false);
    };
    
    // Filtra provincias SOLO por el campo comunidad_autonoma_id (que es el que usas en Firestore)
    const provinciasFiltradas = selectedComunidad
        ? provincias.filter(
            p => String(p.comunidad_autonoma_id) === String(selectedComunidad)
        )
        : provincias;
    
    // Debug: imprime valores para depuración
    useEffect(() => {
        console.log('selectedComunidad:', selectedComunidad);
        console.log('provinciasFiltradas:', provinciasFiltradas);
        console.log('selectedProvincia:', selectedProvincia);
    }, [selectedComunidad, provinciasFiltradas, selectedProvincia]);
    
    // Justo antes del return, añade este useEffect para depuración de cambios de selectedProvincia
    useEffect(() => {
        console.log('selectedProvincia (efecto):', selectedProvincia, typeof selectedProvincia);
    }, [selectedProvincia]);
    
    // Estado para la oferta actual y la lista de ofertas
    // (Declaración única, ya está más arriba en el archivo)
    
    // Reset message when modal is opened or closed
    useEffect(() => {
      setSubmissionMessage({ type: '', text: '' });
    }, [suggestedPlaceName, suggestedPlaceLocation, suggestedPlaceSports, suggestedPlaceComments]);

    // Debug: imprime valores para depuración
    useEffect(() => {
        console.log('selectedComunidad:', selectedComunidad);
        console.log('provinciasFiltradas:', provinciasFiltradas);
        console.log('selectedProvincia:', selectedProvincia);
    }, [selectedComunidad, provinciasFiltradas, selectedProvincia]);

    // Justo antes del return, añade este useEffect para depuración de cambios de selectedProvincia
    useEffect(() => {
        console.log('selectedProvincia (efecto):', selectedProvincia, typeof selectedProvincia);
    }, [selectedProvincia]);

    // Estado para la oferta actual y la lista de ofertas
    const [ofertaActual, setOfertaActual] = useState({
        deporte: '',
        tipo_competicion: '',
        edades: [],
        sexos: [],
    });
    const [ofertas, setOfertas] = useState([]);

    // Añadir oferta
    const handleAddOferta = () => {
        if (
            !ofertaActual.deporte ||
            !ofertaActual.tipo_competicion ||
            ofertaActual.edades.length === 0 ||
            ofertaActual.sexos.length === 0
        ) return;

        setOfertas(prev => [
            ...prev,
            {
                deporte: ofertaActual.deporte,
                tipo_competicion: ofertaActual.tipo_competicion,
                edades: [...ofertaActual.edades],
                sexos: [...ofertaActual.sexos],
            }
        ]);
        setOfertaActual({ deporte: '', tipo_competicion: '', edades: [], sexos: [] });
    };

    // Eliminar oferta
    const handleRemoveOferta = (idx) => {
        setOfertas(prev => prev.filter((_, i) => i !== idx));
    };

    // --- CORRECCIÓN: El submit debe usar el estado 'ofertas' y NO intentar usar un estado externo o prop ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Solo bloquea si hay una oferta en curso (rellena pero no añadida)
        const hayOfertaEnCurso =
            ofertaActual.deporte ||
            ofertaActual.tipo_competicion ||
            ofertaActual.edades.length > 0 ||
            ofertaActual.sexos.length > 0;

        if (hayOfertaEnCurso) {
            setSubmissionMessage({ type: 'error', text: 'Debes añadir la oferta deportiva antes de registrar el lugar.' });
            return;
        }

        if (!suggestedPlaceName || !suggestedPlaceLocation || ofertas.length === 0) {
            setSubmissionMessage({ type: 'error', text: 'Por favor, completa el nombre, la dirección y añade al menos una oferta deportiva.' });
            return;
        }

        let logo_url = '';
        if (logoUrl) {
            logo_url = logoUrl.trim();
        } else if (logoFile) {
            logo_url = await saveLogoFile();
        }

        const newPlace = {
            nombre: suggestedPlaceName,
            direccion: suggestedPlaceLocation,
            email: suggestedPlaceContact,
            telefono: suggestedPlacePhone,
            comentarios: suggestedPlaceComments,
            comunidad_autonoma_id: selectedComunidad,
            provincia_id: selectedProvincia,
            latitud: locationCoordinates?.latitude || null,
            longitud: locationCoordinates?.longitude || null,
            pagina_web: suggestedPlaceWeb,
            instagram: suggestedPlaceInstagram,
            twitter: suggestedPlaceTwitter,
            logo_url,
        };

        try {
            // Usa el array local 'ofertas' (no una prop ni variable externa)
            await handleAddLugar(newPlace, ofertas);

            setSubmissionMessage({ type: 'success', text: '¡Lugar y ofertas deportivas registrados correctamente!' });
            setSuggestedPlaceName('');
            setSuggestedPlaceLocation('');
            setSuggestedPlaceContact('');
            setSuggestedPlacePhone('');
            setSuggestedPlaceComments('');
            setSelectedComunidad('');
            setSelectedProvincia('');
            setAddressSuggestions([]);
            setShowSuggestions(false);
            setLocationCoordinates(null);
            setOfertas([]); // <-- Limpia el array local de ofertas
        } catch (error) {
            setSubmissionMessage({ type: 'error', text: 'Hubo un error al registrar el lugar y las ofertas. Inténtalo de nuevo.' });
        }
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style={{ overflowY: 'auto' }}>
        <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative"
            style={{
                maxHeight: '90vh',
                overflowY: 'auto',
                margin: '40px 0',
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sugerir un lugar</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X />
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                {/* Nombre del lugar */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del lugar
                    </label>
                    <input
                        type="text"
                        value={suggestedPlaceName}
                        onChange={(e) => setSuggestedPlaceName(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                        required
                    />
                </div>

                {/* Dirección del lugar */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                    </label>
                    <input
                        type="text"
                        value={suggestedPlaceLocation}
                        onChange={handleLocationInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                        required
                    />
                    {/* Sugerencias de dirección */}
                    {showSuggestions && (
                        <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-sm">
                            {addressSuggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="p-2 cursor-pointer hover:bg-blue-100"
                                >
                                    {suggestion.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contacto y teléfono */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de contacto
                    </label>
                    <input
                        type="email"
                        value={suggestedPlaceContact}
                        onChange={(e) => setSuggestedPlaceContact(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono de contacto
                    </label>
                    <input
                        type="tel"
                        value={suggestedPlacePhone}
                        onChange={(e) => setSuggestedPlacePhone(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                    />
                </div>

                {/* Deportes disponibles */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deportes disponibles
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {uniqueSports.map(sport => (
                            <div key={sport.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`sport-${sport.id}`}
                                    checked={suggestedPlaceSports.includes(sport.id)}
                                    onChange={() => handleSportChange(sport.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-200"
                                />
                                <label
                                    htmlFor={`sport-${sport.id}`}
                                    className="ml-2 block text-sm text-gray-800"
                                >
                                    {sport.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comentarios adicionales */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comentarios adicionales
                    </label>
                    <textarea
                        value={suggestedPlaceComments}
                        onChange={(e) => setSuggestedPlaceComments(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                        rows="3"
                    />
                </div>

                {/* Comunidad y provincia */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comunidad Autónoma
                    </label>
                    <select
                        value={selectedComunidad}
                        onChange={(e) => setSelectedComunidad(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                    >
                        <option value="">Selecciona una comunidad</option>
                        {uniqueComunidadesAutonomas.map(comunidad => (
                            <option key={comunidad.id} value={comunidad.id}>
                                {comunidad.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia
                    </label>
                    <select
                        value={selectedProvincia}
                        onChange={(e) => setSelectedProvincia(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                    >
                        <option value="">Selecciona una provincia</option>
                        {provinciasFiltradas.map(provincia => (
                            <option key={provincia.id} value={provincia.id}>
                                {provincia.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Logo del lugar */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo del lugar
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-200"
                    />
                    {logoPreview && (
                        <div className="mt-2">
                            <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="max-h-32 mx-auto rounded-md"
                            />
                        </div>
                    )}
                    {logoError && (
                        <p className="mt-2 text-sm text-red-600">
                            {logoError}
                        </p>
                    )}
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded-md shadow-sm text-gray-700 hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 rounded-md shadow-sm text-white hover:bg-blue-700"
                    >
                        Sugerir lugar
                    </button>
                </div>
                {/* Mensaje de estado de la sumisión */}
                {submissionMessage.text && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${submissionMessage.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                        {submissionMessage.text}
                    </div>
                )}
            </form>
        </div>
    </div>
    );
}

export default SuggestPlaceForm;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LugarForm from './LugarForm.jsx';

import MainContent from './MainContent.jsx';
import PlaceDetailModal from './PlaceDetailModal.jsx';
import AdminContentManager from './AdminContentManager.jsx';
import EntityRegistrationModal from './EntityRegistrationModal.jsx';

import appLogo from './assets/logo.png';

const appId = 'deporteca';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const backendApiBase = process.env.REACT_APP_BACKEND_API_BASE || 'http://127.0.0.1:8000';

// Configuración de Firebase desde variables de entorno (ver .env.example)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const toIdString = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
};

const normalizeLugarFromBackend = (rawLugar = {}) => {
    const provinciaObj = rawLugar.provincia && typeof rawLugar.provincia === 'object' ? rawLugar.provincia : null;
    const comunidadObj = rawLugar.comunidad_autonoma && typeof rawLugar.comunidad_autonoma === 'object' ? rawLugar.comunidad_autonoma : null;
    const ofertasBackend = Array.isArray(rawLugar.ofertas_deportivas) ? rawLugar.ofertas_deportivas : [];

    const ofertas = ofertasBackend.map((oferta) => ({
        deporte: toIdString(oferta?.deporte?.id),
        tipo_servicio: toIdString(oferta?.tipo_servicio?.id),
        tipo_competicion: toIdString(oferta?.tipo_competicion?.id),
        sexos: oferta?.sexo_permitido?.id ? [toIdString(oferta.sexo_permitido.id)] : [],
        edades: oferta?.categoria_edad?.id ? [toIdString(oferta.categoria_edad.id)] : [],
        deporte_nombre: oferta?.deporte?.nombre || '',
        tipo_servicio_nombre: oferta?.tipo_servicio?.nombre || '',
        tipo_competicion_nombre: oferta?.tipo_competicion?.nombre || '',
        sexos_nombres: oferta?.sexo_permitido?.opcion ? [oferta.sexo_permitido.opcion] : [],
        edades_nombres: oferta?.categoria_edad?.nombre ? [oferta.categoria_edad.nombre] : [],
    }));

    return {
        ...rawLugar,
        tipoLugar: rawLugar.tipo || '',
        provincia: provinciaObj?.nombre || rawLugar.provincia || '',
        provincia_id: toIdString(provinciaObj?.id || rawLugar.provincia_id),
        comunidad_autonoma_id: toIdString(comunidadObj?.id || rawLugar.comunidad_autonoma_id),
        coordenadas: (rawLugar.latitud !== null && rawLugar.latitud !== undefined && rawLugar.longitud !== null && rawLugar.longitud !== undefined)
            ? { latitude: Number(rawLugar.latitud), longitude: Number(rawLugar.longitud) }
            : null,
        instagram: rawLugar.instagram_link || rawLugar.instagram || '',
        twitter: rawLugar.x_link || rawLugar.twitter || '',
        mail: rawLugar.email || rawLugar.mail || '',
        ofertas,
    };
};

function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [storage, setStorage] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');

    const [allLugares, setAllLugares] = useState([]);
    const [filteredLugares, setFilteredLugares] = useState([]);
    // Paginación de resultados de backend
    const [currentSearchPage, setCurrentSearchPage] = useState(1);
    const [searchPageSize] = useState(20);
    const [, setSearchTotalCount] = useState(0);
    const [hasMoreLugares, setHasMoreLugares] = useState(false);
    const [deportes, setDeportes] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [comunidadesAutonomas, setComunidadesAutonomas] = useState([]);
    const [sexoOptions, setSexoOptions] = useState([]);
    const [edadOptions, setEdadOptions] = useState([]);
    const [tipoEventoOptions, setTipoEventoOptions] = useState([]);
    const [tipoCompeticionOptions, setTipoCompeticionOptions] = useState([]);
    const [tiposLugar, setTiposLugar] = useState([]);
    const [tiposServicio, setTiposServicio] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submissionMessage, setSubmissionMessage] = useState({ text: '', type: '' });
    const [activeView, setActiveView] = useState('list');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeportes, setSelectedDeportes] = useState([]);
    const [selectedComunidad, setSelectedComunidad] = useState('');
    const [selectedProvincia, setSelectedProvincia] = useState('');
    const [selectedSexo, setSelectedSexo] = useState('');
    const [selectedAge, setSelectedAge] = useState('');
    const [selectedEventos, setSelectedEventos] = useState('');
    const [selectedTipoEvento, setSelectedTipoEvento] = useState('');
    const [selectedTipoCompeticion, setSelectedTipoCompeticion] = useState('');
    const [selectedTipoLugar, setSelectedTipoLugar] = useState('');
    const [selectedTipoServicio, setSelectedTipoServicio] = useState('');

    const [userLocation, setUserLocation] = useState(null);
    const [locationCoordinates, setLocationCoordinates] = useState(null);
    const [selectedDistance, setSelectedDistance] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
    const [showSuggestPlaceModal, setShowSuggestPlaceModal] = useState(false);
    const [showPlaceDetailModal, setShowPlaceDetailModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showEntityRegistrationModal, setShowEntityRegistrationModal] = useState(false);

    const [suggestedPlaceName, setSuggestedPlaceName] = useState('');
    const [suggestedPlaceLocation, setSuggestedPlaceLocation] = useState('');
    const [suggestedPlaceSports, setSuggestedPlaceSports] = useState([]);
    const [suggestedPlaceComments, setSuggestedPlaceComments] = useState('');
    const [suggestedPlaceContact, setSuggestedPlaceContact] = useState('');
    const [suggestedPlacePhone, setSuggestedPlacePhone] = useState('');
    const [suggestedPlaceWeb, setSuggestedPlaceWeb] = useState('');
    const [suggestedPlaceInstagram, setSuggestedPlaceInstagram] = useState('');
    const [suggestedPlaceTwitter, setSuggestedPlaceTwitter] = useState('');

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingContentType, setEditingContentType] = useState('');
    const [editingContentItem, setEditingContentItem] = useState(null);
    const [adminSubmissionMessage, setAdminSubmissionMessage] = useState('');

    const [lugarEditando, setLugarEditando] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            setDb(getFirestore(app));
            setAuth(getAuth(app));
            setStorage(getStorage(app));
        } catch (e) {
            console.error("Failed to initialize Firebase:", e);
            setError(`Error al inicializar Firebase: ${e.message}`);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!auth || !db) return;

        let unsubscribes = [];

        const authPromise = initialAuthToken
            ? signInWithCustomToken(auth, initialAuthToken)
            : signInAnonymously(auth);

        authPromise.then(() => {
            const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    // Obtén el rol desde la ruta correcta
                    try {
                        const roleDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'roles', 'role_id');
                        const roleDocSnap = await getDoc(roleDocRef);
                        if (roleDocSnap.exists()) {
                            const roleValue = roleDocSnap.data().role || 'normal_user';
                            setUserRole(roleValue);
                            setIsSuperAdmin(roleValue === 'super_admin');
                        } else {
                            setUserRole('normal_user');
                            setIsSuperAdmin(false);
                        }
                    } catch (e) {
                        setUserRole('normal_user');
                        setIsSuperAdmin(false);
                    }

                    // Suscripciones a datos
                    let firstLugares = true;
                    unsubscribes = [
                        onSnapshot(collection(db, 'artifacts', appId, 'public/data', 'lugares'), (snapshot) => {
                            const placesData = snapshot.docs.map(doc => {
                                const data = doc.data();
                                return {
                                    id: doc.id,
                                    ...data,
                                    provincia_id: data.provincia_id !== undefined ? String(data.provincia_id) : '', // fuerza a string
                                };
                            });
                            setAllLugares(placesData);
                            if (firstLugares) {
                                setIsLoading(false);
                                firstLugares = false;
                            }
                        }, (err) => {
                            setError(`Error al cargar los lugares: ${err.message}`);
                            setIsLoading(false);
                        }),
                    ];

                } else {
                    setUserId(null);
                    setAllLugares([]);
                    setIsLoading(false);
                    setIsSuperAdmin(false);
                    setUserRole('normal_user');
                    console.log('No hay usuario autenticado.');
                }
            });
            unsubscribes.push(unsubscribeAuth);

        }).catch(err => {
            setError(`Error de autenticación: ${err.message}`);
            setIsLoading(false);
        });

        // Cleanup
        return () => {
            unsubscribes.forEach(unsub => typeof unsub === 'function' && unsub());
        };
    }, [auth, db]);

    useEffect(() => {
        const fetchCatalogosBackend = async () => {
            try {
                const endpoints = [
                    'deportes',
                    'provincias',
                    'comunidades-autonomas',
                    'sexos',
                    'categorias-edad',
                    'tipos-evento',
                    'tipos-competicion',
                    'tipos-servicio-oferta',
                    'lugares/tipos-lugar',
                ];

                const responses = await Promise.all(
                    endpoints.map(ep => fetch(`${backendApiBase}/api/${ep}/`))
                );

                const failed = responses.find(r => !r.ok);
                if (failed) {
                    throw new Error(`Error cargando catalogos (HTTP ${failed.status})`);
                }

                const [
                    deportesData,
                    provinciasData,
                    comunidadesData,
                    sexosData,
                    categoriasData,
                    tiposEventoData,
                    tiposCompeticionData,
                    tiposServicioData,
                    tiposLugarData,
                ] = await Promise.all(responses.map(r => r.json()));

                setDeportes(deportesData || []);
                setProvincias((provinciasData || []).map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    comunidad_autonoma_id: p.comunidad_autonoma?.id ?? '',
                })));
                setComunidadesAutonomas(comunidadesData || []);
                setSexoOptions((sexosData || []).map(s => ({ id: s.id, nombre: s.opcion || s.nombre || '' })));
                setEdadOptions(categoriasData || []);
                setTipoEventoOptions(tiposEventoData || []);
                setTipoCompeticionOptions(tiposCompeticionData || []);
                setTiposServicio(tiposServicioData || []);
                setTiposLugar(tiposLugarData || []);
            } catch (e) {
                console.error('Error cargando catálogos backend:', e);
            }
        };

        fetchCatalogosBackend();
    }, []);

    const deporteIdToNameMap = useMemo(() => Object.fromEntries(deportes.map(d => [d.id, d.nombre])), [deportes]);
    const provinciaIdToNameMap = useMemo(() => Object.fromEntries(provincias.map(p => [p.id, p.nombre])), [provincias]);
    const comunidadAutonomaIdToNameMap = useMemo(() => Object.fromEntries(comunidadesAutonomas.map(c => [c.id, c.nombre])), [comunidadesAutonomas]);
    const sexoIdToNameMap = useMemo(() => Object.fromEntries(sexoOptions.map(s => [s.id, s.nombre])), [sexoOptions]);
    const edadIdToNameMap = useMemo(() => Object.fromEntries(edadOptions.map(e => [e.id, e.nombre])), [edadOptions]);
    
    const genderOptions = sexoOptions.map(s => s.nombre);
    const ageOptions = useMemo(() => [...new Set(edadOptions.map(e => e.nombre))].sort(), [edadOptions]);
    const uniqueComunidadesAutonomas = useMemo(() => [...new Set(comunidadesAutonomas.map(c => c.nombre))].sort(), [comunidadesAutonomas]);

    const filteredProvinciasByComunidad = useMemo(() => {
        if (!selectedComunidad) {
            return provincias;
        }
        const comunidadId = comunidadesAutonomas.find(c => c.nombre === selectedComunidad)?.id;
        if (!comunidadId) {
            return provincias;
        }
        return provincias.filter(p => p.comunidad_autonoma_id === comunidadId);
    }, [selectedComunidad, comunidadesAutonomas, provincias]);

    const filters = useMemo(() => ({
        deporte: selectedDeportes[0] || '',
        provincia: selectedProvincia || '',
        comunidad: selectedComunidad || '',
        sexo: selectedSexo || '',
        edad: selectedAge || '',
        eventos: selectedEventos || '',
        tipoEvento: selectedTipoEvento || '',
        tipoCompeticion: selectedTipoCompeticion || '',
        tipoLugar: selectedTipoLugar || '',
        tipoServicio: selectedTipoServicio || '',
    }), [
        selectedDeportes,
        selectedProvincia,
        selectedComunidad,
        selectedSexo,
        selectedAge,
        selectedEventos,
        selectedTipoEvento,
        selectedTipoCompeticion,
        selectedTipoLugar,
        selectedTipoServicio
    ]);

    // Nueva función para cargar lugares filtrados desde backend Django
    const fetchFilteredLugares = useCallback(async (reset = false) => {
        const page = reset ? 1 : currentSearchPage + 1;

        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('page_size', String(searchPageSize));

            if (searchTerm) params.set('q', searchTerm);
            if (filters.provincia) params.set('provincia_id', String(filters.provincia));
            if (filters.comunidad) {
                const comunidadId = comunidadesAutonomas.find(c => c.nombre === filters.comunidad)?.id;
                if (comunidadId) params.set('comunidad_autonoma_id', String(comunidadId));
            }
            if (filters.deporte) params.set('deporte_id', String(filters.deporte));
            if (filters.sexo) params.set('sexo_id', String(filters.sexo));
            if (filters.edad) params.set('categoria_edad_id', String(filters.edad));
            if (filters.eventos === 'con') params.set('con_eventos', 'true');
            if (filters.eventos === 'sin') params.set('sin_eventos', 'true');
            if (filters.tipoEvento) params.set('tipo_evento_id', String(filters.tipoEvento));
            if (filters.tipoCompeticion) params.set('tipo_competicion_id', String(filters.tipoCompeticion));
            if (filters.tipoServicio) params.set('tipo_servicio_oferta_id', String(filters.tipoServicio));
            if (filters.tipoLugar) params.set('tipo_lugar', String(filters.tipoLugar));
            if (selectedDistance && locationCoordinates) {
                params.set('radio_km', String(selectedDistance));
                params.set('latitud', String(locationCoordinates.latitude));
                params.set('longitud', String(locationCoordinates.longitude));
            }

            const response = await fetch(`${backendApiBase}/api/lugares/busqueda-avanzada/?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const rawResults = Array.isArray(payload.results) ? payload.results : [];
            const results = rawResults.map(normalizeLugarFromBackend);
            const total = Number.isFinite(payload.count) ? payload.count : results.length;

            setFilteredLugares(prev => reset ? results : [...prev, ...results]);
            setCurrentSearchPage(page);
            setSearchTotalCount(total);
            setHasMoreLugares(page * searchPageSize < total);
        } catch (e) {
            console.error('Fallo en búsqueda avanzada backend:', e);
            setFilteredLugares([]);
            setCurrentSearchPage(1);
            setSearchTotalCount(0);
            setHasMoreLugares(false);
            setError(
                'No se ha podido conectar con el backend de búsqueda. ' +
                'Comprueba que Django está en ejecución en http://127.0.0.1:8000.'
            );
        }
    }, [
        currentSearchPage,
        searchPageSize,
        filters,
        searchTerm,
        comunidadesAutonomas,
        selectedDistance,
        locationCoordinates,
    ]);

    // Llama a fetchFilteredLugares cuando cambian filtros, origen o distancia
    useEffect(() => {
        fetchFilteredLugares(true);
    }, [filters, searchTerm, selectedDistance, locationCoordinates]);

    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedDeportes([]);
        setSelectedComunidad('');
        setSelectedProvincia('');
        setSelectedSexo('');
        setSelectedAge('');
        setSelectedEventos('');
        setSelectedTipoEvento('');
        setSelectedTipoCompeticion('');
        setSelectedTipoLugar('');
        setSelectedTipoServicio('');
        setSelectedDistance('');
        setSelectedLocation('');
        setUserLocation(null);
        setLocationCoordinates(null);
        setCurrentSearchPage(1);
        setSearchTotalCount(0);
    }, []);

    const closeModals = useCallback(() => {
        setShowAddPlaceModal(false);
        setShowPlaceDetailModal(false);
        setShowContactModal(false);
        setShowProfileModal(false);
        setShowSuggestPlaceModal(false);
        setSubmissionMessage({ text: '', type: '' });
        setSelectedPlace(null);
    }, []);

    const handlePlaceClick = useCallback((place) => {
        setSelectedPlace(place);
        setShowPlaceDetailModal(true);
    }, []);

    // Modifica handleEditPlace para guardar el lugar a editar
    const handleEditPlace = useCallback((place) => {
        setShowPlaceDetailModal(false);
        const lugarSeguro = normalizeLugarFromBackend(place);
        setLugarEditando(lugarSeguro);
        setShowAddPlaceModal(true);
    }, []);

    // Nueva función para manejar la edición y actualizar la lista
    const handleSubmitLugarEditado = useCallback((lugarEditado) => {
        const lugarNormalizado = normalizeLugarFromBackend(lugarEditado);
        setFilteredLugares(prev =>
            prev.map(lugar => (lugar.id === lugarNormalizado.id ? { ...lugar, ...lugarNormalizado } : lugar))
        );
        setShowAddPlaceModal(false);
        setLugarEditando(null);
        setSubmissionMessage({ text: 'Lugar actualizado correctamente.', type: 'success' });
    }, []);

    const handleGetLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userCoords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setUserLocation(userCoords);
                    setLocationCoordinates(userCoords);
                    setSubmissionMessage({ text: 'Ubicación actual obtenida.', type: 'success' });
                },
                (err) => {
                    setSubmissionMessage({ text: 'Error al obtener la ubicación.', type: 'error' });
                }
            );
        } else {
            setSubmissionMessage({ text: 'Geolocalización no es compatible con este navegador.', type: 'error' });
        }
    }, []);

    const handleLogoUpload = async (file, lugarId) => {
        if (!file || !storage) return '';
        // Carpeta en Storage: /logos/
        const storageRef = ref(storage, `logos/${lugarId}_${Date.now()}.${file.name.split('.').pop()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    };

    const handleAddLugar = async (newPlace, ofertas = []) => {
        closeModals();
        setSubmissionMessage({ text: 'Añadiendo nuevo lugar...', type: 'info' });

        // Genera un ID legible a partir del nombre
        let docId = '';
        if (newPlace.nombre) {
            docId = newPlace.nombre
                .toLowerCase()
                .replace(/[^a-z0-9]+/gi, '_')
                .replace(/^_+|_+$/g, '');
        }

        // Normaliza las ofertas para asegurar que todas tienen TODOS los campos obligatorios
        const ofertasNormalizadas = (ofertas || []).map(oferta => ({
            deporte: oferta.deporte || '',
            tipo_servicio: oferta.tipo_servicio || '',
            tipo_competicion: oferta.tipo_competicion || '',
            edades: Array.isArray(oferta.edades) ? oferta.edades.filter(e => !!e) : [],
            sexos: Array.isArray(oferta.sexos) ? oferta.sexos.filter(s => !!s) : [],
        }));

        // Extrae los IDs de deportes de las ofertas
        const deportesIds = (ofertas || []).map(oferta => oferta.deporte).filter(Boolean);

        let logo_url = newPlace.logo_url;
        if (logoFile) {
            // Sube el logo a Firebase Storage y guarda la URL en Firestore
            logo_url = await handleLogoUpload(logoFile, docId || 'nuevoLugar');
        }
        const placeWithOfertas = {
            ...newPlace,
            logo_url,
            ofertas: ofertasNormalizadas,
                deportes: deportesIds,
        };

        try {
            let lugarRef;
            if (docId) {
                lugarRef = doc(collection(db, 'artifacts', appId, 'public/data', 'lugares'), docId);
                await setDoc(lugarRef, placeWithOfertas, { merge: true });
            } else {
                lugarRef = await addDoc(collection(db, 'artifacts', appId, 'public/data', 'lugares'), placeWithOfertas);
            }

            // Guarda cada oferta deportiva en la colección /ofertasDeportivas
            const lugarId = docId || (lugarRef && lugarRef.id);
            const ofertasCollection = collection(db, 'artifacts', appId, 'public/data', 'ofertasDeportivas');
            for (let i = 0; i < ofertasNormalizadas.length; i++) {
                const oferta = ofertasNormalizadas[i];
                const ofertaId = `${lugarId}_oferta${i + 1}`;
                await setDoc(doc(ofertasCollection, ofertaId), {
                    ...oferta,
                    lugar: newPlace.nombre,
                    lugar_id: lugarId,
                });
            }

            setSubmissionMessage({ text: '¡Lugar y ofertas deportivas añadidos con éxito!', type: 'success' });
        } catch (e) {
            setSubmissionMessage({ text: `Error al añadir el lugar/ofertas: ${e.message}`, type: 'error' });
        }
    };

    const handleSuggestPlace = async (e) => {
        e.preventDefault();
        closeModals();
        setSubmissionMessage({ text: 'Enviando sugerencia...', type: 'info' });

        try {
            const suggestionData = {
                name: suggestedPlaceName,
                address: suggestedPlaceLocation,
                description: [
                    suggestedPlaceComments,
                    suggestedPlaceSports.length ? `Deportes: ${suggestedPlaceSports.join(', ')}` : '',
                    suggestedPlaceContact ? `Contacto: ${suggestedPlaceContact}` : '',
                ].filter(Boolean).join(' | '),
            };

            const response = await fetch(`${backendApiBase}/api/sugerencias/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(suggestionData),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            setSubmissionMessage({ text: '¡Sugerencia enviada con éxito! Gracias por tu colaboración.', type: 'success' });
            setSuggestedPlaceName('');
            setSuggestedPlaceLocation('');
            setSuggestedPlaceSports([]);
            setSuggestedPlaceComments('');
        } catch (e) {
            setSubmissionMessage({ text: `Error al enviar la sugerencia: ${e.message}`, type: 'error' });
        }
    };

    const handleContactSubmit = async (email, message) => {
        setSubmissionMessage({ text: 'Enviando mensaje...', type: 'info' });
        try {
            const contactData = {
                name: userName || 'Usuario Deporteca',
                email,
                subject: 'Contacto desde frontend',
                message,
            };

            const response = await fetch(`${backendApiBase}/api/contactos/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            setSubmissionMessage({ text: '¡Mensaje enviado! Gracias por contactarnos.', type: 'success' });
            setTimeout(() => setShowContactModal(false), 2000);
        } catch (e) {
            setSubmissionMessage({ text: `Error al enviar el mensaje: ${e.message}`, type: 'error' });
        }
    };

    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        switch (name) {
            case 'deporte':
                setSelectedDeportes(value ? [value] : []);
                break;
            case 'searchTerm':
                setSearchTerm(value);
                break;
            case 'provincia':
                setSelectedProvincia(value);
                break;
            case 'comunidad':
                setSelectedComunidad(value);
                setSelectedProvincia('');
                break;
            case 'sexo':
                setSelectedSexo(value);
                break;
            case 'edad':
                setSelectedAge(value);
                break;
            case 'eventos':
                setSelectedEventos(value);
                break;
            case 'tipoEvento':
                setSelectedTipoEvento(value);
                break;
            case 'tipoCompeticion':
                setSelectedTipoCompeticion(value);
                break;
            case 'tipoLugar':
                setSelectedTipoLugar(value);
                break;
            case 'tipoServicio':
                setSelectedTipoServicio(value);
                break;
            default:
                break;
        }
    }, [
        setSelectedDeportes,
        setSelectedProvincia,
        setSelectedComunidad,
        setSelectedSexo,
        setSelectedAge,
        setSelectedEventos,
        setSelectedTipoEvento,
        setSelectedTipoCompeticion,
        setSelectedTipoLugar,
        setSelectedTipoServicio
    ]);

    const commonProps = {
        deportes,
        provincias,
        comunidadesAutonomas,
        sexoOptions,
        edadOptions,
        filteredLugares,
        isSuperAdmin,
        showAddPlaceModal,
        setShowAddPlaceModal,
        closeModals,
        handleAddLugar,
        handlePlaceClick,
        searchTerm,
        setSearchTerm,
        selectedDeportes,
        setSelectedDeportes,
        selectedComunidad,
        setSelectedComunidad,
        selectedProvincia,
        setSelectedProvincia,
        selectedSexo,
        setSelectedSexo,
        selectedAge,
        setSelectedAge,
        selectedEventos,
        setSelectedEventos,
        selectedTipoEvento,
        setSelectedTipoEvento,
        selectedTipoCompeticion,
        setSelectedTipoCompeticion,
        selectedTipoServicio,
        setSelectedTipoServicio,
        userLocation,
        handleGetLocation,
        selectedDistance,
        setSelectedDistance,
        selectedLocation,
        setSelectedLocation,
        suggestedPlaceContact,
        setSuggestedPlaceContact,
        suggestedPlacePhone,
        setSuggestedPlacePhone,
        locationCoordinates,
        setLocationCoordinates,
        resetFilters,
        activeView,
        setActiveView,
        deporteIdToNameMap,
        provinciaIdToNameMap,
        comunidadAutonomaIdToNameMap,
        sexoIdToNameMap,
        edadIdToNameMap,
        genderOptions,
        ageOptions,
        uniqueComunidadesAutonomas,
        tipoEventoOptions,
        tipoCompeticionOptions,
        filteredProvinciasByComunidad,
        getLogoSrc: (place) => place.logo_url && typeof place.logo_url === 'string' && place.logo_url.startsWith('http') ? place.logo_url : appLogo,
        showPlaceDetailModal,
        selectedPlace,
        handleEditPlace,
        showContactModal,
        setShowContactModal,
        handleContactSubmit,
        submissionMessage: submissionMessage.text || '',
        userId,
        showProfileModal,
        setShowProfileModal,
        showSuggestPlaceModal,
        setShowSuggestPlaceModal,
        handleSuggestPlace,
        suggestedPlaceName,
        setSuggestedPlaceName,
        suggestedPlaceLocation,
        setSuggestedPlaceLocation,
        suggestedPlaceSports,
        setSuggestedPlaceSports,
        suggestedPlaceComments,
        setSuggestedPlaceComments,
        suggestedPlaceWeb,
        setSuggestedPlaceWeb,
        suggestedPlaceInstagram,
        setSuggestedPlaceInstagram,
        suggestedPlaceTwitter,
        setSuggestedPlaceTwitter,
        filters,
        handleFilterChange,
        tiposLugar,
        tiposServicio,
    };

    const handleAdminContentSubmit = async (collectionName, newDocData, editId) => {
        if (!db) throw new Error('Firestore DB no inicializado');
        const ref = collection(db, 'artifacts', appId, 'public/data', collectionName);

        let docId = editId;
        if (!editId && newDocData.nombre) {
            docId = newDocData.nombre
                .toLowerCase()
                .replace(/[^a-z0-9]+/gi, '-') // Sustituye espacios y símbolos por guiones
                .replace(/^-+|-+$/g, '');    // Elimina guiones al principio/final
        }

        if (docId) {
            // Editar o crear con ID personalizado
            await setDoc(doc(ref, docId), newDocData, { merge: true });
        } else {
            // Añadir con ID autogenerado (fallback)
            await addDoc(ref, newDocData);
        }
    };

    const handleDeleteContentItem = async (collectionName, id) => {
        if (!db) throw new Error('Firestore DB no inicializado');
        await deleteDoc(doc(db, 'artifacts', appId, 'public/data', collectionName, id));
    };

    const handleDeleteLugar = async (lugarId, lugarNombre) => {
        if (!lugarId) return;
        try {
            const response = await fetch(`${backendApiBase}/api/lugares/${lugarId}/`, {
                method: 'DELETE',
            });
            if (!response.ok && response.status !== 204) {
                throw new Error(`HTTP ${response.status}`);
            }
            setFilteredLugares(prev => prev.filter(lugar => String(lugar.id) !== String(lugarId)));
            setSubmissionMessage({ text: `Lugar "${lugarNombre}" eliminado correctamente.`, type: 'success' });
        } catch (e) {
            setSubmissionMessage({ text: `Error al eliminar el lugar: ${e.message}`, type: 'error' });
        }
    };

    useEffect(() => {
        if (!db || !userId) return;
        // Obtiene el nombre de usuario actual
        const userDocRef = doc(db, 'artifacts', appId, 'users', userId);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setUserName(docSnap.data().nombre || '');
            }
        });
    }, [db, userId]);

    const handleChangeUserName = async (uid, newName) => {
        if (!db || !uid) return;
        const userDocRef = doc(db, 'artifacts', appId, 'users', uid);
        try {
            await setDoc(userDocRef, { nombre: newName }, { merge: true });
            setUserName(newName);
        } catch (e) {
            // Puedes mostrar un mensaje de error si lo deseas
            console.error('Error al cambiar el nombre de usuario:', e);
        }
    };

    const [showLanding, setShowLanding] = useState(true);
    const [landingService, setLandingService] = useState('');
    const [landingSport, setLandingSport] = useState('');
    const [landingLocation, setLandingLocation] = useState('');
    const [landingMapMode, setLandingMapMode] = useState(false);

    const handleLandingSearch = () => {
        setSelectedTipoLugar(landingService);
        setSelectedDeportes(landingSport ? [landingSport] : []);
        setSelectedLocation(landingLocation);
        setShowLanding(false);
        setActiveView(landingMapMode ? 'map' : 'list');
        if (landingLocation) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(landingLocation)}&limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data[0]) {
                        setLocationCoordinates({
                            latitude: parseFloat(data[0].lat),
                            longitude: parseFloat(data[0].lon)
                        });
                    }
                });
        }
    };

    if (showLanding) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6">
                    <div className="flex flex-col items-center mb-2">
                        <img src={appLogo} alt="Logo" className="h-20 mb-2" />
                        <span className="text-[2.5rem] font-exo font-light text-[#222e3a] tracking-wide" style={{ fontFamily: "'Exo', sans-serif", letterSpacing: '0.04em' }}>
                            DEPORTECA
                        </span>
                        <span className="text-sm font-exo text-[#4f5b7a]" style={{ fontFamily: "'Exo', sans-serif", fontWeight: 400, letterSpacing: '0.03em', marginTop: '2px' }}>
                            tu deporte, tu lugar
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <label className="text-gray-700 font-medium">¿Qué tipo de lugar estás buscando?</label>
                        <select
                            value={landingService}
                            onChange={e => setLandingService(e.target.value)}
                            className="border rounded-xl px-4 py-2"
                        >
                            <option value="">Selecciona tipo de lugar</option>
                            {(tiposLugar || []).map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                            ))}
                        </select>
                        <label className="text-gray-700 font-medium">¿Qué deporte?</label>
                        <select
                            value={landingSport}
                            onChange={e => setLandingSport(e.target.value)}
                            className="border rounded-xl px-4 py-2"
                        >
                            <option value="">Selecciona deporte</option>
                            {(deportes || []).map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                            ))}
                        </select>
                        <label className="text-gray-700 font-medium">¿Dónde?</label>
                        <input
                            type="text"
                            value={landingLocation}
                            onChange={e => setLandingLocation(e.target.value)}
                            placeholder="Introduce una ubicación (opcional)"
                            className="border rounded-xl px-4 py-2"
                        />
                        <div className="flex flex-col gap-2 mt-2">
                            <button
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors"
                                onClick={() => { setLandingMapMode(false); handleLandingSearch(); }}
                            >
                                Buscar
                            </button>
                            <button
                                className="bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors"
                                onClick={() => { setLandingMapMode(true); handleLandingSearch(); }}
                            >
                                Navegar por el mapa
                            </button>
                            <button
                                className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-emerald-700 transition-colors"
                                onClick={() => setShowEntityRegistrationModal(true)}
                            >
                                Soy una entidad: quiero registrarme
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-700 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 p-8">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <p className="text-red-600 font-semibold mb-2">Ha ocurrido un error:</p>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <MainContent
                {...commonProps}
                filteredLugares={filteredLugares}
                onLoadMore={() => fetchFilteredLugares(false)}
                hasMoreLugares={hasMoreLugares}
                isSuperAdmin={isSuperAdmin}
                userRole={userRole}
                onShowAdminModal={() => setShowAdminModal(true)}
                onShowEntityRegistration={() => setShowEntityRegistrationModal(true)}
                deportes={deportes}
                setShowPlaceDetailModal={setShowPlaceDetailModal}
                handleDeleteLugar={handleDeleteLugar}
                handleEditPlace={handleEditPlace}
                userName={userName}
                handleChangeUserName={handleChangeUserName}
                logoFile={logoFile}
                setLogoFile={setLogoFile}
                tiposLugar={tiposLugar}
                tiposServicio={commonProps.tiposServicio}
            />
            {/* Modal de detalle de lugar */}
            {showPlaceDetailModal && (
                <PlaceDetailModal
                    lugar={selectedPlace}
                    onClose={() => setShowPlaceDetailModal(false)}
                    onEdit={handleEditPlace}
                    onDelete={handleDeleteLugar}
                    isSuperAdmin={isSuperAdmin}
                    deporteIdToNameMap={deporteIdToNameMap}
                />
            )}
            {/* Formulario de edición */}
            {showAddPlaceModal && lugarEditando && (
                <LugarForm
                    lugarEditando={lugarEditando}
                    onSaved={handleSubmitLugarEditado}
                    onClose={() => { setShowAddPlaceModal(false); setLugarEditando(null); }}
                />
            )}
            {showAdminModal && isSuperAdmin && (
                <AdminContentManager
                    db={db}
                    appId={appId}
                    data={{
                        deportes,
                        provincias,
                        comunidadesAutonomas,
                        edades: edadOptions,
                        sexos: sexoOptions,
                        tiposCompeticion: tipoCompeticionOptions,
                    }}
                    closeModals={() => setShowAdminModal(false)}
                    editingContentType={editingContentType}
                    setEditingContentType={setEditingContentType}
                    editingContentItem={editingContentItem}
                    setEditingContentItem={setEditingContentItem}
                    handleAdminContentSubmit={handleAdminContentSubmit}
                    handleDeleteContentItem={handleDeleteContentItem}
                    submissionMessage={adminSubmissionMessage}
                    setSubmissionMessage={setAdminSubmissionMessage}
                />
            )}

            <EntityRegistrationModal
                isOpen={showEntityRegistrationModal}
                onClose={() => setShowEntityRegistrationModal(false)}
            />
        </>
    );
}

export default App;
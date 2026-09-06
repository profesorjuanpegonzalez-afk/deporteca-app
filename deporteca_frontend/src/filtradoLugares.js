// filtradoLugares.js
// Función centralizada para filtrar lugares según los filtros activos

export function filtrarLugares(lugares, filtros, opciones) {
    // opciones: { sexoOptions, edadOptions, deporteIdToNameMap, provinciaIdToNameMap, comunidadesAutonomas, provincias, searchTerm, locationCoordinates, selectedDistance }
    let resultado = [...lugares];

    // Filtrado AND estricto por ofertas (incluye deporte, sexo, edad, etc.)
    const filtrosOferta = [
        { key: 'deporte', value: filtros.deporte },
        { key: 'sexo', value: filtros.sexo },
        { key: 'edad', value: filtros.edad },
        { key: 'oferta', value: filtros.oferta },
        { key: 'tipoCompeticion', value: filtros.tipoCompeticion },
        { key: 'tipoServicio', value: filtros.tipoServicio }
    ].filter(f => f.value);

    resultado = resultado.filter(lugar => {
        // Filtrado por provincia
        if (filtros.provincia) {
            const provinciaId = String(lugar.provincia || lugar.provincia_id);
            const filtroProvinciaId = String(filtros.provincia);
            if (provinciaId !== filtroProvinciaId) return false;
        }
        // Filtrado por tipo de lugar
        if (filtros.tipoLugar) {
            const tipoLugar = lugar.tipoLugar || lugar.tipo;
            if (Array.isArray(tipoLugar)) {
                if (!tipoLugar.map(String).includes(String(filtros.tipoLugar))) return false;
            } else {
                if (String(tipoLugar) !== String(filtros.tipoLugar)) return false;
            }
        }
        // Filtrado por ofertas: solo pasa si alguna oferta cumple TODOS los filtros activos
        if (filtrosOferta.length > 0) {
            const ofertas = lugar.ofertas || [];
            const algunaOfertaCumple = ofertas.some(oferta => {
                return filtrosOferta.every(filtro => {
                    switch (filtro.key) {
                        case 'deporte':
                            return String(oferta.deporte) === String(filtro.value);
                        case 'sexo': {
                            const sexos = oferta.sexos || oferta.sexo || [];
                            if (Array.isArray(sexos)) {
                                return sexos.map(String).includes(String(filtro.value));
                            } else {
                                return String(sexos) === String(filtro.value);
                            }
                        }
                        case 'edad': {
                            const edades = oferta.edades || oferta.edad || [];
                            if (Array.isArray(edades)) {
                                return edades.map(String).includes(String(filtro.value));
                            } else {
                                return String(edades) === String(filtro.value);
                            }
                        }
                        case 'oferta':
                            return String(oferta.tipo_oferta) === String(filtro.value);
                        case 'tipoCompeticion':
                            return String(oferta.tipo_competicion) === String(filtro.value);
                        case 'tipoServicio':
                            return String(oferta.tipo_servicio) === String(filtro.value);
                        default:
                            return true;
                    }
                });
            });
            if (!algunaOfertaCumple) return false;
        }
        return true;
    });

    // Filtrado por comunidad autónoma
    if (filtros.comunidad) {
        const comunidadId = opciones.comunidadesAutonomas.find(c => c.nombre === filtros.comunidad)?.id;
        if (comunidadId) {
            const provinciasComunidad = opciones.provincias.filter(p => p.comunidad_autonoma_id === comunidadId).map(p => p.id);
            resultado = resultado.filter(lugar => provinciasComunidad.includes(lugar.provincia_id));
        }
    }

    // Filtrado por búsqueda de texto
    if (opciones.searchTerm) {
        resultado = resultado.filter(place =>
            place.nombre?.toLowerCase().includes(opciones.searchTerm.toLowerCase()) ||
            (place.deportes && place.deportes.some(dId => opciones.deporteIdToNameMap[dId]?.toLowerCase().includes(opciones.searchTerm.toLowerCase()))) ||
            (place.provincia_id && opciones.provinciaIdToNameMap[place.provincia_id]?.toLowerCase().includes(opciones.searchTerm.toLowerCase()))
        );
    }

    // Filtrado por distancia
    if (opciones.locationCoordinates && opciones.selectedDistance) {
        resultado = resultado.filter(place => {
            const lat = parseFloat(place.latitud || (place.ubicacion && place.ubicacion.latitude));
            const lon = parseFloat(place.longitud || (place.ubicacion && place.ubicacion.longitude));
            if (isNaN(lat) || isNaN(lon)) return false;
            const R = 6371;
            const toRadians = deg => deg * (Math.PI / 180);
            const dLat = toRadians(lat - opciones.locationCoordinates.latitude);
            const dLon = toRadians(lon - opciones.locationCoordinates.longitude);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRadians(opciones.locationCoordinates.latitude)) * Math.cos(toRadians(lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance <= parseFloat(opciones.selectedDistance);
        });
    }

    return resultado;
}

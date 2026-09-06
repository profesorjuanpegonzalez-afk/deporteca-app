// ofertasDeportivas.js
// Funciones para gestionar ofertas deportivas (añadir, editar, validar)

export function crearOferta(oferta, tiposServicio, deportes, sexoOptions, edadOptions) {
    // Valida y normaliza la oferta antes de guardarla
    if (!oferta.deporte || !oferta.tipo_servicio) {
        throw new Error('El deporte y el tipo de servicio son obligatorios');
    }
    // Normaliza los campos
    return {
        ...oferta,
        deporte: String(oferta.deporte),
        tipo_servicio: String(oferta.tipo_servicio),
        sexos: Array.isArray(oferta.sexos) ? oferta.sexos : [oferta.sexos].filter(Boolean),
        edades: Array.isArray(oferta.edades) ? oferta.edades : [oferta.edades].filter(Boolean),
        tipo_oferta: oferta.tipo_oferta || '',
        tipo_competicion: oferta.tipo_competicion || '',
        // Puedes añadir más normalizaciones aquí
    };
}

export function editarOferta(ofertaOriginal, cambios) {
    // Devuelve una nueva oferta con los cambios aplicados
    return {
        ...ofertaOriginal,
        ...cambios
    };
}

export function validarOferta(oferta) {
    // Valida los campos obligatorios
    if (!oferta.deporte) return false;
    if (!oferta.tipo_servicio) return false;
    // Puedes añadir más validaciones aquí
    return true;
}

import React from 'react';
import appLogo from './assets/logo.png';
import { Trash2 } from 'lucide-react';

/**
 * LugarCard Component
 * Muestra una tarjeta individual para un "lugar" con detalles y acciones.
 * @param {Object} props
 * @param {Object} props.lugar - El objeto con la información del lugar.
 * @param {Function} props.onPlaceClick - Handler para cuando se hace clic en la tarjeta o en "Ver más".
 * @param {Object} [props.deporteIdToNameMap] - Mapa de IDs de deportes a nombres.
 */
const LugarCard = ({
    lugar,
    onPlaceClick,
    deporteIdToNameMap = {},
    onDelete,
    isSuperAdmin,
    onEdit, // <-- Añadimos la prop onEdit
}) => {
    // Obtén los deportes de las ofertas deportivas (únicos)
    const deportesOfertados = Array.isArray(lugar.ofertas)
        ? Array.from(
            new Set(
                lugar.ofertas
                    .map(oferta => deporteIdToNameMap[oferta.deporte])
                    .filter(Boolean)
            )
        )
        : [];

    // Logo seguro
    const getLogoSrc = (place) => {
        if (place.logo_url && typeof place.logo_url === 'string' && place.logo_url.startsWith('http')) {
            return place.logo_url;
        }
        return appLogo;
    };

    return (
        <div
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex flex-col items-center cursor-pointer"
            onClick={() => onPlaceClick && onPlaceClick(lugar)}
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlaceClick && onPlaceClick(lugar);
                }
            }}
            role="button"
            aria-label={`Ver detalles de ${lugar.nombre}`}
        >
            {/* Logo */}
            <div className="w-20 h-20 mb-3 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                <img
                    src={getLogoSrc(lugar)}
                    alt={`Logo de ${lugar.nombre}`}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = appLogo; }}
                />
            </div>
            {/* Nombre */}
            <h3 className="text-lg font-bold text-blue-900 text-center mb-2">{lugar.nombre}</h3>
            {/* Deportes ofertados */}
            {deportesOfertados.length > 0 && (
                <div className="text-sm text-gray-700 text-center">
                    <span className="font-semibold">Deportes:</span> {deportesOfertados.join(', ')}
                </div>
            )}
            {/* Botón eliminar solo para superadmin */}
            {isSuperAdmin && typeof onDelete === 'function' && (
                <button
                    type="button"
                    className="mt-4 p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    onClick={e => {
                        e.stopPropagation();
                        if (window.confirm(`¿Seguro que quieres eliminar "${lugar.nombre}"?`)) {
                            onDelete(); // <-- Usa la prop onDelete, no handleDeleteLugar directamente
                        }
                    }}
                    title="Eliminar lugar"
                >
                    <Trash2 size={18} />
                </button>
            )}
            {/* Botón editar lugar */}
            {typeof onEdit === 'function' && (
                <button
                    type="button"
                    className="mt-2 p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(lugar); // <-- Llama a la función onEdit con el lugar
                    }}
                    title="Editar lugar"
                >
                    Editar lugar
                </button>
            )}
        </div>
    );
};

export default LugarCard;
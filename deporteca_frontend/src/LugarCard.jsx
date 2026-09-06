import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
// Importa tu logo local:
import appLogo from './assets/logo.png';

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
    isSuperAdmin = false,
    onDelete,
    onEdit,
    isDetailOpen = false,
    serviciosOfertados = [],
}) => {
    // Helper function para logo: prioriza logo_url, logoUrl, logo, appLogo
    const getLogoSrc = lugar => lugar.logo_url || lugar.logoUrl || lugar.logo || appLogo;


    // Si la tarjeta está cerrada (pantalla de resultados): solo logo y nombre
    if (!isDetailOpen) {
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
                <div className="w-20 h-20 mb-3 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                    <img
                        src={getLogoSrc(lugar)}
                        alt={`Logo de ${lugar.nombre}`}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.onerror = null; e.target.src = appLogo; }}
                    />
                </div>
                <h3 className="text-lg font-bold text-blue-900 text-center mb-2">{lugar.nombre}</h3>
            </div>
        );
    }



    // Si la tarjeta está abierta (detalle): todos los campos requeridos y botones de acción
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
            {/* Logo y nombre */}
            <div className="w-20 h-20 mb-3 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                <img
                    src={getLogoSrc(lugar)}
                    alt={`Logo de ${lugar.nombre}`}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = appLogo; }}
                />
            </div>
            <h3 className="text-lg font-bold text-blue-900 text-center mb-2">{lugar.nombre}</h3>

            {/* Descripción */}
            {lugar.descripcion && (
                <div className="text-sm text-gray-700 text-center mb-2">
                    {lugar.descripcion}
                </div>
            )}

            {/* Dirección y provincia */}
            <div className="text-xs text-gray-600 text-center mb-2">
                {lugar.direccion}
                {lugar.provincia && (
                    <span> &middot; <b>{lugar.provincia}</b></span>
                )}
            </div>

            {/* Contacto con iconos */}
            <div className="flex flex-wrap gap-2 justify-center mb-2">
                {lugar.telefono && (
                    <a href={`tel:${lugar.telefono}`} title="Teléfono" className="text-blue-700 hover:underline flex items-center gap-1">
                        <span role="img" aria-label="Teléfono">📞</span>{lugar.telefono}
                    </a>
                )}
                {lugar.mail && (
                    <a href={`mailto:${lugar.mail}`} title="Email" className="text-blue-700 hover:underline flex items-center gap-1">
                        <span role="img" aria-label="Email">✉️</span>{lugar.mail}
                    </a>
                )}
                {lugar.web && (
                    <a href={lugar.web} target="_blank" rel="noopener noreferrer" title="Web" className="text-blue-700 hover:underline flex items-center gap-1">
                        <span role="img" aria-label="Web">🌐</span>Web
                    </a>
                )}
                {lugar.instagram && (
                    <a href={lugar.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-pink-600 hover:underline flex items-center gap-1">
                        <span role="img" aria-label="Instagram">📸</span>Instagram
                    </a>
                )}
                {lugar.twitter && (
                    <a href={lugar.twitter} target="_blank" rel="noopener noreferrer" title="Twitter" className="text-blue-400 hover:underline flex items-center gap-1">
                        <span role="img" aria-label="Twitter">🐦</span>Twitter
                    </a>
                )}
            </div>

            {/* Oferta deportiva */}
            {Array.isArray(lugar.ofertas) && lugar.ofertas.length > 0 && (
                <div className="w-full mt-2">
                    <h4 className="text-xs font-bold text-blue-900 mb-1">Oferta deportiva:</h4>
                    <ul className="list-disc ml-4 text-xs text-gray-700">
                        {lugar.ofertas.map((oferta, idx) => (
                            <li key={idx} className="mb-1">
                                <b>{deporteIdToNameMap[oferta.deporte] || oferta.deporte}</b>
                                {oferta.tipo_servicio && <> | {oferta.tipo_servicio}</>}
                                {oferta.tipo_competicion && <> | {oferta.tipo_competicion}</>}
                            </li>
                        ))}
                    </ul>
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
                            onDelete(lugar);
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
                        onEdit(lugar);
                    }}
                    title="Editar lugar"
                >
                    <Pencil size={18} />
                </button>
            )}
        </div>
    );
};

export default LugarCard;
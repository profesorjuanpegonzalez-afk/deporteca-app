
import React from 'react';
import appLogo from './assets/logo.png';
import { Trash2, Pencil } from 'lucide-react';

const PlaceDetailModal = ({ lugar, onClose, onEdit, onDelete, isSuperAdmin = false, deporteIdToNameMap = {} }) => {
    if (!lugar) return null;
    const getLogoSrc = lugar => lugar.logo_url || lugar.logo || appLogo;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full relative">
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 text-3xl font-bold" onClick={onClose}>
                    &times;
                </button>
                {/* Logo y nombre */}
                <div className="flex flex-col items-center mb-4">
                    <img src={getLogoSrc(lugar)} alt={lugar.nombre} className="h-24 w-24 rounded-full mb-2 object-cover border border-gray-200" onError={e => { e.target.onerror = null; e.target.src = appLogo; }} />
                    <h2 className="text-2xl font-bold text-blue-900 mb-2">{lugar.nombre}</h2>
                </div>
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
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                    {lugar.telefono && (
                        <a href={`tel:${lugar.telefono}`} title="Teléfono" className="text-blue-700 hover:bg-blue-100 p-2 rounded-full" rel="noopener noreferrer">
                            <span role="img" aria-label="Teléfono">📞</span>
                        </a>
                    )}
                    {lugar.mail && (
                        <a href={`mailto:${lugar.mail}`} title="Email" className="text-blue-700 hover:bg-blue-100 p-2 rounded-full" rel="noopener noreferrer">
                            <span role="img" aria-label="Email">✉️</span>
                        </a>
                    )}
                    {lugar.web && (
                        <a href={lugar.web.startsWith('http') ? lugar.web : `https://${lugar.web}`} target="_blank" rel="noopener noreferrer" title="Web" className="text-blue-700 hover:bg-blue-100 p-2 rounded-full">
                            <span role="img" aria-label="Web">🌐</span>
                        </a>
                    )}
                    {lugar.instagram && (
                        <a href={lugar.instagram.startsWith('http') ? lugar.instagram : `https://instagram.com/${lugar.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-pink-600 hover:bg-pink-100 p-2 rounded-full">
                            <span role="img" aria-label="Instagram">📸</span>
                        </a>
                    )}
                    {lugar.twitter && (
                        <a href={lugar.twitter.startsWith('http') ? lugar.twitter : `https://twitter.com/${lugar.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" title="Twitter" className="text-blue-400 hover:bg-blue-100 p-2 rounded-full">
                            <span role="img" aria-label="Twitter">🐦</span>
                        </a>
                    )}
                </div>
                {/* Oferta deportiva */}
                {Array.isArray(lugar.ofertas) && lugar.ofertas.length > 0 && (
                    <div className="w-full mt-2 mb-4">
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
                {/* Botones de acción */}
                <div className="flex gap-4 justify-center mt-4">
                    {isSuperAdmin && typeof onDelete === 'function' && (
                        <button
                            type="button"
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            onClick={() => {
                                if (window.confirm(`¿Seguro que quieres eliminar "${lugar.nombre}"?`)) {
                                    onDelete(lugar.id);
                                    if (typeof onClose === 'function') onClose();
                                }
                            }}
                            title="Eliminar lugar"
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            <Trash2 size={22} />
                        </button>
                    )}
                    {typeof onEdit === 'function' && (
                        <button
                            type="button"
                            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            onClick={() => {
                                onEdit(lugar);
                                if (typeof onClose === 'function') onClose();
                            }}
                            title="Editar lugar"
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            <Pencil size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceDetailModal;

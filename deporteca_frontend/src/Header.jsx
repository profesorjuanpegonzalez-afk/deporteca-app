import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import appLogo from './assets/logo.png';

// Entradas del menú superior (#24). Las páginas se añaden en src/pages/ y en las rutas de App.js.
const ENTRADAS = [
    { to: '/', label: 'Inicio' },
    { to: '/ranking', label: 'Ranking' },
    { to: '/articulos', label: 'Artículos' },
    { to: '/contacto', label: 'Contacto' },
];

function claseEntrada({ isActive }) {
    return [
        'block px-3 py-2 rounded-xl font-medium transition-colors',
        isActive ? 'text-blue-900 bg-blue-50' : 'text-gray-700 hover:text-blue-900 hover:bg-gray-100',
    ].join(' ');
}

function Header({ onInicio = () => {}, onShowEntityRegistration = () => {}, isSuperAdmin = false, onShowAdminModal = () => {}, userName = '' }) {
    const [abierto, setAbierto] = useState(false);
    const cerrar = () => setAbierto(false);

    const botonAlta = (
        <button
            type="button"
            onClick={() => { cerrar(); onShowEntityRegistration(); }}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
        >
            Registrar entidad
        </button>
    );

    const entradas = ENTRADAS.map(({ to, label }) => (
        <li key={to}>
            <NavLink
                to={to}
                end={to === '/'}
                className={claseEntrada}
                onClick={() => { cerrar(); if (to === '/') onInicio(); }}
            >
                {label}
            </NavLink>
        </li>
    ));

    return (
        <header className="shadow-sm sticky top-0 z-40 bg-white">
            <div className="container mx-auto flex items-center justify-between py-3 px-4">
                <Link to="/" onClick={() => { cerrar(); onInicio(); }} aria-label="Ir al inicio" className="flex items-center gap-3">
                    <img src={appLogo} alt="Deporteca" className="h-12 w-auto" />
                    <span className="text-2xl font-bold text-blue-900">DEPORTECA</span>
                </Link>

                {/* Escritorio */}
                <nav className="hidden md:flex items-center gap-2" aria-label="Menú principal">
                    <ul className="flex items-center gap-1">{entradas}</ul>
                    {botonAlta}
                    {isSuperAdmin && (
                        <button type="button" onClick={onShowAdminModal} className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-900 transition-colors">
                            Admin
                        </button>
                    )}
                    {userName && <span className="text-gray-700 font-semibold ml-2">{userName}</span>}
                </nav>

                {/* Móvil */}
                <button
                    type="button"
                    className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100"
                    aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={abierto}
                    aria-controls="menu-movil"
                    onClick={() => setAbierto(!abierto)}
                >
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        {abierto
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
                    </svg>
                </button>
            </div>

            {abierto && (
                <nav id="menu-movil" className="md:hidden border-t border-gray-100 px-4 pb-4" aria-label="Menú principal">
                    <ul className="flex flex-col gap-1 py-2">{entradas}</ul>
                    <div className="flex flex-col gap-2">
                        {botonAlta}
                        {isSuperAdmin && (
                            <button type="button" onClick={() => { cerrar(); onShowAdminModal(); }} className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-900 transition-colors">
                                Admin
                            </button>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}

export default Header;

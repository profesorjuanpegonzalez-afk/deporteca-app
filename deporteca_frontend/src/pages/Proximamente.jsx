import React from 'react';
import { Link } from 'react-router-dom';

// Página provisional para las secciones del menú que aún no existen (#24).
// Se sustituye por la página real en su issue: Ranking (#31), Artículos (#65), Contacto (#25).
function Proximamente({ titulo }) {
    return (
        <main className="min-h-[calc(100vh-4.5rem)] bg-gray-100 flex items-center justify-center p-8 font-sans">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">{titulo}</h1>
                <p className="text-gray-700 mb-6">Esta sección estará disponible muy pronto.</p>
                <Link to="/" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors">
                    Volver al inicio
                </Link>
            </div>
        </main>
    );
}

export default Proximamente;

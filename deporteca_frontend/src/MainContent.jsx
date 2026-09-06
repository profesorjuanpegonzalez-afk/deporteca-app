import React, { useState } from 'react';
import LugarCard from './LugarCard';
import MapComponent from './MapComponent';
import LugarForm from './LugarForm';
import PlaceAutocomplete from './PlaceAutocomplete';

function MainContent(props) {
    const {
        filteredLugares = [],
        userName = '',
        isSuperAdmin = false,
        onShowAdminModal = () => {},
        onShowEntityRegistration = () => {},
        handleFilterChange = null,
        searchTerm = '',
        setSearchTerm = () => {},
        selectedDeportes = [],
        setSelectedDeportes = () => {},
        deportes = [],
        comunidadesAutonomas = [],
        selectedComunidad = '',
        setSelectedComunidad = () => {},
        provincias = [],
        filteredProvinciasByComunidad = [],
        selectedProvincia = '',
        setSelectedProvincia = () => {},
        tiposLugar = [],
        selectedTipoLugar = '',
        setSelectedTipoLugar = () => {},
        tiposServicio = [],
        selectedTipoServicio = '',
        setSelectedTipoServicio = () => {},
        sexoOptions = [],
        selectedSexo = '',
        setSelectedSexo = () => {},
        edadOptions = [],
        selectedAge = '',
        setSelectedAge = () => {},
        selectedEventos = '',
        setSelectedEventos = () => {},
        tipoEventoOptions = [],
        selectedTipoEvento = '',
        setSelectedTipoEvento = () => {},
        tipoCompeticionOptions = [],
        selectedTipoCompeticion = '',
        setSelectedTipoCompeticion = () => {},
        selectedLocation = '',
        setSelectedLocation = () => {},
        setLocationCoordinates = () => {},
        selectedDistance = '',
        setSelectedDistance = () => {},
        resetFilters = () => {},
        activeView = 'list',
        setActiveView = () => {},
        handlePlaceClick = () => {},
        handleEditPlace = () => {},
        handleDeleteLugar = () => {},
    } = props;

    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
                <header className="shadow-sm sticky top-0 z-40 bg-white">
                    <div className="container mx-auto flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <a href="/" aria-label="Ir al inicio" className="inline-flex items-center">
                                <img src={require('./assets/logo.png')} alt="Deporteca Logo" className="h-16 w-auto mr-4 ml-4" />
                            </a>
                            <span className="text-2xl font-bold text-blue-900">DEPORTECA</span>
                        </div>
                        <nav className="flex items-center space-x-4 pr-6">
                            <button
                                onClick={onShowEntityRegistration}
                                className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                title="Registrar entidad"
                            >
                                Registrar entidad
                            </button>
                            {isSuperAdmin && (
                                <>
                                    <button onClick={() => setShowModal(true)} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-800 transition-colors">Añadir lugar</button>
                                    <button onClick={onShowAdminModal} className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-900 transition-colors">Admin</button>
                                </>
                            )}
                            <span className="text-gray-700 font-semibold">{userName}</span>
                        </nav>
                    </div>
                </header>
                <main className="container mx-auto p-4 flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-1/4 bg-white p-6 rounded-3xl shadow-xl h-fit sticky top-20">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, deporte o dirección..."
                                value={searchTerm}
                                name="searchTerm"
                                onChange={handleFilterChange ? handleFilterChange : e => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                            />
                        </div>
                        <div className="mb-4">
                            <select
                                value={selectedDeportes[0] || ''}
                                name="deporte"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedDeportes(e.target.value ? [e.target.value] : [])}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                            >
                                <option value="">Todos los deportes</option>
                                {deportes.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedComunidad}
                                name="comunidad"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedComunidad(e.target.value)}
                            >
                                <option value="">Elige una comunidad autónoma</option>
                                {comunidadesAutonomas.map(c => (
                                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedProvincia}
                                name="provincia"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedProvincia(e.target.value)}
                            >
                                <option value="">Elige una provincia</option>
                                {(filteredProvinciasByComunidad.length > 0 || !selectedComunidad ? filteredProvinciasByComunidad : provincias).map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedTipoLugar}
                                name="tipoLugar"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedTipoLugar(e.target.value)}
                            >
                                <option value="">Elige tipo de lugar</option>
                                {tiposLugar.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedTipoServicio}
                                name="tipoServicio"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedTipoServicio(e.target.value)}
                            >
                                <option value="">Elige tipo de servicio</option>
                                {tiposServicio.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedSexo}
                                name="sexo"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedSexo(e.target.value)}
                            >
                                <option value="">Elige sexo</option>
                                {sexoOptions.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedAge}
                                name="edad"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedAge(e.target.value)}
                            >
                                <option value="">Elige categoría de edad</option>
                                {edadOptions.map(e => (
                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedTipoCompeticion}
                                name="tipoCompeticion"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedTipoCompeticion(e.target.value)}
                            >
                                <option value="">Elige tipo de competición</option>
                                {tipoCompeticionOptions.map(tc => (
                                    <option key={tc.id} value={tc.id}>{tc.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedEventos}
                                name="eventos"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedEventos(e.target.value)}
                            >
                                <option value="">Eventos: todos</option>
                                <option value="con">Solo con eventos</option>
                                <option value="sin">Solo sin eventos</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedTipoEvento}
                                name="tipoEvento"
                                onChange={handleFilterChange ? handleFilterChange : e => setSelectedTipoEvento(e.target.value)}
                            >
                                <option value="">Elige tipo de evento</option>
                                {tipoEventoOptions.map(te => (
                                    <option key={te.id} value={te.id}>{te.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <PlaceAutocomplete
                                value={selectedLocation}
                                placeholder="Dirección de origen"
                                onChange={(address, coords) => {
                                    setSelectedLocation(address || '');
                                    setLocationCoordinates(coords || null);
                                }}
                            />
                        </div>
                        <div className="mb-4">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                value={selectedDistance}
                                onChange={e => setSelectedDistance(e.target.value)}
                            >
                                <option value="">Sin filtro de distancia</option>
                                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(km => (
                                    <option key={km} value={String(km)}>{`${km} km`}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4 flex justify-center">
                            <button onClick={resetFilters} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors">Limpiar filtros</button>
                        </div>
                    </aside>
                    <section className="lg:w-3/4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-blue-900 uppercase">Lugares de Interés</h2>
                            <div className="flex space-x-2">
                                <button onClick={() => setActiveView('list')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeView === 'list' ? 'bg-gray-300 text-gray-900' : 'bg-gray-200 text-gray-800'}`}>Lista</button>
                                <button onClick={() => setActiveView('map')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeView === 'map' ? 'bg-gray-300 text-gray-900' : 'bg-gray-200 text-gray-800'}`}>Mapa</button>
                            </div>
                        </div>
                        {activeView === 'list' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLugares.length > 0 ? (
                                    filteredLugares.map(lugar => (
                                        <LugarCard
                                            key={lugar.id}
                                            lugar={lugar}
                                            onPlaceClick={() => handlePlaceClick(lugar)}
                                            isSuperAdmin={isSuperAdmin}
                                            onEdit={() => handleEditPlace(lugar)}
                                            onDelete={() => handleDeleteLugar(lugar.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center text-gray-500">No se encontraron lugares.</div>
                                )}
                            </div>
                        ) : (
                            <MapComponent
                                lugares={filteredLugares.map(lugar => ({
                                    ...lugar,
                                    latitud: lugar.latitud ?? (lugar.coordenadas && lugar.coordenadas.latitude),
                                    longitud: lugar.longitud ?? (lugar.coordenadas && lugar.coordenadas.longitude)
                                }))}
                                openPlaceDetail={handlePlaceClick}
                            />
                        )}
                    </section>
                </main>
            </div>
            {showModal && (
                <LugarForm onClose={() => setShowModal(false)} onSaved={() => setShowModal(false)} />
            )}
        </>
    );
}

export default MainContent;

import React, { useState } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';

const backendApiBase = process.env.REACT_APP_BACKEND_API_BASE || 'http://127.0.0.1:8000';

function EntityRegistrationModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        entidad: '',
        responsable: '',
        email: '',
        cif: '',
        telefono: '',
        tipo_lugar: 'otro',
        comunidad_autonoma: '',
        provincia: '',
        web: '',
        instagram_link: '',
        x_link: '',
        direccion: '',
        presentacion: '',
        mensaje: '',
    });
    const [status, setStatus] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direccionCoords, setDireccionCoords] = useState(null);
    const [tiposLugar, setTiposLugar] = useState([]);
    const [comunidades, setComunidades] = useState([]);
    const [provincias, setProvincias] = useState([]);

    React.useEffect(() => {
        const loadCatalogos = async () => {
            try {
                const [tiposRes, comunidadesRes, provinciasRes] = await Promise.all([
                    fetch(`${backendApiBase}/api/lugares/tipos-lugar/`),
                    fetch(`${backendApiBase}/api/comunidades-autonomas/`),
                    fetch(`${backendApiBase}/api/provincias/`),
                ]);

                if (tiposRes.ok) setTiposLugar(await tiposRes.json());
                if (comunidadesRes.ok) setComunidades(await comunidadesRes.json());
                if (provinciasRes.ok) setProvincias(await provinciasRes.json());
            } catch (_error) {
                // Si falla catálogo, el formulario sigue operativo con valores por defecto.
            }
        };

        if (isOpen) {
            loadCatalogos();
        }
    }, [isOpen]);

    const provinciasFiltradas = formData.comunidad_autonoma
        ? provincias.filter(
            (p) => String(p.comunidad_autonoma?.id || '') === String(formData.comunidad_autonoma)
        )
        : provincias;

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const clearFormFields = () => {
        setFormData({
            entidad: '',
            responsable: '',
            email: '',
            cif: '',
            telefono: '',
            tipo_lugar: 'otro',
            comunidad_autonoma: '',
            provincia: '',
            web: '',
            instagram_link: '',
            x_link: '',
            direccion: '',
            presentacion: '',
            mensaje: '',
        });
        setDireccionCoords(null);
    };

    const resetForm = () => {
        clearFormFields();
        setStatus({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', text: '' });

        try {
            const payload = {
                name: formData.responsable,
                email: formData.email,
                entidad: formData.entidad,
                cif: formData.cif || null,
                telefono: formData.telefono || null,
                tipo_lugar: formData.tipo_lugar || 'otro',
                comunidad_autonoma: formData.comunidad_autonoma || null,
                provincia: formData.provincia || null,
                web: formData.web || null,
                instagram_link: formData.instagram_link || null,
                x_link: formData.x_link || null,
                direccion: formData.direccion || null,
                latitud: direccionCoords?.latitude || null,
                longitud: direccionCoords?.longitude || null,
                presentacion: formData.presentacion || null,
                subject: `Registro entidad: ${formData.entidad}`,
                message:
                    `Entidad: ${formData.entidad}\n` +
                    `Responsable: ${formData.responsable}\n` +
                    `Telefono: ${formData.telefono || 'No indicado'}\n` +
                    `Direccion: ${formData.direccion || 'No indicada'}\n\n` +
                    `Coordenadas: ${direccionCoords ? `${direccionCoords.latitude}, ${direccionCoords.longitude}` : 'No indicadas'}\n\n` +
                    `Presentacion: ${formData.presentacion || 'No indicada'}\n\n` +
                    `Mensaje:\n${formData.mensaje}`,
            };

            const response = await fetch(`${backendApiBase}/api/contactos/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            setStatus({
                type: 'success',
                text: 'Hemos recibido tu solicitud correctamente. Te contactaremos en breve para completar el alta.',
            });
            clearFormFields();
        } catch (error) {
            setStatus({
                type: 'error',
                text: 'No se pudo enviar la solicitud. Comprueba que el backend está activo e inténtalo de nuevo.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Registro de entidad</h2>
                    <button onClick={onClose} className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100">
                        Cerrar
                    </button>
                </div>

                <p className="mb-4 text-sm text-gray-600">
                    Completa este formulario y el equipo de Deporteca te contactara para validar y activar tu entidad.
                </p>

                <form className="space-y-3" onSubmit={handleSubmit}>
                    <input
                        name="entidad"
                        value={formData.entidad}
                        onChange={handleChange}
                        required
                        placeholder="Nombre de la entidad"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <input
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleChange}
                        required
                        placeholder="Persona de contacto"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Email de contacto"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <input
                        name="cif"
                        value={formData.cif}
                        onChange={handleChange}
                        required
                        placeholder="CIF"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <select
                        name="tipo_lugar"
                        value={formData.tipo_lugar}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                        {tiposLugar.length > 0 ? (
                            tiposLugar.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                            ))
                        ) : (
                            <>
                                <option value="otro">Otro</option>
                                <option value="club_asociacion">Club/Asociacion</option>
                                <option value="gimnasio">Gimnasio</option>
                                <option value="piscina">Piscina</option>
                                <option value="centro">Centro Deportivo</option>
                            </>
                        )}
                    </select>
                    <input
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Telefono"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <select
                        name="comunidad_autonoma"
                        value={formData.comunidad_autonoma}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, comunidad_autonoma: value, provincia: '' }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                        <option value="">Selecciona comunidad autonoma</option>
                        {comunidades.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                    <select
                        name="provincia"
                        value={formData.provincia}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                        <option value="">Selecciona provincia</option>
                        {provinciasFiltradas.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                    <input
                        name="web"
                        value={formData.web}
                        onChange={handleChange}
                        placeholder="Web (opcional)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <input
                        name="instagram_link"
                        value={formData.instagram_link}
                        onChange={handleChange}
                        placeholder="Instagram (opcional)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <input
                        name="x_link"
                        value={formData.x_link}
                        onChange={handleChange}
                        placeholder="X / Twitter (opcional)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Direccion de la entidad</label>
                        <PlaceAutocomplete
                            value={formData.direccion}
                            placeholder="Escribe y selecciona una direccion"
                            onChange={(address, coords) => {
                                setFormData((prev) => ({ ...prev, direccion: address || '' }));
                                setDireccionCoords(coords || null);
                            }}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Presentacion de la entidad (maximo 200 caracteres)
                        </label>
                        <textarea
                            name="presentacion"
                            value={formData.presentacion}
                            onChange={handleChange}
                            maxLength={200}
                            required
                            rows={3}
                            placeholder="Describe brevemente vuestra entidad"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                        <div className="mt-1 text-right text-xs text-gray-500">
                            {formData.presentacion.length}/200
                        </div>
                    </div>
                    <textarea
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                        required
                        placeholder="Cuentanos que servicios deportivos ofreces"
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />

                    {status.text && (
                        <div className={`rounded-lg p-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status.text}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EntityRegistrationModal;

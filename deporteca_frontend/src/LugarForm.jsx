import React, { useEffect, useState } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';

const backendApiBase = process.env.REACT_APP_BACKEND_API_BASE || 'http://127.0.0.1:8000';

function LugarForm({ lugarEditando = null, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    tipoLugar: '',
    nombre: '',
    direccion: '',
    coordenadas: null,
    provincia: '',
    logoUrl: '',
    logoFile: null,
    descripcion: '',
    web: '',
    instagram: '',
    twitter: '',
    mail: '',
    telefono: '',
    ofertas: [],
  });
  const [ofertaActual, setOfertaActual] = useState({
    deporte: '',
    tipo_servicio: '',
    tipo_competicion: '',
    sexos: [],
    edades: [],
  });
  const [tiposLugar, setTiposLugar] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [deportes, setDeportes] = useState([]);
  const [tiposCompeticion, setTiposCompeticion] = useState([]);
  const [sexoOptions, setSexoOptions] = useState([]);
  const [edadOptions, setEdadOptions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const endpoints = [
          'lugares/tipos-lugar',
          'provincias',
          'tipos-servicio-oferta',
          'deportes',
          'tipos-competicion',
          'sexos',
          'categorias-edad',
        ];
        const responses = await Promise.all(
          endpoints.map(ep => fetch(`${backendApiBase}/api/${ep}/`))
        );
        const failed = responses.find(r => !r.ok);
        if (failed) throw new Error(`HTTP ${failed.status}`);

        const [tiposLugarData, provinciasData, tiposServicioData, deportesData, tiposCompeticionData, sexosData, edadesData] =
          await Promise.all(responses.map(r => r.json()));

        setTiposLugar((tiposLugarData || []).map(i => ({ id: String(i.id), nombre: i.nombre })));
        setProvincias((provinciasData || []).map(i => ({
          id: String(i.id),
          nombre: i.nombre,
          comunidad_autonoma_id: i.comunidad_autonoma?.id ? String(i.comunidad_autonoma.id) : '',
        })));
        setTiposServicio((tiposServicioData || []).map(i => ({ id: String(i.id), nombre: i.nombre })));
        setDeportes((deportesData || []).map(i => ({ id: String(i.id), nombre: i.nombre })));
        setTiposCompeticion((tiposCompeticionData || []).map(i => ({ id: String(i.id), nombre: i.nombre })));
        setSexoOptions((sexosData || []).map(i => ({ id: String(i.id), nombre: i.opcion || i.nombre || '' })));
        setEdadOptions((edadesData || []).map(i => ({ id: String(i.id), nombre: i.nombre })));
      } catch (err) {
        setErrorMsg(`No se pudieron cargar los catálogos: ${err.message}`);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (lugarEditando) {
      // Copia todos los campos, asegurando que ofertas siempre sea un array
      setFormData({
        tipoLugar: lugarEditando.tipoLugar || lugarEditando.tipo || '',
        nombre: lugarEditando.nombre || '',
        direccion: lugarEditando.direccion || '',
        coordenadas: lugarEditando.coordenadas || ((lugarEditando.latitud && lugarEditando.longitud)
          ? { latitude: Number(lugarEditando.latitud), longitude: Number(lugarEditando.longitud) }
          : null),
        provincia: (lugarEditando.provincia_id && String(lugarEditando.provincia_id))
          || (lugarEditando.provincia?.id && String(lugarEditando.provincia.id))
          || lugarEditando.provincia
          || '',
        logoUrl: lugarEditando.logoUrl || lugarEditando.logo_url || '',
        logoFile: null,
        descripcion: lugarEditando.descripcion || '',
        web: lugarEditando.web || '',
        instagram: lugarEditando.instagram || lugarEditando.instagram_link || '',
        twitter: lugarEditando.twitter || lugarEditando.x_link || '',
        mail: lugarEditando.mail || lugarEditando.email || '',
        telefono: lugarEditando.telefono || '',
        ofertas: Array.isArray(lugarEditando.ofertas)
          ? lugarEditando.ofertas
          : (Array.isArray(lugarEditando.ofertas_deportivas)
            ? lugarEditando.ofertas_deportivas.map(of => ({
              deporte: String(of?.deporte?.id || ''),
              tipo_servicio: String(of?.tipo_servicio?.id || ''),
              tipo_competicion: String(of?.tipo_competicion?.id || ''),
              sexos: of?.sexo_permitido?.id ? [String(of.sexo_permitido.id)] : [],
              edades: of?.categoria_edad?.id ? [String(of.categoria_edad.id)] : [],
              deporte_nombre: of?.deporte?.nombre || '',
              tipo_servicio_nombre: of?.tipo_servicio?.nombre || '',
              tipo_competicion_nombre: of?.tipo_competicion?.nombre || '',
              sexos_nombres: of?.sexo_permitido?.opcion ? [of.sexo_permitido.opcion] : [],
              edades_nombres: of?.categoria_edad?.nombre ? [of.categoria_edad.nombre] : [],
            }))
            : []),
      });
    }
  }, [lugarEditando]);

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === 'logoFile') {
      if (files[0] && files[0].size > 90000) {
        setErrorMsg('El archivo de logo no puede superar los 90kb.');
        return;
      }
      setFormData(prev => ({ ...prev, logoFile: files[0] }));
    } else {
      // Solo actualiza el campo correspondiente, nunca borra dirección ni coordenadas
      setFormData(prev => ({
        ...prev,
        [name]: value,
        direccion: prev.direccion,
        coordenadas: prev.coordenadas
      }));
    }
  }

  function handleDireccionChange(value, coords) {
    console.log('LugarForm - handleDireccionChange:', { value, coords });
    setFormData(prev => ({
      ...prev,
      direccion: value,
      coordenadas: coords && coords.latitude && coords.longitude ? coords : null
    }));
  }

  function handleOfertaActualChange(e) {
    const { name, value, options } = e.target;
    if (name === 'sexos' || name === 'edades') {
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setOfertaActual(prev => ({ ...prev, [name]: selected }));
    } else {
      setOfertaActual(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleAddOferta() {
    if (!ofertaActual.deporte || !ofertaActual.tipo_servicio || !ofertaActual.tipo_competicion || ofertaActual.sexos.length === 0 || ofertaActual.edades.length === 0) {
      setErrorMsg('Todos los campos de la oferta deportiva son obligatorios.');
      return;
    }
    // Normalizar la oferta para que los filtros funcionen correctamente
    const ofertaVinculada = {
      deporte: String(ofertaActual.deporte),
      tipo_servicio: String(ofertaActual.tipo_servicio),
      tipo_competicion: String(ofertaActual.tipo_competicion),
      sexos: Array.isArray(ofertaActual.sexos) ? ofertaActual.sexos.map(String) : [String(ofertaActual.sexos)].filter(Boolean),
      edades: Array.isArray(ofertaActual.edades) ? ofertaActual.edades.map(String) : [String(ofertaActual.edades)].filter(Boolean),
      // Nombres para mostrar y para filtros
      deporte_nombre: deportes.find(d => d.id === ofertaActual.deporte)?.nombre || '',
      tipo_servicio_nombre: tiposServicio.find(ts => ts.id === ofertaActual.tipo_servicio)?.nombre || '',
      tipo_competicion_nombre: tiposCompeticion.find(tc => tc.id === ofertaActual.tipo_competicion)?.nombre || '',
      sexos_nombres: ofertaActual.sexos.map(sid => sexoOptions.find(s => s.id === sid)?.nombre || sid),
      edades_nombres: ofertaActual.edades.map(eid => edadOptions.find(e => e.id === eid)?.nombre || eid),
    };
    setFormData(prev => ({
      ...prev,
      ofertas: [...prev.ofertas, ofertaVinculada],
    }));
    setOfertaActual({ deporte: '', tipo_servicio: '', tipo_competicion: '', sexos: [], edades: [] });
    setErrorMsg('');
  }

  function handleRemoveOferta(idx) {
    setFormData(prev => ({
      ...prev,
      ofertas: prev.ofertas.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    // Validaciones SOLO de los campos principales y que haya al menos una oferta guardada
    if (!formData.tipoLugar || !formData.nombre || !formData.direccion || !formData.provincia || !formData.descripcion) {
      setErrorMsg('Todos los campos principales son obligatorios.');
      setSaving(false);
      return;
    }
    if (formData.descripcion.length > 200) {
      setErrorMsg('La descripción no puede superar los 200 caracteres.');
      setSaving(false);
      return;
    }
    if (formData.logoFile && formData.logoFile.size > 90000) {
      setErrorMsg('El archivo de logo no puede superar los 90kb.');
      setSaving(false);
      return;
    }
    if (!formData.ofertas || formData.ofertas.length === 0) {
      setErrorMsg('Debes añadir al menos una oferta deportiva.');
      setSaving(false);
      return;
    }
    try {
      let provinciaId = formData.provincia;
      if (!provincias.find(p => p.id === provinciaId)) {
        const provinciaObj = provincias.find(p => p.nombre === provinciaId);
        if (provinciaObj) provinciaId = provinciaObj.id;
      }

      const provinciaObj = provincias.find(p => String(p.id) === String(provinciaId));
      const comunidadAutonomaId = provinciaObj?.comunidad_autonoma_id || null;

      if (formData.logoFile && !formData.logoUrl) {
        setErrorMsg('La subida de archivo de logo sin URL todavía no está disponible en el flujo Django API.');
        setSaving(false);
        return;
      }

      const payload = {
        tipo: formData.tipoLugar,
        nombre: formData.nombre,
        direccion: formData.direccion,
        provincia_id: provinciaId,
        comunidad_autonoma_id: comunidadAutonomaId,
        latitud: formData.coordenadas?.latitude ?? null,
        longitud: formData.coordenadas?.longitude ?? null,
        logo_url: formData.logoUrl,
        descripcion: formData.descripcion,
        web: formData.web,
        instagram_link: formData.instagram,
        x_link: formData.twitter,
        email: formData.mail,
        telefono: formData.telefono,
        ofertas: Array.isArray(formData.ofertas) ? formData.ofertas : (formData.ofertas ? [formData.ofertas] : []),
      };

      const endpoint = lugarEditando && lugarEditando.id
        ? `${backendApiBase}/api/lugares/${lugarEditando.id}/`
        : `${backendApiBase}/api/lugares/`;
      const method = lugarEditando && lugarEditando.id ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let backendDetail = '';
        try {
          const errPayload = await response.json();
          backendDetail = JSON.stringify(errPayload);
        } catch (_) {
          backendDetail = `HTTP ${response.status}`;
        }
        throw new Error(backendDetail);
      }

      const savedLugar = await response.json();
      setSaving(false);
      if (onSaved) onSaved(savedLugar);
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg('Error al guardar: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button type="button" className="absolute top-3 right-3 text-gray-500 hover:text-gray-900" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold text-blue-900 mb-4">{lugarEditando ? 'Editar lugar' : 'Añadir lugar'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de lugar</label>
            <select name="tipoLugar" id="tipoLugar" value={formData.tipoLugar} onChange={handleChange} className="border rounded px-3 py-2 w-full" required>
              <option value="">Selecciona tipo de lugar</option>
              {tiposLugar.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(tl => <option key={tl.id} value={tl.id}>{tl.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="border rounded px-3 py-2 w-full" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Dirección
              {/* Forzar que el valor del autocompletado siempre sea el del estado */}
              <PlaceAutocomplete
                value={formData.direccion}
                onChange={(value, coords) => handleDireccionChange(value, coords)}
                placeholder="Dirección (solo España)"
                key={formData.direccion || ''} // Forzar re-mount si cambia la dirección
              />
            </label>
            {/* Visor de coordenadas, solo lectura, justo debajo del autocompletado */}
            <div className="mt-2">
              <label className="block text-xs font-semibold mb-1" htmlFor="coordenadas-visor">Coordenadas asignadas:</label>
              <input
                id="coordenadas-visor"
                name="coordenadas-visor"
                type="text"
                className="border rounded px-3 py-2 w-full bg-gray-100 text-gray-700"
                value={formData.coordenadas ? `${formData.coordenadas.latitude}, ${formData.coordenadas.longitude}` : ''}
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                placeholder="No asignadas"
              />
              {!formData.coordenadas && (
                <span className="text-xs text-red-700">Las coordenadas se asignan automáticamente al elegir una dirección válida.</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <select name="provincia" id="provincia" value={formData.provincia} onChange={handleChange} className="border rounded px-3 py-2 w-full" required>
              <option value="">Selecciona provincia</option>
              {provincias.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo (URL)</label>
            <input name="logoUrl" id="logoUrl" value={formData.logoUrl} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="https://..." />
            <label className="block text-xs mt-1">O sube un archivo (máx. 90kb):</label>
            <input type="file" name="logoFile" id="logoFile" accept="image/*" onChange={handleChange} className="mt-1" />
            <div className="text-xs text-gray-500 mt-1">Si hay URL, se prioriza sobre el archivo. Si no hay ninguno, se muestra el logo de la web.</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} className="border rounded px-3 py-2 w-full" maxLength={200} required />
            <div className="text-xs text-gray-500 mt-1">Máximo 200 caracteres.</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Web</label>
            <input name="web" id="web" value={formData.web} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input name="instagram" id="instagram" value={formData.instagram} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twitter</label>
            <input name="twitter" id="twitter" value={formData.twitter} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="https://twitter.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mail</label>
            <input name="mail" id="mail" value={formData.mail} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="ejemplo@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="600123456" />
          </div>
        </div>
        <div className="mb-4">
          <h4 className="font-bold mb-2">Ofertas deportivas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <select name="deporte" id="deporte" value={ofertaActual.deporte} onChange={handleOfertaActualChange} className="border rounded px-2 py-1">
              <option value="">Selecciona deporte</option>
              {deportes.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(dep => <option key={dep.id} value={dep.id}>{dep.nombre}</option>)}
            </select>
            <select name="tipo_servicio" id="tipo_servicio" value={ofertaActual.tipo_servicio} onChange={handleOfertaActualChange} className="border rounded px-2 py-1">
              <option value="">Selecciona tipo de servicio</option>
              {tiposServicio.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(ts => <option key={ts.id} value={ts.id}>{ts.nombre}</option>)}
            </select>
            <select name="tipo_competicion" id="tipo_competicion" value={ofertaActual.tipo_competicion} onChange={handleOfertaActualChange} className="border rounded px-2 py-1">
              <option value="">Selecciona tipo de competición</option>
              {tiposCompeticion.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(tc => <option key={tc.id} value={tc.id}>{tc.nombre}</option>)}
            </select>
            <select name="sexos" id="sexos" multiple value={ofertaActual.sexos} onChange={handleOfertaActualChange} className="border rounded px-2 py-1">
              {sexoOptions.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(sexo => <option key={sexo.id} value={sexo.id}>{sexo.nombre}</option>)}
            </select>
            <select name="edades" id="edades" multiple value={ofertaActual.edades} onChange={handleOfertaActualChange} className="border rounded px-2 py-1">
              {edadOptions.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(edad => <option key={edad.id} value={edad.id}>{edad.nombre}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddOferta}
            className={`bg-blue-600 text-white px-3 py-1 rounded mt-2 ${!ofertaActual.deporte || !ofertaActual.tipo_servicio || !ofertaActual.tipo_competicion || ofertaActual.sexos.length === 0 || ofertaActual.edades.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!ofertaActual.deporte || !ofertaActual.tipo_servicio || !ofertaActual.tipo_competicion || ofertaActual.sexos.length === 0 || ofertaActual.edades.length === 0}
          >
            Añadir oferta
          </button>
          {formData.ofertas.length > 0 && (
            <ul className="mt-2 space-y-1">
              {formData.ofertas.map((of, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>
                    {deportes.find(d => d.id === of.deporte)?.nombre || of.deporte} | {tiposServicio.find(ts => ts.id === of.tipo_servicio)?.nombre || of.tipo_servicio} | {tiposCompeticion.find(tc => tc.id === of.tipo_competicion)?.nombre || of.tipo_competicion} | {of.sexos.map(sid => sexoOptions.find(s => s.id === sid)?.nombre).filter(Boolean).join(', ')} | {of.edades.map(eid => edadOptions.find(e => e.id === eid)?.nombre).filter(Boolean).join(', ')}
                  </span>
                  <button type="button" className="text-red-500 ml-2" onClick={() => handleRemoveOferta(idx)}>Quitar</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={saving || formData.ofertas.length === 0}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}

export default LugarForm;
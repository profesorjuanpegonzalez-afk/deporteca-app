import React, { useEffect, useRef } from 'react';
import appLogo from './assets/logo.png';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issues with Webpack/React.
// This is a common workaround to ensure Leaflet icons load correctly
// in a React environment.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapComponent({ lugares, openPlaceDetail, selectedPlace }) {
    // DEBUG: Mostrar lugares y coordenadas en consola
    console.log('Lugares recibidos en el mapa:', lugares.map(l => ({ nombre: l.nombre, latitud: l.latitud, longitud: l.longitud })));

    // Función para obtener el logo igual que en la vista lista
    const getLogoSrc = lugar => {
        if (lugar.logo_url && typeof lugar.logo_url === 'string' && lugar.logo_url.startsWith('http')) return lugar.logo_url;
        if (lugar.logoUrl && typeof lugar.logoUrl === 'string' && lugar.logoUrl.startsWith('http')) return lugar.logoUrl;
        if (lugar.logo && typeof lugar.logo === 'string' && lugar.logo.startsWith('http')) return lugar.logo;
        return appLogo;
    };

    const mapRef = useRef(null);
    const tileLayerRef = useRef(null);
    const markersRef = useRef([]);
    const popupRef = useRef(null);

    // Inicialización del mapa (se ejecuta solo una vez)
    useEffect(() => {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
            console.error("No se encontró el elemento con id 'map-container'.");
            return;
        }

        if (!mapRef.current) {
            mapRef.current = L.map('map-container').setView([40.416775, -3.703790], 6);
            tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(mapRef.current);
        }

        return () => {
            if (popupRef.current) {
                try { popupRef.current.remove(); } catch (e) {}
                popupRef.current = null;
            }
            if (mapRef.current) {
                try { mapRef.current.remove(); } catch (e) {}
                mapRef.current = null;
            }
        };
    }, []);

    // Actualización de marcadores cuando cambian 'lugares' o 'selectedPlace'
    useEffect(() => {
        if (!mapRef.current) return;

        // Elimina marcadores previos
        markersRef.current.forEach(m => {
            try { mapRef.current.removeLayer(m); } catch (e) {}
        });
        markersRef.current = [];

        lugares.forEach(lugar => {
            if (lugar.latitud && lugar.longitud) {
                const logoSrc = getLogoSrc(lugar);
                const customIcon = L.divIcon({
                    className: 'custom-map-marker',
                    html: `
                        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 60px;">
                            <img src="${logoSrc}" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #61dafb; object-fit: cover; background-color: white;" onerror="this.onerror=null;this.src='https://placehold.co/30x30/cccccc/000000?text=Logo';" />
                            <span style="font-size: 0.7em; font-weight: bold; color: #333; margin-top: 2px; text-shadow: 0 0 2px white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;">${lugar.nombre}</span>
                        </div>
                    `,
                    iconSize: [60, 60],
                    iconAnchor: [30, 60],
                    popupAnchor: [0, -60]
                });

                const marker = L.marker([lugar.latitud, lugar.longitud], { icon: customIcon }).addTo(mapRef.current);
                marker.on('click', () => {
                    if (popupRef.current) {
                        try { popupRef.current.remove(); } catch (e) {}
                        popupRef.current = null;
                    }
                    popupRef.current = L.popup({ closeOnClick: false, autoClose: false })
                        .setLatLng([lugar.latitud, lugar.longitud])
                        .setContent(`<b>${lugar.nombre}</b>`)
                        .openOn(mapRef.current);
                    try { if (typeof openPlaceDetail === 'function') openPlaceDetail(lugar); } catch (e) { console.error(e); }
                });

                markersRef.current.push(marker);
            }
        });

        const latLngs = lugares.filter(l => l.latitud && l.longitud).map(l => [l.latitud, l.longitud]);
        if (latLngs.length > 0) {
            try { const bounds = L.latLngBounds(latLngs); mapRef.current.fitBounds(bounds, { padding: [50, 50] }); } catch (e) {}
        }

        if (selectedPlace && selectedPlace.latitud && selectedPlace.longitud) {
            try { mapRef.current.setView([selectedPlace.latitud, selectedPlace.longitud], 14, { animate: true }); } catch (e) {}
        }
    }, [lugares, openPlaceDetail, selectedPlace]);

    const lugaresConCoordenadas = lugares.filter(l => l.latitud && l.longitud);
    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <div id="map-container" style={{ height: '100%', width: '100%' }}></div>
            {lugaresConCoordenadas.length === 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.9)', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px #0002', zIndex: 10, textAlign: 'center' }}>
                    <span className="text-gray-700 text-lg font-semibold">No hay lugares con coordenadas para mostrar en el mapa.</span>
                </div>
            )}
        </div>
    );
}

export default MapComponent;

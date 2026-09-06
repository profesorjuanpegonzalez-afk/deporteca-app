# Este script inicializa el Firebase Admin SDK y añade los datos de las 50 provincias
# y las 2 ciudades autónomas de España, además de lugares de ejemplo, a Firestore.

import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. Inicialización de Firebase Admin SDK ---
# Asegúrate de que tu archivo de clave de servicio está en la misma carpeta o la ruta es correcta.
try:
    cred = credentials.Certificate('deporteca-firebase-adminsdk-fbsvc-29d39e9668.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    print("Firebase Admin SDK para Firestore inicializado correctamente.")
    
except FileNotFoundError as e:
    print(f"Error al inicializar Firebase Admin SDK: {e}")
    print("Asegúrate de que la ruta a tu archivo de clave de cuenta de servicio es correcta.")
    exit()
except Exception as e:
    print(f"Ocurrió un error inesperado durante la inicialización: {e}")
    exit()

# --- 2. Datos para las 50 provincias y 2 ciudades autónomas de España ---
# Se usarán los 'id' de aquí para vincular los lugares más adelante.
provincias_data = [
    {'id': 'alava', 'nombre': 'Álava', 'coordenadas': {'latitude': 42.8465, 'longitude': -2.6732}},
    {'id': 'albacete', 'nombre': 'Albacete', 'coordenadas': {'latitude': 38.9959, 'longitude': -1.8559}},
    {'id': 'alicante', 'nombre': 'Alicante', 'coordenadas': {'latitude': 38.3452, 'longitude': -0.4810}},
    {'id': 'almeria', 'nombre': 'Almería', 'coordenadas': {'latitude': 36.8381, 'longitude': -2.4597}},
    {'id': 'asturias', 'nombre': 'Asturias', 'coordenadas': {'latitude': 43.3619, 'longitude': -5.8494}},
    {'id': 'avila', 'nombre': 'Ávila', 'coordenadas': {'latitude': 40.6559, 'longitude': -4.7011}},
    {'id': 'badajoz', 'nombre': 'Badajoz', 'coordenadas': {'latitude': 38.8795, 'longitude': -6.9715}},
    {'id': 'baleares', 'nombre': 'Baleares', 'coordenadas': {'latitude': 39.5694, 'longitude': 2.6502}},
    {'id': 'barcelona', 'nombre': 'Barcelona', 'coordenadas': {'latitude': 41.3851, 'longitude': 2.1734}},
    {'id': 'bizkaia', 'nombre': 'Bizkaia', 'coordenadas': {'latitude': 43.2629, 'longitude': -2.9352}},
    {'id': 'burgos', 'nombre': 'Burgos', 'coordenadas': {'latitude': 42.3414, 'longitude': -3.6992}},
    {'id': 'caceres', 'nombre': 'Cáceres', 'coordenadas': {'latitude': 39.4764, 'longitude': -6.3722}},
    {'id': 'cadiz', 'nombre': 'Cádiz', 'coordenadas': {'latitude': 36.5298, 'longitude': -6.2891}},
    {'id': 'castellon', 'nombre': 'Castellón', 'coordenadas': {'latitude': 39.9863, 'longitude': -0.0510}},
    {'id': 'ciudad-real', 'nombre': 'Ciudad Real', 'coordenadas': {'latitude': 38.9861, 'longitude': -3.9272}},
    {'id': 'cordoba', 'nombre': 'Córdoba', 'coordenadas': {'latitude': 37.8882, 'longitude': -4.7794}},
    {'id': 'a-coruna', 'nombre': 'A Coruña', 'coordenadas': {'latitude': 43.3623, 'longitude': -8.3946}},
    {'id': 'cuenca', 'nombre': 'Cuenca', 'coordenadas': {'latitude': 40.0700, 'longitude': -2.1375}},
    {'id': 'girona', 'nombre': 'Girona', 'coordenadas': {'latitude': 41.9794, 'longitude': 2.8214}},
    {'id': 'granada', 'nombre': 'Granada', 'coordenadas': {'latitude': 37.1773, 'longitude': -3.5986}},
    {'id': 'guadalajara', 'nombre': 'Guadalajara', 'coordenadas': {'latitude': 40.6327, 'longitude': -3.1643}},
    {'id': 'gipuzkoa', 'nombre': 'Gipuzkoa', 'coordenadas': {'latitude': 43.3184, 'longitude': -2.0122}},
    {'id': 'huelva', 'nombre': 'Huelva', 'coordenadas': {'latitude': 37.2625, 'longitude': -6.9447}},
    {'id': 'huesca', 'nombre': 'Huesca', 'coordenadas': {'latitude': 42.1360, 'longitude': -0.4109}},
    {'id': 'jaen', 'nombre': 'Jaén', 'coordenadas': {'latitude': 37.7788, 'longitude': -3.7845}},
    {'id': 'leon', 'nombre': 'León', 'coordenadas': {'latitude': 42.5988, 'longitude': -5.5665}},
    {'id': 'lleida', 'nombre': 'Lleida', 'coordenadas': {'latitude': 41.6167, 'longitude': 0.6220}},
    {'id': 'la-rioja', 'nombre': 'La Rioja', 'coordenadas': {'latitude': 42.4646, 'longitude': -2.4496}},
    {'id': 'lugo', 'nombre': 'Lugo', 'coordenadas': {'latitude': 43.0118, 'longitude': -7.5562}},
    {'id': 'madrid', 'nombre': 'Madrid', 'coordenadas': {'latitude': 40.4168, 'longitude': -3.7038}},
    {'id': 'malaga', 'nombre': 'Málaga', 'coordenadas': {'latitude': 36.7213, 'longitude': -4.4211}},
    {'id': 'murcia', 'nombre': 'Murcia', 'coordenadas': {'latitude': 37.9922, 'longitude': -1.1307}},
    {'id': 'navarra', 'nombre': 'Navarra', 'coordenadas': {'latitude': 42.8125, 'longitude': -1.6457}},
    {'id': 'ourense', 'nombre': 'Ourense', 'coordenadas': {'latitude': 42.3367, 'longitude': -7.8646}},
    {'id': 'palencia', 'nombre': 'Palencia', 'coordenadas': {'latitude': 42.0095, 'longitude': -4.5245}},
    {'id': 'las-palmas', 'nombre': 'Las Palmas', 'coordenadas': {'latitude': 28.1248, 'longitude': -15.4300}},
    {'id': 'pontevedra', 'nombre': 'Pontevedra', 'coordenadas': {'latitude': 42.4336, 'longitude': -8.6477}},
    {'id': 'salamanca', 'nombre': 'Salamanca', 'coordenadas': {'latitude': 40.9634, 'longitude': -5.6669}},
    {'id': 'santa-cruz-de-tenerife', 'nombre': 'Santa Cruz de Tenerife', 'coordenadas': {'latitude': 28.4636, 'longitude': -16.2518}},
    {'id': 'cantabria', 'nombre': 'Cantabria', 'coordenadas': {'latitude': 43.4623, 'longitude': -3.8099}},
    {'id': 'segovia', 'nombre': 'Segovia', 'coordenadas': {'latitude': 40.9492, 'longitude': -4.1082}},
    {'id': 'sevilla', 'nombre': 'Sevilla', 'coordenadas': {'latitude': 37.3828, 'longitude': -5.9732}},
    {'id': 'soria', 'nombre': 'Soria', 'coordenadas': {'latitude': 41.7656, 'longitude': -2.4673}},
    {'id': 'tarragona', 'nombre': 'Tarragona', 'coordenadas': {'latitude': 41.1189, 'longitude': 1.2445}},
    {'id': 'teruel', 'nombre': 'Teruel', 'coordenadas': {'latitude': 40.3421, 'longitude': -1.1064}},
    {'id': 'toledo', 'nombre': 'Toledo', 'coordenadas': {'latitude': 39.8628, 'longitude': -4.0273}},
    {'id': 'valencia', 'nombre': 'Valencia', 'coordenadas': {'latitude': 39.4699, 'longitude': -0.3763}},
    {'id': 'valladolid', 'nombre': 'Valladolid', 'coordenadas': {'latitude': 41.6520, 'longitude': -4.7286}},
    {'id': 'zamora', 'nombre': 'Zamora', 'coordenadas': {'latitude': 41.5031, 'longitude': -5.7445}},
    {'id': 'zaragoza', 'nombre': 'Zaragoza', 'coordenadas': {'latitude': 41.6488, 'longitude': -0.8891}},
    {'id': 'ceuta', 'nombre': 'Ceuta', 'coordenadas': {'latitude': 35.8898, 'longitude': -5.3095}},
    {'id': 'melilla', 'nombre': 'Melilla', 'coordenadas': {'latitude': 35.2929, 'longitude': -2.9388}}
]

# --- 3. Datos de lugares de ejemplo para Granada, Badajoz, Ceuta y Melilla ---
# El campo 'provincia_id' es la clave para vincular el lugar a la provincia.
lugares_data = [
    {
        'nombre': 'Alhambra',
        'descripcion': 'Conjunto palaciego y fortaleza de Granada.',
        'coordenadas': {'latitude': 37.1760, 'longitude': -3.5888},
        'provincia_id': 'granada'
    },
    {
        'nombre': 'Sierra Nevada',
        'descripcion': 'Estación de esquí en Granada.',
        'coordenadas': {'latitude': 37.0658, 'longitude': -3.3980},
        'provincia_id': 'granada'
    },
    {
        'nombre': 'Puente de Palmas',
        'descripcion': 'Antiguo puente en el río Guadiana en Badajoz.',
        'coordenadas': {'latitude': 38.8783, 'longitude': -6.9749},
        'provincia_id': 'badajoz'
    },
    {
        'nombre': 'Parque de la Alcazaba',
        'descripcion': 'Parque histórico junto a la fortaleza de Badajoz.',
        'coordenadas': {'latitude': 38.8824, 'longitude': -6.9687},
        'provincia_id': 'badajoz'
    },
    {
        'nombre': 'Parque Marítimo del Mediterráneo',
        'descripcion': 'Complejo de ocio con lagos artificiales en Ceuta.',
        'coordenadas': {'latitude': 35.8864, 'longitude': -5.3051},
        'provincia_id': 'ceuta'
    },
    {
        'nombre': 'Fuerte de Victoria Grande',
        'descripcion': 'Fortaleza histórica en Melilla.',
        'coordenadas': {'latitude': 35.2952, 'longitude': -2.9378},
        'provincia_id': 'melilla'
    }
]

# --- 4. Subir la información a Firestore ---
try:
    # Subimos las provincias a la colección 'regiones'
    provincias_collection_ref = db.collection('artifacts').document('default-app-id').collection('regiones')
    for provincia in provincias_data:
        doc_ref = provincias_collection_ref.document(provincia['id'])
        doc_ref.set({
            'nombre': provincia['nombre'],
            'coordenadas': provincia['coordenadas']
        })
    print("\nTodos los datos de las provincias y ciudades autónomas han sido añadidos a tu base de datos Firestore.")
    
    # Subimos los lugares a la colección 'lugares'
    lugares_collection_ref = db.collection('artifacts').document('default-app-id').collection('lugares')
    for lugar in lugares_data:
        # Aquí Firestore creará un ID automático para cada lugar
        lugares_collection_ref.add(lugar)
    print("Todos los datos de los lugares de ejemplo han sido añadidos a tu base de datos Firestore.")

except Exception as e:
    print(f"Ocurrió un error al escribir los datos en Firestore: {e}")

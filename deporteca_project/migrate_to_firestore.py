import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os

# --- Configuración de Firebase ---
try:
    # ¡IMPORTANTE! Usa el nombre exacto de tu archivo de credenciales de Firebase
    # y asegúrate de que el Project ID en initialize_app coincida con tu proyecto.
    cred = credentials.Certificate("deporteca-firebase-adminsdk-fbsvc-79bbf67fe1.json")
    firebase_admin.initialize_app(cred, {'projectId': 'deporteca'})
    db = firestore.client()
    print("Conexión exitosa a Firebase con Project ID: deporteca")
except Exception as e:
    print(f"Error al inicializar Firebase: {e}")
    exit()

# --- Funciones de Carga y Adaptación de Datos ---

def load_django_data(file_path):
    """
    Carga datos de un archivo JSON exportado de Django.
    Maneja la codificación UTF-8 con o sin BOM.
    """
    print(f"Cargando datos de Django desde: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        print(f"Datos de Django cargados exitosamente desde: {file_path}")
        return data
    except json.JSONDecodeError as e:
        print(f"Error de decodificación JSON: {e}")
        print("Asegúrate de que el archivo JSON esté bien formado y guardado con la codificación correcta (UTF-8 con o sin BOM).")
        return None
    except FileNotFoundError:
        print(f"Error: El archivo {file_path} no se encontró.")
        return None
    except Exception as e:
        print(f"Ocurrió un error inesperado al cargar los datos de Django: {e}")
        return None

def adapt_and_group_data_for_firestore(django_data):
    """
    Adapta los datos de Django y los agrupa por tipo de modelo
    para subirlos a colecciones separadas en Firestore.
    """
    grouped_data = {}
    # Mapeo de nombres de modelos de Django a nombres de colecciones de Firestore
    model_to_collection = {
        'lugares.comunidadautonoma': 'comunidadesAutonomas',
        'lugares.provincia': 'provincias',
        'lugares.deporte': 'deportes',
        'lugares.sexo': 'sexos',
        'lugares.categoriaedad': 'categoriasEdad',
        'lugares.ofertadeportiva': 'ofertasDeportivas',
        'lugares.tipoevento': 'tiposEvento',
        'lugares.lugar': 'lugares'
    }

    for item in django_data:
        django_model_name = item.get('model')
        collection_name = model_to_collection.get(django_model_name)

        if collection_name:
            fields = item.get('fields', {})
            firestore_doc = {
                'id': item.get('pk'), # Usar la clave primaria de Django como ID del documento
                **fields # Desempaquetar todos los campos
            }
            if collection_name not in grouped_data:
                grouped_data[collection_name] = []
            grouped_data[collection_name].append(firestore_doc)
        else:
            print(f"Saltando item del modelo '{django_model_name}' ya que no tiene un mapeo definido para Firestore.")
    return grouped_data

def upload_to_firestore(base_collection_path, collection_name, documents):
    """
    Sube una lista de documentos a una colección específica en Firestore.
    La ruta completa será base_collection_path/collection_name.
    """
    full_collection_path = f"{base_collection_path}/{collection_name}"
    print(f"\nIniciando la subida de datos a la colección: {full_collection_path}")
    if not documents:
        print(f"No hay documentos para subir a la colección '{collection_name}'.")
        return

    batch = db.batch()
    for doc_data in documents:
        # Usar el 'id' del documento como ID del documento en Firestore
        # Si no hay 'id' (pk de Django), Firestore generará uno automáticamente
        doc_id = str(doc_data.pop('id')) # Convertir PK a string para evitar problemas de tipo
        doc_ref = db.collection(full_collection_path).document(doc_id)
        batch.set(doc_ref, doc_data)
        # print(f"Añadiendo documento con ID: {doc_ref.id} a '{collection_name}'") # Descomentar para ver cada documento individual
    
    try:
        batch.commit()
        print(f"Subida de {len(documents)} documentos completada exitosamente a la colección: {full_collection_path}")
    except Exception as e:
        print(f"Error al subir documentos a Firestore para la colección '{collection_name}': {e}")

# --- Ejecución Principal ---
if __name__ == "__main__":
    django_json_file = 'lugares_django.json'
    # La ruta base para todas las colecciones públicas
    firestore_base_path = 'artifacts/deporteca/public/data'

    # 1. Cargar datos de Django
    django_data = load_django_data(django_json_file)

    if django_data:
        # 2. Adaptar y agrupar datos para Firestore
        grouped_firestore_documents = adapt_and_group_data_for_firestore(django_data)

        if grouped_firestore_documents:
            # 3. Subir cada grupo de documentos a su colección correspondiente
            for collection_name, documents in grouped_firestore_documents.items():
                upload_to_firestore(firestore_base_path, collection_name, documents)
        else:
            print("No se encontraron documentos válidos para subir después de la adaptación. Verifica tu archivo JSON de Django y la función de adaptación.")
    else:
        print("No se pudieron cargar los datos de Django. La migración no puede continuar.")

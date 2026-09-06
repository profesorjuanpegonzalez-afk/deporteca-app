import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    // ...tus datos de config...
};

const provincias = [
    { id: "01", nombre: "Álava" },
    { id: "02", nombre: "Albacete" },
    { id: "03", nombre: "Alicante" },
    // ...añade todas las provincias...
];

async function addProvincias() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    for (const provincia of provincias) {
        await setDoc(
            doc(db, 'artifacts', 'deporteca', 'public/data', 'provincias', provincia.id),
            { nombre: provincia.nombre }
        );
    }
    console.log('Provincias añadidas');
}

addProvincias();

// Suscripción de solo lectura a lo necesario para armar el cuadro de deudores del día.
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const FUENTES = {
  personas: 'deudaPersonas',
  movimientos: 'deudaMovimientos',
  repartos: 'repartos',
  saldos: 'clientBalances',
};

export const useDeudores = () => {
  const [datos, setDatos] = useState({});
  const [pendientes, setPendientes] = useState(Object.keys(FUENTES).length);

  useEffect(() => {
    const cierres = Object.entries(FUENTES).map(([clave, coleccion]) => {
      let primera = true;
      const terminar = () => { if (primera) { primera = false; setPendientes((n) => n - 1); } };
      return onSnapshot(
        collection(db, coleccion),
        (snap) => {
          setDatos((prev) => ({ ...prev, [clave]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
          terminar();
        },
        (err) => { console.error(`Deudores: no se pudo leer ${coleccion}`, err); terminar(); }
      );
    });
    return () => cierres.forEach((c) => c());
  }, []);

  return {
    personas: datos.personas || [],
    movimientos: datos.movimientos || [],
    repartos: datos.repartos || [],
    saldos: datos.saldos || [],
    loading: pendientes > 0,
  };
};

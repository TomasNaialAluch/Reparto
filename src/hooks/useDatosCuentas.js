// Suscripción de solo lectura a lo necesario para calcular la cuenta de los contactos:
// semanas (compras y marcas de pago), vinculaciones de saldo a favor, saldos de clientes
// (ventas) y las colecciones donde la misma persona puede aparecer por nombre.
// Solo se usa en las pantallas que muestran cuentas (no corre en el resto de la app).
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const FUENTES = {
  semanas: 'gestion_semanal',
  vinculaciones: 'saldoProveedorVinculaciones',
  saldos: 'clientBalances',
  facturas: 'facturacion_facturas',
  personas: 'deudaPersonas',
  movimientos: 'deudaMovimientos',
  cheques: 'libroCheques',
};

export const useDatosCuentas = (activo = true) => {
  const [datos, setDatos] = useState({});
  const [pendientes, setPendientes] = useState(Object.keys(FUENTES).length);

  useEffect(() => {
    if (!activo) return undefined;
    setPendientes(Object.keys(FUENTES).length);
    const cierres = Object.entries(FUENTES).map(([clave, coleccion]) => {
      let primera = true;
      const terminar = () => { if (primera) { primera = false; setPendientes((n) => n - 1); } };
      return onSnapshot(
        collection(db, coleccion),
        (snap) => {
          setDatos((prev) => ({ ...prev, [clave]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
          terminar();
        },
        () => terminar()
      );
    });
    return () => cierres.forEach((c) => c());
  }, [activo]);

  return {
    semanas: datos.semanas || [],
    vinculaciones: datos.vinculaciones || [],
    saldos: datos.saldos || [],
    facturas: datos.facturas || [],
    personas: datos.personas || [],
    movimientos: datos.movimientos || [],
    cheques: datos.cheques || [],
    loading: pendientes > 0,
  };
};


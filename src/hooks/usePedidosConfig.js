// Estado de la conexión con WhatsApp: proveedor elegido y checklist de pasos hechos.
// Un solo documento (`pedidos_config/whatsapp`), para llevar el avance del trámite con Meta/Twilio.
import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const REF = () => doc(db, 'pedidos_config', 'whatsapp');

export const usePedidosConfig = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      REF(),
      (snap) => {
        setConfig(snap.exists() ? snap.data() : {});
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar la configuración de WhatsApp:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const guardar = useCallback(
    (cambios) => setDoc(REF(), { ...cambios, updatedAt: serverTimestamp() }, { merge: true }),
    []
  );

  const marcarPaso = useCallback(
    (clave, hecho) => guardar({ pasos: { [clave]: hecho } }),
    [guardar]
  );

  return { config, loading, guardar, marcarPaso };
};

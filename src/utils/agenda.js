// Utilidades de la agenda del día (hoja de tareas con hora opcional).

const pad = (n) => String(n).padStart(2, '0');

/** Valida y normaliza una hora a "HH:MM". Devuelve null si no es válida. */
export const normalizarHora = (h, m = 0) => {
  const hh = Number(h);
  const mm = Number(m);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${pad(hh)}:${pad(mm)}`;
};

/**
 * Separa una hora opcional del texto de la tarea.
 *   "10 vtv camioneta"      → { hora: '10:00', texto: 'vtv camioneta' }
 *   "10:30 llamar a Sur"    → { hora: '10:30', texto: 'llamar a Sur' }
 *   "sacar vtv a las 10"    → { hora: '10:00', texto: 'sacar vtv' }
 *   "2 lomos para Juan"     → { hora: null,    texto: '2 lomos para Juan' }
 *
 * Un número suelto solo cuenta como hora entre las 6 y las 22, para no confundir
 * cantidades ("2 lomos") con horarios. Con "hs" o ":" vale cualquier hora válida.
 */
export const parsearTarea = (entrada) => {
  const limpio = String(entrada ?? '').trim().replace(/\s+/g, ' ');
  if (!limpio) return { hora: null, texto: '' };

  // "a las 10", "a las 10:30" en cualquier parte
  const aLas = limpio.match(/^(.*?)\s*\ba las (\d{1,2})(?::(\d{2}))?\s*(?:hs?)?\s*(.*)$/i);
  if (aLas) {
    const hora = normalizarHora(aLas[2], aLas[3] || 0);
    const texto = `${aLas[1]} ${aLas[4]}`.trim();
    if (hora && texto) return { hora, texto };
  }

  // Hora al comienzo: "10 ...", "10:30 ...", "10hs ..."
  const inicio = limpio.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(hs?|h)?\s+(.+)$/i);
  if (inicio) {
    const explicita = !!inicio[2] || !!inicio[3];
    const h = Number(inicio[1]);
    if (explicita || (h >= 6 && h <= 22)) {
      const hora = normalizarHora(inicio[1], inicio[2] || 0);
      if (hora) return { hora, texto: inicio[4].trim() };
    }
  }

  return { hora: null, texto: limpio };
};

/** Orden: con hora (por horario) primero, después sin hora por orden de creación. */
export const ordenarTareas = (tareas = []) => [...tareas].sort((a, b) => {
  if (!!a.hora !== !!b.hora) return a.hora ? -1 : 1;
  if (a.hora && b.hora && a.hora !== b.hora) return a.hora.localeCompare(b.hora);
  return String(a.creada || '').localeCompare(String(b.creada || ''));
});

/** "HH:MM" de ahora, o de ahora + minutos. */
export const horaEn = (minutos = 0) => {
  const d = new Date(Date.now() + minutos * 60000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Minutos desde medianoche de un "HH:MM". */
export const minutosDelDia = (hora) => {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
};

/** "13/10" a partir de "2026-10-13" */
export const fechaCorta = (fecha) => {
  const [, m, d] = String(fecha).split('-');
  return `${d}/${m}`;
};

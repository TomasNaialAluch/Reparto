// Copia a functions/src/compartido las utilidades de la página que el bot también usa.
// La página las importa sin extensión ("./nombres") y Node pide "./nombres.js": acá se corrige.
// Se corre con `npm run sync`; la prueba test/compartido.test.js avisa si las copias quedaron viejas.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const origen = join(aqui, '..', '..', 'src', 'utils');
const destino = join(aqui, '..', 'src', 'compartido');

export const ARCHIVOS = ['nombres', 'pesadas', 'cortes', 'interpretarRespuesta', 'pedidosBot', 'whatsapp'];

const CABECERA = '// COPIA AUTOMÁTICA de src/utils (no editar acá: se corre `npm run sync` en functions/).\n';

/** "from './x'" → "from './x.js'" (solo rutas relativas que todavía no tienen extensión). */
export const conExtension = (codigo) => codigo.replace(/(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g, (m, a, ruta, c) => (
  /\.\w+$/.test(ruta) ? m : `${a}${ruta}.js${c}`
));

export const generar = (nombre) => CABECERA + conExtension(readFileSync(join(origen, `${nombre}.js`), 'utf8'));

if (process.argv[1] && process.argv[1].endsWith('sync-compartido.js')) {
  mkdirSync(destino, { recursive: true });
  ARCHIVOS.forEach((n) => writeFileSync(join(destino, `${n}.js`), generar(n)));
  console.log(`Copiados ${ARCHIVOS.length} archivos a ${destino}`);
}

// Las copias de functions/src/compartido tienen que ser iguales a lo que genera `npm run sync`.
// Si esta prueba falla, alguien cambió src/utils sin correr `npm run sync` dentro de functions/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVOS, conExtension, generar } from '../scripts/sync-compartido.js';

const aqui = dirname(fileURLToPath(import.meta.url));

test('cada copia compartida está al día', () => {
  for (const nombre of ARCHIVOS) {
    const copia = readFileSync(join(aqui, '..', 'src', 'compartido', `${nombre}.js`), 'utf8');
    assert.equal(copia, generar(nombre), `${nombre}.js está desactualizado: corré "npm run sync" en functions/`);
  }
});

test('conExtension agrega .js solo a rutas relativas sin extensión', () => {
  assert.equal(conExtension("import { a } from './x';"), "import { a } from './x.js';");
  assert.equal(conExtension('import { a } from "../y/z";'), 'import { a } from "../y/z.js";');
  assert.equal(conExtension("import { a } from './x.js';"), "import { a } from './x.js';");
  assert.equal(conExtension("import { a } from 'firebase/firestore';"), "import { a } from 'firebase/firestore';");
});

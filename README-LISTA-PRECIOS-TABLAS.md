# Lista de Precios (tablas tipo Excel) — Sección Gestión

## Qué se pide

Agregar una página nueva dentro de la sección **Gestión** del navbar, llamada **"Lista de Precios"**, que funcione como una mini planilla de cálculo conectada a Firebase:

- El usuario puede **crear varias tablas** (instancias independientes), cada una con su propio **nombre**.
- Cada tabla es una grilla tipo Excel: **filas y columnas** donde se cargan **nombres y números** libremente en las celdas.
- El usuario puede **agregar filas** y **agregar columnas** a una tabla existente.
- El usuario puede **ver, crear y modificar** cualquiera de las tablas guardadas.
- Todo se persiste en Firestore en tiempo real (igual que el resto de la app).

## ⚠️ Colisión de nombre a resolver

Ya existe una página llamada "Lista de Precios" en el menú **Herramientas** (`/lista-precios` → [ListaPrecios.jsx](src/pages/ListaPrecios.jsx)), pero hace algo totalmente distinto: gestiona proveedores, "prónelis"/paquetes y comparación de precios entre proveedores.

Antes de implementar hay que decidir una de estas opciones:
1. Renombrar la nueva página (ej. "Tablas de Precios", "Planillas") para no repetir el label "Lista de Precios" dos veces en el navbar.
2. Reemplazar/fusionar la página existente de Herramientas con esta nueva (si el flujo de proveedores ya no se usa).
3. Mantener ambos labels iguales pero en secciones distintas del menú (Herramientas vs Gestión) — funciona pero puede confundir al usuario al ver dos "Lista de Precios".

Este documento asume que se resuelve con la opción 1 o 3 (no se toca [ListaPrecios.jsx](src/pages/ListaPrecios.jsx) existente).

## Dónde engancha en la app

- **Navbar**: agregar entrada en el submenu `gestion` de [navItems.js](src/config/navItems.js:59-68), junto a "Deudas" y "Libro de Cheques".
  ```js
  {
    key: 'gestion',
    label: 'Gestión',
    submenu: [
      { path: '/gestion-deudas',  label: 'Deudas' },
      { path: '/libro-cheques',   label: 'Libro de Cheques' },
      { path: '/tablas-precios',  label: 'Lista de Precios' }, // nueva
    ],
  },
  ```
- **Ruteo**: nueva ruta en [App.jsx](src/App.jsx), apuntando a un nuevo `src/pages/TablasPrecios.jsx` (o el nombre que se elija).
- **Firestore**: nueva colección, ej. `tablas_precios`. Cada documento = una tabla completa.

## Modelo de datos propuesto (Firestore)

Un documento por tabla en la colección `tablas_precios`:

```js
{
  nombre: "Lista Verduras",        // nombre de la tabla, editable
  columnas: ["Producto", "Precio", "Stock"],  // nombres de columna, en orden
  filas: [                          // cada fila es un array paralelo a columnas
    ["Tomate", "1200", "50"],
    ["Papa",   "800",  "120"],
  ],
  createdAt: <serverTimestamp>,
  updatedAt: <serverTimestamp>,
}
```

Notas de diseño:
- Guardar celdas como `string` (no forzar tipo número) porque el pedido es "nombres y números" mezclados libremente, como en Excel.
- `columnas` y cada fila de `filas` deben mantenerse en sincronía en longitud: agregar una columna implica agregarle un `""` a cada fila existente; agregar una fila implica crear un array del mismo largo que `columnas`.
- Alternativa más "Firestore-friendly" para tablas grandes: subcolección `tablas_precios/{tablaId}/filas/{filaId}`. Se recomienda **no** hacer esto salvo que las tablas crezcan a cientos de filas — la playa de datos de este proyecto (listas de precios manuales) es chica, y guardar todo en un solo documento simplifica mucho la edición estilo grilla y el realtime listener (mismo patrón ya usado en [LibroCheques.jsx](src/pages/LibroCheques.jsx) y `gestion_semanal`).

## Hook de datos

Seguir el patrón de hooks existentes ([hooks.js](src/firebase/hooks.js)) o crear uno dedicado `useTablasPrecios()`:

```js
export const useTablasPrecios = () => {
  const { documents, loading, error } = useFirestoreRealtime('tablas_precios');
  const { addDocument, updateDocument, deleteDocument } = useFirestore('tablas_precios');

  const crearTabla = (nombre) => addDocument({
    nombre,
    columnas: ['Columna 1'],
    filas: [['']],
  });

  const renombrarTabla = (id, nombre) => updateDocument(id, { nombre });

  const agregarColumna = (tabla, nombreColumna = `Columna ${tabla.columnas.length + 1}`) =>
    updateDocument(tabla.id, {
      columnas: [...tabla.columnas, nombreColumna],
      filas: tabla.filas.map(fila => [...fila, '']),
    });

  const agregarFila = (tabla) =>
    updateDocument(tabla.id, {
      filas: [...tabla.filas, tabla.columnas.map(() => '')],
    });

  const actualizarCelda = (tabla, filaIdx, colIdx, valor) => {
    const nuevasFilas = tabla.filas.map(f => [...f]);
    nuevasFilas[filaIdx][colIdx] = valor;
    return updateDocument(tabla.id, { filas: nuevasFilas });
  };

  return {
    tablas: documents,
    loading, error,
    crearTabla, renombrarTabla,
    agregarColumna, agregarFila, actualizarCelda,
    eliminarTabla: deleteDocument,
  };
};
```

## UI propuesta

- Lista lateral (o tabs) con las tablas existentes, botón "+ Nueva Tabla" que pide el nombre.
- Al seleccionar una tabla: header editable con el nombre (input inline, guarda `onBlur`), y debajo la grilla.
- Grilla: `<table>` con `<input>` en cada celda (sin bordes visibles hasta el hover/focus, para look de Excel), encabezados de columna editables (doble click para renombrar), botón "+ columna" al final de la fila de encabezados, botón "+ fila" al final de la tabla.
- Guardado: on blur de cada celda (no on-change por cada tecla, para no saturar Firestore) — mismo criterio que otras pantallas de la app que evitan escrituras excesivas.
- Botón eliminar tabla con `window.confirm`, siguiendo el patrón usado en [LibroCheques.jsx](src/pages/LibroCheques.jsx:224-227) y [ListaPrecios.jsx](src/pages/ListaPrecios.jsx:92-100).

## Alcance no incluido (a menos que se pida)

- Fórmulas tipo Excel (sumas automáticas, referencias entre celdas).
- Importar/exportar CSV.
- Compartir una tabla con permisos distintos por usuario (acá todo es `shared`, como el resto de la app).

## Próximo paso

Confirmar el nombre final de la página (ver sección "Colisión de nombre") y la ruta (`/tablas-precios` u otra) antes de implementar `TablasPrecios.jsx`, el hook `useTablasPrecios`, y el link en el navbar.

# Mi Reparto — a futuro (solo anotado, no se toca todavía)

**Estado:** en pausa. Este documento existe para no olvidarlo; no hay nada para implementar ahora.

## La idea

- **Mi Reparto va a generar el reparto con clientes**, no solo cargar nombres y montos sueltos.
- Sobre cada reparto se va a poder **guardar las deudas y hacer seguimiento**: quién pagó, cuánto, cómo y cuándo, y quién queda debiendo.
- Después se podrá ver **quién me debe** juntando varios repartos.

## Qué ya está pensado

El diseño detallado de esa parte está en [README-REPARTO-SEGUIMIENTO.md](README-REPARTO-SEGUIMIENTO.md): historial de pagos por cliente, pantalla de seguimiento, notas y fecha prometida, y vista consolidada de deudores.

## Para tener en cuenta cuando se retome

- **Clientes vs. contactos:** parte de los nombres de repartos son lugares o direcciones, no personas. El vínculo con un contacto tiene que ser **opcional**, manteniendo el texto libre.
- **`updatePayment` no sirve tal cual:** hoy no se ejecuta y, si se activara, escribiría datos incorrectos y podría borrar un reparto entero. Hay que reemplazarla por una función nueva que opere sobre un cliente dentro del reparto.
- **Datos duplicados:** algunos repartos guardan dos veces la lista de clientes (`clientes` y `clients`). Decidir cuál queda antes de migrar.
- **Ids de clientes:** casi todos conservan un id `temp_…` generado en el momento; no sirven como clave estable.
- **Depende de los contactos solo en parte:** el seguimiento funciona sin ellos, y se enlaza con el catálogo de contactos cuando exista (Fase 8 del [roadmap](README-ROADMAP.md)).

## Dónde está registrado

- Fase 7 del [roadmap](README-ROADMAP.md): ⏸ en pausa.
- Hallazgos de los datos reales: resultado de la Fase 0 del roadmap.

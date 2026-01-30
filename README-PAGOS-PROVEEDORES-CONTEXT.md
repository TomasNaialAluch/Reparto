# Context API: Pagos a Proveedores

## Descripción

Este contexto proporciona una **fuente única de verdad** para el estado de Pagos a Proveedores, sin duplicar datos en Firebase. Lee directamente desde `semanaActiva.pagosProveedoresEstado` y expone funciones helper para consultar el estado.

## Arquitectura

```
Firebase (semanaActiva.pagosProveedoresEstado)
    ↓
PagosProveedoresContext - Lee de Firebase en tiempo real
    ↓
Componentes (SaldoClientes, PagosProveedores, etc.) - Consumen el contexto
```

## Instalación

El contexto ya está integrado en `App.jsx`:

```jsx
import { PagosProveedoresProvider } from './contexts/PagosProveedoresContext';

function App() {
  return (
    <FirebaseProvider>
      <PagosProveedoresProvider>
        {/* Tu aplicación */}
      </PagosProveedoresProvider>
    </FirebaseProvider>
  );
}
```

## Uso

### 1. Importar el Hook

```jsx
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';
```

### 2. Usar en tu Componente

```jsx
function MiComponente() {
  const { 
    estaPagada,
    obtenerBoletasPorProveedor,
    obtenerEstadisticasProveedor 
  } = usePagosProveedores();

  // Verificar si una boleta está pagada
  const pagada = estaPagada('boleta-0');
  
  // Obtener boletas de un proveedor (incluye estado de pago)
  const boletasTito = obtenerBoletasPorProveedor('Tito');
  
  // Obtener estadísticas de un proveedor
  const stats = obtenerEstadisticasProveedor('Tito');
  console.log(stats.boletasPagadas, stats.montoPendiente);
}
```

## API del Contexto

### Estado Expuesto

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `semanaActiva` | Object | Semana activa de Firebase |
| `loading` | Boolean | Estado de carga |
| `boletasPagadas` | Object | Objeto con `boletaId: true/false` |
| `dineroDisponible` | Object | `{ efectivo, transferencia, cheques }` |
| `boletas` | Array | Array de todas las boletas con estado |
| `proveedores` | Array | Lista de proveedores únicos |
| `pagosRealizados` | Array | Pagos registrados en la semana |

### Funciones Principales

#### `estaPagada(boletaId)`
Verifica si una boleta está marcada como pagada.

```jsx
const pagada = estaPagada('boleta-5');
// Retorna: true o false
```

#### `obtenerBoletasPorProveedor(nombreProveedor, incluirPagadas)`
Obtiene todas las boletas de un proveedor específico.

```jsx
// Incluir todas (pagadas y no pagadas)
const todasLasBoletas = obtenerBoletasPorProveedor('Tito', true);

// Solo boletas pendientes
const soloNoPagadas = obtenerBoletasPorProveedor('Tito', false);
```

**Retorna:** Array de objetos boleta con:
```js
{
  id: 'boleta-0',
  index: 0,
  dia: 'Lunes',
  proveedor: 'Tito',
  costoTotal: 150000,
  cortes: [...],
  timestamp: '2026-01-30T...',
  estaPagada: true // ⭐ Estado de pago incluido
}
```

#### `obtenerEstadisticasProveedor(nombreProveedor)`
Obtiene estadísticas completas de un proveedor.

```jsx
const stats = obtenerEstadisticasProveedor('Tito');
```

**Retorna:**
```js
{
  totalBoletas: 10,
  boletasPagadas: 7,
  boletasPendientes: 3,
  montoTotal: 1500000,
  montoPagado: 1100000,
  montoPendiente: 400000
}
```

#### `obtenerPagosPorProveedor(nombreProveedor)`
Obtiene el historial de pagos realizados a un proveedor.

```jsx
const pagos = obtenerPagosPorProveedor('Tito');
// Retorna: Array de registros de pago
```

## Ejemplo Completo: Saldo Clientes

```jsx
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';

function SaldoClientes() {
  const { obtenerBoletasPorProveedor } = usePagosProveedores();
  const [clientName, setClientName] = useState('');

  // Obtener boletas para vincular (incluye boletas pagadas)
  const obtenerBoletasMercaderia = () => {
    if (!clientName.trim()) return [];
    
    // ⭐ Incluye tanto boletas nuevas como boletas ya pagadas
    const boletasProveedor = obtenerBoletasPorProveedor(clientName, true);
    
    return boletasProveedor;
  };

  return (
    <div>
      {obtenerBoletasMercaderia().map(boleta => (
        <div key={boleta.id}>
          <h5>{boleta.proveedor} - {boleta.dia}</h5>
          <p>Monto: ${boleta.costoTotal}</p>
          
          {/* ⭐ Mostrar si está pagada */}
          {boleta.estaPagada && (
            <span className="badge bg-success">💰 Pagada</span>
          )}
          
          <button onClick={() => vincular(boleta)}>
            Vincular
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Ventajas de esta Arquitectura

### ✅ Sin Duplicación de Datos
- No hay múltiples copias del estado
- Todo se lee desde Firebase en tiempo real
- Sincronización automática entre componentes

### ✅ Fuente Única de Verdad
- El estado vive en `semanaActiva.pagosProveedoresEstado`
- Todos los componentes leen del mismo lugar
- Cambios se propagan automáticamente

### ✅ Escalable
- Fácil agregar nuevas funciones al contexto
- Componentes no necesitan conocer la estructura de Firebase
- API limpia y bien definida

### ✅ Fácil de Mantener
- Lógica centralizada en un solo lugar
- Componentes más simples y limpios
- Testing más sencillo

## Integración con Otros Componentes

### Pagos a Proveedores
```jsx
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';

function PagosProveedoresTab() {
  const { boletas, obtenerEstadisticasProveedor } = usePagosProveedores();
  
  // Usar boletas directamente del contexto
  // No necesita calcularlas localmente
}
```

### Balance / Reportes
```jsx
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';

function Balance() {
  const { obtenerEstadisticasProveedor, proveedores } = usePagosProveedores();
  
  // Generar reporte de todos los proveedores
  const reporte = proveedores.map(prov => 
    obtenerEstadisticasProveedor(prov)
  );
}
```

## Migración desde Código Anterior

### Antes (Sin Contexto)
```jsx
// ❌ Cada componente calculaba su propio estado
const boletasPagadas = semanaActiva?.pagosProveedoresEstado?.boletasPagadas || {};
const estaPagada = boletasPagadas[boletaId] || false;
```

### Después (Con Contexto)
```jsx
// ✅ Usar el contexto
const { estaPagada } = usePagosProveedores();
const pagada = estaPagada(boletaId);
```

## Troubleshooting

### Error: "usePagosProveedores debe usarse dentro de PagosProveedoresProvider"
**Solución:** Asegúrate de que tu componente esté envuelto en el Provider:

```jsx
// App.jsx
<PagosProveedoresProvider>
  <TuComponente />
</PagosProveedoresProvider>
```

### Las boletas no se actualizan en tiempo real
**Solución:** El contexto usa `onSnapshot` de Firebase, debería actualizarse automáticamente. Verifica:
1. Que `useGestionSemanal` esté funcionando correctamente
2. Que `semanaActiva` tenga datos
3. La consola de Firebase por errores de permisos

### Performance: Demasiados re-renders
**Solución:** El contexto usa `useMemo` para optimizar. Si aún tienes problemas:
1. Usa `React.memo()` en tus componentes
2. Extrae solo lo que necesitas del contexto
3. Considera dividir el contexto si crece mucho

## Próximos Pasos / Mejoras Futuras

- [ ] Agregar caché local con IndexedDB
- [ ] Implementar historial de cambios
- [ ] Agregar notificaciones push cuando cambia el estado
- [ ] Migrar otros módulos a usar el contexto
- [ ] Crear dashboard de estadísticas en tiempo real

## Soporte

Para preguntas o problemas, revisar:
1. Este README
2. Código fuente en `src/contexts/PagosProveedoresContext.jsx`
3. Ejemplos en `src/pages/SaldoClientes.jsx`

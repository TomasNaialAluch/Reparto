import { useState } from 'react';
import { formatCurrency } from '../utils/money';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/NotificationContainer';

const DENOMINACIONES = [
  { valor: 20000, nombre: '$20.000' },
  { valor: 10000, nombre: '$10.000' },
  { valor: 2000, nombre: '$2.000' },
  { valor: 1000, nombre: '$1.000' },
  { valor: 500, nombre: '$500' }
];

export default function Contador() {
  const { notifications, removeNotification, showSuccess } = useNotifications();
  
  const [cantidades, setCantidades] = useState(
    DENOMINACIONES.reduce((acc, den) => ({ ...acc, [den.valor]: 0 }), {})
  );
  
  const [etiquetas, setEtiquetas] = useState([]);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState({ cantidad: 1, monto: '' });
  const [mostrarVista, setMostrarVista] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);

  // Actualizar cantidad de una denominación
  const actualizarCantidad = (valor, cantidad) => {
    setCantidades(prev => ({
      ...prev,
      [valor]: parseInt(cantidad) || 0
    }));
  };

  // Calcular total general
  const calcularTotal = () => {
    return DENOMINACIONES.reduce((total, den) => {
      return total + (den.valor * cantidades[den.valor]);
    }, 0);
  };

  // Alternar selección de denominación
  const toggleSeleccion = (valor) => {
    setSeleccionadas(prev => {
      if (prev.includes(valor)) {
        return prev.filter(v => v !== valor);
      } else {
        return [...prev, valor];
      }
    });
  };

  // Crear etiqueta combinada con las denominaciones seleccionadas
  const crearEtiquetaCombinada = () => {
    if (seleccionadas.length === 0) return;
    
    const totalCombinado = seleccionadas.reduce((total, valor) => {
      return total + (valor * cantidades[valor]);
    }, 0);

    if (totalCombinado > 0) {
      setEtiquetas(prev => [
        ...prev,
        {
          id: Date.now(),
          cantidad: 1,
          monto: totalCombinado
        }
      ]);
      
      const nombresSeleccionados = seleccionadas
        .map(v => DENOMINACIONES.find(d => d.valor === v)?.nombre)
        .join(' + ');
      
      showSuccess(`✓ Etiqueta combinada de ${formatCurrency(totalCombinado)} (${nombresSeleccionados})`);
      setSeleccionadas([]);
    }
  };

  // Calcular total de denominaciones seleccionadas
  const calcularTotalSeleccionadas = () => {
    return seleccionadas.reduce((total, valor) => {
      return total + (valor * cantidades[valor]);
    }, 0);
  };

  // Agregar etiqueta personalizada
  const agregarEtiqueta = () => {
    if (nuevaEtiqueta.monto && nuevaEtiqueta.cantidad > 0) {
      const monto = parseFloat(nuevaEtiqueta.monto);
      if (!isNaN(monto) && monto > 0) {
        setEtiquetas(prev => [
          ...prev,
          {
            id: Date.now(),
            cantidad: parseInt(nuevaEtiqueta.cantidad),
            monto: monto
          }
        ]);
        setNuevaEtiqueta({ cantidad: 1, monto: '' });
      }
    }
  };

  // Eliminar etiqueta
  const eliminarEtiqueta = (id) => {
    setEtiquetas(prev => prev.filter(e => e.id !== id));
  };

  // Limpiar todo
  const limpiarTodo = () => {
    setCantidades(DENOMINACIONES.reduce((acc, den) => ({ ...acc, [den.valor]: 0 }), {}));
    setEtiquetas([]);
    setNuevaEtiqueta({ cantidad: 1, monto: '' });
    setSeleccionadas([]);
  };

  // Imprimir
  const handleImprimir = () => {
    window.print();
  };

  const totalGeneral = calcularTotal();

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Panel de control - NO se imprime */}
        <div className="col-12 no-print">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>💵 Contador de Billetes</h2>
            <div className="d-flex gap-2">
              <button className="btn btn-warning" onClick={limpiarTodo}>
                🗑️ Limpiar Todo
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleImprimir}
                disabled={totalGeneral === 0 && etiquetas.length === 0}
              >
                🖨️ Imprimir Etiquetas
              </button>
            </div>
          </div>

          {/* Contador de Billetes */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Contar Billetes</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {DENOMINACIONES.map(den => {
                  const subtotal = den.valor * cantidades[den.valor];
                  const isSeleccionada = seleccionadas.includes(den.valor);
                  return (
                    <div key={den.valor} className="col-md-4 col-sm-6">
                      <div className={`card h-100 ${isSeleccionada ? 'border-warning border-3' : 'border-secondary'}`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSeleccionada}
                                onChange={() => toggleSeleccion(den.valor)}
                                disabled={subtotal === 0}
                                style={{ cursor: subtotal > 0 ? 'pointer' : 'not-allowed' }}
                              />
                              <h5 className="mb-0 text-primary">{den.nombre}</h5>
                            </div>
                            <span className="badge bg-secondary">x {cantidades[den.valor]}</span>
                          </div>
                          <input
                            type="number"
                            className="form-control mb-2"
                            min="0"
                            value={cantidades[den.valor]}
                            onChange={(e) => actualizarCantidad(den.valor, e.target.value)}
                            placeholder="Cantidad"
                          />
                          <div className="d-flex justify-content-between align-items-center">
                            <strong className="text-success">
                              {formatCurrency(subtotal)}
                            </strong>
                            {subtotal > 0 && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => {
                                  setEtiquetas(prev => [
                                    ...prev,
                                    {
                                      id: Date.now(),
                                      cantidad: 1,
                                      monto: subtotal
                                    }
                                  ]);
                                  showSuccess(`✓ Etiqueta de ${formatCurrency(subtotal)} agregada`);
                                }}
                                title="Crear etiqueta con este subtotal"
                              >
                                🏷️ Etiqueta
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total de billetes */}
              <div className="mt-4 p-3 bg-success text-white rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Total en Billetes:</h4>
                  <h3 className="mb-0">{formatCurrency(totalGeneral)}</h3>
                </div>
              </div>

              {/* Botón para combinar seleccionadas */}
              {seleccionadas.length > 0 && (
                <div className="mt-3">
                  <div className="alert alert-warning d-flex justify-content-between align-items-center mb-0">
                    <div>
                      <strong>Denominaciones seleccionadas ({seleccionadas.length}):</strong>
                      <div className="mt-1">
                        {seleccionadas.map(valor => {
                          const den = DENOMINACIONES.find(d => d.valor === valor);
                          const subtotal = valor * cantidades[valor];
                          return (
                            <span key={valor} className="badge bg-warning text-dark me-2">
                              {den.nombre}: {formatCurrency(subtotal)}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-2">
                        <strong>Total combinado: {formatCurrency(calcularTotalSeleccionadas())}</strong>
                      </div>
                    </div>
                    <button
                      className="btn btn-warning btn-lg"
                      onClick={crearEtiquetaCombinada}
                    >
                      🏷️ Crear Etiqueta Combinada
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Etiquetas Personalizadas */}
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Etiquetas Personalizadas</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Cantidad de Etiquetas</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={nuevaEtiqueta.cantidad}
                    onChange={(e) => setNuevaEtiqueta(prev => ({ ...prev, cantidad: e.target.value }))}
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label">Monto por Etiqueta</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ej: 50000"
                    value={nuevaEtiqueta.monto}
                    onChange={(e) => setNuevaEtiqueta(prev => ({ ...prev, monto: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && agregarEtiqueta()}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={agregarEtiqueta}
                  >
                    ➕ Agregar
                  </button>
                </div>
              </div>

              {/* Lista de etiquetas */}
              {etiquetas.length > 0 && (
                <div>
                  <h6>Etiquetas a Imprimir:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {etiquetas.map(etiqueta => (
                      <div key={etiqueta.id} className="badge bg-info fs-6 d-flex align-items-center gap-2">
                        {etiqueta.cantidad}x {formatCurrency(etiqueta.monto)}
                        <button
                          className="btn btn-sm btn-close btn-close-white"
                          onClick={() => eliminarEtiqueta(etiqueta.id)}
                          style={{ fontSize: '0.6rem', padding: '0.1rem' }}
                        ></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vista de Impresión - Solo se ve al imprimir */}
        <div className="col-12 print-only">
          <style>{`
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              @page {
                size: A4 portrait;
                margin: 0.5cm;
              }
              .etiqueta-container {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                max-height: 14cm; /* Mitad de A4 vertical (aprox 29.7cm / 2) */
                padding: 10px;
              }
              .etiqueta {
                border: 2px solid #000;
                padding: 20px 30px;
                text-align: center;
                font-size: 28pt;
                font-weight: bold;
                min-width: 200px;
                background: white;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
              }
              .etiqueta-total {
                border: 3px solid #000;
                padding: 30px 40px;
                text-align: center;
                font-size: 36pt;
                font-weight: bold;
                background: #f0f0f0;
                width: 100%;
                margin-top: 20px;
              }
            }
            @media screen {
              .print-only {
                display: none !important;
              }
            }
          `}</style>

          <div className="etiqueta-container">
            {/* Etiquetas personalizadas */}
            {etiquetas.map((etiqueta) => 
              Array.from({ length: etiqueta.cantidad }).map((_, i) => (
                <div key={`${etiqueta.id}-${i}`} className="etiqueta">
                  {formatCurrency(etiqueta.monto)}
                </div>
              ))
            )}
          </div>

          {/* Etiqueta de total */}
          {totalGeneral > 0 && (
            <div className="etiqueta-total">
              TOTAL: {formatCurrency(totalGeneral)}
            </div>
          )}
        </div>
      </div>

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}


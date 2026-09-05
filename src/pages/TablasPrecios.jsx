import React, { useState } from 'react';
import { useTablasPrecios } from '../firebase/hooks';

const TablasPrecios = () => {
  const {
    tablas,
    loading,
    crearTabla,
    renombrarTabla,
    agregarColumna,
    renombrarColumna,
    eliminarColumna,
    agregarFila,
    eliminarFila,
    actualizarCelda,
    eliminarTabla,
  } = useTablasPrecios();

  const [tablaSeleccionadaId, setTablaSeleccionadaId] = useState(null);
  const [editandoNombreTabla, setEditandoNombreTabla] = useState(false);
  const [nombreTablaTemp, setNombreTablaTemp] = useState('');
  const [editandoColumna, setEditandoColumna] = useState(null); // índice de columna en edición
  const [nombreColumnaTemp, setNombreColumnaTemp] = useState('');
  const [creandoTabla, setCreandoTabla] = useState(false);
  const [nombreNuevaTabla, setNombreNuevaTabla] = useState('');

  const tablaSeleccionada = tablas.find(t => t.id === tablaSeleccionadaId) || null;

  const handleConfirmarCrearTabla = async () => {
    const nombre = nombreNuevaTabla.trim();
    if (!nombre) return;
    const id = await crearTabla(nombre);
    setTablaSeleccionadaId(id);
    setNombreNuevaTabla('');
    setCreandoTabla(false);
  };

  const handleEliminarTabla = async (tabla) => {
    if (!window.confirm(`¿Eliminar la tabla "${tabla.nombre}"? Esta acción no se puede deshacer.`)) return;
    await eliminarTabla(tabla.id);
    if (tablaSeleccionadaId === tabla.id) setTablaSeleccionadaId(null);
  };

  const iniciarEdicionNombreTabla = () => {
    setNombreTablaTemp(tablaSeleccionada.nombre);
    setEditandoNombreTabla(true);
  };

  const guardarNombreTabla = async () => {
    const nombre = nombreTablaTemp.trim();
    if (nombre && nombre !== tablaSeleccionada.nombre) {
      await renombrarTabla(tablaSeleccionada.id, nombre);
    }
    setEditandoNombreTabla(false);
  };

  const iniciarEdicionColumna = (colIdx) => {
    setEditandoColumna(colIdx);
    setNombreColumnaTemp(tablaSeleccionada.columnas[colIdx]);
  };

  const guardarNombreColumna = async () => {
    const nombre = nombreColumnaTemp.trim() || tablaSeleccionada.columnas[editandoColumna];
    await renombrarColumna(tablaSeleccionada, editandoColumna, nombre);
    setEditandoColumna(null);
  };

  const handleCelda = (filaIdx, colIdx, valor) => {
    actualizarCelda(tablaSeleccionada, filaIdx, colIdx, valor);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3 px-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">📊 Lista de Precios</h2>
        {creandoTabla ? (
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Nombre de la tabla"
              value={nombreNuevaTabla}
              autoFocus
              onChange={(e) => setNombreNuevaTabla(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmarCrearTabla();
                if (e.key === 'Escape') { setCreandoTabla(false); setNombreNuevaTabla(''); }
              }}
            />
            <button type="button" className="btn btn-sm btn-success" onClick={handleConfirmarCrearTabla} disabled={!nombreNuevaTabla.trim()}>
              <i className="fas fa-check"></i>
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setCreandoTabla(false); setNombreNuevaTabla(''); }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setCreandoTabla(true)}>
            + Nueva Tabla
          </button>
        )}
      </div>

      <div className="row">
        {/* Lista de tablas */}
        <div className="col-lg-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">Tablas ({tablas.length})</h6>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {tablas.length === 0 ? (
                <div className="text-center text-muted py-4 px-2">
                  <p className="mb-0 small">No hay tablas creadas todavía.</p>
                </div>
              ) : (
                tablas.map(tabla => (
                  <div
                    key={tabla.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${tabla.id === tablaSeleccionadaId ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setTablaSeleccionadaId(tabla.id)}
                  >
                    <span className="text-truncate">{tabla.nombre}</span>
                    <button
                      type="button"
                      className={`btn btn-sm ${tabla.id === tablaSeleccionadaId ? 'btn-light' : 'btn-outline-danger'}`}
                      onClick={(e) => { e.stopPropagation(); handleEliminarTabla(tabla); }}
                      title="Eliminar tabla"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Grilla de la tabla seleccionada */}
        <div className="col-lg-9">
          {!tablaSeleccionada ? (
            <div className="card shadow-sm">
              <div className="card-body text-center text-muted py-5">
                <i className="fas fa-table fa-3x mb-3"></i>
                <p>Seleccioná una tabla de la izquierda o creá una nueva.</p>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                {editandoNombreTabla ? (
                  <input
                    type="text"
                    className="form-control form-control-sm w-auto"
                    style={{ maxWidth: '300px' }}
                    value={nombreTablaTemp}
                    autoFocus
                    onChange={(e) => setNombreTablaTemp(e.target.value)}
                    onBlur={guardarNombreTabla}
                    onKeyDown={(e) => e.key === 'Enter' && guardarNombreTabla()}
                  />
                ) : (
                  <h5 className="mb-0" style={{ cursor: 'text' }} onClick={iniciarEdicionNombreTabla} title="Click para renombrar">
                    {tablaSeleccionada.nombre}
                    <i className="fas fa-pen ms-2 text-muted" style={{ fontSize: '0.7rem' }}></i>
                  </h5>
                )}
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => agregarColumna(tablaSeleccionada)}>
                    <i className="fas fa-plus me-1"></i>Columna
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-success" onClick={() => agregarFila(tablaSeleccionada)}>
                    <i className="fas fa-plus me-1"></i>Fila
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-sm mb-0" style={{ tableLayout: 'fixed' }}>
                    <thead className="table-light">
                      <tr>
                        {tablaSeleccionada.columnas.map((col, colIdx) => (
                          <th key={colIdx} style={{ minWidth: '140px' }}>
                            <div className="d-flex align-items-center justify-content-between gap-1">
                              {editandoColumna === colIdx ? (
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={nombreColumnaTemp}
                                  autoFocus
                                  onChange={(e) => setNombreColumnaTemp(e.target.value)}
                                  onBlur={guardarNombreColumna}
                                  onKeyDown={(e) => e.key === 'Enter' && guardarNombreColumna()}
                                />
                              ) : (
                                <span
                                  style={{ cursor: 'text' }}
                                  onClick={() => iniciarEdicionColumna(colIdx)}
                                  title="Click para renombrar columna"
                                >
                                  {col}
                                </span>
                              )}
                              {tablaSeleccionada.columnas.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => eliminarColumna(tablaSeleccionada, colIdx)}
                                  title="Eliminar columna"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaSeleccionada.filas.map((fila, filaIdx) => (
                        <tr key={filaIdx}>
                          {fila.valores.map((valor, colIdx) => (
                            <td key={colIdx} className="p-0">
                              <input
                                type="text"
                                className="form-control form-control-sm border-0"
                                defaultValue={valor}
                                onBlur={(e) => handleCelda(filaIdx, colIdx, e.target.value)}
                              />
                            </td>
                          ))}
                          <td className="text-center align-middle">
                            {tablaSeleccionada.filas.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0"
                                onClick={() => eliminarFila(tablaSeleccionada, filaIdx)}
                                title="Eliminar fila"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TablasPrecios;

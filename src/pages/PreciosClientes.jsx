import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import './PreciosClientes.css';

const CORTES_INICIALES = [
  { id: 'nalga', nombre: 'Nalga' },
  { id: 'bolaLomo', nombre: 'Bola de lomo' },
  { id: 'peceto', nombre: 'Peceto' }
];

const CLIENTES_INICIALES = [
  {
    id: 'c1',
    nombre: 'Cliente A',
    grupo: 'Restaurantes',
    deuda: 0,
    notas: '',
    precios: {
      nalga: 3500,
      bolaLomo: 3600,
      peceto: 3800
    }
  },
  {
    id: 'c2',
    nombre: 'Cliente B',
    grupo: 'Restaurantes',
    deuda: 15000,
    notas: 'Pagar el viernes',
    precios: {
      nalga: 3400,
      bolaLomo: 3500,
      peceto: 3700
    }
  },
  {
    id: 'c3',
    nombre: 'Cliente C',
    grupo: 'Carnicerías',
    deuda: 0,
    notas: '',
    precios: {
      nalga: 3600,
      bolaLomo: 3700,
      peceto: 3900
    }
  }
];

const PreciosClientes = () => {
  const [cortes, setCortes] = useState(CORTES_INICIALES);
  const [clientes, setClientes] = useState(CLIENTES_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('todos');

  const listasRefs = useRef({});
  const sortablesRef = useRef({});

  const grupos = useMemo(() => {
    const set = new Set();
    clientes.forEach((c) => {
      if (c.grupo) {
        set.add(c.grupo);
      }
    });
    return Array.from(set);
  }, [clientes]);

  const clientesFiltrados = useMemo(
    () =>
      clientes.filter((c) => {
        const matchNombre = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchGrupo = grupoFiltro === 'todos' || c.grupo === grupoFiltro;
        return matchNombre && matchGrupo;
      }),
    [clientes, busqueda, grupoFiltro]
  );

  const gruposConClientes = useMemo(() => {
    const mapa = new Map();
    clientesFiltrados.forEach((c) => {
      const key = c.grupo && c.grupo.trim() ? c.grupo.trim() : 'Sin grupo';
      if (!mapa.has(key)) {
        mapa.set(key, []);
      }
      mapa.get(key).push(c);
    });
    return Array.from(mapa.entries()); // [ [grupoNombre, clientes[]], ... ]
  }, [clientesFiltrados]);

  const actualizarPrecio = (clienteId, corteId, valor) => {
    const precio = parseFloat(String(valor).replace(',', '.'));
    setClientes((prev) =>
      prev.map((c) =>
        c.id === clienteId
          ? {
              ...c,
              precios: {
                ...c.precios,
                [corteId]: Number.isNaN(precio) ? '' : precio
              }
            }
          : c
      )
    );
  };

  const actualizarCampoCliente = (clienteId, campo, valor) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === clienteId
          ? {
              ...c,
              [campo]:
                campo === 'deuda'
                  ? (() => {
                      const num = parseFloat(String(valor).replace(',', '.'));
                      return Number.isNaN(num) ? 0 : num;
                    })()
                  : valor
            }
          : c
      )
    );
  };

  const crearCliente = (grupoNombre = '') => {
    const id = `c-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    const grupoLimpio = grupoNombre === 'Sin grupo' ? '' : grupoNombre;
    setClientes((prev) => [
      ...prev,
      {
        id,
        nombre: 'Nuevo cliente',
        grupo: grupoLimpio,
        deuda: 0,
        notas: '',
        precios: {}
      }
    ]);
  };

  const agregarClienteEnGrupo = (grupoNombre) => {
    crearCliente(grupoNombre);
  };

  const agregarClienteSinGrupo = () => {
    crearCliente('Sin grupo');
  };

  const agregarCorte = () => {
    setCortes((prev) => {
      const index = prev.length + 1;
      const id = `corte-${Date.now()}-${index}`;
      return [...prev, { id, nombre: `Nuevo corte ${index}` }];
    });
  };

  const actualizarNombreCorte = (corteId, nuevoNombre) => {
    setCortes((prev) => prev.map((c) => (c.id === corteId ? { ...c, nombre: nuevoNombre } : c)));
  };

  const eliminarCorte = (corteId) => {
    setCortes((prev) => prev.filter((c) => c.id !== corteId));
    setClientes((prev) =>
      prev.map((cliente) => {
        if (!cliente.precios) return cliente;
        const { [corteId]: _omit, ...resto } = cliente.precios;
        return { ...cliente, precios: resto };
      })
    );
  };

  const eliminarCliente = (clienteId) => {
    setClientes((prev) => prev.filter((c) => c.id !== clienteId));
  };

  const renombrarGrupo = (grupoAnterior, nuevoNombreCrudo) => {
    const nuevoNombre = nuevoNombreCrudo.trim();
    const destino = nuevoNombre === '' ? '' : nuevoNombre;

    setClientes((prev) =>
      prev.map((c) => {
        const labelActual =
          c.grupo && c.grupo.trim() ? c.grupo.trim() : 'Sin grupo';
        if (labelActual !== grupoAnterior) return c;
        return {
          ...c,
          grupo: destino
        };
      })
    );
  };

  useEffect(() => {
    // Destruir instancias anteriores
    Object.values(sortablesRef.current).forEach((sortable) => {
      if (sortable && typeof sortable.destroy === 'function') {
        sortable.destroy();
      }
    });
    sortablesRef.current = {};

    gruposConClientes.forEach(([grupoNombre]) => {
      const el = listasRefs.current[grupoNombre];
      if (!el) return;

      sortablesRef.current[grupoNombre] = new Sortable(el, {
        group: 'clientes',
        animation: 150,
        ghostClass: 'pc-cliente-ghost',
        onEnd: (evt) => {
          const itemEl = evt.item;
          const clienteId = itemEl?.dataset?.id;
          const fromGrupo = evt.from?.dataset?.grupo;
          const toGrupo = evt.to?.dataset?.grupo;

          if (!clienteId || !fromGrupo || !toGrupo) return;
          if (fromGrupo === toGrupo && evt.oldIndex === evt.newIndex) return;

          setClientes((prev) => {
            const destinoLabel = toGrupo === 'Sin grupo' ? '' : toGrupo;
            return prev.map((c) =>
              c.id === clienteId
                ? {
                    ...c,
                    grupo: destinoLabel
                  }
                : c
            );
          });
        }
      });
    });

    return () => {
      Object.values(sortablesRef.current).forEach((sortable) => {
        if (sortable && typeof sortable.destroy === 'function') {
          sortable.destroy();
        }
      });
      sortablesRef.current = {};
    };
  }, [gruposConClientes, setClientes]);

  return (
    <div className="precios-clientes-page">
      <header className="pc-header">
        <div>
          <h1>Precios por Cliente</h1>
          <p className="pc-subtitle">
            Tabla tipo Excel: clientes en filas, cortes en columnas (precio por kg).
          </p>
        </div>
      </header>

      <section className="pc-filtros">
        <div className="pc-filtro-item">
          <label htmlFor="pc-busqueda">Buscar cliente</label>
          <input
            id="pc-busqueda"
            type="text"
            placeholder="Nombre del cliente..."
            value={busqueda}
            spellCheck={false}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="pc-filtro-item">
          <label htmlFor="pc-grupo">Grupo</label>
          <select
            id="pc-grupo"
            value={grupoFiltro}
            onChange={(e) => setGrupoFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            {grupos.map((grupo) => (
              <option key={grupo} value={grupo}>
                {grupo}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="pc-tabla-wrapper">
        <div className="pc-tabla">
          <div className="pc-tabla-header">
            <div className="pc-col-fija pc-header-cell">Cliente</div>
            <div className="pc-col-scroll">
              <div className="pc-row-cortes">
                {cortes.map((corte) => (
                  <div key={corte.id} className="pc-header-cell pc-corte-cell">
                    <div className="pc-corte-header">
                      <input
                        type="text"
                        className="pc-corte-input"
                        value={corte.nombre}
                        spellCheck={false}
                        onChange={(e) => actualizarNombreCorte(corte.id, e.target.value)}
                      />
                      <button
                        type="button"
                        className="pc-icon-btn pc-corte-delete"
                        onClick={() => eliminarCorte(corte.id)}
                        aria-label="Eliminar corte"
                      >
                        ×
                      </button>
                    </div>
                    <span className="pc-header-sub">$/kg</span>
                  </div>
                ))}
                <button
                  type="button"
                  className="pc-header-cell pc-corte-cell pc-corte-add"
                  onClick={agregarCorte}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="pc-tabla-body">
            {gruposConClientes.map(([grupoNombre, clientesDelGrupo]) => (
              <React.Fragment key={grupoNombre}>
                <div className="pc-row pc-grupo-header-row">
                  <div className="pc-col-fija pc-grupo-header">
                    <input
                      type="text"
                      className="pc-grupo-input"
                      defaultValue={grupoNombre === 'Sin grupo' ? '' : grupoNombre}
                      spellCheck={false}
                      onBlur={(e) => renombrarGrupo(grupoNombre, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="pc-btn pc-btn-ghost pc-grupo-add-btn"
                      onClick={() => agregarClienteEnGrupo(grupoNombre)}
                    >
                      + Cliente
                    </button>
                  </div>
                  <div className="pc-col-scroll pc-grupo-header-filler" />
                </div>

                <div
                  ref={(el) => {
                    if (el) {
                      listasRefs.current[grupoNombre] = el;
                    }
                  }}
                  data-grupo={grupoNombre}
                  className="pc-grupo-lista-clientes"
                >
                  {clientesDelGrupo.map((cliente) => (
                    <div
                      key={cliente.id}
                      data-id={cliente.id}
                      className="pc-row pc-cliente-row"
                    >
                      <div className="pc-col-fija pc-cliente-cell">
                        <div className="pc-cliente-header">
                          <input
                            type="text"
                            className="pc-cliente-nombre-input"
                            value={cliente.nombre}
                            spellCheck={false}
                            onChange={(e) =>
                              actualizarCampoCliente(cliente.id, 'nombre', e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="pc-icon-btn pc-cliente-delete"
                            onClick={() => eliminarCliente(cliente.id)}
                            aria-label="Eliminar cliente"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="pc-col-scroll">
                        <div className="pc-row-precios">
                          {cortes.map((corte) => (
                            <div key={corte.id} className="pc-precio-cell">
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="10"
                                value={cliente.precios?.[corte.id] ?? ''}
                                onChange={(e) =>
                                  actualizarPrecio(cliente.id, corte.id, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}

            {clientesFiltrados.length === 0 && (
              <div className="pc-empty-state">No hay clientes que coincidan con el filtro.</div>
            )}

            <div className="pc-grupo-footer-global">
              <button
                type="button"
                className="pc-btn pc-btn-secondary"
                onClick={agregarClienteSinGrupo}
              >
                + Cliente sin grupo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreciosClientes;


import React from 'react';
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';
import { formatCurrency } from '../utils/money';

/**
 * Componente de ejemplo que muestra cómo usar el contexto de Pagos a Proveedores
 * Muestra estadísticas de todos los proveedores
 */
const EstadisticasProveedores = () => {
  const { 
    proveedores, 
    obtenerEstadisticasProveedor,
    loading 
  } = usePagosProveedores();

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted">
          <p>No hay proveedores registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">📊 Estadísticas de Proveedores</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th className="text-center">Total Boletas</th>
                <th className="text-center">Pagadas</th>
                <th className="text-center">Pendientes</th>
                <th className="text-end">Monto Total</th>
                <th className="text-end">Pagado</th>
                <th className="text-end">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map(proveedor => {
                const stats = obtenerEstadisticasProveedor(proveedor);
                const progresoPorcentaje = stats.totalBoletas > 0 
                  ? (stats.boletasPagadas / stats.totalBoletas * 100).toFixed(0)
                  : 0;

                return (
                  <tr key={proveedor}>
                    <td>
                      <strong>{proveedor}</strong>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-secondary">
                        {stats.totalBoletas}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-success">
                        {stats.boletasPagadas}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-warning text-dark">
                        {stats.boletasPendientes}
                      </span>
                    </td>
                    <td className="text-end">
                      {formatCurrency(stats.montoTotal)}
                    </td>
                    <td className="text-end text-success">
                      {formatCurrency(stats.montoPagado)}
                    </td>
                    <td className="text-end text-danger">
                      {formatCurrency(stats.montoPendiente)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan="7">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Total de proveedores: {proveedores.length}
                    </small>
                    <small className="text-muted">
                      Actualizado en tiempo real desde Firebase
                    </small>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Resumen por proveedor con barras de progreso */}
        <div className="mt-4">
          <h6 className="mb-3">Progreso de Pagos por Proveedor</h6>
          {proveedores.map(proveedor => {
            const stats = obtenerEstadisticasProveedor(proveedor);
            const progresoPorcentaje = stats.totalBoletas > 0 
              ? (stats.boletasPagadas / stats.totalBoletas * 100)
              : 0;

            return (
              <div key={proveedor} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-bold">{proveedor}</span>
                  <span className="text-muted">
                    {stats.boletasPagadas} / {stats.totalBoletas} boletas
                  </span>
                </div>
                <div className="progress" style={{ height: '25px' }}>
                  <div 
                    className={`progress-bar ${progresoPorcentaje === 100 ? 'bg-success' : 'bg-primary'}`}
                    role="progressbar" 
                    style={{ width: `${progresoPorcentaje}%` }}
                    aria-valuenow={progresoPorcentaje} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {progresoPorcentaje.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasProveedores;

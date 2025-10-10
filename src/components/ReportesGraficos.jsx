import React, { useState, useMemo } from 'react';

const ReportesGraficos = ({ repartos }) => {
  const [tipoReporte, setTipoReporte] = useState('semanal'); // semanal, mensual, anual
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM para mensual
  const [isExpanded, setIsExpanded] = useState(false); // Estado para vista expandida/colapsada

  // Función para obtener nombre del día
  const getDiaNombre = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date(fecha).getDay()];
  };

  // Función para obtener nombre del mes
  const getMesNombre = (fecha) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[new Date(fecha).getMonth()];
  };

  // Calcular estadísticas por día de la semana
  const estadisticasPorDia = useMemo(() => {
    const stats = {
      'Lunes': { cantidad: 0, total: 0, repartos: [] },
      'Martes': { cantidad: 0, total: 0, repartos: [] },
      'Miércoles': { cantidad: 0, total: 0, repartos: [] },
      'Jueves': { cantidad: 0, total: 0, repartos: [] },
      'Viernes': { cantidad: 0, total: 0, repartos: [] },
      'Sábado': { cantidad: 0, total: 0, repartos: [] },
      'Domingo': { cantidad: 0, total: 0, repartos: [] }
    };

    // Filtrar repartos según el tipo de reporte
    let repartosFiltrados = repartos;
    
    if (tipoReporte === 'mensual') {
      repartosFiltrados = repartos.filter(reparto => 
        reparto.date.startsWith(periodo)
      );
    } else if (tipoReporte === 'anual') {
      const año = periodo.slice(0, 4);
      repartosFiltrados = repartos.filter(reparto => 
        reparto.date.startsWith(año)
      );
    }

    // Procesar cada reparto
    repartosFiltrados.forEach(reparto => {
      const diaNombre = getDiaNombre(reparto.date);
      const totalReparto = reparto.clients?.reduce((sum, client) => 
        sum + parseFloat(client.billAmount || 0), 0) || 0;
      
      if (stats[diaNombre]) {
        stats[diaNombre].cantidad += 1;
        stats[diaNombre].total += totalReparto;
        stats[diaNombre].repartos.push({
          fecha: reparto.date,
          total: totalReparto,
          clientes: reparto.clients?.length || 0
        });
      }
    });

    return stats;
  }, [repartos, tipoReporte, periodo]);

  // Calcular totales generales
  const totalesGenerales = useMemo(() => {
    const totalRepartos = Object.values(estadisticasPorDia).reduce((sum, stat) => sum + stat.cantidad, 0);
    const totalVentas = Object.values(estadisticasPorDia).reduce((sum, stat) => sum + stat.total, 0);
    const promedioPorReparto = totalRepartos > 0 ? totalVentas / totalRepartos : 0;

    return {
      totalRepartos,
      totalVentas,
      promedioPorReparto
    };
  }, [estadisticasPorDia]);

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Función para obtener el color de la barra
  const getBarColor = (dia) => {
    const colores = {
      'Lunes': '#FF6B6B',
      'Martes': '#4ECDC4', 
      'Miércoles': '#45B7D1',
      'Jueves': '#96CEB4',
      'Viernes': '#FFEAA7',
      'Sábado': '#DDA0DD',
      'Domingo': '#98D8C8'
    };
    return colores[dia] || '#95A5A6';
  };

  // Encontrar el mejor y peor día
  const mejorDia = Object.entries(estadisticasPorDia).reduce((best, [dia, stats]) => 
    stats.total > best.total ? { dia, ...stats } : best, 
    { dia: 'N/A', total: 0 }
  );

  const peorDia = Object.entries(estadisticasPorDia).reduce((worst, [dia, stats]) => 
    stats.total < worst.total && stats.total > 0 ? { dia, ...stats } : worst, 
    { dia: 'N/A', total: Infinity }
  );

  return (
    <div className="card p-3">
      {/* Header con botón de expandir */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">📊 Reportes por Día de la Semana</h6>
        <div className="d-flex gap-2 align-items-center">
          {isExpanded && (
            <div className="d-flex gap-2">
              <select 
                className="form-select form-select-sm"
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="semanal">Esta Semana</option>
                <option value="mensual">Este Mes</option>
                <option value="anual">Este Año</option>
              </select>
              
              {(tipoReporte === 'mensual' || tipoReporte === 'anual') && (
                <input
                  type={tipoReporte === 'mensual' ? 'month' : 'number'}
                  className="form-control form-control-sm"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  style={{ width: 'auto' }}
                />
              )}
            </div>
          )}
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Contraer vista" : "Expandir vista"}
          >
            {isExpanded ? 'Contraer' : 'Expandir'}
          </button>
        </div>
      </div>

      {/* Vista Compacta (siempre visible) */}
      <div className="row text-center">
        <div className="col-3">
          <div className="border rounded p-2">
            <small className="text-muted">Total Repartos</small>
            <div className="fw-bold text-primary">{totalesGenerales.totalRepartos}</div>
          </div>
        </div>
        <div className="col-3">
          <div className="border rounded p-2">
            <small className="text-muted">Total Ventas</small>
            <div className="fw-bold text-success">{formatCurrency(totalesGenerales.totalVentas)}</div>
          </div>
        </div>
        <div className="col-3">
          <div className="border rounded p-2">
            <small className="text-muted">Promedio/Reparto</small>
            <div className="fw-bold text-info">{formatCurrency(totalesGenerales.promedioPorReparto)}</div>
          </div>
        </div>
        <div className="col-3">
          <div className="border rounded p-2">
            <small className="text-muted">🏆 Mejor Día</small>
            <div className="fw-bold text-success">
              {mejorDia.dia}<br/>
              <small>{formatCurrency(mejorDia.total)}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Vista Expandida (solo si isExpanded es true) */}
      {isExpanded && (
        <>
          {/* Peor Día (solo en vista expandida) */}
          <div className="row text-center mb-3 mt-3">
            <div className="col-12">
              <div className="border rounded p-2 bg-light">
                <small className="text-muted">📉 Peor Día</small>
                <div className="fw-bold text-warning">
                  {peorDia.dia !== 'N/A' ? peorDia.dia : 'Sin datos'}<br/>
                  <small>{peorDia.dia !== 'N/A' ? formatCurrency(peorDia.total) : '-'}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras */}
          <div className="mb-3">
            <h6 className="mb-2">Comparación por Día</h6>
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', justifyContent: 'space-between', padding: '10px', border: '1px solid #dee2e6', borderRadius: '5px', backgroundColor: '#f8f9fa' }}>
              {Object.entries(estadisticasPorDia).map(([dia, stats]) => {
                const maxTotal = Math.max(...Object.values(estadisticasPorDia).map(s => s.total));
                const altura = maxTotal > 0 ? (stats.total / maxTotal) * 150 : 0;
                
                return (
                  <div key={dia} className="d-flex flex-column align-items-center" style={{ width: '12%' }}>
                    <div className="text-center mb-1">
                      <small className="fw-bold">{dia.slice(0, 3)}</small><br/>
                      <small className="text-muted">{stats.cantidad}</small>
                    </div>
                    <div 
                      className="rounded-top"
                      style={{
                        width: '100%',
                        height: `${altura}px`,
                        backgroundColor: getBarColor(dia),
                        minHeight: stats.total > 0 ? '5px' : '0px',
                        transition: 'all 0.3s ease'
                      }}
                      title={`${dia}: ${formatCurrency(stats.total)} (${stats.cantidad} repartos)`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla Detallada */}
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Día</th>
                  <th className="text-center">Repartos</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(estadisticasPorDia)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([dia, stats]) => (
                  <tr key={dia}>
                    <td className="fw-bold">{dia}</td>
                    <td className="text-center">{stats.cantidad}</td>
                    <td className="text-end">{formatCurrency(stats.total)}</td>
                    <td className="text-end">
                      {stats.cantidad > 0 ? formatCurrency(stats.total / stats.cantidad) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mensaje si no hay datos */}
      {totalesGenerales.totalRepartos === 0 && (
        <div className="text-center text-muted py-3">
          <i className="fas fa-chart-bar fa-2x mb-2"></i>
          <p className="mb-0">No hay datos para mostrar</p>
          <small>Agrega repartos para ver estadísticas</small>
        </div>
      )}
    </div>
  );
};

export default ReportesGraficos;


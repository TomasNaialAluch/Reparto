import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useDolarData } from '../hooks/useDolarData';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DolarHoy = () => {
  const { cotizaciones, historico, loading, error, recargar } = useDolarData();
  const [vistaGrafico, setVistaGrafico] = useState('semanal'); // 'semanal' o 'anual'
  
  console.log('🎯 DolarHoy renderizando:', { loading, error, cotizaciones, historico });

  // Preparar datos para gráficos
  const prepararDatosGrafico = () => {
    if (!historico) return null;

    const datos = vistaGrafico === 'semanal' ? historico.semanal : historico.anual;

    return {
      labels: datos.map(d => d.fecha),
      datasets: [
        {
          label: 'Dólar Oficial',
          data: datos.map(d => d.oficial),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Dólar Blue',
          data: datos.map(d => d.blue),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Dólar MEP',
          data: datos.map(d => d.mep),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: vistaGrafico === 'semanal' ? 'Evolución Semanal del Dólar' : 'Evolución Anual del Dólar',
        font: {
          size: 18
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      }
    }
  };

  const calcularVariacion = (compra, venta) => {
    if (!compra || !venta) return null;
    const variacion = ((venta - compra) / compra) * 100;
    return variacion;
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center" style={{ padding: '50px', backgroundColor: 'white', borderRadius: '10px' }}>
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h3 className="mt-3">💵 Cargando cotizaciones del dólar...</h3>
          <p className="text-muted">Obteniendo datos de DolarAPI.com</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-4 mb-2">
            💵 Dólar Hoy
          </h1>
          <p className="text-muted">
            Cotizaciones en tiempo real • Actualizado: {new Date().toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Cotizaciones actuales */}
      <div className="row mb-4">
        {cotizaciones && cotizaciones.length > 0 ? cotizaciones.map((dolar, index) => {
          const variacion = calcularVariacion(dolar.compra, dolar.venta);
          const isPositive = variacion > 0;
          
          return (
            <div key={index} className="col-lg-3 col-md-4 col-sm-6 mb-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-uppercase text-primary mb-3">
                    {dolar.nombre}
                  </h5>
                  
                  <div className="mb-2">
                    <small className="text-muted">Compra</small>
                    <div className="h4 mb-0 text-success">
                      ${dolar.compra?.toFixed(2) || 'N/A'}
                    </div>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">Venta</small>
                    <div className="h4 mb-0 text-danger">
                      ${dolar.venta?.toFixed(2) || 'N/A'}
                    </div>
                  </div>

                  {variacion !== null && (
                    <div className="mt-3">
                      <span className={`badge ${isPositive ? 'bg-success' : 'bg-danger'}`}>
                        {isPositive ? '↑' : '↓'} {Math.abs(variacion).toFixed(2)}%
                      </span>
                    </div>
                  )}

                  <small className="text-muted d-block mt-2">
                    Actualizado: {new Date(dolar.fechaActualizacion).toLocaleTimeString('es-AR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </small>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-12">
            <div className="alert alert-info">
              <h5>📊 Sin datos de cotizaciones</h5>
              <p>No se pudieron cargar las cotizaciones. Haz clic en "Actualizar ahora" para reintentar.</p>
            </div>
          </div>
        )}
      </div>

      {/* Selector de vista de gráfico */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${vistaGrafico === 'semanal' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaGrafico('semanal')}
            >
              📊 Vista Semanal
            </button>
            <button
              type="button"
              className={`btn ${vistaGrafico === 'anual' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVistaGrafico('anual')}
            >
              📈 Vista Anual
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico de evolución */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div style={{ height: '400px' }}>
                {historico ? (
                  <Line data={prepararDatosGrafico()} options={opcionesGrafico} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <p className="text-muted">Cargando gráfico...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title">ℹ️ Sobre las cotizaciones</h5>
              <ul className="mb-0">
                <li><strong>Dólar Oficial:</strong> Cotización del Banco Central (BCRA)</li>
                <li><strong>Dólar Blue:</strong> Cotización del mercado paralelo</li>
                <li><strong>Dólar MEP:</strong> Mediante títulos públicos (Mercado Electrónico de Pagos)</li>
                <li><strong>Dólar Tarjeta:</strong> Para compras en el exterior con tarjeta</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title">🔄 Actualización</h5>
              <p className="mb-2">
                Las cotizaciones se actualizan automáticamente cada 5 minutos.
              </p>
              <p className="mb-2">
                <small className="text-muted">
                  Fuente de datos: DolarAPI.com
                </small>
              </p>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={recargar}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Actualizando...
                  </>
                ) : (
                  <>🔄 Actualizar ahora</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con advertencia */}
      <div className="row">
        <div className="col-12">
          <div className="alert alert-warning" role="alert">
            <strong>⚠️ Importante:</strong> Los valores mostrados son informativos y pueden variar según la fuente. 
            Para operaciones financieras, consultar con entidades oficiales.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DolarHoy;

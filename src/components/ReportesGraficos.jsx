import React, { useState, useMemo } from 'react';

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

const BAR_COLORS = {
  Lunes:     '#6A8899',
  Martes:    '#BEE3DB',
  Miércoles: '#90C3D4',
  Jueves:    '#A3D2CA',
  Viernes:   '#FFD166',
  Sábado:    '#DDA0DD',
  Domingo:   '#98D8C8',
};

const formatCurrency = (v) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS',
  minimumFractionDigits: 0, maximumFractionDigits: 0
}).format(v);

const StatBox = ({ label, value, color = '#212529', small = false }) => (
  <div style={{ textAlign: 'center', padding: '6px 0' }}>
    <div style={{ fontSize: '0.67rem', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: small ? '0.72rem' : '0.9rem', color, lineHeight: 1.2 }}>{value}</div>
  </div>
);

const ReportesGraficos = ({ repartos }) => {
  const [tipoReporte, setTipoReporte] = useState('semanal');
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [isExpanded, setIsExpanded] = useState(false);

  const getDiaNombre = (fecha) => {
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return dias[new Date(fecha).getDay()];
  };

  const estadisticasPorDia = useMemo(() => {
    const stats = Object.fromEntries(DIAS.map(d => [d, { cantidad: 0, total: 0 }]));
    let filtrados = repartos;
    if (tipoReporte === 'mensual') filtrados = repartos.filter(r => r.date.startsWith(periodo));
    else if (tipoReporte === 'anual') filtrados = repartos.filter(r => r.date.startsWith(periodo.slice(0, 4)));

    filtrados.forEach(r => {
      const dia = getDiaNombre(r.date);
      const total = r.clientes?.reduce((s, c) => s + parseFloat(c.billAmount || 0), 0)
                 || r.clients?.reduce((s, c) => s + parseFloat(c.billAmount || 0), 0)
                 || r.total || 0;
      if (stats[dia]) { stats[dia].cantidad += 1; stats[dia].total += total; }
    });
    return stats;
  }, [repartos, tipoReporte, periodo]);

  const totales = useMemo(() => {
    const totalRepartos = Object.values(estadisticasPorDia).reduce((s, d) => s + d.cantidad, 0);
    const totalVentas   = Object.values(estadisticasPorDia).reduce((s, d) => s + d.total, 0);
    return { totalRepartos, totalVentas, promedio: totalRepartos > 0 ? totalVentas / totalRepartos : 0 };
  }, [estadisticasPorDia]);

  const mejorDia = Object.entries(estadisticasPorDia).reduce(
    (best, [dia, s]) => s.total > best.total ? { dia, ...s } : best,
    { dia: '—', total: 0 }
  );
  const peorDia = Object.entries(estadisticasPorDia).reduce(
    (worst, [dia, s]) => s.total > 0 && s.total < worst.total ? { dia, ...s } : worst,
    { dia: '—', total: Infinity }
  );

  const maxTotal = Math.max(...Object.values(estadisticasPorDia).map(s => s.total), 1);

  return (
    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          Reportes
        </span>
        <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />

        {/* Filtros (solo cuando expandido) */}
        {isExpanded && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)}
              style={{ borderRadius: '8px', border: '1px solid #dee2e6', padding: '3px 8px', fontSize: '0.72rem', color: '#6c757d', background: 'white', cursor: 'pointer' }}>
              <option value="semanal">Esta semana</option>
              <option value="mensual">Este mes</option>
              <option value="anual">Este año</option>
            </select>
            {(tipoReporte === 'mensual' || tipoReporte === 'anual') && (
              <input
                type={tipoReporte === 'mensual' ? 'month' : 'number'}
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #dee2e6', padding: '3px 8px', fontSize: '0.72rem', color: '#6c757d', width: tipoReporte === 'anual' ? '70px' : '120px' }}
              />
            )}
          </div>
        )}

        {/* Toggle expandir */}
        <div onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.72rem', color: '#6c757d', fontWeight: 600, flexShrink: 0 }}>
          {isExpanded ? 'Contraer' : 'Expandir'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Sin datos */}
      {totales.totalRepartos === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '1.4rem', opacity: 0.3, marginBottom: '6px' }}>📊</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>Sin datos para mostrar</div>
          <div style={{ fontSize: '0.72rem', color: '#c4c9d4', marginTop: '3px' }}>Guardá repartos para ver estadísticas</div>
        </div>
      ) : (
        <>
          {/* Stats compactos — siempre visibles */}
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', borderBottom: isExpanded ? '1px solid #e9ecef' : 'none', paddingBottom: isExpanded ? '10px' : 0 }}>
              <StatBox label="Repartos"   value={totales.totalRepartos}               color="#6A8899" />
              <StatBox label="Ventas"     value={formatCurrency(totales.totalVentas)} color="#28a745" small />
              <StatBox label="Promedio"   value={formatCurrency(totales.promedio)}    color="#6c757d" small />
              <StatBox label="🏆 Mejor"  value={<>{mejorDia.dia}<br/><span style={{ fontSize: '0.65rem', fontWeight: 400 }}>{formatCurrency(mejorDia.total)}</span></>} color="#e6a817" small />
            </div>

            {/* Peor día — solo expandido */}
            {isExpanded && (
              <div style={{ paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <StatBox label="📉 Peor día"
                  value={peorDia.dia !== '—' ? <>{peorDia.dia}<br/><span style={{ fontSize: '0.65rem', fontWeight: 400 }}>{formatCurrency(peorDia.total)}</span></> : '—'}
                  color="#dc3545" small />
                <StatBox label="Días activos"
                  value={Object.values(estadisticasPorDia).filter(s => s.cantidad > 0).length}
                  color="#6c757d" />
              </div>
            )}
          </div>

          {/* Gráfico de barras — solo expandido */}
          <div style={{ maxHeight: isExpanded ? '400px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)' }}>
            <div>
              {/* Barras */}
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Comparación por día
              </div>
              <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '0 2px', marginBottom: '4px' }}>
                {DIAS.map(dia => {
                  const s = estadisticasPorDia[dia];
                  const pct = maxTotal > 0 ? (s.total / maxTotal) * 100 : 0;
                  const esMejor = dia === mejorDia.dia && mejorDia.total > 0;
                  return (
                    <div key={dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                      title={`${dia}: ${formatCurrency(s.total)} (${s.cantidad} repartos)`}>
                      <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginBottom: '3px' }}>{s.cantidad || ''}</div>
                      <div style={{
                        width: '100%', borderRadius: '4px 4px 0 0',
                        height: `${Math.max(pct, s.total > 0 ? 4 : 0)}%`,
                        background: esMejor ? '#e6a817' : BAR_COLORS[dia] || '#dee2e6',
                        transition: 'height 0.4s cubic-bezier(.4,0,.2,1)',
                        boxShadow: esMejor ? '0 0 0 2px rgba(230,168,23,0.3)' : 'none',
                      }} />
                    </div>
                  );
                })}
              </div>
              {/* Labels días */}
              <div style={{ display: 'flex', gap: '6px', padding: '0 2px', marginBottom: '16px' }}>
                {DIAS.map(dia => (
                  <div key={dia} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: dia === mejorDia.dia && mejorDia.total > 0 ? '#e6a817' : '#9ca3af', fontWeight: dia === mejorDia.dia && mejorDia.total > 0 ? 700 : 400 }}>
                    {dia.slice(0, 2)}
                  </div>
                ))}
              </div>

              {/* Tabla detallada */}
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Detalle por día
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Object.entries(estadisticasPorDia)
                  .sort((a, b) => b[1].total - a[1].total)
                  .filter(([, s]) => s.cantidad > 0)
                  .map(([dia, s]) => {
                    const pct = maxTotal > 0 ? (s.total / maxTotal) * 100 : 0;
                    return (
                      <div key={dia} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 70px', gap: '8px', alignItems: 'center', padding: '5px 8px', borderRadius: '6px', background: '#f8f9fa' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#212529' }}>{dia}</div>
                        <div style={{ height: '6px', borderRadius: '3px', background: '#e9ecef', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: BAR_COLORS[dia], borderRadius: '3px', transition: 'width 0.4s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#28a745', textAlign: 'right' }}>{formatCurrency(s.total)}</div>
                        <div style={{ fontSize: '0.67rem', color: '#9ca3af', textAlign: 'right' }}>{s.cantidad} rep.</div>
                      </div>
                    );
                  })}
                {Object.values(estadisticasPorDia).every(s => s.cantidad === 0) && (
                  <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.75rem', color: '#9ca3af' }}>Sin datos para el período seleccionado</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportesGraficos;

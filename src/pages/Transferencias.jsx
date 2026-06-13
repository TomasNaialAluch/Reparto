import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString } from '../utils/date';
import { useTransferenciasClientes } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useAutoSavePrint } from '../hooks/useAutoSavePrint';
import PrintDocument from '../components/PrintDocument';
import TransferenciaCard from '../components/TransferenciaCard';
import NotificationContainer from '../components/NotificationContainer';
import EditTransferenciaModal from '../components/EditTransferenciaModal';

const Transferencias = () => {
  const [clientName, setClientName] = useState('');
  const [transferencias, setTransferencias] = useState([{ descripcion: '', monto: '' }]);
  const [boletas, setBoletas] = useState([{ fecha: '', monto: '' }]);
  const [summaryData, setSummaryData] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Estado para impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Firebase hooks
  const { 
    transferencias: savedTransferencias, 
    loading, 
    error, 
    addTransferencia, 
    deleteTransferencia, 
    updateTransferencia 
  } = useTransferenciasClientes();

  // Notificaciones
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('semana');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));

  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transferenciaToEdit, setTransferenciaToEdit] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [draggedOverType, setDraggedOverType] = useState(null);
  const filterContainerRef = useRef(null);
  const filterButtonRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const today = getLocalDateString();
    if (boletas[0].fecha === '') {
      updateBoleta(0, 'fecha', today);
    }
  }, []);

  // Funciones para Transferencias (formulario)
  const addTransferenciaRow = () => {
    setTransferencias([...transferencias, { descripcion: '', monto: '' }]);
  };

  const updateTransferenciaRow = (index, field, value) => {
    const newTransferencias = [...transferencias];
    newTransferencias[index][field] = value;
    setTransferencias(newTransferencias);
  };

  const removeTransferenciaRow = (index) => {
    if (transferencias.length > 1) {
      setTransferencias(transferencias.filter((_, i) => i !== index));
    }
  };

  // Funciones para Boletas
  const addBoleta = () => {
    const today = getLocalDateString();
    setBoletas([...boletas, { fecha: today, monto: '' }]);
  };

  const updateBoleta = (index, field, value) => {
    const newBoletas = [...boletas];
    newBoletas[index][field] = value;
    setBoletas(newBoletas);
  };

  const removeBoleta = (index) => {
    if (boletas.length > 1) {
      setBoletas(boletas.filter((_, i) => i !== index));
    }
  };

  // Calcular saldo
  const calcularSaldo = () => {
    if (!clientName.trim()) {
      showError('Por favor ingrese el nombre del cliente');
      return;
    }

    const totalTransferencias = transferencias.reduce((sum, t) => sum + parseCurrencyValue(t.monto), 0);
    const totalBoletas = boletas.reduce((sum, b) => sum + parseCurrencyValue(b.monto), 0);
    const saldoFinal = totalTransferencias - totalBoletas;

    setSummaryData({
      nombreCliente: clientName,
      transferencias,
      boletas,
      totalTransferencias,
      totalBoletas,
      saldoFinal,
      fecha: getLocalDateString()
    });
    setShowSummary(true);

    setTimeout(() => {
      const summaryElement = document.querySelector('.card.printable');
      if (summaryElement) {
        summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  // Guardar en Firebase sin limpiar el formulario (reutilizable para auto-save al imprimir)
  const guardarEnFirebase = async () => {
    if (!summaryData) {
      throw new Error('Primero debe calcular el saldo');
    }
    await addTransferencia(summaryData);
  };

  // Guardar y limpiar formulario (comportamiento del botón Guardar)
  const saveTransferencia = async () => {
    if (!summaryData) {
      showError('Primero debe calcular el saldo');
      return;
    }

    try {
      await guardarEnFirebase();
      showSuccess('✓ Transferencia guardada exitosamente');

      // Limpiar formulario
      setClientName('');
      setTransferencias([{ descripcion: '', monto: '' }]);
      setBoletas([{ fecha: getLocalDateString(), monto: '' }]);
      setSummaryData(null);
      setShowSummary(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al guardar la transferencia');
    }
  };

  // Hook para auto-guardar antes de imprimir
  const { handlePrintWithAutoSave } = useAutoSavePrint({
    summaryData,
    savedItems: savedTransferencias || [],
    checkIsAlreadySaved: (data, items) =>
      items.some(
        (t) =>
          t.nombreCliente === clientName.trim() &&
          t.fecha === getLocalDateString() &&
          Math.abs((t.saldoFinal || 0) - (data.saldoFinal || 0)) < 0.01
      ),
    saveWithoutClear: guardarEnFirebase,
    showSuccess,
    showError
  });

  // Función para filtrar transferencias por fecha
  const getFilteredTransferencias = () => {
    if (!savedTransferencias) return [];

    const today = new Date();
    const todayStr = getLocalDateString();

    switch (dateFilter) {
      case 'hoy':
        return savedTransferencias.filter(t => t.fecha === todayStr);
      
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return savedTransferencias.filter(t => new Date(t.fecha) >= weekAgo);
      
      case 'mes':
        return savedTransferencias.filter(t => t.fecha?.startsWith(customMonth));
      
      case 'año':
        const currentYear = today.getFullYear().toString();
        return savedTransferencias.filter(t => t.fecha?.startsWith(currentYear));
      
      default:
        return savedTransferencias;
    }
  };

  // Eliminar transferencia
  const deleteTransferenciaItem = async (id) => {
    try {
      await deleteTransferencia(id);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la transferencia');
    }
  };

  // Abrir modal de edición
  const openEditModal = (transferencia) => {
    setTransferenciaToEdit(transferencia);
    setIsEditModalOpen(true);
  };

  // Cerrar modal de edición
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTransferenciaToEdit(null);
  };

  // Función para manejar impresión desde las cards
  const handlePrintTransferencia = (transferencia) => {
    setPrintData(transferencia);
    setShowPrintModal(true);
  };

  // Función para guardar cambios en la edición
  const handleSaveEdit = async (id, data) => {
    try {
      await updateTransferencia(id, data);
      showSuccess('✓ Transferencia actualizada exitosamente');
      closeEditModal();
    } catch (error) {
      console.error('Error al actualizar:', error);
      showError('Error al actualizar la transferencia');
    }
  };

  useEffect(() => {
    const activeBtn = filterButtonRefs.current[dateFilter];
    const container = filterContainerRef.current;
    if (activeBtn && container) {
      const cr = container.getBoundingClientRect();
      const br = activeBtn.getBoundingClientRect();
      setSliderStyle({ left: br.left - cr.left, width: br.width });
    }
  }, [dateFilter, savedTransferencias]);

  return (
    <div className="container mt-4">
      <div className="row justify-content-start">
        <div className="col-lg-7 col-md-8">

          {/* Formulario */}
          <div className="no-print mb-3" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)', padding: '20px' }}>

            {/* Título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                Transferencias
              </span>
              <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            </div>

            {/* Nombre */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: '5px' }}>
                Nombre del Cliente
              </label>
              <input type="text" className="form-control" placeholder="Ingrese el nombre"
                value={clientName} onChange={(e) => setClientName(e.target.value)}
                style={{ borderRadius: '8px', fontSize: '0.95rem' }} required />
            </div>

            {/* Sección Transferencias Recibidas */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  Transferencias Recibidas
                </span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '10px' }}>Dinero que el cliente te envió</div>
              {transferencias.map((t, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input type="text" className="form-control" placeholder="Descripción"
                    value={t.descripcion} onChange={(e) => updateTransferenciaRow(index, 'descripcion', e.target.value)}
                    style={{ borderRadius: '8px', flex: 2 }} />
                  <input type="text" className="form-control" placeholder="Monto (AR$)"
                    value={t.monto} onChange={(e) => updateTransferenciaRow(index, 'monto', e.target.value)}
                    onDragEnter={(e) => { e.preventDefault(); setDraggedOverIndex(index); setDraggedOverType('transferencia'); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
                    onDragLeave={(e) => { e.preventDefault(); setDraggedOverIndex(null); setDraggedOverType(null); }}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation(); setDraggedOverIndex(null); setDraggedOverType(null);
                      const v = parseFloat(e.dataTransfer.getData('text/plain'));
                      if (!isNaN(v)) updateTransferenciaRow(index, 'monto', formatCurrencyNoSymbol(v));
                    }}
                    style={{ borderRadius: '8px', flex: 1, cursor: 'copy', borderColor: draggedOverIndex === index && draggedOverType === 'transferencia' ? '#6A8899' : undefined, background: draggedOverIndex === index && draggedOverType === 'transferencia' ? 'rgba(106,136,153,0.08)' : undefined }}
                    title="Arrastrá un monto aquí" />
                  {transferencias.length > 1 && (
                    <button type="button" onClick={() => removeTransferenciaRow(index)}
                      style={{ border: 'none', background: 'transparent', color: '#dc3545', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTransferenciaRow}
                style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer' }}>
                + Agregar Transferencia
              </button>
            </div>

            {/* Sección Boletas */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  Boletas Vendidas
                </span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '10px' }}>Dinero que le debés al cliente</div>
              {boletas.map((b, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input type="date" className="form-control"
                    value={b.fecha} onChange={(e) => updateBoleta(index, 'fecha', e.target.value)}
                    style={{ borderRadius: '8px', flex: 2 }} />
                  <input type="text" className="form-control" placeholder="Monto (AR$)"
                    value={b.monto} onChange={(e) => updateBoleta(index, 'monto', e.target.value)}
                    onDragEnter={(e) => { e.preventDefault(); setDraggedOverIndex(index); setDraggedOverType('boleta'); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
                    onDragLeave={(e) => { e.preventDefault(); setDraggedOverIndex(null); setDraggedOverType(null); }}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation(); setDraggedOverIndex(null); setDraggedOverType(null);
                      const v = parseFloat(e.dataTransfer.getData('text/plain'));
                      if (!isNaN(v)) updateBoleta(index, 'monto', formatCurrencyNoSymbol(v));
                    }}
                    style={{ borderRadius: '8px', flex: 1, cursor: 'copy', borderColor: draggedOverIndex === index && draggedOverType === 'boleta' ? '#6A8899' : undefined, background: draggedOverIndex === index && draggedOverType === 'boleta' ? 'rgba(106,136,153,0.08)' : undefined }}
                    title="Arrastrá un monto aquí" />
                  {boletas.length > 1 && (
                    <button type="button" onClick={() => removeBoleta(index)}
                      style={{ border: 'none', background: 'transparent', color: '#dc3545', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addBoleta}
                style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer' }}>
                + Agregar Boleta
              </button>
            </div>

            {/* Botones principales */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={calcularSaldo}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                Calcular Saldo
              </button>
              <button type="button" onClick={saveTransferencia} disabled={!summaryData}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: !summaryData ? '#e9ecef' : '#28a745', color: !summaryData ? '#9ca3af' : 'white', fontSize: '0.95rem', fontWeight: 700, cursor: !summaryData ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                Guardar
              </button>
            </div>
          </div>

          {/* Resumen */}
          {showSummary && summaryData && (
            <div className="mb-3 printable" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)', padding: '20px' }}>

              {/* Header resumen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  Resumen · {summaryData.nombreCliente}
                </span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
              </div>

              {/* Transferencias */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Transferencias Recibidas</div>
                {summaryData.transferencias.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '6px', background: 'rgba(106,136,153,0.07)', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#212529' }}>{t.descripcion || `Transferencia ${i + 1}`}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3a5060' }}>{formatCurrency(parseCurrencyValue(t.monto))}</span>
                  </div>
                ))}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3a5060', textAlign: 'right', marginTop: '4px' }}>
                  Subtotal: {formatCurrency(summaryData.totalTransferencias)}
                </div>
              </div>

              {/* Boletas */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Boletas Vendidas</div>
                {summaryData.boletas.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '6px', background: 'rgba(230,168,23,0.08)', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#212529' }}>Boleta {i + 1} · {b.fecha}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e6a817' }}>{formatCurrency(parseCurrencyValue(b.monto))}</span>
                  </div>
                ))}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e6a817', textAlign: 'right', marginTop: '4px' }}>
                  Subtotal: {formatCurrency(summaryData.totalBoletas)}
                </div>
              </div>

              {/* Saldo final */}
              <div style={{
                background: '#f8f9fa', borderRadius: '10px', padding: '12px 16px',
                borderLeft: `3px solid ${summaryData.saldoFinal > 0 ? '#28a745' : summaryData.saldoFinal < 0 ? '#dc3545' : '#dee2e6'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#6c757d' }}>
                  {summaryData.saldoFinal > 0 ? `Le debés a ${summaryData.nombreCliente}` : summaryData.saldoFinal < 0 ? `${summaryData.nombreCliente} te debe` : 'Cuentas saldadas'}
                </span>
                <span style={{
                  fontWeight: 700, fontSize: '1rem',
                  color: summaryData.saldoFinal > 0 ? '#28a745' : summaryData.saldoFinal < 0 ? '#dc3545' : '#6c757d',
                  background: summaryData.saldoFinal > 0 ? 'rgba(40,167,69,0.1)' : summaryData.saldoFinal < 0 ? 'rgba(220,53,69,0.1)' : '#e9ecef',
                  padding: '4px 14px', borderRadius: '999px'
                }}>
                  {formatCurrency(Math.abs(summaryData.saldoFinal))}
                </span>
              </div>

              {/* Botón imprimir */}
              <button className="no-print"
                onClick={() => handlePrintWithAutoSave((data) => data, (pd) => { setPrintData(pd); setShowPrintModal(true); })}
                style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 16px', background: 'transparent', color: '#6c757d', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-print" style={{ fontSize: '0.75rem' }}></i> Imprimir
              </button>
            </div>
          )}
        </div>

        {/* Panel Derecho */}
        <div className="col-lg-5 col-md-4 no-print clientes-sidebar">

          {/* Status Firebase */}
          <div
            className={!loading && !error ? 'status-connected-pulse' : ''}
            style={{
              borderRadius: '12px', background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
              padding: '10px 14px', marginBottom: '8px',
              borderLeft: `3px solid ${loading ? '#6c757d' : error ? '#dc3545' : '#28a745'}`,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
          >
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: loading ? '#adb5bd' : error ? '#dc3545' : '#28a745',
              boxShadow: loading ? 'none' : error ? '0 0 0 3px rgba(220,53,69,0.15)' : '0 0 0 3px rgba(40,167,69,0.15)',
            }} />
            <div style={{ minWidth: 0 }}>
              {loading ? (
                <div style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 500 }}>Cargando…</div>
              ) : error ? (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#dc3545' }}>Error de conexión</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '1px' }}>Verificá la consola</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#212529' }}>Firebase conectado</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '1px' }}>
                    {savedTransferencias?.length || 0} {(savedTransferencias?.length || 0) === 1 ? 'transferencia guardada' : 'transferencias guardadas'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panel transferencias guardadas */}
          <div className="card p-3 clientes-guardados-card">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Transferencias Guardadas
              </span>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                {getFilteredTransferencias().length} {getFilteredTransferencias().length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {/* Segmented control filtros */}
            <div style={{ marginBottom: '12px' }}>
              <div ref={filterContainerRef}
                style={{ position: 'relative', display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                <div style={{
                  position: 'absolute', top: '3px', bottom: '3px',
                  left: sliderStyle.left + 'px', width: sliderStyle.width + 'px',
                  background: 'white', borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  transition: 'left 0.22s cubic-bezier(.4,0,.2,1), width 0.22s cubic-bezier(.4,0,.2,1)',
                  pointerEvents: 'none', zIndex: 0,
                }} />
                {[['hoy','Hoy'],['semana','Semana'],['mes','Mes'],['año','Año']].map(([val, label]) => (
                  <button key={val}
                    ref={el => filterButtonRefs.current[val] = el}
                    onClick={() => setDateFilter(val)}
                    style={{
                      position: 'relative', zIndex: 1, flex: 1, border: 'none',
                      borderRadius: '8px', padding: '5px 6px', fontSize: '0.75rem',
                      fontWeight: dateFilter === val ? 600 : 400, background: 'transparent',
                      color: dateFilter === val ? '#212529' : '#6c757d',
                      transition: 'color 0.2s', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>{label}</button>
                ))}
              </div>
              {dateFilter === 'mes' && (
                <div style={{ marginTop: '8px' }}>
                  <input type="month" className="form-control form-control-sm"
                    value={customMonth} onChange={(e) => setCustomMonth(e.target.value)}
                    style={{ borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              )}
            </div>

            {/* Lista */}
            <div className="clientes-list-scroll">
              {getFilteredTransferencias().length > 0 ? (
                getFilteredTransferencias().map((trans, index) => (
                  <TransferenciaCard
                    key={trans.id || index}
                    transferencia={trans}
                    onDelete={deleteTransferenciaItem}
                    onEdit={openEditModal}
                    onPrint={handlePrintTransferencia}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px', opacity: 0.3 }}>📭</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>Sin transferencias guardadas</div>
                  <div style={{ fontSize: '0.72rem', color: '#c4c9d4', marginTop: '3px' }}>Calculá y guardá para verlas acá</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de impresión */}
      {showPrintModal && printData && (
        <PrintDocument
          data={printData}
          type="transferencia"
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
        />
      )}

      {/* Modal de edición */}
      {isEditModalOpen && transferenciaToEdit && (
        <EditTransferenciaModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          transferencia={transferenciaToEdit}
          onSave={handleSaveEdit}
        />
      )}

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default Transferencias;


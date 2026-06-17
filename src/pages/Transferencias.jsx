import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString } from '../utils/date';
import { useTransferenciasClientes } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useAutoSavePrint } from '../hooks/useAutoSavePrint';
import PrintDocument from '../components/PrintDocument';
import TransferenciaCard from '../components/TransferenciaCard';
import NotificationContainer from '../components/NotificationContainer';
import EditTransferenciaModal from '../components/EditTransferenciaModal';
import { IconPrinter, IconCalendar, IconInbox, IconX } from '../components/gestionSemanal/icons';

const FILTER_OPTIONS = [
  ['hoy', 'Hoy'],
  ['semana', 'Semana'],
  ['mes', 'Mes'],
  ['año', 'Año'],
  ['elegir_mes', null],
];

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
  const transferenciasAnchorRef = useRef(null);
  const transferenciasListRef = useRef(null);
  const [transferenciasListMaxH, setTransferenciasListMaxH] = useState(undefined);

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
      showSuccess('Transferencia guardada exitosamente');

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

      case 'semana': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
        return savedTransferencias.filter(t => t.fecha >= weekStartStr && t.fecha <= weekEndStr);
      }

      case 'mes': {
        const currentMonth = today.toISOString().slice(0, 7);
        return savedTransferencias.filter(t => t.fecha?.startsWith(currentMonth));
      }

      case 'año': {
        const currentYear = today.getFullYear().toString();
        return savedTransferencias.filter(t => t.fecha?.startsWith(currentYear));
      }

      case 'elegir_mes':
        return savedTransferencias.filter(t => t.fecha?.startsWith(customMonth));

      default:
        return [];
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
      showSuccess('Transferencia actualizada exitosamente');
      closeEditModal();
    } catch (error) {
      console.error('Error al actualizar:', error);
      showError('Error al actualizar la transferencia');
    }
  };

  const getFilterLabel = () => {
    const labels = {
      hoy: 'hoy',
      semana: 'esta semana',
      mes: 'este mes',
      año: 'este año',
      elegir_mes: 'el mes seleccionado',
    };
    return labels[dateFilter] || 'el período';
  };

  const filteredTransferenciasCount = getFilteredTransferencias().length;

  const syncTransferenciasListHeight = () => {
    if (window.innerWidth < 992) {
      setTransferenciasListMaxH(undefined);
      return;
    }
    const anchor = transferenciasAnchorRef.current;
    const list = transferenciasListRef.current;
    if (!anchor || !list) return;
    const maxH = Math.floor(anchor.getBoundingClientRect().bottom - list.getBoundingClientRect().top);
    setTransferenciasListMaxH(maxH > 100 ? maxH : 100);
  };

  useEffect(() => {
    syncTransferenciasListHeight();
    const afterTransition = setTimeout(syncTransferenciasListHeight, 350);
    const raf = requestAnimationFrame(() => {
      syncTransferenciasListHeight();
      requestAnimationFrame(syncTransferenciasListHeight);
    });

    const ro = new ResizeObserver(syncTransferenciasListHeight);
    if (transferenciasAnchorRef.current) ro.observe(transferenciasAnchorRef.current);
    if (transferenciasListRef.current) ro.observe(transferenciasListRef.current);

    window.addEventListener('resize', syncTransferenciasListHeight);
    return () => {
      clearTimeout(afterTransition);
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', syncTransferenciasListHeight);
    };
  }, [showSummary, summaryData, dateFilter, savedTransferencias?.length, filteredTransferenciasCount, loading, customMonth]);

  return (
    <div className="container mt-4 transferencias-page">
      <div className="row align-items-stretch">
        <div className="col-lg-7 col-md-8 transferencias-main-col">
          <div ref={transferenciasAnchorRef}>

          <div className="no-print mb-3" style={{ background: 'white', borderRadius: '12px', border: '1px solid #d3d9de', boxShadow: 'none', padding: '20px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                Transferencias
              </span>
              <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
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
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  Transferencias Recibidas
                </span>
                <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: '10px' }}>Dinero que el cliente te envió</div>
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
                      className="d-inline-flex align-items-center justify-content-center"
                      style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
                      <IconX size={14} />
                    </button>
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
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  Boletas Vendidas
                </span>
                <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: '10px' }}>Dinero que le debés al cliente</div>
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
                      className="d-inline-flex align-items-center justify-content-center"
                      style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
                      <IconX size={14} />
                    </button>
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
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: !summaryData ? '#e9ecef' : '#28a745', color: !summaryData ? '#8a939c' : 'white', fontSize: '0.95rem', fontWeight: 700, cursor: !summaryData ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                Guardar
              </button>
            </div>
          </div>

          {/* Resumen */}
          {showSummary && summaryData && (
            <div className="mb-3 printable" style={{ background: 'white', borderRadius: '12px', border: '1px solid #d3d9de', boxShadow: 'none', padding: '20px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  Resumen · {summaryData.nombreCliente}
                </span>
                <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
              </div>

              {/* Transferencias */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Transferencias Recibidas</div>
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
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Boletas Vendidas</div>
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
              <button type="button"
                onClick={() => handlePrintWithAutoSave((data) => data, (pd) => { setPrintData(pd); setShowPrintModal(true); })}
                className="no-print d-inline-flex align-items-center gap-2"
                style={{ border: '1px solid #ccd3d9', borderRadius: '8px', padding: '8px 16px', background: 'transparent', color: '#6c757d', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                <IconPrinter size={14} /> Imprimir
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Panel Derecho */}
        <div className="col-lg-5 col-md-4 no-print clientes-sidebar">

          {/* Status Firebase */}
          <div
            className={!loading && !error ? 'status-connected-pulse' : ''}
            style={{
              borderRadius: '12px', background: 'white',
              border: '1px solid #d3d9de', boxShadow: 'none',
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
                  <div style={{ fontSize: '0.68rem', color: '#6c757d', marginTop: '1px' }}>Verificá la consola</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#212529' }}>Firebase conectado</div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d', marginTop: '1px' }}>
                    {savedTransferencias?.length || 0} {(savedTransferencias?.length || 0) === 1 ? 'transferencia guardada' : 'transferencias guardadas'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mb-3 clientes-guardados-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 2px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Transferencias Guardadas
              </span>
              <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>
                {filteredTransferenciasCount} {filteredTransferenciasCount === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div style={{ background: '#e9ecef', borderRadius: '12px', padding: '4px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '4px', width: 'max-content', minWidth: '100%' }}>
                  {FILTER_OPTIONS.map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDateFilter(val)}
                      style={{
                        position: 'relative', zIndex: 1, flex: '1 0 auto',
                        border: 'none', borderRadius: '9px',
                        padding: '9px 12px', fontSize: '0.75rem',
                        fontWeight: dateFilter === val ? 700 : 400,
                        background: 'transparent', boxShadow: 'none',
                        color: dateFilter === val ? '#212529' : '#6c757d',
                        transition: 'color 0.2s, font-weight 0.2s',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}
                    >
                      {dateFilter === val && (
                        <motion.div
                          layoutId="transferencias-filter-indicator"
                          style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '9px 9px 0 0', zIndex: 0 }}
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      <span style={{ position: 'relative', zIndex: 1 }}>
                        {val === 'elegir_mes' ? <IconCalendar size={13} /> : label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'white', borderRadius: '0 0 9px 9px',
                padding: '12px', flex: 1, minHeight: 0,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                {dateFilter === 'elegir_mes' && (
                  <div style={{ marginBottom: '10px' }}>
                    <input type="month" className="form-control form-control-sm"
                      value={customMonth} onChange={(e) => setCustomMonth(e.target.value)}
                      style={{ borderRadius: '8px', fontSize: '0.8rem' }} />
                  </div>
                )}

                <div
                  ref={transferenciasListRef}
                  className="clientes-list-scroll"
                  style={transferenciasListMaxH != null ? { maxHeight: transferenciasListMaxH, overflowY: 'auto' } : undefined}
                >
                  {filteredTransferenciasCount > 0 ? (
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
                      <div style={{ marginBottom: '6px', opacity: 0.35, display: 'flex', justifyContent: 'center', color: '#6c757d' }}>
                        <IconInbox size={28} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 500 }}>
                        {(savedTransferencias?.length || 0) === 0 ? 'Sin transferencias guardadas' : `Sin transferencias en ${getFilterLabel()}`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8a939c', marginTop: '3px' }}>
                        {(savedTransferencias?.length || 0) === 0 ? 'Calculá y guardá para verlas acá' : 'Cambiá el filtro para ver más'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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


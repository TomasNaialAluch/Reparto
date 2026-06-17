import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/money';
import { getLocalDateString, dateToLocalString } from '../utils/date';
import { useRepartos } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useAutoSavePrint } from '../hooks/useAutoSavePrint';
import RepartoCard from '../components/RepartoCard';
import ClienteRow from '../components/ClienteRow';
import EditRepartoModal from '../components/EditRepartoModal';
import ReportesGraficos from '../components/ReportesGraficos';
import PrintDocument from '../components/PrintDocument';
import NotificationContainer from '../components/NotificationContainer';
import { IconSave, IconPrinter, IconPlus, IconClipboard, IconCalendar, IconCheck, IconChevronDown } from '../components/gestionSemanal/icons';

const MiReparto = () => {
  const [clientName, setClientName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  const clientNameInputRef = useRef(null);
  const deudoresSectionRef = useRef(null);
  const repartosListRef = useRef(null);
  const [repartosListMaxH, setRepartosListMaxH] = useState(undefined);

  // Estados para el reparto actual (React puro)
  const [clientes, setClientes] = useState([]);
  const [currentReparto, setCurrentReparto] = useState({
    date: getLocalDateString(),
    clients: []
  });

  // Firebase hooks
  const { repartos, loading, error, addReparto, updatePayment, deleteReparto, updateDocument } = useRepartos();

  // Notificaciones
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  // Estados para las cards de repartos guardados
  const [savedRepartos, setSavedRepartos] = useState([]);
  
  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('semana');
  const [customMonth, setCustomMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lastProcessedDate, setLastProcessedDate] = useState(getLocalDateString());
  const [isManuallyCleared, setIsManuallyCleared] = useState(false);
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [repartoToEdit, setRepartoToEdit] = useState(null);
  
  // Estado para impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  
  // Estado para mostrar/ocultar deudores (React puro)
  const [showDebtors, setShowDebtors] = useState(false);

  // Actualizar fecha del reparto actual cada vez que se carga la página
  useEffect(() => {
    const today = getLocalDateString();
    
    setCurrentReparto(prev => ({
      ...prev,
      date: today
    }));
    setLastProcessedDate(today);
  }, []);

  // Función para filtrar repartos por fecha
  const getFilteredRepartos = () => {
    const today = new Date();
    const todayStr = getLocalDateString();
    let filtered = [];
    
    switch (dateFilter) {
      case 'hoy':
        filtered = savedRepartos.filter(reparto => reparto.date === todayStr);
        break;
      
      case 'semana': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = dateToLocalString(weekStart);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = dateToLocalString(weekEnd);
        filtered = savedRepartos.filter(reparto => 
          reparto.date >= weekStartStr && reparto.date <= weekEndStr
        );
        break;
      }
      
      case 'mes': {
        const currentMonth = getLocalDateString().slice(0, 7);
        filtered = savedRepartos.filter(reparto => reparto.date.startsWith(currentMonth));
        break;
      }
      
      case 'año': {
        const currentYear = today.getFullYear().toString();
        filtered = savedRepartos.filter(reparto => reparto.date.startsWith(currentYear));
        break;
      }
      
      case 'elegir_mes':
        filtered = savedRepartos.filter(reparto => reparto.date.startsWith(customMonth));
        break;
      
      default: {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = dateToLocalString(weekStart);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = dateToLocalString(weekEnd);
        filtered = savedRepartos.filter(reparto => 
          reparto.date >= weekStartStr && reparto.date <= weekEndStr
        );
      }
    }
    
    return filtered;
  };

  // Función para obtener el título del filtro
  const getFilterTitle = () => {
    const today = new Date();
    const todayStr = getLocalDateString();
    
    switch (dateFilter) {
      case 'hoy':
        return `Hoy (${todayStr})`;
      case 'semana': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = dateToLocalString(weekStart);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = dateToLocalString(weekEnd);
        return `Esta Semana (${weekStartStr} - ${weekEndStr})`;
      }
      case 'mes':
        return `Este Mes (${today.toISOString().slice(0, 7)})`;
      case 'año':
        return `Este Año (${today.getFullYear()})`;
      case 'elegir_mes':
        return `Mes Seleccionado (${customMonth})`;
      default:
        return 'Esta semana';
    }
  };

  // Guardar en Firebase sin limpiar el formulario (para auto-guardado al imprimir)
  const guardarRepartoEnFirebase = async () => {
    if (currentReparto.clients.length === 0) {
      throw new Error('No hay clientes para guardar');
    }
    const fechaActual = getLocalDateString();
    const total = currentReparto.clients.reduce((sum, c) => sum + (c.billAmount || 0), 0);
    const repartoCompleto = {
      date: fechaActual,
      clientes: currentReparto.clients,
      total,
      cantidad: currentReparto.clients.length,
      createdAt: new Date().toISOString()
    };
    const repartoId = await addReparto(repartoCompleto);
    const repartoConId = { ...repartoCompleto, id: repartoId };
    setSavedRepartos(prev => [repartoConId, ...prev]);
    return repartoConId;
  };

  // Función para guardar el reparto actual como card (guarda + limpia formulario)
  const saveCurrentReparto = async () => {
    if (currentReparto.clients.length > 0) {
      try {
        await guardarRepartoEnFirebase();
        setIsManuallyCleared(true);
        setClientes([]);
        setCurrentReparto({
          date: getLocalDateString(),
          clients: []
        });
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        setShowDebtors(false);
        showSuccess('Reparto guardado exitosamente - Lista limpiada');
        setTimeout(() => setIsManuallyCleared(false), 2000);
      } catch (error) {
        console.error('❌ Error al guardar reparto como card:', error);
        const newReparto = {
          id: Date.now().toString(),
          date: getLocalDateString(),
          clientes: currentReparto.clients,
          total: currentReparto.clients.reduce((sum, c) => sum + (c.billAmount || 0), 0),
          cantidad: currentReparto.clients.length,
          createdAt: new Date().toISOString()
        };
        setSavedRepartos(prev => [newReparto, ...prev]);
        setClientes([]);
        setCurrentReparto({ date: getLocalDateString(), clients: [] });
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        setShowDebtors(false);
        showSuccess('Reparto guardado localmente - Lista limpiada');
      }
    }
  };

  // Datos del reparto actual para imprimir (null si no hay clientes)
  const repartoSummaryForPrint = currentReparto.clients.length > 0
    ? { clientes: currentReparto.clients, date: currentReparto.date }
    : null;

  const { handlePrintWithAutoSave } = useAutoSavePrint({
    summaryData: repartoSummaryForPrint,
    savedItems: savedRepartos,
    checkIsAlreadySaved: (data, items) =>
      items.some(
        (r) =>
          r.date === data.date &&
          r.cantidad === data.clientes.length &&
          Math.abs((r.total || 0) - data.clientes.reduce((s, c) => s + (c.billAmount || 0), 0)) < 0.01
      ),
    saveWithoutClear: guardarRepartoEnFirebase,
    showSuccess,
    showError
  });

  // Función para eliminar un reparto guardado
  const deleteSavedReparto = async (repartoId) => {
    try {
      // Eliminar de Firebase
      await deleteReparto(repartoId);
      
      // Eliminar del estado local
      setSavedRepartos(prev => prev.filter(reparto => reparto.id !== repartoId));
      
      showSuccess('Reparto eliminado exitosamente');
      console.log('✅ Reparto eliminado de Firebase');
    } catch (error) {
      console.error('❌ Error al eliminar reparto:', error);
      showError('Error al eliminar el reparto');
      // Aún así eliminar localmente
      setSavedRepartos(prev => prev.filter(reparto => reparto.id !== repartoId));
    }
  };

  // Abrir modal de edición
  const openEditModal = (reparto) => {
    console.log('🔍 openEditModal - Reparto seleccionado:', reparto);
    console.log('🔍 openEditModal - ID del reparto:', reparto.id);
    setRepartoToEdit(reparto);
    setIsEditModalOpen(true);
  };

  // Cerrar modal de edición
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setRepartoToEdit(null);
  };

  // Función para manejar impresión desde las cards
  const handlePrintReparto = (reparto) => {
    console.log('🔍 handlePrintReparto - Reparto recibido:', reparto);
    
    // Convertir el formato del reparto guardado al formato que espera PrintDocument
    const printData = {
      clientes: reparto.clientes || [],
      fecha: reparto.date
    };
    
    console.log('🔍 handlePrintReparto - Datos para impresión:', printData);
    
    setPrintData(printData);
    setShowPrintModal(true);
  };

  // Actualizar reparto
  const updateReparto = async (repartoId, updatedData) => {
    try {
      console.log('🔍 updateReparto - Datos recibidos:', {
        repartoId,
        updatedData,
        clientes: updatedData.clientes?.length,
        clients: updatedData.clients?.length
      });
      
      // Calcular totales para el reparto actualizado
      const totalReparto = updatedData.clientes?.reduce((sum, c) => sum + (c.billAmount || 0), 0) || 0;
      const cantidadClientes = updatedData.clientes?.length || 0;
      
      const repartoCompleto = {
        ...updatedData,
        total: totalReparto,
        cantidad: cantidadClientes,
        updatedAt: new Date().toISOString()
      };
      
      console.log('🔍 updateReparto - Datos completos a guardar:', repartoCompleto);
      
      await updateDocument(repartoId, repartoCompleto);
      console.log('✅ Reparto actualizado en Firebase:', repartoId);
      
      // Actualizar el estado local inmediatamente
      setSavedRepartos(prev => prev.map(reparto => 
        reparto.id === repartoId ? { ...reparto, ...repartoCompleto } : reparto
      ));
      console.log('🔄 Estado local actualizado');
      
    } catch (error) {
      console.error('❌ Error al actualizar reparto:', error);
    }
  };

  // formatCurrency centralizado en utils

  // Función para mostrar errores de validación
  const showValidationError = (fieldId, message) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldId]: message
    }));
  };

  // Resetear validaciones
  const clearValidationError = (fieldId) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldId]: null
    }));
  };

  // Manejar envío del formulario (React puro)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!clientName.trim()) {
      showValidationError('clientName', 'Ingrese un nombre válido');
      return;
    }
    
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      showValidationError('billAmount', 'Ingrese un monto positivo');
      return;
    }
    
    // Crear objeto cliente con ID único
    const newClient = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único temporal
      clientName: clientName.trim(),
      billAmount: amount,
      paymentStatus: 'pending',
      paymentAmount: 0,
      address: ''
    };

    // Actualizar estado React (solo local, NO guardar en Firebase aún)
    setClientes(prev => [...prev, newClient]);
    setCurrentReparto(prev => ({
      ...prev,
      clients: [...prev.clients, newClient]
    }));
    
    // Limpiar formulario
    setClientName('');
    setBillAmount('');
    setValidationErrors({});
    
    // Hacer focus en el input de nombre para continuar agregando clientes
    setTimeout(() => {
      if (clientNameInputRef.current) {
        clientNameInputRef.current.focus();
      }
    }, 100);
    
  };

  // Funciones React puras para manejar clientes
  const updateCliente = async (clienteId, updates) => {
    try {
      // Actualizar en Firebase si no es un ID temporal
      if (!clienteId.startsWith('temp_')) {
        await updatePayment(clienteId, updates);
      }
      
      // Actualizar estado local
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteId ? { ...cliente, ...updates } : cliente
      ));
      setCurrentReparto(prev => ({
        ...prev,
        clients: prev.clients.map(cliente => 
          cliente.id === clienteId ? { ...cliente, ...updates } : cliente
        )
      }));
    } catch (error) {
      console.error('❌ Error al actualizar cliente:', error);
      // Aún así actualizar localmente para UX
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteId ? { ...cliente, ...updates } : cliente
      ));
      setCurrentReparto(prev => ({
        ...prev,
        clients: prev.clients.map(cliente => 
          cliente.id === clienteId ? { ...cliente, ...updates } : cliente
        )
      }));
    }
  };

  const deleteCliente = async (clienteId) => {
    // Eliminar del estado local (React puro - instantáneo)
    setClientes(prev => prev.filter(cliente => cliente.id !== clienteId));
    setCurrentReparto(prev => ({
      ...prev,
      clients: prev.clients.filter(cliente => cliente.id !== clienteId)
    }));
    
    // Solo eliminar de Firebase si es un cliente que ya estaba guardado (no temp_)
    if (!clienteId.startsWith('temp_')) {
      try {
        await deleteReparto(clienteId);
      } catch (error) {
        console.error('❌ Error al eliminar de Firebase:', error);
      }
    }
  };

  // Calcular totales con React puro
  const calcularTotales = () => {
    const subtotal = clientes.reduce((sum, cliente) => sum + cliente.billAmount, 0);
    const totalPendiente = clientes.reduce((sum, cliente) => {
      const pagado = cliente.paymentAmount || 0;
      return sum + (cliente.billAmount - pagado);
    }, 0);
    
    return { subtotal, totalPendiente };
  };

  const { subtotal, totalPendiente } = calcularTotales();


  // Calcular deudores con React puro
  const deudores = clientes.filter(cliente => {
    const pagado = cliente.paymentAmount || 0;
    return cliente.billAmount - pagado > 0;
  });

  const handleShowDebtors = () => {
    if (deudores.length === 0) {
        showError("No hay deudores");
      return;
    }
    setShowDebtors(!showDebtors);
  };

  // Cargar datos desde Firebase al inicializar (consolidado)
  useEffect(() => {
    // No cargar datos si fue limpiado manualmente
    if (isManuallyCleared) {
      return;
    }
    
    // No cargar si la tabla ya tiene clientes (evitar sobrescribir)
    if (clientes.length > 0) {
      return;
    }
    
    if (repartos.length > 0) {
      // Cargar solo repartos completos (nueva estructura)
      const repartosCompletos = repartos.filter(reparto => 
        reparto.clientes && Array.isArray(reparto.clientes) && reparto.clientes.length > 0
      );
      
      if (repartosCompletos.length > 0) {
        setSavedRepartos(repartosCompletos);
      }
    } else {
      // Limpiar todo si no hay datos
      setClientes([]);
      setSavedRepartos([]);
      setCurrentReparto(prev => ({
        ...prev,
        clients: []
      }));
    }
  }, [repartos, clientes.length, isManuallyCleared]);

  // Limpiar datos al cambiar de día
  useEffect(() => {
    const todayStr = getLocalDateString();
    
    if (lastProcessedDate !== todayStr) {
      // Limpiar clientes del día anterior
      setClientes([]);
      setCurrentReparto(prev => ({
        ...prev,
        date: todayStr,
        clients: []
      }));
      setShowDebtors(false);
      
      // Actualizar fecha procesada
      setLastProcessedDate(todayStr);
    }
  }, [lastProcessedDate]);

  const FILTER_OPTIONS = [
    ['hoy', 'Hoy'],
    ['semana', 'Semana'],
    ['mes', 'Mes'],
    ['año', 'Año'],
    ['elegir_mes', null],
  ];

  const syncRepartosListHeight = () => {
    if (window.innerWidth < 992) {
      setRepartosListMaxH(undefined);
      return;
    }
    const deudores = deudoresSectionRef.current;
    const list = repartosListRef.current;
    if (!deudores || !list) return;
    const maxH = Math.floor(deudores.getBoundingClientRect().bottom - list.getBoundingClientRect().top);
    setRepartosListMaxH(maxH > 100 ? maxH : 100);
  };

  useEffect(() => {
    syncRepartosListHeight();
    const afterTransition = setTimeout(syncRepartosListHeight, 350);

    const mainCol = deudoresSectionRef.current?.closest('.reparto-main-col');
    const ro = new ResizeObserver(syncRepartosListHeight);
    if (mainCol) ro.observe(mainCol);
    if (deudoresSectionRef.current) ro.observe(deudoresSectionRef.current);

    window.addEventListener('resize', syncRepartosListHeight);
    return () => {
      clearTimeout(afterTransition);
      ro.disconnect();
      window.removeEventListener('resize', syncRepartosListHeight);
    };
  }, [showDebtors, deudores.length, clientes.length, dateFilter, savedRepartos.length, loading]);

  return (
    <div className="container mt-4 printable reparto-page">
      <div className="row justify-content-start">
        <div className="col-lg-7 col-md-8 reparto-main-col">
      {/* Formulario para agregar cliente */}
      <div className="no-print mb-3" style={{ background: 'white', borderRadius: '12px', border: '1px solid #d3d9de', boxShadow: 'none', padding: '20px' }}>
        <form onSubmit={handleSubmit}>

          {/* Título de sección */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              Agregar Cliente
            </span>
            <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="clientName" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: '5px' }}>
              Nombre del Cliente
            </label>
            <input
              ref={clientNameInputRef}
              type="text"
              id="clientName"
              className="form-control"
              value={clientName}
              onChange={(e) => { setClientName(e.target.value); clearValidationError('clientName'); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('billAmount').focus(); } }}
              placeholder="Ingrese nombre"
              required
              style={{ borderRadius: '8px', fontSize: '0.95rem', borderColor: validationErrors.clientName ? '#dc3545' : undefined }}
            />
            {validationErrors.clientName && (
              <div style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '4px' }}>{validationErrors.clientName}</div>
            )}
          </div>

          {/* Monto */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="billAmount" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: '5px' }}>
              Monto de la Boleta
            </label>
            <input
              type="number"
              step="0.01"
              id="billAmount"
              className="form-control"
              value={billAmount}
              onChange={(e) => { setBillAmount(e.target.value); clearValidationError('billAmount'); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Ingrese monto"
              required
              style={{ borderRadius: '8px', fontSize: '0.95rem', borderColor: validationErrors.billAmount ? '#dc3545' : undefined }}
            />
            {validationErrors.billAmount && (
              <div style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '4px' }}>{validationErrors.billAmount}</div>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={!clientName.trim() || !billAmount}
            className="d-inline-flex align-items-center justify-content-center gap-2"
            style={{
              width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
              background: !clientName.trim() || !billAmount ? '#e9ecef' : '#6A8899',
              color: !clientName.trim() || !billAmount ? '#8a939c' : 'white',
              fontSize: '0.9rem', fontWeight: 700,
              cursor: !clientName.trim() || !billAmount ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <IconPlus size={15} /> Agregar Cliente
          </button>
        </form>
      </div>
      
      {/* Sección de Clientes del Día */}
      <div className="mb-3 printable" style={{ background: 'white', borderRadius: '12px', border: '1px solid #d3d9de', boxShadow: 'none', padding: '20px' }}>

        {/* Header */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Clientes del Día
          </span>
          <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
          {/* Acciones */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {currentReparto.clients.length > 0 && (
              <button onClick={saveCurrentReparto}
                className="d-inline-flex align-items-center gap-2"
                style={{ border: 'none', borderRadius: '8px', padding: '6px 14px', background: '#28a745', color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                <IconSave size={13} /> Guardar
              </button>
            )}
            <button
              onClick={() => handlePrintWithAutoSave(
                (data) => ({ clientes: data.clientes, fecha: data.date }),
                (pd) => { setPrintData(pd); setShowPrintModal(true); }
              )}
              className="d-inline-flex align-items-center gap-2"
              style={{ border: '1px solid #ccd3d9', borderRadius: '8px', padding: '6px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              <IconPrinter size={13} /> Imprimir
            </button>
          </div>
        </div>

        {/* Tip de uso */}
        <div className="no-print" style={{ background: 'rgba(106,136,153,0.08)', borderLeft: '3px solid #6A8899', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#3a5060', lineHeight: 1.6 }}>
            <strong>Pago:</strong> clic = pago completo · doble clic = monto parcial<br />
            <strong>Monto:</strong> clic sobre el importe para editar · Enter para guardar
          </div>
        </div>

        {/* Lista de clientes */}
        {clientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#6c757d' }}>
            <div style={{ marginBottom: '8px', opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
              <IconClipboard size={32} />
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Sin clientes agregados</div>
            <div style={{ fontSize: '0.72rem', color: '#8a939c', marginTop: '3px' }}>Usá el formulario de arriba para comenzar</div>
          </div>
        ) : (
          <>
            {/* Cabecera de tabla minimalista */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '8px', padding: '0 8px 6px', marginBottom: '4px' }}>
              {['Cliente','Dirección','Boleta','Pago',''].map((h, i) => (
                <div key={i} style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {clientes.map(cliente => (
                <ClienteRow
                  key={cliente.id}
                  cliente={cliente}
                  onUpdate={updateCliente}
                  onDelete={deleteCliente}
                />
              ))}
            </div>

            {/* Totales */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #dde2e6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '8px 12px', border: '1px solid #dde2e6' }}>
                <div style={{ fontSize: '0.68rem', color: '#6c757d', marginBottom: '2px' }}>Subtotal</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212529' }}>{formatCurrency(subtotal)}</div>
              </div>
              <div style={{ background: totalPendiente > 0 ? 'rgba(220,53,69,0.07)' : 'rgba(40,167,69,0.07)', borderRadius: '8px', padding: '8px 12px', borderLeft: `3px solid ${totalPendiente > 0 ? '#dc3545' : '#28a745'}` }}>
                <div style={{ fontSize: '0.68rem', color: '#6c757d', marginBottom: '2px' }}>Pendiente</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: totalPendiente > 0 ? '#dc3545' : '#28a745' }}>{formatCurrency(totalPendiente)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sección de Deudores */}
      <div ref={deudoresSectionRef} className="no-print mb-3" style={{ background: 'white', borderRadius: '12px', border: '1px solid #d3d9de', boxShadow: 'none', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={handleShowDebtors}>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Deudores {deudores.length > 0 && <span style={{ background: 'rgba(230,168,23,0.15)', color: '#e6a817', padding: '1px 7px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, marginLeft: '4px' }}>{deudores.length}</span>}
          </span>
          <div style={{ flex: 1, height: '1px', background: '#dde2e6' }} />
          <span className="d-inline-flex" style={{ transform: showDebtors ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)', flexShrink: 0, color: '#6c757d' }}>
            <IconChevronDown size={14} />
          </span>
        </div>

        <div style={{ maxHeight: showDebtors ? '400px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)' }}>
          <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {deudores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.78rem', color: '#6c757d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <IconCheck size={14} /> Sin deudores
              </div>
            ) : deudores.map(deudor => {
              const pendiente = deudor.billAmount - (deudor.paymentAmount || 0);
              return (
                <div key={deudor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: 'rgba(220,53,69,0.05)', borderLeft: '3px solid #dc3545' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#212529' }}>{deudor.clientName}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc3545', background: 'rgba(220,53,69,0.1)', padding: '3px 10px', borderRadius: '999px' }}>{formatCurrency(pendiente)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
        </div>
        <div className="col-lg-5 col-md-4 clientes-sidebar">

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
              boxShadow: loading ? 'none' : error
                ? '0 0 0 3px rgba(220,53,69,0.15)'
                : '0 0 0 3px rgba(40,167,69,0.15)',
            }} />
            <div style={{ minWidth: 0 }}>
              {loading ? (
                <div style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 500 }}>Conectando…</div>
              ) : error ? (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#dc3545' }}>Error de conexión</div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d', marginTop: '1px' }}>Verificá la consola</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#212529' }}>Firebase conectado</div>
                  <div style={{ fontSize: '0.68rem', color: '#6c757d', marginTop: '1px' }}>
                    {repartos.length} {repartos.length === 1 ? 'reparto guardado' : 'repartos guardados'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panel Repartos Guardados */}
          <div className="mb-3 clientes-guardados-card">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 2px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Repartos Guardados
              </span>
              <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>
                {getFilteredRepartos().length} {getFilteredRepartos().length === 1 ? 'reparto' : 'repartos'}
              </span>
            </div>

            {/* Filtros + lista — bloque gris unificado (patrón Gestión Semanal) */}
            <div style={{ background: '#e9ecef', borderRadius: '12px', padding: '4px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

              {/* Fila de filtros */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '4px', width: 'max-content', minWidth: '100%' }}>
                  {FILTER_OPTIONS.map(([val, label]) => (
                    <button
                      key={val}
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
                          layoutId="reparto-filter-indicator"
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

              {/* Contenido — blanco conectado al filtro activo */}
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
                  ref={repartosListRef}
                  className="clientes-list-scroll"
                  style={repartosListMaxH != null ? { maxHeight: repartosListMaxH } : undefined}
                >
                  {getFilteredRepartos().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ marginBottom: '6px', opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
                        <IconClipboard size={28} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 500 }}>
                        {savedRepartos.length === 0 ? 'Sin repartos guardados' : `Sin repartos en ${getFilterTitle().toLowerCase()}`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8a939c', marginTop: '3px' }}>
                        {savedRepartos.length === 0 ? 'Guardá el reparto del día para verlo acá' : 'Cambiá el filtro para ver más'}
                      </div>
                    </div>
                  ) : (
                    getFilteredRepartos().map(reparto => (
                      <RepartoCard
                        key={reparto.id}
                        reparto={reparto}
                        onDelete={deleteSavedReparto}
                        onEdit={openEditModal}
                        onPrint={handlePrintReparto}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reportes */}
          <ReportesGraficos repartos={savedRepartos} />
        </div>
      </div>
      
      {/* Modal de edición de reparto */}
      <EditRepartoModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        reparto={repartoToEdit}
        onSave={updateReparto}
      />
      
      {/* Modal de impresión */}
      {showPrintModal && printData && (
        <PrintDocument
          data={printData}
          type="reparto"
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
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

export default MiReparto;
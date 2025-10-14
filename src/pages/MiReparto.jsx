import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/money';
import { getLocalDateString, dateToLocalString } from '../utils/date';
import { useRepartos } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import RepartoCard from '../components/RepartoCard';
import ClienteRow from '../components/ClienteRow';
import EditRepartoModal from '../components/EditRepartoModal';
import ReportesGraficos from '../components/ReportesGraficos';
import PrintDocument from '../components/PrintDocument';
import NotificationContainer from '../components/NotificationContainer';

const MiReparto = () => {
  const [clientName, setClientName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Referencia para el input de nombre
  const clientNameInputRef = useRef(null);
  

  // Estados para el reparto actual (React puro)
  const [clientes, setClientes] = useState([]);
  const [currentReparto, setCurrentReparto] = useState({
    date: getLocalDateString(),
    clients: []
  });

  // Firebase hooks
  const { repartos, todayRepartos, loading, error, addReparto, updatePayment, deleteReparto, updateDocument } = useRepartos();

  // Notificaciones
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  // Estados para las cards de repartos guardados
  const [savedRepartos, setSavedRepartos] = useState([]);
  
  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('hoy');
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
    const todayStr = getLocalDateString();
    let filtered = [];
    
    switch (dateFilter) {
      case 'hoy':
        filtered = savedRepartos.filter(reparto => reparto.date === todayStr);
        break;
      
      case 'semana':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = dateToLocalString(weekStart);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = dateToLocalString(weekEnd);
        filtered = savedRepartos.filter(reparto => 
          reparto.date >= weekStartStr && reparto.date <= weekEndStr
        );
        break;
      
      case 'mes':
        const currentMonth = getLocalDateString().slice(0, 7);
        filtered = savedRepartos.filter(reparto => reparto.date.startsWith(currentMonth));
        break;
      
      case 'año':
        const currentYear = today.getFullYear().toString();
        filtered = savedRepartos.filter(reparto => reparto.date.startsWith(currentYear));
        break;
      
      case 'elegir_mes':
        filtered = savedRepartos.filter(reparto => reparto.date.startsWith(customMonth));
        break;
      
      case 'todos':
        filtered = savedRepartos;
        break;
      
      default:
        filtered = savedRepartos;
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
      case 'semana':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = dateToLocalString(weekStart);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = dateToLocalString(weekEnd);
        return `Esta Semana (${weekStartStr} - ${weekEndStr})`;
      case 'mes':
        return `Este Mes (${today.toISOString().slice(0, 7)})`;
      case 'año':
        return `Este Año (${today.getFullYear()})`;
      case 'elegir_mes':
        return `Mes Seleccionado (${customMonth})`;
      default:
        return 'Todos los Repartos';
    }
  };

  // Función para guardar el reparto actual como card
  const saveCurrentReparto = async () => {
    if (currentReparto.clients.length > 0) {
      try {
        const fechaActual = getLocalDateString();
        
        // Calcular total del reparto
        const total = currentReparto.clients.reduce((sum, cliente) => sum + (cliente.billAmount || 0), 0);
        
        // Construir reparto completo
        const repartoCompleto = {
          date: fechaActual,
          clientes: currentReparto.clients,
          total: total,
          cantidad: currentReparto.clients.length,
          createdAt: new Date().toISOString()
        };

        // Guardar TODO el reparto como un solo documento
        const repartoId = await addReparto(repartoCompleto);

        // Actualizar estado local
        setSavedRepartos(prev => [repartoCompleto, ...prev]);
        
        // LIMPIAR COMPLETAMENTE TODO DESPUÉS DE GUARDAR (React puro)
        // Marcar como limpiado manualmente para evitar interferencia del listener
        setIsManuallyCleared(true);
        
        // Limpiar todo de forma síncrona
        setClientes([]);
        setCurrentReparto({
          date: getLocalDateString(),
          clients: []
        });
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        setShowDebtors(false);
        
        // Mostrar notificación de éxito
        showSuccess('✓ Reparto guardado exitosamente - Lista limpiada');
        
        // Resetear flag después de un tiempo
        setTimeout(() => {
          setIsManuallyCleared(false);
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error al guardar reparto como card:', error);
        // Aún así guardar localmente para no perder datos
        const newReparto = {
          id: Date.now().toString(),
          ...currentReparto,
          createdAt: new Date().toISOString()
        };
        setSavedRepartos(prev => [newReparto, ...prev]);
        
        // Limpiar igual aunque haya error (React puro)
        console.log('🧹 Limpiando después de error...');
        setClientes([]);
        setCurrentReparto({
          date: getLocalDateString(),
          clients: []
        });
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        setShowDebtors(false);
        
        // Mostrar notificación de éxito (aunque haya error en Firebase)
        showSuccess('✓ Reparto guardado localmente - Lista limpiada');
      }
    }
  };


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
    // Convertir el formato del reparto guardado al formato que espera PrintDocument
    const printData = {
      clientes: reparto.clientes || [],
      fecha: reparto.date
    };
    
    setPrintData(printData);
    setShowPrintModal(true);
  };

  // Actualizar reparto
  const updateReparto = async (repartoId, updatedData) => {
    try {
      await updateDocument(repartoId, updatedData);
      console.log('✅ Reparto actualizado en Firebase:', repartoId);
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


  // Estado para mostrar/ocultar deudores (React puro)
  const [showDebtors, setShowDebtors] = useState(false);

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
  }, [repartos]);

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

  return (
    <div className="container mt-4 printable">
      <div className="row justify-content-start">
        <div className="col-lg-7 col-md-8">
      {/* Formulario para agregar cliente */}
      <div className="card p-3 no-print mb-3">
        <h2 className="card-title mb-3">Agregar Cliente</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="clientName" className="form-label">Nombre del Cliente *</label>
            <input 
              ref={clientNameInputRef}
              type="text" 
              className={`form-control ${validationErrors.clientName ? 'is-invalid' : ''}`}
              id="clientName" 
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                clearValidationError('clientName');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.getElementById('billAmount').focus();
                }
              }}
              placeholder="Ingrese nombre" 
              required 
            />
            {validationErrors.clientName && (
              <div className="invalid-feedback">{validationErrors.clientName}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="billAmount" className="form-label">Monto de la Boleta *</label>
            <input 
              type="number" 
              step="0.01" 
              className={`form-control ${validationErrors.billAmount ? 'is-invalid' : ''}`}
              id="billAmount" 
              value={billAmount}
              onChange={(e) => {
                setBillAmount(e.target.value);
                clearValidationError('billAmount');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ingrese monto" 
              required 
            />
            {validationErrors.billAmount && (
              <div className="invalid-feedback">{validationErrors.billAmount}</div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">Agregar Cliente</button>
        </form>
      </div>
      
      {/* Sección de Clientes del Día */}
      <div className="card p-3 mb-3 printable">
        <div className="d-flex justify-content-between align-items-center no-print">
          <h2 className="card-title">Clientes del Día</h2>
          <div className="d-flex gap-2">
            {currentReparto.clients.length > 0 && (
              <button 
                className="btn btn-success" 
                onClick={saveCurrentReparto}
              >
                <i className="fas fa-save me-1"></i>
                Guardar
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => {
              if (clientes.length === 0) {
                showError('No hay clientes para imprimir');
                return;
              }
              setPrintData({
                clientes: clientes,
                fecha: currentReparto.date
              });
              setShowPrintModal(true);
            }}>
              <i className="fas fa-print me-2"></i>
              Imprimir
            </button>
          </div>
        </div>
        <div className="alert alert-info mt-2 no-print" role="alert">
          <small>En la columna Pago: clic para marcar pago completo o doble clic para ingresar un monto parcial.</small>
          <small className="d-block mt-1">Clic en el monto de la boleta para editarlo (Enter para guardar).</small>
          <small className="d-block mt-1">Puedes reordenar los clientes arrastrando las filas.</small>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Nombre del Cliente</th>
                <th>Dirección</th>
                <th>Monto de Boleta</th>
                <th>Pago</th>
                <th className="no-print">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <ClienteRow
                  key={cliente.id}
                  cliente={cliente}
                  onUpdate={updateCliente}
                  onDelete={deleteCliente}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 totals-container">
          <p><strong>Subtotal:</strong> <span>{formatCurrency(subtotal)}</span></p>
          <p className="total"><strong>Total Pendiente:</strong> <span>{formatCurrency(totalPendiente)}</span></p>
        </div>
      </div>
      
      {/* Sección de Deudores */}
      <div className="card p-3 no-print">
        <button 
          className="btn btn-warning"
          onClick={handleShowDebtors}
        >
          {showDebtors ? 'Ocultar Deudores' : 'Ver Deudores'}
        </button>
        {showDebtors && (
          <div className="mt-3">
          <h3>Lista de Deudores</h3>
            <ul className="list-group">
              {deudores.map(deudor => {
                const pagado = deudor.paymentAmount || 0;
                const pendiente = deudor.billAmount - pagado;
                return (
                  <li key={deudor.id} className="list-group-item">
                    {deudor.clientName} debe {formatCurrency(pendiente)}
                  </li>
                );
              })}
          </ul>
        </div>
        )}
      </div>
        </div>
        <div className="col-lg-5 col-md-4">
          {/* Panel de Repartos */}
          <div className="card p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Repartos Guardados</h6>
              <small className="text-muted">{getFilteredRepartos().length} repartos</small>
            </div>
            
            {/* Filtros de Fecha */}
            <div className="mb-3">
              <div className="btn-group w-100 mb-2" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm ${dateFilter === 'hoy' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDateFilter('hoy')}
                >
                  Hoy
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${dateFilter === 'semana' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDateFilter('semana')}
                >
                  Semana
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${dateFilter === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDateFilter('mes')}
                >
                  Mes
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${dateFilter === 'año' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDateFilter('año')}
                >
                  Año
                </button>
              </div>
              
              {/* Selector de Mes Personalizado */}
              {dateFilter === 'elegir_mes' && (
                <div className="mb-2">
                  <input
                    type="month"
                    className="form-control form-control-sm"
                    value={customMonth}
                    onChange={(e) => setCustomMonth(e.target.value)}
                  />
                </div>
              )}
              
              <div className="d-flex gap-1">
                <button 
                  type="button" 
                  className={`btn btn-sm flex-fill ${dateFilter === 'elegir_mes' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDateFilter('elegir_mes')}
                >
                  Elegir Mes
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setDateFilter('todos')}
                  title="Ver todos los repartos"
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
            
            {/* Estado de Firebase */}
            <div className="mb-3">
              {loading ? (
                <div className="d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <small>Conectando...</small>
                </div>
              ) : error ? (
                <div className="text-danger">
                  <span className="badge bg-danger me-1">❌</span>
                  <small>Error de conexión: {error}</small>
                </div>
              ) : (
                <div className="text-success">
                  <span className="badge bg-success me-1">🟢</span>
                  <small>Conectado a Firebase</small>
                  <br />
                  <small className="text-muted">{repartos.length} repartos cargados</small>
                  <br />
                  <small className="text-info">🔗 Colección: repartos</small>
                </div>
              )}
            </div>

            {/* Lista de Cards de Repartos */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {getFilteredRepartos().length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p className="mb-0">
                    {savedRepartos.length === 0 
                      ? 'No hay repartos guardados' 
                      : `No hay repartos en ${getFilterTitle().toLowerCase()}`
                    }
                  </p>
                  <small>
                    {savedRepartos.length === 0 
                      ? 'Agrega clientes y guarda el reparto' 
                      : 'Cambia el filtro para ver más repartos'
                    }
                  </small>
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
          
          {/* Componente de Reportes */}
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
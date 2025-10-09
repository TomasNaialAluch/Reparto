import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/money';
import { useRepartos } from '../firebase/hooks';
import RepartoCard from '../components/RepartoCard';
import ClienteRow from '../components/ClienteRow';
import EditRepartoModal from '../components/EditRepartoModal';
import ReportesGraficos from '../components/ReportesGraficos';
import { printReparto } from '../utils/printUtils';

const MiReparto = () => {
  const [clientName, setClientName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  

  // Estados para el reparto actual (React puro)
  const [clientes, setClientes] = useState([]);
  const [currentReparto, setCurrentReparto] = useState({
    date: new Date().toISOString().split('T')[0],
    clients: []
  });

  // Firebase hooks
  const { repartos, todayRepartos, loading, error, addReparto, updatePayment, deleteReparto, updateDocument } = useRepartos();

  // Estados para las cards de repartos guardados
  const [savedRepartos, setSavedRepartos] = useState([]);
  
  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('hoy');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [lastProcessedDate, setLastProcessedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isManuallyCleared, setIsManuallyCleared] = useState(false);
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [repartoToEdit, setRepartoToEdit] = useState(null);

  // Función para filtrar repartos por fecha
  const getFilteredRepartos = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('🔍 Filtrando repartos:', {
      dateFilter,
      totalRepartos: savedRepartos.length,
      repartos: savedRepartos.map(r => ({ id: r.id, date: r.date }))
    });
    
    let filtered = [];
    
    switch (dateFilter) {
      case 'hoy':
        filtered = savedRepartos.filter(reparto => reparto.date === todayStr);
        break;
      
      case 'semana':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filtered = savedRepartos.filter(reparto => 
          reparto.date >= weekStartStr && reparto.date <= weekEndStr
        );
        break;
      
      case 'mes':
        const currentMonth = today.toISOString().slice(0, 7);
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
    
    console.log('✅ Repartos filtrados:', filtered.length);
    return filtered;
  };

  // Función para obtener el título del filtro
  const getFilterTitle = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'hoy':
        return `Hoy (${todayStr})`;
      case 'semana':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
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
        const newReparto = {
          ...currentReparto,
          clients: currentReparto.clients,
          createdAt: new Date().toISOString()
        };

        console.log('📝 Intentando guardar reparto:', newReparto);

        // Guardar en Firebase
        const repartoId = await addReparto({
          ...newReparto,
          isCardReparto: true // Marcar como reparto guardado como card
        });

        console.log('✅ Reparto guardado con ID:', repartoId);

        // Actualizar estado local
        setSavedRepartos(prev => [newReparto, ...prev]);
        
        // LIMPIAR COMPLETAMENTE TODO DESPUÉS DE GUARDAR (React puro)
        console.log('🧹 Iniciando limpieza después de guardar...');
        
        // Marcar como limpiado manualmente para evitar interferencia del listener
        setIsManuallyCleared(true);
        
        // Limpiar todo de forma síncrona
        setClientes([]);
        setCurrentReparto({
          date: new Date().toISOString().split('T')[0],
          clients: []
        });
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        setShowDebtors(false);
        
        // Resetear flag después de un tiempo
        setTimeout(() => {
          setIsManuallyCleared(false);
          console.log('🧹 Limpieza completada - Tabla vacía');
        }, 1000);
        
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
          date: new Date().toISOString().split('T')[0],
          clients: []
        });
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        setShowDebtors(false);
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
      
      console.log('✅ Reparto eliminado de Firebase');
    } catch (error) {
      console.error('❌ Error al eliminar reparto:', error);
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
    
    try {
      // Crear objeto cliente con ID único
      const newClient = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único temporal
        clientName: clientName.trim(),
        billAmount: amount,
        paymentStatus: 'pending',
        paymentAmount: 0,
        address: ''
      };

      // Actualizar estado React
      setClientes(prev => [...prev, newClient]);
      setCurrentReparto(prev => ({
        ...prev,
        clients: [...prev.clients, newClient]
      }));
      
      // Guardar en Firebase
      await addReparto({
        clientName: clientName.trim(),
        billAmount: amount,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Limpiar formulario
      setClientName('');
      setBillAmount('');
      setValidationErrors({});
      
      console.log('✅ Cliente agregado');
    } catch (error) {
      console.error('❌ Error al guardar cliente:', error);
      // Aún así agregamos localmente
      setClientes(prev => [...prev, newClient]);
      setClientName('');
      setBillAmount('');
      setValidationErrors({});
    }
  };

  // Funciones React puras para manejar clientes
  const updateCliente = async (clienteId, updates) => {
    try {
      // Actualizar en Firebase si no es un ID temporal
      if (!clienteId.startsWith('temp_')) {
        await updatePayment(clienteId, updates);
        console.log('✅ Cliente actualizado en Firebase:', clienteId);
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
    try {
      // Eliminar de Firebase
      await deleteReparto(clienteId);
      console.log('✅ Cliente eliminado de Firebase:', clienteId);
      
      // El estado local se actualizará automáticamente por el listener de Firebase
    } catch (error) {
      console.error('❌ Error al eliminar cliente:', error);
      // Aún así eliminar del estado local para UX
      setClientes(prev => prev.filter(cliente => cliente.id !== clienteId));
      setCurrentReparto(prev => ({
        ...prev,
        clients: prev.clients.filter(cliente => cliente.id !== clienteId)
      }));
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
        alert("No hay deudores.");
      return;
    }
    setShowDebtors(!showDebtors);
  };

  // Cargar datos desde Firebase al inicializar (consolidado)
  useEffect(() => {
    console.log('🔄 useEffect ejecutado - Repartos:', repartos.length, 'Manualmente limpiado:', isManuallyCleared);
    
    // No cargar datos si fue limpiado manualmente
    if (isManuallyCleared) {
      console.log('🚫 Saltando carga de datos - Tabla limpiada manualmente');
      return;
    }
    
    if (repartos.length > 0) {
      console.log('📦 Todos los repartos:', repartos);
      
      const todayStr = new Date().toISOString().split('T')[0];
      console.log('📅 Procesando repartos para el día:', todayStr);
      
      // 1. Cargar repartos con múltiples clientes (cards)
      const cardRepartos = repartos.filter(reparto => 
        reparto.clients && Array.isArray(reparto.clients) && reparto.clients.length > 0
      );
      
      if (cardRepartos.length > 0) {
        const formattedRepartos = cardRepartos.map(reparto => ({
          id: reparto.id,
          date: reparto.date,
          clients: reparto.clients || [],
          createdAt: reparto.createdAt
        }));
        
        setSavedRepartos(formattedRepartos);
        console.log('✅ Cards de repartos cargadas:', formattedRepartos.length);
      }
      
      // 2. Cargar clientes individuales del día actual (mejorado con validaciones)
      const todayIndividualRepartos = repartos.filter(reparto => {
        const isToday = reparto.date === todayStr;
        const hasClientName = reparto.clientName && reparto.clientName.trim() !== '';
        const isIndividual = !reparto.clients || reparto.clients.length === 0;
        const hasValidAmount = reparto.billAmount && parseFloat(reparto.billAmount) > 0;
        const hasValidId = reparto.id && reparto.id.trim() !== '';
        const isNotCorrupted = reparto.clientName !== 'undefined' && reparto.clientName !== null;
        
        return isToday && hasClientName && isIndividual && hasValidAmount && hasValidId && isNotCorrupted;
      });
      
      console.log('✅ Repartos individuales del día encontrados:', todayIndividualRepartos.length);
      
      if (todayIndividualRepartos.length > 0) {
        const clientesFormateados = todayIndividualRepartos.map(reparto => ({
          id: reparto.id,
          clientName: reparto.clientName.trim(),
          billAmount: parseFloat(reparto.billAmount),
          paymentStatus: reparto.paymentStatus || 'pending',
          paymentAmount: parseFloat(reparto.paymentAmount) || 0,
          address: reparto.address || ''
        }));
        
        console.log('👥 Clientes formateados:', clientesFormateados);
        
        setClientes(clientesFormateados);
        setCurrentReparto(prev => ({
          ...prev,
          clients: clientesFormateados
        }));
        
        console.log('✅ Clientes del día cargados desde Firebase:', clientesFormateados.length);
      } else {
        // Limpiar clientes si no hay repartos del día
        setClientes([]);
        setCurrentReparto(prev => ({
          ...prev,
          clients: []
        }));
        console.log('🧹 Clientes limpiados - No hay repartos del día');
      }
    } else {
      console.log('❌ No hay repartos en Firebase');
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
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (lastProcessedDate !== todayStr) {
      console.log('📅 Cambio de fecha detectado:', lastProcessedDate, '->', todayStr);
      
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
      
      console.log('🧹 Datos limpiados por cambio de fecha');
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
              type="text" 
              className={`form-control ${validationErrors.clientName ? 'is-invalid' : ''}`}
              id="clientName" 
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                clearValidationError('clientName');
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
            <button className="btn btn-secondary" onClick={() => printReparto(clientes, currentReparto.date)}>Imprimir</button>
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
    </div>
  );
};

export default MiReparto;
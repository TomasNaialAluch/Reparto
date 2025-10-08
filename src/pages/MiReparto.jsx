import React, { useState, useEffect } from 'react';
import Sortable from 'sortablejs';
import { formatCurrency } from '../utils/money';
import { Modal, Button } from 'react-bootstrap';
import { useRepartos } from '../firebase/hooks';
import RepartoCard from '../components/RepartoCard';
import ReportesGraficos from '../components/ReportesGraficos';

const MiReparto = () => {
  const [clientName, setClientName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newAmount, setNewAmount] = useState('');

  // Estados para el reparto actual
  const [currentReparto, setCurrentReparto] = useState({
    date: new Date().toISOString().split('T')[0],
    clients: []
  });

  // Firebase hooks
  const { repartos, todayRepartos, loading, error, addReparto, updatePayment, deleteReparto } = useRepartos();

  // Estados para las cards de repartos guardados
  const [savedRepartos, setSavedRepartos] = useState([]);
  
  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('hoy');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

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
        
        // LIMPIAR COMPLETAMENTE TODO DESPUÉS DE GUARDAR
        // 1. Limpiar reparto actual
        setCurrentReparto({
          date: new Date().toISOString().split('T')[0],
          clients: []
        });
        
        // 2. Limpiar tabla visual
        const tbody = document.getElementById('clientTableBody');
        if (tbody) {
          tbody.innerHTML = '';
        }
        
        // 3. Limpiar formulario
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
        
        // 4. Actualizar totales (debería mostrar 0)
        updateTotals();
        
        // 5. Limpiar lista de deudores si existe
        const debtorsList = document.getElementById('debtorsList');
        if (debtorsList) {
          debtorsList.style.display = 'none';
        }
        
        console.log('🧹 Tabla y formulario limpiados completamente');
        
      } catch (error) {
        console.error('❌ Error al guardar reparto como card:', error);
        // Aún así guardar localmente para no perder datos
        const newReparto = {
          id: Date.now().toString(),
          ...currentReparto,
          createdAt: new Date().toISOString()
        };
        setSavedRepartos(prev => [newReparto, ...prev]);
        
        // Limpiar igual aunque haya error
        setCurrentReparto({
          date: new Date().toISOString().split('T')[0],
          clients: []
        });
        
        const tbody = document.getElementById('clientTableBody');
        if (tbody) {
          tbody.innerHTML = '';
          updateTotals();
        }
        
        setClientName('');
        setBillAmount('');
        setValidationErrors({});
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

  // Función para editar un reparto guardado
  const editSavedReparto = (reparto) => {
    // Cargar el reparto en el estado actual
    setCurrentReparto(reparto);
    
    // Cargar en la tabla
    const tbody = document.getElementById('clientTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      reparto.clients.forEach(client => {
        addClientRow(client.clientName, client.billAmount.toFixed(2));
      });
      updateTotals();
    }
    
    // Eliminar de saved repartos (se volverá a guardar cuando presione "Guardar")
    deleteSavedReparto(reparto.id);
  };

  // Cargar repartos desde Firebase al inicializar
  useEffect(() => {
    if (repartos.length > 0) {
      console.log('📦 Repartos cargados desde Firebase:', repartos);
      
      // Filtrar repartos que tienen múltiples clientes (cards) o están marcados como cards
      const cardRepartos = repartos.filter(reparto => 
        reparto.clients && Array.isArray(reparto.clients) && reparto.clients.length > 0
      );
      
      console.log('🎴 Cards encontradas:', cardRepartos);
      
      if (cardRepartos.length > 0) {
        // Convertir a formato de cards
        const formattedRepartos = cardRepartos.map(reparto => ({
          id: reparto.id,
          date: reparto.date,
          clients: reparto.clients || [],
          createdAt: reparto.createdAt
        }));
        
        setSavedRepartos(formattedRepartos);
        console.log('✅ Cards de repartos cargadas desde Firebase:', formattedRepartos.length);
      }
      
      // Cargar repartos individuales del día actual en la tabla
      const todayIndividualRepartos = repartos.filter(reparto => 
        reparto.date === new Date().toISOString().split('T')[0] && 
        reparto.clientName && // Tiene nombre de cliente individual
        (!reparto.clients || reparto.clients.length === 0) // No es un reparto con múltiples clientes
      );
      
      if (todayIndividualRepartos.length > 0) {
        const tbody = document.getElementById('clientTableBody');
        if (tbody) {
          tbody.innerHTML = '';
        }
        
        todayIndividualRepartos.forEach(reparto => {
          addClientRow(reparto.clientName, reparto.billAmount.toFixed(2));
        });
        
        updateTotals();
        console.log('✅ Repartos individuales del día cargados desde Firebase:', todayIndividualRepartos.length);
      }
    }
  }, [repartos]);

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

  // Manejar envío del formulario
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
      // Crear objeto cliente
      const newClient = {
        clientName: clientName.trim(),
        billAmount: amount,
        paymentStatus: 'pending',
        paymentAmount: 0
      };

      // Actualizar reparto actual
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
      
      // Agregar cliente a la tabla local (para compatibilidad)
      addClientRow(clientName.trim(), amount.toFixed(2));
      updateTotals();
      
      // Limpiar formulario
      setClientName('');
      setBillAmount('');
      setValidationErrors({});
      
      console.log('✅ Reparto guardado en Firebase');
    } catch (error) {
      console.error('❌ Error al guardar reparto:', error);
      // Aún así agregamos localmente para no perder la funcionalidad
      addClientRow(clientName.trim(), amount.toFixed(2));
      updateTotals();
      setClientName('');
      setBillAmount('');
      setValidationErrors({});
    }
  };

  // Función para agregar fila de cliente (simplificada)
  const addClientRow = (name, amount) => {
    const tbody = document.getElementById('clientTableBody');
    const tr = document.createElement('tr');
    tr.dataset.bill = amount;
    tr.dataset.payment = "";

    // Nombre del Cliente
    const tdName = document.createElement('td');
    tdName.textContent = name;
    tr.appendChild(tdName);

    // Dirección (vacía)
    const tdAddress = document.createElement('td');
    tdAddress.textContent = "";
    tr.appendChild(tdAddress);

      // Monto de Boleta (editable con clic - modal)
      const tdAmount = document.createElement('td');
      tdAmount.textContent = formatCurrency(amount);
      tdAmount.style.cursor = 'pointer';
      tdAmount.title = 'Clic para editar monto';
      tdAmount.addEventListener('click', function() {
        const clientName = tr.cells[0].textContent;
        const currentAmount = parseFloat(tr.dataset.bill);
        
        // Usar React state para abrir modal
        setEditingClient({ name: clientName, tr: tr, td: tdAmount });
        setNewAmount(currentAmount.toFixed(2));
        setShowEditModal(true);
      });
      tr.appendChild(tdAmount);

    // Columna Pago
    const tdPago = document.createElement('td');
    tdPago.style.cursor = 'pointer';
    tdPago.textContent = "";
    tdPago.title = "Clic para marcar pago completo; Doble clic para ingresar monto parcial";

    let clickTimer = null;

    const refreshPaymentDisplay = () => {
      const paymentVal = tr.dataset.payment;
      if (paymentVal === "full") {
        tdPago.innerHTML = '<span class="paid">&times;</span>';
      } else if (paymentVal !== "" && !isNaN(paymentVal)) {
        tdPago.textContent = formatCurrency(paymentVal);
      } else {
        tdPago.textContent = "";
      }
    };

    tdPago.addEventListener('click', function(e) {
      if (clickTimer == null) {
        clickTimer = setTimeout(function(){
          clickTimer = null;
          tr.dataset.payment = (tr.dataset.payment === "" || tr.dataset.payment === null) ? "full" : "";
          refreshPaymentDisplay();
          updateTotals();
        }, 200);
      }
    });

    tdPago.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.classList.add('payment-input');
      input.value = (tr.dataset.payment !== "full" && tr.dataset.payment !== "") ? tr.dataset.payment : "";
      tdPago.innerHTML = "";
      tdPago.appendChild(input);
      input.focus();
      input.addEventListener('blur', function() {
        tr.dataset.payment = (input.value.trim() !== "") ? parseFloat(input.value).toFixed(2) : "";
        refreshPaymentDisplay();
        updateTotals();
      });
      input.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          input.blur();
        }
      });
    });

    tr.appendChild(tdPago);

    // Botón eliminar
    const tdActions = document.createElement('td');
    tdActions.classList.add('no-print', 'text-center');

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '❌';
    deleteBtn.classList.add('btn', 'btn-sm', 'btn-link', 'text-danger', 'p-0');
    deleteBtn.style.fontSize = '1.2em';
    deleteBtn.title = 'Eliminar cliente';

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tr.classList.add('fade-out');
      setTimeout(() => {
        tr.remove();
        updateTotals();
      }, 300);
    });

    tdActions.appendChild(deleteBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  };

  // Función para actualizar totales
  const updateTotals = () => {
    let subtotal = 0;
    let totalPending = 0;
    const rows = document.querySelectorAll("#clientTableBody tr");
    rows.forEach(row => {
      const bill = parseFloat(row.dataset.bill);
      subtotal += bill;
      let payment = 0;
      if (row.dataset.payment === "full") {
        payment = bill;
      } else if (row.dataset.payment !== "" && !isNaN(row.dataset.payment)) {
        payment = parseFloat(row.dataset.payment);
      }
      totalPending += (bill - payment);
    });
    
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(totalPending);
  };

  // Manejar edición de monto
  const handleSaveAmount = () => {
    const amount = parseFloat(newAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert("Ingrese un monto válido");
      return;
    }
    
    if (editingClient) {
      editingClient.tr.dataset.bill = amount.toFixed(2);
      editingClient.td.textContent = formatCurrency(amount);
      updateTotals();
    }
    
    setShowEditModal(false);
    setEditingClient(null);
    setNewAmount('');
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingClient(null);
    setNewAmount('');
  };

  // Manejar deudores
  const handleShowDebtors = () => {
    const debtorsListDiv = document.getElementById("debtorsList");
    const showBtn = document.getElementById("showDebtorsBtn");
    
    if (debtorsListDiv.style.display === "block") {
      debtorsListDiv.style.display = "none";
      showBtn.textContent = "Ver Deudores";
    } else {
      const debtorsUl = document.getElementById("debtorsUl");
      debtorsUl.innerHTML = "";
      const rows = document.querySelectorAll("#clientTableBody tr");
      rows.forEach(row => {
        const bill = parseFloat(row.dataset.bill);
        let payment = 0;
        if (row.dataset.payment === "full") {
          payment = bill;
        } else if (row.dataset.payment !== "" && !isNaN(row.dataset.payment)) {
          payment = parseFloat(row.dataset.payment);
        }
        const pending = bill - payment;
        if (pending > 0) {
          const debtorName = row.cells[0].textContent;
          const li = document.createElement('li');
          li.classList.add('list-group-item');
          li.textContent = debtorName + " debe " + formatCurrency(pending);
          debtorsUl.appendChild(li);
        }
      });
      if (document.getElementById("debtorsUl").children.length > 0) {
        debtorsListDiv.style.display = "block";
        showBtn.textContent = "Ocultar Deudores";
      } else {
        debtorsListDiv.style.display = "none";
        alert("No hay deudores.");
      }
    }
  };

  useEffect(() => {
    const tbody = document.getElementById('clientTableBody');
    if (!tbody) return;
    const sortable = new Sortable(tbody, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: () => updateTotals(),
    });
    return () => {
      try {
        sortable.destroy();
      } catch (_) {
        // ignore
      }
    };
  }, []);

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
      <div className="card p-3 mb-3">
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
            <button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
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
            <tbody id="clientTableBody">
              {/* Las filas se agregarán dinámicamente */}
            </tbody>
          </table>
        </div>
        <div className="mt-3 totals-container">
          <p><strong>Subtotal:</strong> <span id="subtotal">0</span></p>
          <p className="total"><strong>Total Pendiente:</strong> <span id="total">0</span></p>
        </div>
      </div>
      
      {/* Sección de Deudores */}
      <div className="card p-3 no-print">
        <button 
          id="showDebtorsBtn" 
          className="btn btn-warning"
          onClick={handleShowDebtors}
        >
          Ver Deudores
        </button>
        <div id="debtorsList" className="mt-3" style={{display: 'none'}}>
          <h3>Lista de Deudores</h3>
          <ul className="list-group" id="debtorsUl">
            {/* Se listarán los deudores */}
          </ul>
        </div>
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
                  <small>Error de conexión</small>
                </div>
              ) : (
                <div className="text-success">
                  <span className="badge bg-success me-1">🟢</span>
                  <small>Conectado a Firebase</small>
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
                    onEdit={editSavedReparto}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Componente de Reportes */}
          <ReportesGraficos repartos={savedRepartos} />
        </div>
      </div>
      
      {/* Modal para editar monto */}
      <Modal show={showEditModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Monto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingClient && (
            <>
              <p><strong>Cliente:</strong> {editingClient.name}</p>
              <div className="mb-3">
                <label htmlFor="newAmount" className="form-label">Nuevo monto:</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-control" 
                  id="newAmount" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveAmount();
                    }
                  }}
                  autoFocus
                  ref={(input) => {
                    if (input && showEditModal) {
                      setTimeout(() => {
                        input.focus();
                        input.select();
                      }, 100);
                    }
                  }}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveAmount}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MiReparto;
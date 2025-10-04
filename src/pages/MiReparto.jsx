import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

const MiReparto = () => {
  const [clientName, setClientName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newAmount, setNewAmount] = useState('');

  // Función para formatear montos a moneda argentina
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

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
  const handleSubmit = (e) => {
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
    
    // Si pasa las validaciones, agregar cliente
    addClientRow(clientName.trim(), amount.toFixed(2));
    updateTotals();
    
    // Limpiar formulario
    setClientName('');
    setBillAmount('');
    setValidationErrors({});
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
    // Inicializar SortableJS cuando el componente se monte
    const tbody = document.getElementById('clientTableBody');
    if (tbody && window.Sortable) {
      new window.Sortable(tbody, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function() {
          updateTotals();
        }
      });
    }
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
          <button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button>
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
          {/* Espacio reservado para funcionalidades de base de datos */}
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
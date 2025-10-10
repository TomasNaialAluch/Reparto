import React, { useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { useTransferenciasClientes } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import PrintDocument from '../components/PrintDocument';
import TransferenciaCard from '../components/TransferenciaCard';
import NotificationContainer from '../components/NotificationContainer';

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
  const [dateFilter, setDateFilter] = useState('hoy');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));

  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transferenciaToEdit, setTransferenciaToEdit] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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
      fecha: new Date().toISOString().split('T')[0]
    });
    setShowSummary(true);

    setTimeout(() => {
      const summaryElement = document.querySelector('.card.printable');
      if (summaryElement) {
        summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  // Guardar en Firebase
  const saveTransferencia = async () => {
    if (!summaryData) {
      showError('Primero debe calcular el saldo');
      return;
    }

    try {
      await addTransferencia(summaryData);
      showSuccess('✓ Transferencia guardada exitosamente');
      
      // Limpiar formulario
      setClientName('');
      setTransferencias([{ descripcion: '', monto: '' }]);
      setBoletas([{ fecha: new Date().toISOString().split('T')[0], monto: '' }]);
      setSummaryData(null);
      setShowSummary(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al guardar la transferencia');
    }
  };

  // Función para filtrar transferencias por fecha
  const getFilteredTransferencias = () => {
    if (!savedTransferencias) return [];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

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

  return (
    <div className="container mt-4">
      <div className="row justify-content-start">
        <div className="col-lg-7 col-md-8">
          {/* Formulario */}
          <div className="card p-3 no-print mb-3">
            <h4 className="mb-3">Transferencias</h4>
            
            {/* Nombre del Cliente */}
            <div className="mb-3">
              <label htmlFor="clientName" className="form-label">Nombre del Cliente</label>
              <input
                type="text"
                id="clientName"
                className="form-control"
                placeholder="Ingrese el nombre del cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <hr />

            {/* Transferencias */}
            <h5 className="mb-2">Transferencias Recibidas</h5>
            <small className="text-muted d-block mb-2">Dinero que el cliente te envió</small>
            {transferencias.map((t, index) => (
              <div key={index} className="row mb-2">
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Descripción"
                    value={t.descripcion}
                    onChange={(e) => updateTransferenciaRow(index, 'descripcion', e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Monto (AR$)"
                    value={t.monto}
                    onChange={(e) => updateTransferenciaRow(index, 'monto', e.target.value)}
                  />
                </div>
                <div className="col-1">
                  {transferencias.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeTransferenciaRow(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-secondary mb-3"
              onClick={addTransferenciaRow}
            >
              + Agregar Transferencia
            </button>

            <hr />

            {/* Boletas */}
            <h5 className="mb-2">Boletas Vendidas al Cliente</h5>
            <small className="text-muted d-block mb-2">Dinero que le debes al cliente</small>
            {boletas.map((b, index) => (
              <div key={index} className="row mb-2">
                <div className="col-6">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={b.fecha}
                    onChange={(e) => updateBoleta(index, 'fecha', e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Monto (AR$)"
                    value={b.monto}
                    onChange={(e) => updateBoleta(index, 'monto', e.target.value)}
                  />
                </div>
                <div className="col-1">
                  {boletas.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeBoleta(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-secondary mb-3"
              onClick={addBoleta}
            >
              + Agregar Boleta
            </button>

            <hr />

            {/* Botones */}
            <div className="d-flex gap-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={calcularSaldo}
                style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}
              >
                Calcular Saldo
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={saveTransferencia}
                disabled={!summaryData}
                style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}
              >
                <i className="fas fa-save me-2"></i>
                Guardar
              </button>
            </div>
          </div>

          {/* Resumen */}
          {showSummary && summaryData && (
            <div className="card p-3 printable">
              <h4 className="mb-3">Resumen de Transferencias</h4>
              <h5 className="mb-3">Cliente: {summaryData.nombreCliente}</h5>

              {/* Transferencias */}
              <div className="mb-3">
                <h6 className="text-primary">Transferencias Recibidas:</h6>
                {summaryData.transferencias.map((t, i) => (
                  <p key={i} className="mb-1">
                    {t.descripcion || `Transferencia ${i + 1}`}: {formatCurrency(parseCurrencyValue(t.monto))}
                  </p>
                ))}
                <p className="fw-bold">Subtotal: {formatCurrency(summaryData.totalTransferencias)}</p>
              </div>

              <hr />

              {/* Boletas */}
              <div className="mb-3">
                <h6 className="text-warning">Boletas Vendidas:</h6>
                {summaryData.boletas.map((b, i) => (
                  <p key={i} className="mb-1">
                    Boleta {i + 1} ({b.fecha}): {formatCurrency(parseCurrencyValue(b.monto))}
                  </p>
                ))}
                <p className="fw-bold">Subtotal: {formatCurrency(summaryData.totalBoletas)}</p>
              </div>

              <hr />

              {/* Saldo Final */}
              <div className="mb-3">
                {summaryData.saldoFinal > 0 ? (
                  <>
                    <h5 className="text-success">Saldo a favor del cliente: {formatCurrency(summaryData.saldoFinal)}</h5>
                    <p className="text-success fw-bold">Le debes {formatCurrency(summaryData.saldoFinal)} a {summaryData.nombreCliente}</p>
                  </>
                ) : summaryData.saldoFinal < 0 ? (
                  <>
                    <h5 className="text-danger">Saldo a tu favor: {formatCurrency(Math.abs(summaryData.saldoFinal))}</h5>
                    <p className="text-danger fw-bold">{summaryData.nombreCliente} te debe {formatCurrency(Math.abs(summaryData.saldoFinal))}</p>
                  </>
                ) : (
                  <>
                    <h5 className="text-info">Saldo Final: Exacto</h5>
                    <p className="text-info fw-bold">No hay diferencia - Cuentas saldadas</p>
                  </>
                )}
              </div>

              <button
                className="btn btn-secondary mt-3 no-print"
                onClick={() => {
                  setPrintData(summaryData);
                  setShowPrintModal(true);
                }}
              >
                <i className="fas fa-print me-2"></i>
                Imprimir
              </button>
            </div>
          )}
        </div>

        {/* Panel Derecho - Transferencias Guardadas */}
        <div className="col-lg-5 col-md-4 no-print">
          <div className="card p-3 mb-3">
            <h6>Estado de Conexión</h6>
            {loading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                <small>Cargando transferencias...</small>
              </div>
            ) : error ? (
              <div className="alert alert-danger py-2">
                <small>Error: {error}</small>
              </div>
            ) : (
              <div className="alert alert-success py-2">
                <small>✓ Conectado - {savedTransferencias?.length || 0} transferencias</small>
              </div>
            )}
          </div>

          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Transferencias Guardadas</h6>
              <span className="badge bg-primary">{getFilteredTransferencias().length}</span>
            </div>

            {/* Filtros de Fecha */}
            <div className="btn-group btn-group-sm mb-3 w-100" role="group">
              <button
                type="button"
                className={`btn ${dateFilter === 'hoy' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setDateFilter('hoy')}
              >
                Hoy
              </button>
              <button
                type="button"
                className={`btn ${dateFilter === 'semana' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setDateFilter('semana')}
              >
                Semana
              </button>
              <button
                type="button"
                className={`btn ${dateFilter === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setDateFilter('mes')}
              >
                Mes
              </button>
              <button
                type="button"
                className={`btn ${dateFilter === 'año' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setDateFilter('año')}
              >
                Año
              </button>
            </div>

            {dateFilter === 'mes' && (
              <div className="mb-3">
                <input
                  type="month"
                  className="form-control form-control-sm"
                  value={customMonth}
                  onChange={(e) => setCustomMonth(e.target.value)}
                />
              </div>
            )}

            {/* Lista de Transferencias */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                <div className="text-center text-muted py-3">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p className="mb-0">No hay transferencias guardadas</p>
                  <small>Calcula y guarda una transferencia para verla aquí</small>
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

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default Transferencias;


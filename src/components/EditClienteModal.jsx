import React, { useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString } from '../utils/date';

const EditClienteModal = ({ isOpen, onClose, cliente, onSave }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    boletas: [{ date: '', amount: '' }],
    ventas: [],
    plataFavor: [],
    efectivo: [],
    cheques: [],
    transferencias: []
  });
  const [showSections, setShowSections] = useState({
    ventas: false,
    plataFavor: false,
    efectivo: false,
    cheques: false,
    transferencias: false
  });

  // Cargar datos del cliente cuando se abre el modal
  useEffect(() => {
    if (isOpen && cliente) {
      setFormData({
        clientName: cliente.nombreCliente || '',
        boletas: cliente.boletas?.length > 0 ? cliente.boletas : [{ date: '', amount: '' }],
        ventas: cliente.ventas || [],
        plataFavor: cliente.plataFavor || [],
        efectivo: cliente.efectivo || [],
        cheques: cliente.cheques || [],
        transferencias: cliente.transferencias || []
      });
      setShowSections({
        ventas: (cliente.ventas?.length || 0) > 0,
        plataFavor: (cliente.plataFavor?.length || 0) > 0,
        efectivo: (cliente.efectivo?.length || 0) > 0,
        cheques: (cliente.cheques?.length || 0) > 0,
        transferencias: (cliente.transferencias?.length || 0) > 0
      });
    }
  }, [isOpen, cliente]);

  // Funciones helper (reutilizadas del componente principal)
  const handleCurrencyBlur = (e) => {
    let num = parseCurrencyValue(e.target.value);
    if (!isNaN(num)) {
      e.target.value = formatCurrencyNoSymbol(num);
    }
  };

  const handleCurrencyFocus = (e) => {
    let val = e.target.value.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim();
    e.target.value = val;
  };

  // Funciones para manejar arrays (DRY)
  const addItem = (arrayName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  const removeItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const updateItem = (arrayName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Funciones específicas para cada tipo
  const addBoleta = () => addItem('boletas', { date: getLocalDateString(), amount: '' });
  const addVenta = () => addItem('ventas', { date: getLocalDateString(), amount: '' });
  const addPlataFavor = () => addItem('plataFavor', { amount: '' });
  const addEfectivo = () => addItem('efectivo', { amount: '' });
  const addCheque = () => addItem('cheques', { id: '', amount: '' });
  const addTransferencia = () => addItem('transferencias', { amount: '' });

  const handleSave = () => {
    if (!formData.clientName.trim()) {
      alert('Ingrese el nombre del cliente');
      return;
    }

    // Filtrar datos válidos
    const boletasFiltradas = formData.boletas.filter(b => b.date && b.amount);
    const ventasFiltradas = showSections.ventas ? formData.ventas.filter(v => v.date && v.amount) : [];
    const plataFiltrada = showSections.plataFavor ? formData.plataFavor.filter(p => p.amount) : [];
    const efectivoFiltrado = showSections.efectivo ? formData.efectivo.filter(e => e.amount) : [];
    const chequesFiltrados = showSections.cheques ? formData.cheques.filter(c => c.id && c.amount) : [];
    const transferenciasFiltradas = showSections.transferencias ? formData.transferencias.filter(t => t.amount) : [];

    // Calcular totales (igual que en el componente principal)
    const totalBoletas = boletasFiltradas.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0);
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0);
    const totalPlata = plataFiltrada.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0);
    const totalEfectivo = efectivoFiltrado.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0);
    const totalCheque = chequesFiltrados.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0);
    const totalTransferencia = transferenciasFiltradas.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0);
    const totalIngresos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
    const finalBalance = totalBoletas - totalIngresos;

    // Debug: Log de los cálculos
    console.log('🔍 Modal - Cálculos realizados:', {
      boletasFiltradas: boletasFiltradas.length,
      totalBoletas,
      chequesFiltrados: chequesFiltrados.length,
      totalCheque,
      totalIngresos,
      finalBalance,
      plataFiltrada: plataFiltrada.length,
      totalPlata,
      efectivoFiltrado: efectivoFiltrado.length,
      totalEfectivo,
      transferenciasFiltradas: transferenciasFiltradas.length,
      totalTransferencia
    });

    const clienteData = {
      ...formData,
      clientName: formData.clientName.trim(),
      boletas: boletasFiltradas,
      ventas: ventasFiltradas,
      plataFavor: plataFiltrada,
      efectivo: efectivoFiltrado,
      cheques: chequesFiltrados,
      transferencias: transferenciasFiltradas,
      // Agregar todos los totales calculados
      totalBoletas,
      totalVentas,
      totalPlata,
      totalEfectivo,
      totalCheque,
      totalTransferencia,
      totalIngresos,
      finalBalance
    };

    console.log('📤 Modal - Datos enviados a onSave:', {
      clienteId: cliente.id,
      clienteData: clienteData,
      plataFavor: clienteData.plataFavor,
      totalPlata: clienteData.totalPlata
    });

    onSave(cliente.id, clienteData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Editar Cliente: {cliente?.nombreCliente}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Nombre del Cliente */}
            <div className="mb-3">
              <label className="form-label">Nombre del Cliente</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                required 
              />
            </div>

            {/* Boletas */}
            <div className="mb-3">
              <h6>Boletas</h6>
              {formData.boletas.map((boleta, index) => (
                <div key={index} className="d-flex gap-2 align-items-center mb-2">
                  <input 
                    type="date" 
                    className="form-control" 
                    value={boleta.date}
                    onChange={(e) => updateItem('boletas', index, 'date', e.target.value)}
                    required 
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Monto (AR$)" 
                    value={boleta.amount}
                    onChange={(e) => updateItem('boletas', index, 'amount', e.target.value)}
                    onBlur={handleCurrencyBlur}
                    onFocus={handleCurrencyFocus}
                    required 
                  />
                  <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem('boletas', index)}>×</button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={addBoleta}>Agregar Boleta</button>
            </div>

            {/* Ventas */}
            <div className="mb-3">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={showSections.ventas} 
                  onChange={(e) => {
                    setShowSections(prev => ({ ...prev, ventas: e.target.checked }));
                    if (e.target.checked && formData.ventas.length === 0) addVenta();
                  }} 
                />
                <label className="form-check-label">Le vendió algo</label>
              </div>
              {showSections.ventas && (
                <div className="mt-2">
                  {formData.ventas.map((venta, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="date" className="form-control" value={venta.date} onChange={(e) => updateItem('ventas', index, 'date', e.target.value)} />
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={venta.amount} onChange={(e) => updateItem('ventas', index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem('ventas', index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addVenta}>Agregar Venta</button>
                </div>
              )}
            </div>

            {/* Plata a Favor */}
            <div className="mb-3">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={showSections.plataFavor} 
                  onChange={(e) => {
                    setShowSections(prev => ({ ...prev, plataFavor: e.target.checked }));
                    if (e.target.checked && formData.plataFavor.length === 0) addPlataFavor();
                  }} 
                />
                <label className="form-check-label">Plata a Favor</label>
              </div>
              {showSections.plataFavor && (
                <div className="mt-2">
                  {formData.plataFavor.map((item, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updateItem('plataFavor', index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem('plataFavor', index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addPlataFavor}>Agregar Plata a Favor</button>
                </div>
              )}
            </div>

            {/* Efectivo */}
            <div className="mb-3">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={showSections.efectivo} 
                  onChange={(e) => {
                    setShowSections(prev => ({ ...prev, efectivo: e.target.checked }));
                    if (e.target.checked && formData.efectivo.length === 0) addEfectivo();
                  }} 
                />
                <label className="form-check-label">Pago en Efectivo</label>
              </div>
              {showSections.efectivo && (
                <div className="mt-2">
                  {formData.efectivo.map((item, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updateItem('efectivo', index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem('efectivo', index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addEfectivo}>Agregar Efectivo</button>
                </div>
              )}
            </div>

            {/* Cheques */}
            <div className="mb-3">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={showSections.cheques} 
                  onChange={(e) => {
                    setShowSections(prev => ({ ...prev, cheques: e.target.checked }));
                    if (e.target.checked && formData.cheques.length === 0) addCheque();
                  }} 
                />
                <label className="form-check-label">Pago con Cheque</label>
              </div>
              {showSections.cheques && (
                <div className="mt-2">
                  {formData.cheques.map((cheque, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" maxLength="4" placeholder="Últimos 4 dígitos" value={cheque.id} onChange={(e) => updateItem('cheques', index, 'id', e.target.value)} />
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={cheque.amount} onChange={(e) => updateItem('cheques', index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem('cheques', index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addCheque}>Agregar Cheque</button>
                </div>
              )}
            </div>

            {/* Transferencias */}
            <div className="mb-3">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={showSections.transferencias} 
                  onChange={(e) => {
                    setShowSections(prev => ({ ...prev, transferencias: e.target.checked }));
                    if (e.target.checked && formData.transferencias.length === 0) addTransferencia();
                  }} 
                />
                <label className="form-check-label">Pago por Transferencia</label>
              </div>
              {showSections.transferencias && (
                <div className="mt-2">
                  {formData.transferencias.map((transfer, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={transfer.amount} onChange={(e) => updateItem('transferencias', index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem('transferencias', index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addTransferencia}>Agregar Transferencia</button>
                </div>
              )}
            </div>

            {/* Resumen del Balance */}
            <div className="card mt-3">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">Resumen del Balance</h6>
              </div>
              <div className="card-body">
                {(() => {
                  // Calcular totales en tiempo real
                  const totalBoletas = formData.boletas
                    .filter(b => b.date && b.amount)
                    .reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0);
                  
                  const totalVentas = showSections.ventas ? 
                    formData.ventas
                      .filter(v => v.date && v.amount)
                      .reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0) : 0;
                  
                  const totalPlata = showSections.plataFavor ? 
                    formData.plataFavor
                      .filter(p => p.amount)
                      .reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0) : 0;
                  
                  const totalEfectivo = showSections.efectivo ? 
                    formData.efectivo
                      .filter(e => e.amount)
                      .reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0) : 0;
                  
                  const totalCheque = showSections.cheques ? 
                    formData.cheques
                      .filter(c => c.id && c.amount)
                      .reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0) : 0;
                  
                  const totalTransferencia = showSections.transferencias ? 
                    formData.transferencias
                      .filter(t => t.amount)
                      .reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0) : 0;
                  
                  const totalIngresos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
                  const finalBalance = totalBoletas - totalIngresos;

                  return (
                    <div>
                      <div className="row">
                        <div className="col-6">
                          <p><strong>Total Boletas:</strong> {formatCurrency(totalBoletas)}</p>
                        </div>
                        <div className="col-6">
                          <p><strong>Total Ingresos:</strong> {formatCurrency(totalIngresos)}</p>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-12">
                          <div className={`alert ${finalBalance > 0 ? 'alert-warning' : finalBalance < 0 ? 'alert-success' : 'alert-info'}`}>
                            <strong>Balance Final: {formatCurrency(Math.abs(finalBalance))}</strong>
                            <br />
                            {finalBalance > 0 ? (
                              <span>{formData.clientName || 'El cliente'} te debe {formatCurrency(finalBalance)}</span>
                            ) : finalBalance < 0 ? (
                              <span>Tú le debes {formatCurrency(Math.abs(finalBalance))} a {formData.clientName || 'el cliente'}</span>
                            ) : (
                              <span>Las cuentas están saldadas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClienteModal;

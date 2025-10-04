import React, { useState, useEffect } from 'react';

const SaldoClientes = () => {
  const [clientName, setClientName] = useState('');
  const [boletas, setBoletas] = useState([{ date: '', amount: '' }]);
  const [showVentas, setShowVentas] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [showPlata, setShowPlata] = useState(false);
  const [plata, setPlata] = useState([]);
  const [showEfectivo, setShowEfectivo] = useState(false);
  const [efectivo, setEfectivo] = useState([]);
  const [showCheque, setShowCheque] = useState(false);
  const [cheques, setCheques] = useState([]);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [transferencias, setTransferencias] = useState([]);
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Función para formatear números a moneda argentina
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Función para parsear el valor formateado a número
  const parseCurrencyValue = (value) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Formatear input de moneda
  const handleCurrencyBlur = (e) => {
    let num = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num)) {
      e.target.value = formatCurrency(num).replace('$', '').trim();
    }
  };

  const handleCurrencyFocus = (e) => {
    let val = e.target.value.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim();
    e.target.value = val;
  };

  // Funciones para agregar filas
  const addBoleta = () => {
    setBoletas([...boletas, { date: new Date().toISOString().split('T')[0], amount: '' }]);
  };

  const addVenta = () => {
    setVentas([...ventas, { date: new Date().toISOString().split('T')[0], amount: '' }]);
  };

  const addPlata = () => {
    setPlata([...plata, { amount: '' }]);
  };

  const addEfectivo = () => {
    setEfectivo([...efectivo, { amount: '' }]);
  };

  const addCheque = () => {
    setCheques([...cheques, { id: '', amount: '' }]);
  };

  const addTransferencia = () => {
    setTransferencias([...transferencias, { amount: '' }]);
  };

  // Funciones para eliminar filas
  const removeBoleta = (index) => {
    setBoletas(boletas.filter((_, i) => i !== index));
  };

  const removeVenta = (index) => {
    setVentas(ventas.filter((_, i) => i !== index));
  };

  const removePlata = (index) => {
    setPlata(plata.filter((_, i) => i !== index));
  };

  const removeEfectivo = (index) => {
    setEfectivo(efectivo.filter((_, i) => i !== index));
  };

  const removeCheque = (index) => {
    setCheques(cheques.filter((_, i) => i !== index));
  };

  const removeTransferencia = (index) => {
    setTransferencias(transferencias.filter((_, i) => i !== index));
  };

  // Actualizar valores
  const updateBoleta = (index, field, value) => {
    const newBoletas = [...boletas];
    newBoletas[index][field] = value;
    setBoletas(newBoletas);
  };

  const updateVenta = (index, field, value) => {
    const newVentas = [...ventas];
    newVentas[index][field] = value;
    setVentas(newVentas);
  };

  const updatePlata = (index, value) => {
    const newPlata = [...plata];
    newPlata[index].amount = value;
    setPlata(newPlata);
  };

  const updateEfectivo = (index, value) => {
    const newEfectivo = [...efectivo];
    newEfectivo[index].amount = value;
    setEfectivo(newEfectivo);
  };

  const updateCheque = (index, field, value) => {
    const newCheques = [...cheques];
    newCheques[index][field] = value;
    setCheques(newCheques);
  };

  const updateTransferencia = (index, value) => {
    const newTransferencias = [...transferencias];
    newTransferencias[index].amount = value;
    setTransferencias(newTransferencias);
  };

  // Calcular saldo
  const calculateSaldo = () => {
    if (!clientName.trim()) {
      alert('Ingrese el nombre del cliente');
      return;
    }

    let summaryHtml = `<h1 class="print-header">Resumen de Cuenta con ${clientName}</h1>`;

    // Boletas
    let totalBoletas = 0;
    let boletasHtml = '';
    boletas.forEach((boleta, index) => {
      const amount = parseCurrencyValue(boleta.amount);
      totalBoletas += amount;
      boletasHtml += `<p class="print-small">Boleta ${index + 1}: ${boleta.date}, ${formatCurrency(amount)}</p>`;
    });
    summaryHtml += `<p class="print-small"><strong>Boletas vendidas por ${clientName}:</strong></p>` + boletasHtml;
    summaryHtml += `
      <div class="print-subtotal">
        <p><strong>Total de Boletas vendidas por ${clientName}:</strong> ${formatCurrency(totalBoletas)}</p>
      </div>
    `;

    // Ventas
    let totalVentas = 0;
    let ventasHtml = '';
    ventas.forEach((venta, index) => {
      const amount = parseCurrencyValue(venta.amount);
      totalVentas += amount;
      ventasHtml += `<p class="print-small">Venta ${index + 1}: ${venta.date}, ${formatCurrency(amount)}</p>`;
    });
    if (totalVentas > 0) {
      summaryHtml += `<p class="print-small" style="margin-top: 1rem;"><strong>Ventas a ${clientName}:</strong></p>` + ventasHtml;
    }

    // Plata a Favor
    let totalPlata = 0;
    let plataHtml = '';
    plata.forEach((item, index) => {
      const amount = parseCurrencyValue(item.amount);
      totalPlata += amount;
      plataHtml += `<p class="print-small">Plata ${index + 1}: ${formatCurrency(amount)}</p>`;
    });
    if (totalPlata > 0) {
      summaryHtml += `<p class="print-small" style="margin-top: 1rem;"><strong>Plata a Favor:</strong></p>` + plataHtml;
    }

    // Efectivo
    let totalEfectivo = 0;
    let efectivoHtml = '';
    efectivo.forEach((item, index) => {
      const amount = parseCurrencyValue(item.amount);
      totalEfectivo += amount;
      efectivoHtml += `<p class="print-small">Efectivo ${index + 1}: ${formatCurrency(amount)}</p>`;
    });
    if (totalEfectivo > 0) {
      summaryHtml += `<p class="print-small" style="margin-top: 1rem;"><strong>Efectivo:</strong></p>` + efectivoHtml;
    }

    // Cheques
    let totalCheque = 0;
    let chequeHtml = '';
    cheques.forEach((cheque, index) => {
      const amount = parseCurrencyValue(cheque.amount);
      totalCheque += amount;
      chequeHtml += `<p class="print-small">Cheque ${index + 1} (ID: ${cheque.id}): ${formatCurrency(amount)}</p>`;
    });
    if (totalCheque > 0) {
      summaryHtml += `<p class="print-small" style="margin-top: 1rem;"><strong>Cheque:</strong></p>` + chequeHtml;
    }

    // Transferencias
    let totalTransferencia = 0;
    let transferenciaHtml = '';
    transferencias.forEach((transfer, index) => {
      const amount = parseCurrencyValue(transfer.amount);
      totalTransferencia += amount;
      transferenciaHtml += `<p class="print-small">Transferencia ${index + 1}: ${formatCurrency(amount)}</p>`;
    });
    if (totalTransferencia > 0) {
      summaryHtml += `<p class="print-small" style="margin-top: 1rem;"><strong>Transferencia:</strong></p>` + transferenciaHtml;
    }

    // Subtotal de ingresos
    const totalIngresos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
    summaryHtml += `
      <div class="print-subtotal">
        <p><strong>Total de Ingresos del Usuario:</strong> ${formatCurrency(totalIngresos)}</p>
      </div>
    `;

    // Saldo Final
    const finalBalance = totalIngresos - totalBoletas;
    let finalHtml = '';
    if (finalBalance > 0) {
      finalHtml = `<h3 class="print-message">Saldo Final: ${formatCurrency(finalBalance)}</h3>
                   <p class="print-message">${clientName} te debe ${formatCurrency(finalBalance)}.</p>`;
    } else if (finalBalance < 0) {
      finalHtml = `<h3 class="print-message">Saldo Final: ${formatCurrency(Math.abs(finalBalance))}</h3>
                   <p class="print-message">Tú le debes ${formatCurrency(Math.abs(finalBalance))} a ${clientName}.</p>`;
    } else {
      finalHtml = `<h3 class="print-message">Saldo Final: ${formatCurrency(0)}</h3>
                   <p class="print-message">Las cuentas están saldadas. No hay deudas pendientes.</p>`;
    }

    setSummary(summaryHtml + finalHtml);
    setShowSummary(true);
  };

  useEffect(() => {
    // Establecer fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    if (boletas[0].date === '') {
      updateBoleta(0, 'date', today);
    }
  }, []);

  return (
    <div className="container mt-4 printable">
      <div className="row justify-content-start">
        <div className="col-lg-7 col-md-8">
          <h1 className="text-center mb-4 no-print">Saldo Clientes</h1>
          
          {/* Formulario */}
          <div className="card p-3 no-print mb-3">
            <form>
              {/* Datos del Cliente */}
              <h4>Datos del Cliente</h4>
              <div className="mb-3">
                <label htmlFor="clientName" className="form-label">Nombre del Cliente</label>
                <input 
                  type="text" 
                  id="clientName" 
                  className="form-control" 
                  placeholder="Ingrese nombre" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required 
                />
              </div>

              {/* Detalle de Boletas */}
              <h4>Detalle de Boletas</h4>
              <div className="mb-3">
                {boletas.map((boleta, index) => (
                  <div key={index} className="d-flex gap-2 align-items-center mb-2">
                    <input 
                      type="date" 
                      className="form-control" 
                      value={boleta.date}
                      onChange={(e) => updateBoleta(index, 'date', e.target.value)}
                      required 
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Monto (AR$)" 
                      value={boleta.amount}
                      onChange={(e) => updateBoleta(index, 'amount', e.target.value)}
                      onBlur={handleCurrencyBlur}
                      onFocus={handleCurrencyFocus}
                      required 
                    />
                    <button 
                      type="button" 
                      className="btn btn-link text-danger p-0" 
                      onClick={() => removeBoleta(index)}
                      style={{ fontSize: '1.2rem' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-secondary mb-3" onClick={addBoleta}>
                Agregar Boleta
              </button>

              {/* Ajustes: Venta */}
              <h4>Ajustes</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    id="checkVenta" 
                    className="form-check-input"
                    checked={showVentas}
                    onChange={(e) => {
                      setShowVentas(e.target.checked);
                      if (e.target.checked && ventas.length === 0) {
                        addVenta();
                      }
                    }}
                  />
                  <label htmlFor="checkVenta" className="form-check-label">Le vendió algo</label>
                </div>
              </div>
              
              {showVentas && (
                <div className="mb-3">
                  <h5>Detalle de Ventas</h5>
                  {ventas.map((venta, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input 
                        type="date" 
                        className="form-control" 
                        value={venta.date}
                        onChange={(e) => updateVenta(index, 'date', e.target.value)}
                        required 
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Monto (AR$)" 
                        value={venta.amount}
                        onChange={(e) => updateVenta(index, 'amount', e.target.value)}
                        onBlur={handleCurrencyBlur}
                        onFocus={handleCurrencyFocus}
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn btn-link text-danger p-0" 
                        onClick={() => removeVenta(index)}
                        style={{ fontSize: '1.2rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addVenta}>
                    Agregar Venta
                  </button>
                </div>
              )}

              {/* Plata a Favor */}
              <h4>Plata a Favor</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    id="checkPlata" 
                    className="form-check-input"
                    checked={showPlata}
                    onChange={(e) => {
                      setShowPlata(e.target.checked);
                      if (e.target.checked && plata.length === 0) {
                        addPlata();
                      }
                    }}
                  />
                  <label htmlFor="checkPlata" className="form-check-label">Tiene Plata a Favor</label>
                </div>
              </div>
              
              {showPlata && (
                <div className="mb-3">
                  {plata.map((item, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Monto (AR$)" 
                        value={item.amount}
                        onChange={(e) => updatePlata(index, e.target.value)}
                        onBlur={handleCurrencyBlur}
                        onFocus={handleCurrencyFocus}
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn btn-link text-danger p-0" 
                        onClick={() => removePlata(index)}
                        style={{ fontSize: '1.2rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addPlata}>
                    Agregar Plata a Favor
                  </button>
                </div>
              )}

              {/* Pago en Efectivo */}
              <h4>Pago en Efectivo</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    id="checkEfectivo" 
                    className="form-check-input"
                    checked={showEfectivo}
                    onChange={(e) => {
                      setShowEfectivo(e.target.checked);
                      if (e.target.checked && efectivo.length === 0) {
                        addEfectivo();
                      }
                    }}
                  />
                  <label htmlFor="checkEfectivo" className="form-check-label">Pago en Efectivo</label>
                </div>
              </div>
              
              {showEfectivo && (
                <div className="mb-3">
                  {efectivo.map((item, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Monto (AR$)" 
                        value={item.amount}
                        onChange={(e) => updateEfectivo(index, e.target.value)}
                        onBlur={handleCurrencyBlur}
                        onFocus={handleCurrencyFocus}
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn btn-link text-danger p-0" 
                        onClick={() => removeEfectivo(index)}
                        style={{ fontSize: '1.2rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addEfectivo}>
                    Agregar Pago en Efectivo
                  </button>
                </div>
              )}

              {/* Pago con Cheque */}
              <h4>Pago con Cheque</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    id="checkCheque" 
                    className="form-check-input"
                    checked={showCheque}
                    onChange={(e) => {
                      setShowCheque(e.target.checked);
                      if (e.target.checked && cheques.length === 0) {
                        addCheque();
                      }
                    }}
                  />
                  <label htmlFor="checkCheque" className="form-check-label">Pago con Cheque</label>
                </div>
              </div>
              
              {showCheque && (
                <div className="mb-3">
                  {cheques.map((cheque, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input 
                        type="text" 
                        className="form-control" 
                        maxLength="4" 
                        placeholder="Últimos 4 dígitos" 
                        value={cheque.id}
                        onChange={(e) => updateCheque(index, 'id', e.target.value)}
                        required 
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Monto (AR$)" 
                        value={cheque.amount}
                        onChange={(e) => updateCheque(index, 'amount', e.target.value)}
                        onBlur={handleCurrencyBlur}
                        onFocus={handleCurrencyFocus}
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn btn-link text-danger p-0" 
                        onClick={() => removeCheque(index)}
                        style={{ fontSize: '1.2rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addCheque}>
                    Agregar Cheque
                  </button>
                </div>
              )}

              {/* Pago por Transferencia */}
              <h4>Pago por Transferencia</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    id="checkTransferencia" 
                    className="form-check-input"
                    checked={showTransferencia}
                    onChange={(e) => {
                      setShowTransferencia(e.target.checked);
                      if (e.target.checked && transferencias.length === 0) {
                        addTransferencia();
                      }
                    }}
                  />
                  <label htmlFor="checkTransferencia" className="form-check-label">Pago por Transferencia</label>
                </div>
              </div>
              
              {showTransferencia && (
                <div className="mb-3">
                  {transferencias.map((transfer, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Monto (AR$)" 
                        value={transfer.amount}
                        onChange={(e) => updateTransferencia(index, e.target.value)}
                        onBlur={handleCurrencyBlur}
                        onFocus={handleCurrencyFocus}
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn btn-link text-danger p-0" 
                        onClick={() => removeTransferencia(index)}
                        style={{ fontSize: '1.2rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addTransferencia}>
                    Agregar Transferencia
                  </button>
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={calculateSaldo}
                style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}
              >
                Calcular Saldo
              </button>
            </form>
          </div>

          {/* Resumen e Impresión */}
          {showSummary && (
            <div className="card p-3 printable">
              <div dangerouslySetInnerHTML={{ __html: summary }} />
              <button 
                className="btn btn-secondary mt-3 no-print" 
                onClick={() => window.print()}
              >
                Imprimir
              </button>
            </div>
          )}
        </div>
        <div className="col-lg-5 col-md-4">
          {/* Espacio reservado para funcionalidades de base de datos */}
        </div>
      </div>
    </div>
  );
};

export default SaldoClientes;

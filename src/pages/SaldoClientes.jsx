import React, { useState, useEffect } from 'react';
import { useClientBalances, useGestionSemanal } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useFirebase } from '../contexts/FirebaseContext';
import { useSaldoProveedor } from '../components/saldoProveedor';
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';
import ClienteDeudorCard from '../components/ClienteDeudorCard';
import EditClienteModal from '../components/EditClienteModal';
import PrintDocument from '../components/PrintDocument';
import NotificationContainer from '../components/NotificationContainer';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString } from '../utils/date';

const SaldoClientes = () => {
  const { user } = useFirebase();
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
  const [summaryData, setSummaryData] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // Firebase hooks
  const { balances, loading, error, addClientBalance, deleteBalance, updateBalance } = useClientBalances();
  const { semanaActiva } = useGestionSemanal('shared');

  // Hook para manejar vinculaciones de saldo proveedor
  const { guardarVinculacionSaldoCliente } = useSaldoProveedor();
  
  // Hook para acceder al contexto de Pagos a Proveedores
  const { obtenerBoletasPorProveedor } = usePagosProveedores();

  // Notificaciones
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  // Estados para las cards de clientes guardados
  const [savedClientes, setSavedClientes] = useState([]);
  
  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('hoy');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estado para impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [clienteToEdit, setClienteToEdit] = useState(null);
  
  // Estado para modal de vincular boletas de mercadería
  const [showMercaderiaModal, setShowMercaderiaModal] = useState(false);

  // Función para filtrar clientes por fecha
  const getFilteredClientes = () => {
    const today = new Date();
    const todayStr = getLocalDateString();
    
    let filtered = [];
    
    switch (dateFilter) {
      case 'hoy':
        filtered = savedClientes.filter(cliente => cliente.fecha === todayStr);
        break;
      case 'semana':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const year = weekStart.getFullYear();
        const month = String(weekStart.getMonth() + 1).padStart(2, '0');
        const day = String(weekStart.getDate()).padStart(2, '0');
        const weekStartStr = `${year}-${month}-${day}`;
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
        filtered = savedClientes.filter(cliente => 
          cliente.fecha >= weekStartStr && cliente.fecha <= weekEndStr
        );
        break;
      case 'mes':
        const currentMonth = today.toISOString().slice(0, 7);
        filtered = savedClientes.filter(cliente => cliente.fecha.startsWith(currentMonth));
        break;
      case 'año':
        const currentYear = today.getFullYear().toString();
        filtered = savedClientes.filter(cliente => cliente.fecha.startsWith(currentYear));
        break;
      case 'elegir_mes':
        filtered = savedClientes.filter(cliente => cliente.fecha.startsWith(customMonth));
        break;
      case 'todos':
        filtered = savedClientes;
        break;
      default:
        filtered = savedClientes;
    }
    
    return filtered;
  };

  // Eliminar cliente de Firebase y estado local
  const deleteCliente = async (clienteId) => {
    try {
      if (clienteId) {
        await deleteBalance(clienteId);
      }
      // El estado local se actualizará automáticamente por el listener de Firebase
    } catch (error) {
      console.error('❌ Error al eliminar cliente:', error);
    }
  };

  // Abrir modal de edición
  const openEditModal = (cliente) => {
    setClienteToEdit(cliente);
    setIsEditModalOpen(true);
  };

  // Cerrar modal de edición
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setClienteToEdit(null);
  };

  // Función para manejar impresión desde las cards
  const handlePrintCliente = (cliente) => {
    // Convertir el formato del cliente guardado al formato que espera PrintDocument
    const printData = {
      clientName: cliente.nombreCliente,
      boletas: cliente.boletas || [],
      ventas: cliente.ventas || [],
      plataFavor: cliente.plataFavor || [],
      efectivo: cliente.efectivo || [],
      cheques: cliente.cheques || [],
      transferencias: cliente.transferencias || [],
      totalBoletas: cliente.totalBoletas || 0,
      totalVentas: cliente.totalVentas || 0,
      totalPlata: cliente.totalPlata || 0,
      totalEfectivo: cliente.totalEfectivo || 0,
      totalCheque: cliente.totalCheque || 0,
      totalTransferencia: cliente.totalTransferencia || 0,
      totalIngresos: cliente.totalIngresos || 0,
      finalBalance: cliente.saldoFinal || 0
    };
    
    setPrintData(printData);
    setShowPrintModal(true);
  };

  // Actualizar cliente
  const updateCliente = async (clienteId, updatedData) => {
    try {

      // Mapear datos del modal al formato de Firebase
      const dataWithTotals = {
        clientName: updatedData.clientName,
        boletas: updatedData.boletas || [],
        ventas: updatedData.ventas || [],
        plataFavor: updatedData.plataFavor || [],
        efectivo: updatedData.efectivo || [],
        cheques: updatedData.cheques || [],
        transferencias: updatedData.transferencias || [],
        // Incluir todos los totales calculados por el modal
        totalBoletas: updatedData.totalBoletas || 0,
        totalVentas: updatedData.totalVentas || 0,
        totalPlata: updatedData.totalPlata || 0,
        totalEfectivo: updatedData.totalEfectivo || 0,
        totalCheque: updatedData.totalCheque || 0,
        totalTransferencia: updatedData.totalTransferencia || 0,
        totalIngresos: updatedData.totalIngresos || 0,
        finalBalance: updatedData.finalBalance || (updatedData.totalIngresos - updatedData.totalBoletas),
        date: updatedData.date || getLocalDateString()
      };

      await updateBalance(clienteId, dataWithTotals);

      // Guardar vinculación si hay boletas vinculadas de mercadería y saldo a favor positivo
      if (dataWithTotals.finalBalance > 0) {
        try {
          await guardarVinculacionSaldoCliente({
            saldoClienteId: clienteId,
            proveedor: dataWithTotals.clientName,
            boletasVinculadas: dataWithTotals.boletas || [],
            saldoAFavor: dataWithTotals.finalBalance,
            detalleSaldo: {
              totalVentas: dataWithTotals.totalVentas || 0,
              totalPlata: dataWithTotals.totalPlata || 0,
              totalEfectivo: dataWithTotals.totalEfectivo || 0,
              totalCheque: dataWithTotals.totalCheque || 0,
              totalTransferencia: dataWithTotals.totalTransferencia || 0,
              totalIngresos: dataWithTotals.totalIngresos || 0,
              totalBoletas: dataWithTotals.totalBoletas || 0
            },
            fechaSaldoCliente: dataWithTotals.date || getLocalDateString()
          });
        } catch (error) {
          console.error('⚠️ Error al guardar vinculación al actualizar (no crítico):', error);
        }
      }

      // Mostrar notificación de éxito
      showSuccess('✓ Cliente actualizado exitosamente');

      // Actualizar el estado local para reflejar los cambios inmediatamente
      setSavedClientes(prev => prev.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, ...dataWithTotals }
          : cliente
      ));
    } catch (error) {
      console.error('❌ Error al actualizar cliente:', error);
      showError('Error al actualizar el cliente: ' + error.message);
    }
  };

  // Importar boletas desde Gestión Semanal
  const importarBoletasDesdeGestion = (clienteGestion) => {
    const hoy = getLocalDateString();
    const ventasImportadas = clienteGestion.boletas.map(boleta => ({
      date: hoy, // Fecha del día por defecto
      amount: boleta.monto.toString()
    }));
    
    // Establecer el nombre del cliente
    setClientName(clienteGestion.nombre);
    
    // Activar la sección de ventas y agregar las boletas ahí
    setShowVentas(true);
    setVentas(ventasImportadas.length > 0 ? ventasImportadas : [{ date: '', amount: '' }]);
    
    showSuccess(`✓ ${ventasImportadas.length} boletas importadas a "Ventas" de ${clienteGestion.nombre}`);
  };

  // Guardar en Firebase sin limpiar el formulario (función interna reutilizable)
  const guardarEnFirebase = async () => {
    if (!clientName.trim() || !summaryData) {
      throw new Error('Datos incompletos para guardar');
    }

    const plataFavorData = showPlata ? plata.filter(p => p.amount) : [];
    
    const clienteData = {
      id: `cliente_${Date.now()}`,
      nombreCliente: clientName.trim(),
      fecha: getLocalDateString(),
      boletas: boletas.filter(b => b.date && b.amount),
      ventas: showVentas ? ventas.filter(v => v.date && v.amount) : [],
      plataFavor: plataFavorData,
      efectivo: showEfectivo ? efectivo.filter(e => e.amount) : [],
      cheques: showCheque ? cheques.filter(c => c.id && c.amount) : [],
      transferencias: showTransferencia ? transferencias.filter(t => t.amount) : [],
      saldoFinal: summaryData.finalBalance || 0,
      // Incluir todos los totales del summaryData para consistencia
      totalBoletas: summaryData.totalBoletas || 0,
      totalVentas: summaryData.totalVentas || 0,
      totalPlata: summaryData.totalPlata || 0,
      totalEfectivo: summaryData.totalEfectivo || 0,
      totalCheque: summaryData.totalCheque || 0,
      totalTransferencia: summaryData.totalTransferencia || 0,
      totalIngresos: summaryData.totalIngresos || 0
    };

    const firebaseData = {
      clientName: clienteData.nombreCliente,
      boletas: clienteData.boletas,
      ventas: clienteData.ventas,
      plataFavor: plataFavorData,
      efectivo: clienteData.efectivo,
      cheques: clienteData.cheques,
      transferencias: clienteData.transferencias,
      finalBalance: clienteData.saldoFinal,
      date: clienteData.fecha,
      // Incluir todos los totales calculados
      totalBoletas: clienteData.totalBoletas,
      totalVentas: clienteData.totalVentas,
      totalPlata: clienteData.totalPlata,
      totalEfectivo: clienteData.totalEfectivo,
      totalCheque: clienteData.totalCheque,
      totalTransferencia: clienteData.totalTransferencia,
      totalIngresos: clienteData.totalIngresos
    };
    
    // Guardar en Firebase
    const saldoClienteId = await addClientBalance(firebaseData);

    // Guardar vinculación si hay boletas vinculadas de mercadería y saldo a favor positivo
    if (clienteData.saldoFinal > 0) {
      try {
        await guardarVinculacionSaldoCliente({
          saldoClienteId: saldoClienteId,
          proveedor: clienteData.nombreCliente,
          boletasVinculadas: clienteData.boletas, // Todas las boletas (el hook filtra las vinculadas)
          saldoAFavor: clienteData.saldoFinal,
          detalleSaldo: {
            totalVentas: clienteData.totalVentas,
            totalPlata: clienteData.totalPlata,
            totalEfectivo: clienteData.totalEfectivo,
            totalCheque: clienteData.totalCheque,
            totalTransferencia: clienteData.totalTransferencia,
            totalIngresos: clienteData.totalIngresos,
            totalBoletas: clienteData.totalBoletas
          },
          fechaSaldoCliente: clienteData.fecha
        });
      } catch (error) {
        console.error('⚠️ Error al guardar vinculación (no crítico):', error);
        // No mostrar error al usuario, solo log
      }
    }

    // Actualizar estado local
    setSavedClientes(prev => [clienteData, ...prev]);
    
    return { saldoClienteId, clienteData };
  };

  // Guardar el cliente actual como card (guarda Y limpia el formulario)
  const saveCurrentCliente = async () => {
    if (clientName.trim() && summaryData) {
      try {
        await guardarEnFirebase();
        showSuccess('✓ Cliente guardado exitosamente');
        
        // Limpiar formulario después de guardar
        setClientName('');
        setBoletas([{ date: '', amount: '' }]);
        setShowVentas(false);
        setVentas([]);
        setShowPlata(false);
        setPlata([]);
        setShowEfectivo(false);
        setEfectivo([]);
        setShowCheque(false);
        setCheques([]);
        setShowTransferencia(false);
        setTransferencias([]);
        setSummaryData(null);
        setShowSummary(false);
      } catch (error) {
        console.error('❌ Error al guardar cliente:', error);
        showError('Error al guardar el cliente: ' + error.message);
      }
    }
  };

  // Formatear input de moneda
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

  // Add rows
  const addBoleta = () => {
    setBoletas([...boletas, { date: getLocalDateString(), amount: '' }]);
  };
  const addVenta = () => {
    setVentas([...ventas, { date: getLocalDateString(), amount: '' }]);
  };
  const addPlata = () => {
    setPlata([...plata, { date: getLocalDateString(), amount: '' }]);
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

  // Obtener boletas de mercadería disponibles para vincular
  // NUEVA FUNCIONALIDAD: Incluye tanto boletas nuevas como boletas ya marcadas como pagadas
  const obtenerBoletasMercaderia = () => {
    if (!clientName.trim()) return [];
    
    // Usar el contexto para obtener boletas (incluye estado de pagada)
    const boletasProveedor = obtenerBoletasPorProveedor(clientName.trim(), true);
    
    const boletasMapeadas = boletasProveedor.map((boleta) => ({
      id: `mercaderia-${boleta.index}`,
      index: boleta.index,
      dia: boleta.dia,
      proveedor: boleta.proveedor,
      costoTotal: boleta.costoTotal,
      cortes: boleta.cortes,
      timestamp: boleta.timestamp || new Date().toISOString(),
      estaPagada: boleta.estaPagada // NUEVO: Indica si está marcada como pagada
    }));
    
    // Ordenar de más nueva a más vieja (descendente por timestamp)
    return boletasMapeadas.sort((a, b) => {
      const fechaA = new Date(a.timestamp);
      const fechaB = new Date(b.timestamp);
      return fechaB - fechaA; // Descendente: más reciente primero
    });
  };

  // Vincular una boleta de mercadería
  const vincularBoletaMercaderia = (boletaMercaderia) => {
    // Verificar si ya existe esta boleta vinculada
    const yaExiste = boletas.some(b => 
      b.mercaderiaIndex !== undefined && b.mercaderiaIndex === boletaMercaderia.index
    );
    
    if (yaExiste) {
      showError('Esta boleta de mercadería ya está vinculada');
      return;
    }

    // Agregar la boleta vinculada
    const nuevaBoleta = {
      date: boletaMercaderia.timestamp ? boletaMercaderia.timestamp.split('T')[0] : getLocalDateString(),
      amount: formatCurrencyNoSymbol(boletaMercaderia.costoTotal),
      mercaderiaIndex: boletaMercaderia.index,
      esDeMercaderia: true
    };
    
    setBoletas([...boletas, nuevaBoleta]);
    // No cerrar el modal para poder vincular múltiples boletas
    showSuccess(`Boleta de mercadería del ${boletaMercaderia.dia} vinculada correctamente`);
  };

  // Remove rows
  const removeBoleta = (index) => { setBoletas(boletas.filter((_, i) => i !== index)); };
  const removeVenta = (index) => { setVentas(ventas.filter((_, i) => i !== index)); };
  const removePlata = (index) => { setPlata(plata.filter((_, i) => i !== index)); };
  const removeEfectivo = (index) => { setEfectivo(efectivo.filter((_, i) => i !== index)); };
  const removeCheque = (index) => { setCheques(cheques.filter((_, i) => i !== index)); };
  const removeTransferencia = (index) => { setTransferencias(transferencias.filter((_, i) => i !== index)); };

  // Update field values
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
  const updatePlata = (index, field, value) => {
    const newPlata = [...plata];
    newPlata[index][field] = value;
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
      showError('Por favor ingrese el nombre del cliente');
      return;
    }

    const totalBoletas = boletas.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0);
    const totalVentas = ventas.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0);
    const totalPlata = plata.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0);
    const totalEfectivo = efectivo.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0);
    const totalCheque = cheques.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0);
    const totalTransferencia = transferencias.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0);
    const totalPagos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
    const finalBalance = totalPagos - totalBoletas;

    setSummaryData({
      clientName,
      boletas,
      ventas,
      plataFavor: plata,
      efectivo,
      cheques,
      transferencias,
      totalBoletas,
      totalVentas,
      totalPlata,
      totalEfectivo,
      totalCheque,
      totalTransferencia,
      totalIngresos: totalPagos,
      finalBalance,
    });
    setShowSummary(true);

    setTimeout(() => {
      const summaryElement = document.querySelector('.card.printable');
      if (summaryElement) {
        summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  useEffect(() => {
    const today = getLocalDateString();
    if (boletas[0].date === '') {
      updateBoleta(0, 'date', today);
    }
  }, []);

  useEffect(() => {
    if (balances && balances.length > 0) {
      const clientesFormateados = balances.map(balance => {
        // Calcular totales si no existen en la base de datos
        const totalBoletas = balance.totalBoletas || balance.boletas?.reduce((sum, b) => sum + parseCurrencyValue(b.amount), 0) || 0;
        const totalVentas = balance.totalVentas || balance.ventas?.reduce((sum, v) => sum + parseCurrencyValue(v.amount), 0) || 0;
        const totalPlata = balance.totalPlata || balance.plataFavor?.reduce((sum, p) => sum + parseCurrencyValue(p.amount), 0) || 0;
        const totalEfectivo = balance.totalEfectivo || balance.efectivo?.reduce((sum, e) => sum + parseCurrencyValue(e.amount), 0) || 0;
        const totalCheque = balance.totalCheque || balance.cheques?.reduce((sum, c) => sum + parseCurrencyValue(c.amount), 0) || 0;
        const totalTransferencia = balance.totalTransferencia || balance.transferencias?.reduce((sum, t) => sum + parseCurrencyValue(t.amount), 0) || 0;
        const totalIngresos = balance.totalIngresos || (totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia);
        const finalBalance = balance.finalBalance || (totalIngresos - totalBoletas);

        return {
          id: balance.id,
          nombreCliente: balance.clientName,
          fecha: balance.date,
          boletas: balance.boletas || [],
          ventas: balance.ventas || [],
          plataFavor: balance.plataFavor || [],
          efectivo: balance.efectivo || [],
          cheques: balance.cheques || [],
          transferencias: balance.transferencias || [],
          saldoFinal: balance.finalBalance || finalBalance,
          // Agregar todos los totales calculados
          totalBoletas: balance.totalBoletas || totalBoletas,
          totalVentas: balance.totalVentas || totalVentas,
          totalPlata: balance.totalPlata || totalPlata,
          totalEfectivo: balance.totalEfectivo || totalEfectivo,
          totalCheque: balance.totalCheque || totalCheque,
          totalTransferencia: balance.totalTransferencia || totalTransferencia,
          totalIngresos: balance.totalIngresos || totalIngresos
        };
      });
      setSavedClientes(clientesFormateados);
    }
  }, [balances]);

  return (
    <div className="container mt-4 printable">
      <div className="row">
        {/* Formulario Principal - Izquierda */}
        <div className="col-lg-7 col-md-12">
          <div className="card p-3 no-print mb-3">
            <form>
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
                      disabled={boleta.esDeMercaderia}
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
                      disabled={boleta.esDeMercaderia}
                    />
                    {boleta.esDeMercaderia && (
                      <span className="badge bg-info" title="Boleta vinculada de Mercadería">📦</span>
                    )}
                    <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeBoleta(index)} style={{ fontSize: '1.2rem' }}>×</button>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 mb-3">
                <button type="button" className="btn btn-secondary" onClick={addBoleta}>Agregar Boleta Manual</button>
                {clientName.trim() && semanaActiva?.mercaderia && (
                  <button 
                    type="button" 
                    className="btn btn-outline-primary" 
                    onClick={() => setShowMercaderiaModal(true)}
                  >
                    📦 Vincular Boleta de Mercadería
                  </button>
                )}
              </div>

              <h4>Ajustes</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input type="checkbox" id="checkVenta" className="form-check-input" checked={showVentas} onChange={(e) => { setShowVentas(e.target.checked); if (e.target.checked && ventas.length === 0) { addVenta(); } }} />
                  <label htmlFor="checkVenta" className="form-check-label">Le vendió algo</label>
                </div>
              </div>
              {showVentas && (
                <div className="mb-3">
                  <h5>Detalle de Ventas</h5>
                  {ventas.map((venta, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="date" className="form-control" value={venta.date} onChange={(e) => updateVenta(index, 'date', e.target.value)} required />
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={venta.amount} onChange={(e) => updateVenta(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeVenta(index)} style={{ fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addVenta}>Agregar Venta</button>
                </div>
              )}

              <h4>Plata a Favor</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input type="checkbox" id="checkPlata" className="form-check-input" checked={showPlata} onChange={(e) => { setShowPlata(e.target.checked); if (e.target.checked && plata.length === 0) { addPlata(); } }} />
                  <label htmlFor="checkPlata" className="form-check-label">Tiene Plata a Favor</label>
                </div>
              </div>
              {showPlata && (
                <div className="mb-3">
                  {plata.map((item, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="date" className="form-control" value={item.date || ''} onChange={(e) => updatePlata(index, 'date', e.target.value)} required />
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updatePlata(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removePlata(index)} style={{ fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addPlata}>Agregar Plata a Favor</button>
                </div>
              )}

              <h4>Pago en Efectivo</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input type="checkbox" id="checkEfectivo" className="form-check-input" checked={showEfectivo} onChange={(e) => { setShowEfectivo(e.target.checked); if (e.target.checked && efectivo.length === 0) { addEfectivo(); } }} />
                  <label htmlFor="checkEfectivo" className="form-check-label">Pago en Efectivo</label>
                </div>
              </div>
              {showEfectivo && (
                <div className="mb-3">
                  {efectivo.map((item, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updateEfectivo(index, e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeEfectivo(index)} style={{ fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addEfectivo}>Agregar Pago en Efectivo</button>
                </div>
              )}

              <h4>Pago con Cheque</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input type="checkbox" id="checkCheque" className="form-check-input" checked={showCheque} onChange={(e) => { setShowCheque(e.target.checked); if (e.target.checked && cheques.length === 0) { addCheque(); } }} />
                  <label htmlFor="checkCheque" className="form-check-label">Pago con Cheque</label>
                </div>
              </div>
              {showCheque && (
                <div className="mb-3">
                  {cheques.map((cheque, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" maxLength="4" placeholder="Últimos 4 dígitos" value={cheque.id} onChange={(e) => updateCheque(index, 'id', e.target.value)} required />
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={cheque.amount} onChange={(e) => updateCheque(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeCheque(index)} style={{ fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addCheque}>Agregar Cheque</button>
                </div>
              )}

              <h4>Pago por Transferencia</h4>
              <div className="mb-3">
                <div className="form-check">
                  <input type="checkbox" id="checkTransferencia" className="form-check-input" checked={showTransferencia} onChange={(e) => { setShowTransferencia(e.target.checked); if (e.target.checked && transferencias.length === 0) { addTransferencia(); } }} />
                  <label htmlFor="checkTransferencia" className="form-check-label">Pago por Transferencia</label>
                </div>
              </div>
              {showTransferencia && (
                <div className="mb-3">
                  {transferencias.map((transfer, index) => (
                    <div key={index} className="d-flex gap-2 align-items-center mb-2">
                      <input type="text" className="form-control" placeholder="Monto (AR$)" value={transfer.amount} onChange={(e) => updateTransferencia(index, e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeTransferencia(index)} style={{ fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mb-3" onClick={addTransferencia}>Agregar Transferencia</button>
                </div>
              )}

              <div className="d-flex gap-3">
                <button type="button" className="btn btn-primary" onClick={calculateSaldo} style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}>Calcular Saldo</button>
                <button type="button" className="btn btn-success" onClick={saveCurrentCliente} disabled={!clientName.trim() || !summaryData} style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}>
                  <i className="fas fa-save me-2"></i>
                  Guardar
                </button>
              </div>
            </form>
          </div>

          {showSummary && (
            <div className="card p-3 printable">
              <h1 className="print-header">Resumen de Cuenta con {summaryData?.clientName}</h1>

              <p className="print-small"><strong>Boletas vendidas por {summaryData?.clientName}:</strong></p>
              {summaryData?.boletas?.map((b, i) => (
                <p key={`b-${i}`} className="print-small">Boleta {i+1}: {b.date}, {formatCurrency(parseCurrencyValue(b.amount))}</p>
              ))}
              <div className="print-subtotal">
                <p><strong>Total de Boletas vendidas por {summaryData?.clientName}:</strong> {formatCurrency(summaryData?.totalBoletas || 0)}</p>
              </div>

              {summaryData && summaryData.totalVentas > 0 && (
                <>
                  <p className="print-small" style={{ marginTop: '1rem' }}><strong>Ventas a {summaryData.clientName}:</strong></p>
                  {summaryData.ventas.map((v, i) => (
                    <p key={`v-${i}`} className="print-small">Venta {i+1}: {v.date}, {formatCurrency(parseCurrencyValue(v.amount))}</p>
                  ))}
                </>
              )}

              {summaryData && summaryData.totalPlata > 0 && (
                <>
                  <p className="print-small" style={{ marginTop: '1rem' }}><strong>Plata a Favor:</strong></p>
                  {summaryData.plataFavor && summaryData.plataFavor.map((p, i) => (
                    <p key={`pf-${i}`} className="print-small">Plata {i+1}: {formatCurrency(parseCurrencyValue(p.amount))}</p>
                  ))}
                </>
              )}

              {summaryData && summaryData.totalEfectivo > 0 && (
                <>
                  <p className="print-small" style={{ marginTop: '1rem' }}><strong>Efectivo:</strong></p>
                  {summaryData.efectivo.map((e, i) => (
                    <p key={`ef-${i}`} className="print-small">Efectivo {i+1}: {formatCurrency(parseCurrencyValue(e.amount))}</p>
                  ))}
                </>
              )}

              {summaryData && summaryData.totalCheque > 0 && (
                <>
                  <p className="print-small" style={{ marginTop: '1rem' }}><strong>Cheque:</strong></p>
                  {summaryData.cheques.map((c, i) => (
                    <p key={`ch-${i}`} className="print-small">Cheque {i+1} (ID: {c.id}): {formatCurrency(parseCurrencyValue(c.amount))}</p>
                  ))}
                </>
              )}

              {summaryData && summaryData.totalTransferencia > 0 && (
                <>
                  <p className="print-small" style={{ marginTop: '1rem' }}><strong>Transferencia:</strong></p>
                  {summaryData.transferencias.map((t, i) => (
                    <p key={`tr-${i}`} className="print-small">Transferencia {i+1}: {formatCurrency(parseCurrencyValue(t.amount))}</p>
                  ))}
                </>
              )}

              <div className="print-subtotal">
                <p><strong>Total de Pagos del Usuario:</strong> {formatCurrency(summaryData?.totalIngresos || 0)}</p>
              </div>

              {summaryData && (
                summaryData.finalBalance > 0 ? (
                  <>
                    <h3 className="print-message">Saldo Final: {formatCurrency(summaryData.finalBalance)}</h3>
                    <p className="print-message">{summaryData.clientName} te debe {formatCurrency(summaryData.finalBalance)}.</p>
                  </>
                ) : summaryData.finalBalance < 0 ? (
                  <>
                    <h3 className="print-message">Saldo Final: {formatCurrency(Math.abs(summaryData.finalBalance))}</h3>
                    <p className="print-message">Tú le debes {formatCurrency(Math.abs(summaryData.finalBalance))} a {summaryData.clientName}.</p>
                  </>
                ) : (
                  <>
                    <h3 className="print-message">Saldo Final: {formatCurrency(0)}</h3>
                    <p className="print-message">Las cuentas están saldadas. No hay deudas pendientes.</p>
                  </>
                )
              )}

              <button className="btn btn-secondary mt-3 no-print" onClick={async () => {
                if (!summaryData) {
                  showError('No hay datos para imprimir');
                  return;
                }
                
                // Verificar si ya está guardado en Firebase
                const yaGuardado = savedClientes.some(c => 
                  c.nombreCliente === clientName.trim() && 
                  c.fecha === getLocalDateString() &&
                  Math.abs(c.saldoFinal - summaryData.finalBalance) < 0.01 // Comparar con tolerancia para decimales
                );
                
                // Si no está guardado, guardar automáticamente antes de imprimir
                if (!yaGuardado && clientName.trim()) {
                  try {
                    await guardarEnFirebase();
                    showSuccess('✓ Datos guardados automáticamente antes de imprimir');
                  } catch (error) {
                    console.error('❌ Error al guardar antes de imprimir:', error);
                    showError('Error al guardar: ' + error.message);
                    return; // No imprimir si falla el guardado
                  }
                }
                
                // Mapear summaryData al formato que espera PrintDocument
                const printData = {
                  clientName: summaryData.clientName,
                  boletas: summaryData.boletas || [],
                  ventas: summaryData.ventas || [],
                  plataFavor: summaryData.plataFavor || [],
                  efectivo: summaryData.efectivo || [],
                  cheques: summaryData.cheques || [],
                  transferencias: summaryData.transferencias || [],
                  totalBoletas: summaryData.totalBoletas || 0,
                  totalIngresos: summaryData.totalIngresos || 0,
                  finalBalance: summaryData.finalBalance || 0
                };
                setPrintData(printData);
                setShowPrintModal(true);
              }}>
                <i className="fas fa-print me-2"></i>
                Imprimir
              </button>
            </div>
          )}
        </div>
        <div className="col-lg-5 col-md-4 no-print">
          <div className="card p-3 mb-3">
            <h6>Estado de Conexión</h6>
            {loading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>Conectando a Firebase...</span>
              </div>
            ) : error ? (
              <div className="text-danger">
                <span className="badge bg-danger me-2">❌</span>
                Error de conexión: {error}
                <br />
                <small>Verifica la consola para más detalles</small>
              </div>
            ) : (
              <div className="text-success">
                <span className="badge bg-success me-2">🟢</span>
                Conectado a Firebase
                <br />
                <small className="text-muted">{balances.length} saldos guardados</small>
                <br />
                <small className="text-info">🔗 Colección: clientBalances</small>
              </div>
            )}
          </div>
          
          {/* Panel de Deudas de Gestión Semanal */}
          {semanaActiva && semanaActiva.clientesCuenta && semanaActiva.clientesCuenta.length > 0 && (
            <div className="card p-3 mb-3 border-info">
              <h6 className="text-info">
                <i className="fas fa-calendar-week me-2"></i>
                Deudas de Gestión Semanal
              </h6>
              <small className="text-muted d-block mb-3">
                Importa boletas desde la gestión semanal activa
              </small>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {semanaActiva.clientesCuenta.map((cliente, index) => {
                  const deudaTotal = cliente.boletas.reduce((sum, b) => sum + b.monto, 0);
                  return (
                    <div key={index} className="card mb-2 border-primary">
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong className="d-block">{cliente.nombre}</strong>
                            <small className="text-danger fw-bold">
                              Debe: {formatCurrency(deudaTotal)}
                            </small>
                            <div className="mt-1">
                              <small className="text-muted">
                                {cliente.boletas.length} {cliente.boletas.length === 1 ? 'boleta' : 'boletas'}
                              </small>
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => importarBoletasDesdeGestion(cliente)}
                            title="Importar boletas a Saldo Clientes"
                          >
                            <i className="fas fa-download me-1"></i>
                            Importar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="card p-3 mb-3">
            <h6>Clientes Guardados</h6>
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                <button className={`btn btn-sm ${dateFilter === 'hoy' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDateFilter('hoy')}>Hoy</button>
                <button className={`btn btn-sm ${dateFilter === 'semana' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDateFilter('semana')}>Semana</button>
                <button className={`btn btn-sm ${dateFilter === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDateFilter('mes')}>Mes</button>
                <button className={`btn btn-sm ${dateFilter === 'año' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDateFilter('año')}>Año</button>
                <button className={`btn btn-sm ${dateFilter === 'elegir_mes' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDateFilter('elegir_mes')}>Elegir Mes</button>
                <button className={`btn btn-sm ${dateFilter === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setDateFilter('todos')}>Todos</button>
              </div>
              {dateFilter === 'elegir_mes' && (
                <div className="mt-2">
                  <input type="month" className="form-control form-control-sm" value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} />
                </div>
              )}
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {getFilteredClientes().length > 0 ? (
                getFilteredClientes().map((cliente, index) => (
                  <ClienteDeudorCard 
                    key={cliente.id || index} 
                    cliente={cliente} 
                    onDelete={deleteCliente} 
                    onEdit={openEditModal}
                    onPrint={handlePrintCliente}
                  />
                ))
              ) : (
                <div className="text-center text-muted py-3">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p className="mb-0">No hay clientes guardados</p>
                  <small>Calcula y guarda un saldo para verlo aquí</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      <EditClienteModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        cliente={clienteToEdit}
        onSave={updateCliente}
      />
      
      {/* Modal de impresión */}
      {showPrintModal && printData && (
        <PrintDocument
          data={printData}
          type="saldo"
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
        />
      )}

      {/* Modal para vincular boletas de mercadería */}
      {showMercaderiaModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📦 Vincular Boletas de Mercadería</h5>
                <button type="button" className="btn-close" onClick={() => setShowMercaderiaModal(false)}></button>
              </div>
              <div className="modal-body">
                {!clientName.trim() ? (
                  <div className="alert alert-warning">
                    Por favor ingrese el nombre del cliente/proveedor primero
                  </div>
                ) : obtenerBoletasMercaderia().length === 0 ? (
                  <div className="alert alert-info">
                    No hay boletas de mercadería disponibles para <strong>{clientName}</strong>
                  </div>
                ) : (
                  <>
                    <p className="mb-3">
                      Seleccione las boletas de mercadería que desea vincular para <strong>{clientName}</strong>:
                    </p>
                    <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {obtenerBoletasMercaderia().map((boleta) => {
                        const yaVinculada = boletas.some(b => 
                          b.mercaderiaIndex !== undefined && b.mercaderiaIndex === boleta.index
                        );
                        
                        return (
                          <div 
                            key={boleta.id} 
                            className={`list-group-item ${yaVinculada ? 'bg-light' : ''} ${boleta.estaPagada ? 'border-success' : ''}`}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge bg-primary">{boleta.dia}</span>
                                  <strong>{boleta.proveedor}</strong>
                                  {yaVinculada && (
                                    <span className="badge bg-success">✓ Ya vinculada</span>
                                  )}
                                  {boleta.estaPagada && (
                                    <span className="badge bg-success" title="Esta boleta está marcada como pagada en Pagos a Proveedores">
                                      💰 Pagada
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted small">
                                  {boleta.cortes.length} corte{boleta.cortes.length > 1 ? 's' : ''}
                                  {boleta.estaPagada && (
                                    <span className="text-success ms-2">
                                      • Registrada en Pagos a Proveedores
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold text-success fs-5">
                                  {formatCurrency(boleta.costoTotal)}
                                </div>
                                <small className="text-muted">
                                  {formatCurrencyNoSymbol(boleta.costoTotal)} AR$
                                </small>
                                {!yaVinculada && (
                                  <button
                                    className="btn btn-sm btn-primary mt-2"
                                    onClick={() => vincularBoletaMercaderia(boleta)}
                                  >
                                    Vincular
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMercaderiaModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default SaldoClientes;

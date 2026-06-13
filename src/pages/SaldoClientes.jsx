import React, { useState, useEffect, useRef } from 'react';
import { useClientBalances, useGestionSemanal } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useAutoSavePrint } from '../hooks/useAutoSavePrint';
import { useFirebase } from '../contexts/FirebaseContext';
import { useSaldoProveedor } from '../components/saldoProveedor';
import { usePagosProveedores } from '../contexts/PagosProveedoresContext';
import ClienteDeudorCard from '../components/ClienteDeudorCard';
import EditClienteModal from '../components/EditClienteModal';
import PrintDocument from '../components/PrintDocument';
import NotificationContainer from '../components/NotificationContainer';
import { formatCurrency, parseCurrencyValue, formatCurrencyNoSymbol } from '../utils/money';
import { getLocalDateString, formatDateSafe } from '../utils/date';

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
  const [showDeuda, setShowDeuda] = useState(false);
  const [deudas, setDeudas] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
  const [dateFilter, setDateFilter] = useState('semana');
  const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const filterContainerRef = useRef(null);
  const filterButtonRefs = useRef({});
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estado para impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [clienteToEdit, setClienteToEdit] = useState(null);
  
  // Estado para modal de vincular boletas de mercadería
  const [showMercaderiaModal, setShowMercaderiaModal] = useState(false);

  // Estados para el banner de saldo previo
  const [saldoPrevioData, setSaldoPrevioData] = useState([]);
  const [showSaldoPrevio, setShowSaldoPrevio] = useState(false);
  const [saldoPrevioDismissed, setSaldoPrevioDismissed] = useState('');
  const [saldoPrevioSeleccion, setSaldoPrevioSeleccion] = useState([]);

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
    const printData = {
      clientName: cliente.nombreCliente,
      boletas: cliente.boletas || [],
      ventas: cliente.ventas || [],
      plataFavor: cliente.plataFavor || [],
      deudas: cliente.deudas || [],
      efectivo: cliente.efectivo || [],
      cheques: cliente.cheques || [],
      transferencias: cliente.transferencias || [],
      totalBoletas: cliente.totalBoletas || 0,
      totalVentas: cliente.totalVentas || 0,
      totalPlata: cliente.totalPlata || 0,
      totalDeuda: cliente.totalDeuda || 0,
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
    const deudasData = showDeuda ? deudas.filter(d => d.amount) : [];
    
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
      deudas: deudasData,
      saldoFinal: summaryData.finalBalance || 0,
      totalBoletas: summaryData.totalBoletas || 0,
      totalVentas: summaryData.totalVentas || 0,
      totalPlata: summaryData.totalPlata || 0,
      totalEfectivo: summaryData.totalEfectivo || 0,
      totalCheque: summaryData.totalCheque || 0,
      totalTransferencia: summaryData.totalTransferencia || 0,
      totalDeuda: summaryData.totalDeuda || 0,
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
      deudas: deudasData,
      finalBalance: clienteData.saldoFinal,
      date: clienteData.fecha,
      totalBoletas: clienteData.totalBoletas,
      totalVentas: clienteData.totalVentas,
      totalPlata: clienteData.totalPlata,
      totalEfectivo: clienteData.totalEfectivo,
      totalCheque: clienteData.totalCheque,
      totalTransferencia: clienteData.totalTransferencia,
      totalDeuda: clienteData.totalDeuda,
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

  // Limpiar formulario (usado al guardar y al imprimir con auto-guardado)
  const clearForm = () => {
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
    setShowDeuda(false);
    setDeudas([]);
    setSummaryData(null);
    setShowSummary(false);
  };

  // Guardar el cliente actual como card (guarda Y limpia el formulario)
  const saveCurrentCliente = async () => {
    if (clientName.trim() && summaryData) {
      try {
        await guardarEnFirebase();
        showSuccess('✓ Cliente guardado exitosamente');
        clearForm();
      } catch (error) {
        console.error('❌ Error al guardar cliente:', error);
        showError('Error al guardar el cliente: ' + error.message);
      }
    }
  };

  // Hook para auto-guardar antes de imprimir
  const { handlePrintWithAutoSave } = useAutoSavePrint({
    summaryData,
    savedItems: savedClientes,
    checkIsAlreadySaved: (data, items) =>
      items.some(c =>
        c.nombreCliente === clientName.trim() &&
        c.fecha === getLocalDateString() &&
        Math.abs(c.saldoFinal - data.finalBalance) < 0.01
      ),
    saveWithoutClear: guardarEnFirebase,
    onAfterSave: clearForm,
    showSuccess,
    showError
  });

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
    const ultimaFecha = boletas[boletas.length - 1]?.date || getLocalDateString();
    setBoletas([...boletas, { date: ultimaFecha, amount: '' }]);
  };
  const addVenta = () => {
    const ultimaFecha = ventas[ventas.length - 1]?.date || getLocalDateString();
    setVentas([...ventas, { date: ultimaFecha, amount: '' }]);
  };
  const addPlata = () => {
    const ultimaFecha = plata[plata.length - 1]?.date || getLocalDateString();
    setPlata([...plata, { date: ultimaFecha, amount: '' }]);
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
  const addDeuda = () => {
    const ultimaFecha = deudas[deudas.length - 1]?.date || getLocalDateString();
    setDeudas([...deudas, { date: ultimaFecha, amount: '' }]);
  };
  const removeDeuda = (index) => { setDeudas(deudas.filter((_, i) => i !== index)); };

  const handleDropCliente = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (clientName.trim()) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!data?.nombreCliente) return;
      setClientName(data.nombreCliente);
    } catch {}
  };
  const updateDeuda = (index, field, value) => {
    const newDeudas = [...deudas];
    newDeudas[index][field] = value;
    setDeudas(newDeudas);
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

  // Mover boleta de "lo que te vendieron" a "lo que vos vendiste" (Le vendió algo)
  const moverBoletaAVentas = (index) => {
    const boleta = boletas[index];
    setShowVentas(true);
    setVentas(prev => [...prev, { date: boleta.date || getLocalDateString(), amount: boleta.amount }]);
    setBoletas(prev => prev.filter((_, i) => i !== index));
    showSuccess('Boleta movida a "Le vendió algo"');
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
    const totalDeuda = deudas.reduce((sum, d) => sum + parseCurrencyValue(d.amount), 0);
    const totalPagos = totalVentas + totalPlata + totalEfectivo + totalCheque + totalTransferencia;
    const finalBalance = totalPagos - totalBoletas - totalDeuda;

    setSummaryData({
      clientName,
      boletas,
      ventas,
      plataFavor: plata,
      efectivo,
      cheques,
      transferencias,
      deudas,
      totalBoletas,
      totalVentas,
      totalPlata,
      totalEfectivo,
      totalCheque,
      totalTransferencia,
      totalDeuda,
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

  // Debounce: buscar últimos 3 saldos cuando cambia el nombre del cliente
  useEffect(() => {
    if (!clientName.trim() || clientName.trim().length < 2) {
      setShowSaldoPrevio(false);
      setSaldoPrevioData([]);
      return;
    }

    if (clientName.trim().toLowerCase() === saldoPrevioDismissed.toLowerCase()) {
      return;
    }

    const timer = setTimeout(() => {
      const nombreBuscado = clientName.trim().toLowerCase();
      const coincidentes = savedClientes
        .filter(c => c.nombreCliente?.toLowerCase() === nombreBuscado)
        .sort((a, b) => {
          if (a.fecha > b.fecha) return -1;
          if (a.fecha < b.fecha) return 1;
          return 0;
        })
        .slice(0, 3);

      if (coincidentes.length > 0) {
        setSaldoPrevioData(coincidentes);
        setSaldoPrevioSeleccion(coincidentes.map((_, i) => i)); // todos seleccionados por defecto
        setShowSaldoPrevio(true);
      } else {
        setShowSaldoPrevio(false);
        setSaldoPrevioData([]);
        setSaldoPrevioSeleccion([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [clientName, savedClientes, saldoPrevioDismissed]);

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

  // Sub-componentes internos del formulario
  const FormSection = ({ label, children }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
      </div>
      {children}
    </div>
  );

  const ToggleRow = ({ id, label, checked, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer' }} onClick={() => onChange({ target: { checked: !checked } })}>
      <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: checked ? '#6A8899' : '#dee2e6', position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: checked ? '18px' : '2px', transition: 'left 0.2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <label htmlFor={id} style={{ fontSize: '0.85rem', color: '#212529', cursor: 'pointer', margin: 0 }}>{label}</label>
    </div>
  );

  const InputRow = ({ children }) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
      {children}
    </div>
  );

  const RemoveBtn = ({ onClick }) => (
    <button type="button" onClick={onClick}
      style={{ border: 'none', background: 'transparent', color: '#dc3545', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
      ×
    </button>
  );

  const AddBtn = ({ onClick, children }) => (
    <button type="button" onClick={onClick}
      style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: '#6c757d', fontSize: '0.75rem', cursor: 'pointer', marginBottom: '8px', marginRight: '6px', transition: 'all 0.15s' }}>
      {children}
    </button>
  );

  // Actualizar posición del slider animado cuando cambia el filtro
  useEffect(() => {
    const activeBtn = filterButtonRefs.current[dateFilter];
    const container = filterContainerRef.current;
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setSliderStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [dateFilter, savedClientes]);

  return (
    <div className="container mt-4 printable">
      <div className="row align-items-stretch">
        {/* Formulario Principal - Izquierda */}
        <div className="col-lg-7 col-md-12">
          <div
            className="no-print mb-3"
            onDragOver={(e) => { e.preventDefault(); if (!clientName.trim()) setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDropCliente}
            style={{
              borderRadius: '12px',
              background: 'white',
              boxShadow: isDragOver ? 'none' : '0 2px 6px rgba(0,0,0,0.07)',
              border: isDragOver ? '2px dashed #6A8899' : '2px solid transparent',
              background: isDragOver ? '#f0f8ff' : 'white',
              padding: '20px',
              transition: 'border 0.2s, box-shadow 0.2s',
            }}
          >
            <form>
              {/* Título de sección */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Datos del Cliente
                </span>
                {isDragOver && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(106,136,153,0.12)', borderRadius: '8px', fontSize: '0.8rem', color: '#3a5060', textAlign: 'center' }}>
                    Soltá para cargar el saldo histórico
                  </div>
                )}
              </div>

              {/* Campo nombre */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="clientName" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', display: 'block', marginBottom: '5px' }}>
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  id="clientName"
                  className="form-control"
                  placeholder="Ingrese nombre"
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setSaldoPrevioDismissed(''); }}
                  required
                  style={{ borderRadius: '8px', fontSize: '0.95rem' }}
                />
              </div>

              {/* Banner saldo previo */}
              {showSaldoPrevio && saldoPrevioData.length > 0 && (() => {
                const seleccionados = saldoPrevioData.filter((_, i) => saldoPrevioSeleccion.includes(i));
                const itemsAFavor = seleccionados.filter(c => (c.saldoFinal || 0) > 0);
                const itemsDeuda  = seleccionados.filter(c => (c.saldoFinal || 0) < 0);
                const totalAFavor = itemsAFavor.reduce((sum, c) => sum + (c.saldoFinal || 0), 0);
                const totalDeudaHist = itemsDeuda.reduce((sum, c) => sum + Math.abs(c.saldoFinal || 0), 0);
                const haySeleccion = seleccionados.length > 0;
                const hayMezcla = totalAFavor > 0 && totalDeudaHist > 0;
                const btnLabel = hayMezcla
                  ? `Aplicar: ${formatCurrency(totalAFavor)} a favor + ${formatCurrency(totalDeudaHist)} en deuda`
                  : totalAFavor > 0 ? `+ Agregar como Plata a Favor` : `+ Agregar como Deuda`;
                const btnColor = hayMezcla ? '#6A8899' : totalAFavor > 0 ? '#28a745' : '#dc3545';

                return (
                  <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', borderLeft: '3px solid #6c757d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#212529' }}>
                        Saldo histórico con {clientName.trim()}
                      </span>
                      <button type="button" className="btn-close btn-sm" style={{ fontSize: '0.6rem' }}
                        onClick={() => { setShowSaldoPrevio(false); setSaldoPrevioDismissed(clientName.trim()); }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: '8px' }}>
                      Seleccioná los saldos que querés considerar:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                      {saldoPrevioData.map((c, i) => {
                        const esFavor = (c.saldoFinal || 0) > 0;
                        const checked = saldoPrevioSeleccion.includes(i);
                        return (
                          <div key={i} onClick={() => setSaldoPrevioSeleccion(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                              background: checked ? (esFavor ? 'rgba(40,167,69,0.08)' : 'rgba(220,53,69,0.08)') : 'white' }}>
                            <input type="checkbox" className="form-check-input mt-0" checked={checked} readOnly style={{ pointerEvents: 'none', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.72rem', color: '#6c757d', flexShrink: 0 }}>{c.fecha || 'Sin fecha'}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: esFavor ? '#28a745' : '#dc3545', background: esFavor ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', padding: '2px 8px', borderRadius: '999px' }}>
                              {esFavor ? '+' : ''}{formatCurrency(c.saldoFinal || 0)}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: esFavor ? '#28a745' : '#dc3545', flexShrink: 0 }}>
                              {esFavor ? 'A tu favor' : 'Debés'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {haySeleccion && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e9ecef' }}>
                        <div style={{ fontSize: '0.75rem' }}>
                          {totalAFavor > 0 && <span style={{ color: '#28a745', marginRight: '12px' }}>✓ {formatCurrency(totalAFavor)}</span>}
                          {totalDeudaHist > 0 && <span style={{ color: '#dc3545' }}>⚠ {formatCurrency(totalDeudaHist)}</span>}
                        </div>
                        <button type="button"
                          style={{ border: `1px solid ${btnColor}`, borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: btnColor, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => {
                            if (itemsAFavor.length > 0) { setShowPlata(true); setPlata(prev => [...prev.filter(p => p.amount), ...itemsAFavor.map(c => ({ date: c.fecha || getLocalDateString(), amount: formatCurrencyNoSymbol(c.saldoFinal) }))]); }
                            if (itemsDeuda.length > 0) { setShowDeuda(true); setDeudas(prev => [...prev.filter(d => d.amount), ...itemsDeuda.map(c => ({ date: c.fecha || getLocalDateString(), amount: formatCurrencyNoSymbol(Math.abs(c.saldoFinal)) }))]); }
                            setShowSaldoPrevio(false); setSaldoPrevioDismissed(clientName.trim());
                            const cantFavor = itemsAFavor.length; const cantDeuda = itemsDeuda.length;
                            showSuccess(hayMezcla ? `✓ ${cantFavor} saldo${cantFavor > 1 ? 's' : ''} a Plata a Favor · ${cantDeuda} deuda${cantDeuda > 1 ? 's' : ''} agregada${cantDeuda > 1 ? 's' : ''}` : cantFavor > 0 ? `✓ ${cantFavor} saldo${cantFavor > 1 ? 's' : ''} (${formatCurrency(totalAFavor)}) agregado${cantFavor > 1 ? 's' : ''} como Plata a Favor` : `✓ ${cantDeuda} deuda${cantDeuda > 1 ? 's' : ''} (${formatCurrency(totalDeudaHist)}) agregada${cantDeuda > 1 ? 's' : ''}`);
                          }}>
                          {btnLabel}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Separador de sección */}
              <FormSection label="Deuda">
                <ToggleRow id="checkDeuda" label="Tiene Deuda pendiente" checked={showDeuda}
                  onChange={(e) => { setShowDeuda(e.target.checked); if (e.target.checked && deudas.length === 0) addDeuda(); }} />
                {showDeuda && (
                  <div style={{ marginTop: '10px' }}>
                    {deudas.map((item, index) => (
                      <InputRow key={index}>
                        <input type="date" className="form-control" value={item.date || ''} onChange={(e) => updateDeuda(index, 'date', e.target.value)} />
                        <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updateDeuda(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} />
                        <RemoveBtn onClick={() => removeDeuda(index)} />
                      </InputRow>
                    ))}
                    <AddBtn onClick={addDeuda}>+ Agregar Deuda</AddBtn>
                  </div>
                )}
              </FormSection>

              <FormSection label="Boletas">
                {boletas.map((boleta, index) => (
                  <InputRow key={index}>
                    <input type="date" className="form-control" value={boleta.date} onChange={(e) => updateBoleta(index, 'date', e.target.value)} required disabled={boleta.esDeMercaderia} />
                    <input type="text" className="form-control" placeholder="Monto (AR$)" value={boleta.amount} onChange={(e) => updateBoleta(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required disabled={boleta.esDeMercaderia} />
                    {boleta.esDeMercaderia
                      ? <span style={{ fontSize: '0.75rem', background: 'rgba(23,162,184,0.12)', color: '#17a2b8', padding: '3px 7px', borderRadius: '6px', flexShrink: 0 }}>📦</span>
                      : <button type="button" onClick={() => moverBoletaAVentas(index)} title="Pasé mal: era venta mía al cliente"
                          style={{ border: '1px solid #dee2e6', borderRadius: '6px', padding: '3px 8px', background: 'transparent', color: '#6c757d', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          → Ventas
                        </button>
                    }
                    <RemoveBtn onClick={() => removeBoleta(index)} />
                  </InputRow>
                ))}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <AddBtn onClick={addBoleta}>+ Boleta Manual</AddBtn>
                  {clientName.trim() && semanaActiva?.mercaderia && (
                    <AddBtn onClick={() => setShowMercaderiaModal(true)}>📦 Vincular Mercadería</AddBtn>
                  )}
                </div>
              </FormSection>

              <FormSection label="Ajustes">
                <ToggleRow id="checkVenta" label="Le vendió algo" checked={showVentas}
                  onChange={(e) => { setShowVentas(e.target.checked); if (e.target.checked && ventas.length === 0) addVenta(); }} />
                {showVentas && (
                  <div style={{ marginTop: '10px' }}>
                    {ventas.map((venta, index) => (
                      <InputRow key={index}>
                        <input type="date" className="form-control" value={venta.date} onChange={(e) => updateVenta(index, 'date', e.target.value)} required />
                        <input type="text" className="form-control" placeholder="Monto (AR$)" value={venta.amount} onChange={(e) => updateVenta(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                        <RemoveBtn onClick={() => removeVenta(index)} />
                      </InputRow>
                    ))}
                    <AddBtn onClick={addVenta}>+ Agregar Venta</AddBtn>
                  </div>
                )}
              </FormSection>

              <FormSection label="Pagos Recibidos">
                <ToggleRow id="checkPlata" label="Plata a Favor" checked={showPlata}
                  onChange={(e) => { setShowPlata(e.target.checked); if (e.target.checked && plata.length === 0) addPlata(); }} />
                {showPlata && (
                  <div style={{ marginTop: '10px' }}>
                    {plata.map((item, index) => (
                      <InputRow key={index}>
                        <input type="date" className="form-control" value={item.date || ''} onChange={(e) => updatePlata(index, 'date', e.target.value)} required />
                        <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updatePlata(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                        <RemoveBtn onClick={() => removePlata(index)} />
                      </InputRow>
                    ))}
                    <AddBtn onClick={addPlata}>+ Agregar</AddBtn>
                  </div>
                )}

                <ToggleRow id="checkEfectivo" label="Pago en Efectivo" checked={showEfectivo}
                  onChange={(e) => { setShowEfectivo(e.target.checked); if (e.target.checked && efectivo.length === 0) addEfectivo(); }} />
                {showEfectivo && (
                  <div style={{ marginTop: '10px' }}>
                    {efectivo.map((item, index) => (
                      <InputRow key={index}>
                        <input type="text" className="form-control" placeholder="Monto (AR$)" value={item.amount} onChange={(e) => updateEfectivo(index, e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                        <RemoveBtn onClick={() => removeEfectivo(index)} />
                      </InputRow>
                    ))}
                    <AddBtn onClick={addEfectivo}>+ Agregar</AddBtn>
                  </div>
                )}

                <ToggleRow id="checkCheque" label="Pago con Cheque" checked={showCheque}
                  onChange={(e) => { setShowCheque(e.target.checked); if (e.target.checked && cheques.length === 0) addCheque(); }} />
                {showCheque && (
                  <div style={{ marginTop: '10px' }}>
                    {cheques.map((cheque, index) => (
                      <InputRow key={index}>
                        <input type="text" className="form-control" maxLength="4" placeholder="Últimos 4 dígitos" value={cheque.id} onChange={(e) => updateCheque(index, 'id', e.target.value)} required />
                        <input type="text" className="form-control" placeholder="Monto (AR$)" value={cheque.amount} onChange={(e) => updateCheque(index, 'amount', e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                        <RemoveBtn onClick={() => removeCheque(index)} />
                      </InputRow>
                    ))}
                    <AddBtn onClick={addCheque}>+ Agregar</AddBtn>
                  </div>
                )}

                <ToggleRow id="checkTransferencia" label="Pago por Transferencia" checked={showTransferencia}
                  onChange={(e) => { setShowTransferencia(e.target.checked); if (e.target.checked && transferencias.length === 0) addTransferencia(); }} />
                {showTransferencia && (
                  <div style={{ marginTop: '10px' }}>
                    {transferencias.map((transfer, index) => (
                      <InputRow key={index}>
                        <input type="text" className="form-control" placeholder="Monto (AR$)" value={transfer.amount} onChange={(e) => updateTransferencia(index, e.target.value)} onBlur={handleCurrencyBlur} onFocus={handleCurrencyFocus} required />
                        <RemoveBtn onClick={() => removeTransferencia(index)} />
                      </InputRow>
                    ))}
                    <AddBtn onClick={addTransferencia}>+ Agregar</AddBtn>
                  </div>
                )}
              </FormSection>

              {/* Acciones principales */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={calculateSaldo}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  Calcular Saldo
                </button>
                <button type="button" onClick={saveCurrentCliente} disabled={!clientName.trim() || !summaryData}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: !clientName.trim() || !summaryData ? '#e9ecef' : '#28a745', color: !clientName.trim() || !summaryData ? '#9ca3af' : 'white', fontSize: '0.95rem', fontWeight: 700, cursor: !clientName.trim() || !summaryData ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
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

              {summaryData && summaryData.totalDeuda > 0 && (
                <>
                  <p className="print-small" style={{ marginTop: '1rem' }}><strong>Deuda pendiente:</strong></p>
                  {summaryData.deudas && summaryData.deudas.map((d, i) => (
                    <p key={`d-${i}`} className="print-small">Deuda {i+1}: {d.date ? `${d.date}, ` : ''}{formatCurrency(parseCurrencyValue(d.amount))}</p>
                  ))}
                  <div className="print-subtotal" style={{ borderLeft: '3px solid #dc3545', paddingLeft: '16px' }}>
                    <p className="mb-0"><strong>Total Deuda:</strong> {formatCurrency(summaryData.totalDeuda)}</p>
                  </div>
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
                <p><strong>Total Ingresos:</strong> {formatCurrency(summaryData?.totalIngresos || 0)}</p>
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

              <button className="btn btn-secondary mt-3 no-print" onClick={() => handlePrintWithAutoSave(
                (data) => ({
                  clientName: data.clientName,
                  boletas: data.boletas || [],
                  ventas: data.ventas || [],
                  plataFavor: data.plataFavor || [],
                  deudas: data.deudas || [],
                  efectivo: data.efectivo || [],
                  cheques: data.cheques || [],
                  transferencias: data.transferencias || [],
                  totalBoletas: data.totalBoletas || 0,
                  totalDeuda: data.totalDeuda || 0,
                  totalIngresos: data.totalIngresos || 0,
                  finalBalance: data.finalBalance || 0
                }),
                (printData) => {
                  setPrintData(printData);
                  setShowPrintModal(true);
                }
              )}>
                <i className="fas fa-print me-2"></i>
                Imprimir
              </button>
            </div>
          )}
        </div>
        <div className="col-lg-5 col-md-4 no-print clientes-sidebar">
          {/* Card de estado de conexión */}
          <div
            className={!loading && !error ? 'status-connected-pulse' : ''}
            style={{
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
              padding: '10px 14px',
              marginBottom: '8px',
              borderLeft: `3px solid ${loading ? '#6c757d' : error ? '#dc3545' : '#28a745'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
            {/* Dot de estado */}
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: loading ? '#adb5bd' : error ? '#dc3545' : '#28a745',
              boxShadow: loading ? 'none' : error
                ? '0 0 0 3px rgba(220,53,69,0.15)'
                : '0 0 0 3px rgba(40,167,69,0.15)',
            }} />

            <div style={{ minWidth: 0 }}>
              {loading ? (
                <div style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 500 }}>
                  Conectando…
                </div>
              ) : error ? (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#dc3545' }}>
                    Error de conexión
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '1px' }}>
                    Verificá la consola
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#212529' }}>
                    Firebase conectado
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '1px' }}>
                    {balances.length} {balances.length === 1 ? 'saldo guardado' : 'saldos guardados'}
                  </div>
                </>
              )}
            </div>
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
          
          <div className="card p-3 mb-3 clientes-guardados-card">
            <h6>Clientes Guardados</h6>
            <div className="mb-3">
              <div
                ref={filterContainerRef}
                style={{ position: 'relative', display: 'flex', background: '#e9ecef', borderRadius: '10px', padding: '3px', gap: '2px' }}
              >
                {/* Slider animado */}
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  bottom: '3px',
                  left: sliderStyle.left + 'px',
                  width: sliderStyle.width + 'px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  transition: 'left 0.22s cubic-bezier(.4,0,.2,1), width 0.22s cubic-bezier(.4,0,.2,1)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }} />
                {[['hoy','Hoy'],['semana','Semana'],['mes','Mes'],['año','Año'],['elegir_mes','📅'],['todos','Todos']].map(([val, label]) => (
                  <button
                    key={val}
                    ref={el => filterButtonRefs.current[val] = el}
                    onClick={() => setDateFilter(val)}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      flex: 1,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 6px',
                      fontSize: '0.75rem',
                      fontWeight: dateFilter === val ? 600 : 400,
                      background: 'transparent',
                      color: dateFilter === val ? '#212529' : '#6c757d',
                      transition: 'color 0.2s, font-weight 0.2s',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >{label}</button>
                ))}
              </div>
              {dateFilter === 'elegir_mes' && (
                <div className="mt-2">
                  <input type="month" className="form-control form-control-sm" value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} />
                </div>
              )}
            </div>
            <div className="clientes-list-scroll">
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
        <>
          {/* Overlay */}
          <div onClick={() => setShowMercaderiaModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }} />

          {/* Panel */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(580px, 95vw)',
            maxHeight: '85vh',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            zIndex: 1051,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                  Vincular mercadería
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#212529' }}>
                  {clientName.trim() || 'Sin cliente'}
                </div>
              </div>
              <button onClick={() => setShowMercaderiaModal(false)}
                style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#6c757d' }}>
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: '20px 22px', flex: 1 }}>
              {!clientName.trim() ? (
                <div style={{ background: 'rgba(255,193,7,0.1)', borderLeft: '3px solid #ffc107', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#856404' }}>
                  Ingresá el nombre del cliente primero
                </div>
              ) : obtenerBoletasMercaderia().length === 0 ? (
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#6c757d' }}>
                  No hay boletas disponibles para <strong>{clientName}</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: '4px' }}>
                    Seleccioná las boletas que querés vincular para <strong style={{ color: '#212529' }}>{clientName}</strong>
                  </div>
                  {obtenerBoletasMercaderia().map((boleta) => {
                    const yaVinculada = boletas.some(b =>
                      b.mercaderiaIndex !== undefined && b.mercaderiaIndex === boleta.index
                    );
                    const accentColor = boleta.estaPagada ? '#28a745' : yaVinculada ? '#6A8899' : '#f3f4f6';

                    return (
                      <div key={boleta.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 14px', borderRadius: '10px',
                        background: yaVinculada ? '#f8f9fa' : 'white',
                        border: `1px solid ${accentColor}`,
                        borderLeft: `3px solid ${accentColor}`,
                        transition: 'border 0.15s',
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(106,136,153,0.15)', color: '#3a5060', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, flexShrink: 0 }}>
                              {boleta.dia}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', flexShrink: 0 }}>
                              {formatDateSafe(boleta.timestamp?.split('T')[0])}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#212529' }}>{boleta.proveedor}</span>
                            {yaVinculada && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(40,167,69,0.12)', color: '#28a745', padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>✓ Vinculada</span>
                            )}
                            {boleta.estaPagada && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(40,167,69,0.12)', color: '#28a745', padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>💰 Pagada</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                            {boleta.cortes.length} corte{boleta.cortes.length !== 1 ? 's' : ''}
                            {boleta.estaPagada && (
                              <span style={{ color: '#28a745', marginLeft: '6px' }}>· Registrada en Pagos a Proveedores</span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#28a745', marginBottom: '6px' }}>
                            {formatCurrency(boleta.costoTotal)}
                          </div>
                          {!yaVinculada && (
                            <button onClick={() => vincularBoletaMercaderia(boleta)}
                              style={{ border: '1px solid #6A8899', borderRadius: '8px', padding: '5px 12px', background: 'transparent', color: '#3a5060', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                              Vincular
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
              <button onClick={() => setShowMercaderiaModal(false)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </>
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

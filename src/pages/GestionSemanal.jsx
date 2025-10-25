import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';
import { useGestionSemanal } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { formatCurrency } from '../utils/money';
import { getLocalDateString } from '../utils/date';
import ConfirmModal from '../components/ConfirmModal';
import PrintDocument from '../components/PrintDocument';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const PROVEEDORES = ['Catriel', 'Lucas', 'Tito', 'FM', 'Moreira', 'Doina', 'Facundo', 'Novak'];

const CORTES_CARNE = [
  'Carre',
  'Manta',
  'Bondiola',
  'Churrasquito 1°',
  'Anketa',
  'Jamon',
  'Recorte',
  'Menudencias',
  'Varios'
];

const TIPOS_EMBUTIDOS = [
  'Morcilla',
  'Puro',
  'Comun',
  'Parrilera',
  'Ochi',
  'Viena',
  'Colorado',
  'Choribon'
];

const EMPLEADOS_DEFAULT = ['Jorge', 'Nico', 'Gustavo', 'Tomy'];

// Estilos CSS para animaciones suaves
const styles = `
  .card-transition {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-expand {
    animation: expandCard 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-shrink {
    animation: shrinkCard 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes expandCard {
    from {
      opacity: 0.7;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes shrinkCard {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .smooth-hover {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .smooth-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .btn {
    transition: all 0.2s ease;
  }
  
  .btn:hover {
    transform: scale(1.05);
  }
  
  .btn:active {
    transform: scale(0.98);
  }
  
  .form-control, .form-select {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  .form-control:focus, .form-select:focus {
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }
  
  .input-group {
    transition: all 0.2s ease;
  }
  
  .nav-tabs .nav-link {
    transition: all 0.2s ease;
  }
  
  .card-body {
    transition: padding 0.3s ease;
  }
`;

export default function GestionSemanal() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('mercaderia');
  const [expandedMercaderia, setExpandedMercaderia] = useState({});
  const [editingMercaderia, setEditingMercaderia] = useState(null);
  const [tempMercaderiaData, setTempMercaderiaData] = useState({});
  
  // Estados para modal de confirmación de eliminación de corte
  const [showDeleteCorteModal, setShowDeleteCorteModal] = useState(false);
  const [corteToDelete, setCorteToDelete] = useState(null);
  const [expandedEmbutidos, setExpandedEmbutidos] = useState({});
  const [editingEmbutidos, setEditingEmbutidos] = useState(null);
  const [tempEmbutidosData, setTempEmbutidosData] = useState({});
  const [expandedClientes, setExpandedClientes] = useState({});
  const [editingClientes, setEditingClientes] = useState(null);
  const [tempClientesData, setTempClientesData] = useState({});
  const botonAdelantoRef = useRef(null);
  
  // Estados para tipos de embutidos personalizados
  const [tiposEmbutidosPersonalizados, setTiposEmbutidosPersonalizados] = useState([]);
  const [nuevoTipoEmbutido, setNuevoTipoEmbutido] = useState('');
  const [mostrarInputNuevoTipo, setMostrarInputNuevoTipo] = useState(false);

  // Función para alternar expansión de cards de mercadería
  const toggleExpandedMercaderia = (index) => {
    // Cerrar edición si hay alguna activa
    if (editingMercaderia !== null) {
      cancelEditingMercaderia();
    }
    
    // Solo permitir una card expandida a la vez
    setExpandedMercaderia(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        // Si ya está expandida, cerrarla
        return {};
      } else {
        // Cerrar todas y abrir solo esta
        return { [index]: true };
      }
    });
  };

  // Función para iniciar edición de mercadería
  const startEditingMercaderia = (index, entrada) => {
    setEditingMercaderia(index);
    setTempMercaderiaData({
      dia: entrada.dia,
      proveedor: entrada.proveedor,
      cortes: [...entrada.cortes]
    });
  };

  // Función para cancelar edición
  const cancelEditingMercaderia = () => {
    setEditingMercaderia(null);
    setTempMercaderiaData({});
  };

  // Función para guardar edición
  const saveEditingMercaderia = async (index) => {
    try {
      await actualizarMercaderia(index, tempMercaderiaData);
      addNotification('Mercadería actualizada', 'success');
      setEditingMercaderia(null);
      setTempMercaderiaData({});
      setExpandedMercaderia({});
    } catch (error) {
      addNotification('Error al actualizar mercadería', 'error');
      console.error(error);
    }
  };

  // Función para actualizar un corte específico
  const updateCorte = (corteIndex, field, value) => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: prev.cortes.map((corte, index) => 
        index === corteIndex ? { ...corte, [field]: value } : corte
      )
    }));
  };

  // Función para eliminar un corte en edición
  const eliminarCorteEnEdicion = (corteIndex) => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: prev.cortes.filter((_, index) => index !== corteIndex)
    }));
  };

  // Función para mostrar modal de confirmación de eliminación de corte
  const confirmarEliminarCorte = (entradaIndex, corteIndex) => {
    const corte = semanaActiva.mercaderia[entradaIndex].cortes[corteIndex];
    setCorteToDelete({ entradaIndex, corteIndex, corte });
    setShowDeleteCorteModal(true);
  };

  // Función para eliminar un corte de mercadería guardada
  const eliminarCorteDeMercaderia = async () => {
    if (!semanaActiva?.mercaderia || !corteToDelete) return;
    
    try {
      const { entradaIndex, corteIndex } = corteToDelete;
      const nuevaMercaderia = [...semanaActiva.mercaderia];
      nuevaMercaderia[entradaIndex].cortes = nuevaMercaderia[entradaIndex].cortes.filter((_, index) => index !== corteIndex);
      
      // Si no quedan cortes, eliminar toda la entrada
      if (nuevaMercaderia[entradaIndex].cortes.length === 0) {
        nuevaMercaderia.splice(entradaIndex, 1);
      }
      
      await updateDocument(semanaActiva.id, { mercaderia: nuevaMercaderia });
      addNotification('Corte eliminado exitosamente', 'success');
      setShowDeleteCorteModal(false);
      setCorteToDelete(null);
    } catch (error) {
      console.error('Error al eliminar corte:', error);
      addNotification('Error al eliminar el corte', 'error');
    }
  };

  // Función para agregar un corte en edición
  const agregarCorteEnEdicion = () => {
    setTempMercaderiaData(prev => ({
      ...prev,
      cortes: [...prev.cortes, { corte: 'Nuevo Corte', kg: 0, precioKg: 0 }]
    }));
  };

  // Funciones para embutidos
  const toggleExpandedEmbutidos = (index) => {
    // Cerrar edición si hay alguna activa
    if (editingEmbutidos !== null) {
      cancelEditingEmbutidos();
    }
    
    // Solo permitir una card expandida a la vez
    setExpandedEmbutidos(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        // Si ya está expandida, cerrarla
        return {};
      } else {
        // Cerrar todas y abrir solo esta
        return { [index]: true };
      }
    });
  };

  const startEditingEmbutidos = (index, entrada) => {
    setEditingEmbutidos(index);
    setTempEmbutidosData({
      dia: entrada.dia,
      embutidos: [...entrada.embutidos]
    });
  };

  const cancelEditingEmbutidos = () => {
    setEditingEmbutidos(null);
    setTempEmbutidosData({});
  };

  const saveEditingEmbutidos = async (index) => {
    try {
      await actualizarEmbutidos(index, tempEmbutidosData);
      addNotification('Embutidos actualizados', 'success');
      setEditingEmbutidos(null);
      setTempEmbutidosData({});
      setExpandedEmbutidos({});
    } catch (error) {
      addNotification('Error al actualizar embutidos', 'error');
      console.error(error);
    }
  };

  const updateEmbutido = (embutidoIndex, field, value) => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: prev.embutidos.map((embutido, index) => 
        index === embutidoIndex ? { ...embutido, [field]: value } : embutido
      )
    }));
  };

  // Función para eliminar un embutido en edición
  const eliminarEmbutidoEnEdicion = (embutidoIndex) => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: prev.embutidos.filter((_, index) => index !== embutidoIndex)
    }));
  };

  // Función para agregar un embutido en edición
  const agregarEmbutidoEnEdicion = () => {
    setTempEmbutidosData(prev => ({
      ...prev,
      embutidos: [...prev.embutidos, { tipo: 'Nuevo Tipo', kg: 0, precioKg: 0 }]
    }));
  };

  // Funciones para clientes
  const toggleExpandedClientes = (index) => {
    // Cerrar edición si hay alguna activa
    if (editingClientes !== null) {
      cancelEditingClientes();
    }
    
    // Solo permitir una card expandida a la vez
    setExpandedClientes(prev => {
      const isCurrentlyExpanded = prev[index];
      if (isCurrentlyExpanded) {
        // Si ya está expandida, cerrarla
        return {};
      } else {
        // Cerrar todas y abrir solo esta
        return { [index]: true };
      }
    });
  };

  const startEditingClientes = (index, cliente) => {
    setEditingClientes(index);
    setTempClientesData({
      nombre: cliente.nombre,
      boletas: [...cliente.boletas]
    });
  };

  const cancelEditingClientes = () => {
    setEditingClientes(null);
    setTempClientesData({});
  };

  const saveEditingClientes = async (index) => {
    try {
      await actualizarCliente(index, tempClientesData);
      addNotification('Cliente actualizado', 'success');
      setEditingClientes(null);
      setTempClientesData({});
      setExpandedClientes({});
    } catch (error) {
      addNotification('Error al actualizar cliente', 'error');
      console.error(error);
    }
  };

  const updateBoleta = (boletaIndex, field, value) => {
    setTempClientesData(prev => ({
      ...prev,
      boletas: prev.boletas.map((boleta, index) => 
        index === boletaIndex ? { ...boleta, [field]: value } : boleta
      )
    }));
  };

  // Función para eliminar una boleta en edición
  const eliminarBoletaEnEdicion = (boletaIndex) => {
    setTempClientesData(prev => ({
      ...prev,
      boletas: prev.boletas.filter((_, index) => index !== boletaIndex)
    }));
  };

  // Función para agregar una boleta en edición
  const agregarBoletaEnEdicion = () => {
    setTempClientesData(prev => ({
      ...prev,
      boletas: [...prev.boletas, { dia: getDiaActual(), monto: 0 }]
    }));
  };

  const [editingSueldoId, setEditingSueldoId] = useState(null);
  const [tempSueldoValue, setTempSueldoValue] = useState('');
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState({});
  const [hoverTimeout, setHoverTimeout] = useState({});

  // Función para cambiar tab y hacer scroll si es necesario
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    
    // Scroll automático según el tab seleccionado
    setTimeout(() => {
      switch (tabName) {
        case 'mercaderia':
          // Scroll al formulario de mercadería
          const formMercaderia = document.querySelector('[data-tab="mercaderia"]');
          if (formMercaderia) {
            formMercaderia.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'embutidos':
          // Scroll al formulario de embutidos
          const formEmbutidos = document.querySelector('[data-tab="embutidos"]');
          if (formEmbutidos) {
            formEmbutidos.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'empleados':
          // Scroll al resumen de empleados (lo más importante)
          const resumenEmpleados = document.querySelector('[data-section="resumen-empleados"]');
          if (resumenEmpleados) {
            resumenEmpleados.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'gastos':
          // Scroll al formulario de gastos
          const formGastos = document.querySelector('[data-tab="gastos"]');
          if (formGastos) {
            formGastos.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'clientes':
          // Scroll al formulario de clientes
          const formClientes = document.querySelector('[data-tab="clientes"]');
          if (formClientes) {
            formClientes.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
      }
    }, 100); // Pequeño delay para que se renderice el contenido
  };

  const {
    semanaActiva,
    loading,
    error,
    crearNuevaSemana,
    cerrarSemana,
    agregarMercaderia,
    eliminarMercaderia,
    actualizarMercaderia,
    agregarEmbutidos,
    eliminarEmbutidos,
    actualizarEmbutidos,
    gestionarEmpleado,
    agregarAdelanto,
    eliminarAdelanto,
    agregarGasto,
    eliminarGasto,
    agregarBoletaCliente,
    eliminarBoletaCliente,
    actualizarCliente,
    getConfiguracionesUsuario,
    guardarConfiguracionesUsuario
  } = useGestionSemanal(user?.uid);

  // Cargar tipos de embutidos personalizados desde Firebase
  useEffect(() => {
    const cargarTiposPersonalizados = async () => {
      if (user?.uid) {
        try {
          const configs = await getConfiguracionesUsuario();
          if (configs?.tiposEmbutidosPersonalizados) {
            setTiposEmbutidosPersonalizados(configs.tiposEmbutidosPersonalizados);
          }
        } catch (error) {
          console.error('Error cargando tipos personalizados:', error);
        }
      }
    };
    cargarTiposPersonalizados();
  }, [user?.uid]);

  // Función para agregar nuevo tipo de embutido personalizado
  const agregarTipoEmbutidoPersonalizado = async () => {
    const tipoTrimmed = nuevoTipoEmbutido.trim();
    if (!tipoTrimmed) {
      addNotification('Ingrese un nombre para el nuevo tipo', 'warning');
      return;
    }

    // Verificar que no exista ya
    const todosLosTipos = [...TIPOS_EMBUTIDOS, ...tiposEmbutidosPersonalizados];
    if (todosLosTipos.includes(tipoTrimmed)) {
      addNotification('Este tipo ya existe', 'warning');
      return;
    }

    const nuevosPersonalizados = [...tiposEmbutidosPersonalizados, tipoTrimmed];
    setTiposEmbutidosPersonalizados(nuevosPersonalizados);
    
    // Guardar en Firebase
    try {
      await guardarConfiguracionesUsuario({
        tiposEmbutidosPersonalizados: nuevosPersonalizados
      });
      addNotification(`Tipo "${tipoTrimmed}" agregado exitosamente`, 'success');
      setNuevoTipoEmbutido('');
      setMostrarInputNuevoTipo(false);
    } catch (error) {
      console.error('Error guardando tipo personalizado:', error);
      addNotification('Error al guardar el tipo personalizado', 'error');
    }
  };

  // Obtener lista completa de tipos de embutidos
  const getTodosLosTiposEmbutidos = () => {
    return [...TIPOS_EMBUTIDOS, ...tiposEmbutidosPersonalizados];
  };

  // ==================== TAB MERCADERÍA ====================
  
  // Función para obtener el día actual de la semana
  const getDiaActual = () => {
    const hoy = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = dias[hoy.getDay()];
    
    // Si es domingo, usar lunes como día por defecto (primer día laboral)
    return diaActual === 'Domingo' ? 'Lunes' : diaActual;
  };

  const [formMercaderia, setFormMercaderia] = useState({
    dia: getDiaActual(),
    proveedor: 'Catriel',
    proveedorOtro: '',
    cortes: {}
  });

  // Estados para agregar cortes personalizados
  const [nuevoCorte, setNuevoCorte] = useState('');
  const [mostrarInputNuevoCorte, setMostrarInputNuevoCorte] = useState(false);

  // Función para agregar un nuevo tipo de corte
  const agregarNuevoCorte = () => {
    const corteTrimmed = nuevoCorte.trim();
    if (!corteTrimmed) {
      addNotification('Ingrese un nombre para el nuevo corte', 'warning');
      return;
    }

    // Verificar si ya existe
    if (formMercaderia.cortes[corteTrimmed]) {
      addNotification('Este corte ya existe', 'warning');
      return;
    }

    // Agregar el nuevo corte al formulario
    setFormMercaderia(prev => ({
      ...prev,
      cortes: {
        ...prev.cortes,
        [corteTrimmed]: { kg: '', precioKg: '' }
      }
    }));

    setNuevoCorte('');
    setMostrarInputNuevoCorte(false);
    addNotification(`Corte "${corteTrimmed}" agregado`, 'success');
  };

  // Función para eliminar un corte del formulario
  const eliminarCorteDelFormulario = (corte) => {
    setFormMercaderia(prev => {
      const nuevosCortes = { ...prev.cortes };
      delete nuevosCortes[corte];
      return {
        ...prev,
        cortes: nuevosCortes
      };
    });
  };

  const handleAgregarMercaderia = async () => {
    try {
      const cortesConDatos = Object.entries(formMercaderia.cortes)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([corte, datos]) => ({ 
          corte, 
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      if (cortesConDatos.length === 0) {
        addNotification('Debe ingresar al menos un corte con kilos', 'warning');
        return;
      }

      const proveedor = formMercaderia.proveedor === 'Otro' 
        ? formMercaderia.proveedorOtro 
        : formMercaderia.proveedor;

      if (!proveedor) {
        addNotification('Debe especificar un proveedor', 'warning');
        return;
      }

      await agregarMercaderia({
        dia: formMercaderia.dia,
        proveedor,
        cortes: cortesConDatos
      });

      setFormMercaderia({
        dia: formMercaderia.dia,
        proveedor: 'Catriel',
        proveedorOtro: '',
        cortes: {}
      });

      addNotification('Mercadería agregada', 'success');
    } catch (err) {
      addNotification('Error al agregar mercadería', 'error');
    }
  };

  const calcularTotalesMercaderia = () => {
    if (!semanaActiva?.mercaderia) return { porCorte: {}, total: 0 };

    const porCorte = {};
    let total = 0;

    semanaActiva.mercaderia.forEach(entrada => {
      entrada.cortes.forEach(({ corte, kg }) => {
        porCorte[corte] = (porCorte[corte] || 0) + kg;
        total += kg;
      });
    });

    return { porCorte, total };
  };

  // ==================== TAB EMBUTIDOS ====================
  const [formEmbutidos, setFormEmbutidos] = useState({
    dia: getDiaActual(),
    embutidos: {}
  });

  const handleAgregarEmbutidos = async () => {
    try {
      const embutidosConDatos = Object.entries(formEmbutidos.embutidos)
        .filter(([_, datos]) => datos?.kg && parseFloat(datos.kg) > 0)
        .map(([tipo, datos]) => ({ 
          tipo, 
          kg: parseFloat(datos.kg),
          precioKg: datos.precioKg ? parseFloat(datos.precioKg) : 0
        }));

      if (embutidosConDatos.length === 0) {
        addNotification('Debe ingresar al menos un tipo de embutido con kilos', 'warning');
        return;
      }

      await agregarEmbutidos({
        dia: formEmbutidos.dia,
        embutidos: embutidosConDatos
      });

      setFormEmbutidos({
        dia: formEmbutidos.dia,
        embutidos: {}
      });

      addNotification('Embutidos agregados', 'success');
    } catch (err) {
      addNotification('Error al agregar embutidos', 'error');
    }
  };

  const calcularTotalesEmbutidos = () => {
    if (!semanaActiva?.embutidos) return { porTipo: {}, total: 0 };

    const porTipo = {};
    let total = 0;

    semanaActiva.embutidos.forEach(entrada => {
      entrada.embutidos.forEach(({ tipo, kg }) => {
        porTipo[tipo] = (porTipo[tipo] || 0) + kg;
        total += kg;
      });
    });

    return { porTipo, total };
  };

  // ==================== TAB EMPLEADOS ====================
  const [formEmpleado, setFormEmpleado] = useState({
    nombre: 'Jorge',
    nombreOtro: '',
    sueldoSemanal: ''
  });

  const [formAdelanto, setFormAdelanto] = useState({
    empleado: '',
    dia: getDiaActual(),
    monto: '',
    descripcion: ''
  });

  // Efecto para actualizar el empleado seleccionado cuando se cargan empleados
  useEffect(() => {
    if (semanaActiva?.empleados && semanaActiva.empleados.length > 0) {
      // Si no hay empleado seleccionado o el empleado seleccionado no existe, seleccionar el primero
      if (!formAdelanto.empleado || !semanaActiva.empleados.find(emp => emp.nombre === formAdelanto.empleado)) {
        setFormAdelanto(prev => ({
          ...prev,
          empleado: semanaActiva.empleados[0].nombre
        }));
      }
    }
  }, [semanaActiva?.empleados]);

  const handleAgregarEmpleado = async () => {
    try {
      const nombre = formEmpleado.nombre === 'Otro' 
        ? formEmpleado.nombreOtro 
        : formEmpleado.nombre;

      if (!nombre || !formEmpleado.sueldoSemanal) {
        addNotification('Complete todos los campos', 'warning');
        return;
      }

      await gestionarEmpleado({
        nombre,
        sueldoSemanal: parseFloat(formEmpleado.sueldoSemanal)
      });

      setFormEmpleado({
        nombre: 'Jorge',
        nombreOtro: '',
        sueldoSemanal: ''
      });

      addNotification('Empleado configurado', 'success');
    } catch (err) {
      addNotification('Error al configurar empleado', 'error');
    }
  };

  const handleAgregarAdelanto = async () => {
    try {
      if (!formAdelanto.monto) {
        addNotification('Debe ingresar un monto', 'warning');
        return;
      }

      await agregarAdelanto({
        empleado: formAdelanto.empleado,
        dia: formAdelanto.dia,
        monto: parseFloat(formAdelanto.monto),
        descripcion: formAdelanto.descripcion
      });

      setFormAdelanto({
        empleado: formAdelanto.empleado, // Mantener el empleado seleccionado
        dia: getDiaActual(),
        monto: '',
        descripcion: ''
      });

      addNotification('Adelanto registrado', 'success');
    } catch (err) {
      addNotification('Error al registrar adelanto', 'error');
    }
  };

  const calcularDeudaEmpleado = (empleado) => {
    const adelantos = semanaActiva?.adelantos || [];
    const totalAdelantos = adelantos
      .filter(a => a.empleado === empleado.nombre)
      .reduce((sum, a) => sum + a.monto, 0);
    
    return empleado.sueldoSemanal - totalAdelantos;
  };

  // Función para iniciar edición de sueldo
  const iniciarEdicionSueldo = (empleado) => {
    setEditingSueldoId(empleado.nombre);
    setTempSueldoValue(empleado.sueldoSemanal.toString());
  };

  // Función para guardar sueldo editado
  const guardarSueldoEditado = async (empleado) => {
    try {
      const nuevoSueldo = parseFloat(tempSueldoValue);
      
      if (isNaN(nuevoSueldo) || nuevoSueldo < 0) {
        addNotification('El sueldo debe ser un número válido y positivo', 'warning');
        return;
      }

      await gestionarEmpleado({
        ...empleado,
        sueldoSemanal: nuevoSueldo
      });

      setEditingSueldoId(null);
      setTempSueldoValue('');
      addNotification('Sueldo actualizado correctamente', 'success');
    } catch (err) {
      addNotification('Error al actualizar sueldo', 'error');
    }
  };

  // Función para cancelar edición
  const cancelarEdicionSueldo = () => {
    setEditingSueldoId(null);
    setTempSueldoValue('');
  };

  // Funciones para manejar tooltip
  const handleMouseEnter = (empleado) => {
    // Limpiar timeout anterior si existe
    if (hoverTimeout[empleado]) {
      clearTimeout(hoverTimeout[empleado]);
    }
    
    // Crear nuevo timeout para mostrar tooltip después de 2 segundos
    const timeout = setTimeout(() => {
      setTooltipVisible(prev => ({ ...prev, [empleado]: true }));
    }, 2000);
    
    setHoverTimeout(prev => ({ ...prev, [empleado]: timeout }));
  };

  const handleMouseLeave = (empleado) => {
    // Limpiar timeout
    if (hoverTimeout[empleado]) {
      clearTimeout(hoverTimeout[empleado]);
      setHoverTimeout(prev => ({ ...prev, [empleado]: null }));
    }
    
    // Ocultar tooltip
    setTooltipVisible(prev => ({ ...prev, [empleado]: false }));
  };

  // ==================== TAB GASTOS ====================
  const [formGasto, setFormGasto] = useState({
    fecha: getLocalDateString(),
    descripcion: '',
    monto: ''
  });

  const handleAgregarGasto = async () => {
    try {
      if (!formGasto.descripcion || !formGasto.monto) {
        addNotification('Complete todos los campos', 'warning');
        return;
      }

      await agregarGasto({
        fecha: formGasto.fecha,
        descripcion: formGasto.descripcion,
        monto: parseFloat(formGasto.monto)
      });

      setFormGasto({
        fecha: getLocalDateString(),
        descripcion: '',
        monto: ''
      });

      addNotification('Gasto registrado', 'success');
    } catch (err) {
      addNotification('Error al registrar gasto', 'error');
    }
  };

  const calcularTotalGastos = () => {
    if (!semanaActiva?.gastos) return 0;
    return semanaActiva.gastos.reduce((sum, g) => sum + g.monto, 0);
  };

  // ==================== TAB CLIENTES ====================
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    dia: getDiaActual(),
    monto: ''
  });

  // Estados para impresión de empleados
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Función para imprimir comprobante de empleado individual
  const handleImprimirEmpleado = (empleadoNombre) => {
    if (!semanaActiva) return;
    
    // Filtrar empleado específico y sus adelantos
    const empleado = semanaActiva.empleados?.find(emp => emp.nombre === empleadoNombre);
    const adelantosEmpleado = semanaActiva.adelantos?.filter(adel => adel.empleado === empleadoNombre) || [];
    
    if (!empleado) return;
    
    const empleadoData = {
      empleado: empleado,
      adelantos: adelantosEmpleado,
      fechaInicio: semanaActiva.fechaInicio,
      tipo: 'empleado'
    };
    
    setPrintData(empleadoData);
    setShowPrintModal(true);
  };

  const handleAgregarBoleta = async () => {
    try {
      if (!formCliente.nombre || !formCliente.monto) {
        addNotification('Complete todos los campos', 'warning');
        return;
      }

      await agregarBoletaCliente(formCliente.nombre, {
        dia: formCliente.dia,
        monto: parseFloat(formCliente.monto)
      });

      setFormCliente({
        nombre: formCliente.nombre,
        dia: getDiaActual(),
        monto: ''
      });

      addNotification('Boleta registrada', 'success');
    } catch (err) {
      addNotification('Error al registrar boleta', 'error');
    }
  };

  const calcularDeudaCliente = (cliente) => {
    if (!cliente.boletas) return 0;
    return cliente.boletas.reduce((sum, b) => sum + b.monto, 0);
  };

  // ==================== NAVEGACIÓN ====================
  const irABalance = () => {
    navigate('/balance');
  };



  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="container-fluid mt-4 px-lg-5" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div style={{ width: '200px' }}></div> {/* Espaciador izquierdo */}
            <h2 className="mb-0">Gestión Semanal</h2>
            <div className="d-flex align-items-center" style={{ width: '200px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-success btn-sm"
                onClick={() => navigate('/balance')}
                style={{ 
                  fontWeight: '600',
                  padding: '0.5rem 1rem'
                }}
              >
                <i className="fas fa-chart-line me-1"></i>
                Ver Balance
              </button>
            </div>
          </div>
          
          {semanaActiva && (
            <div className="alert alert-info text-center">
              <strong>Semana actual:</strong> Iniciada el {new Date(semanaActiva.fechaInicio).toLocaleDateString('es-AR')}
            </div>
          )}

          {!semanaActiva && (
            <div className="alert alert-warning text-center">
              <p>No hay una semana activa. Los datos se guardarán automáticamente al agregar la primera entrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <ul className="nav nav-tabs nav-fill mb-4" style={{ fontSize: '1.1rem' }}>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'mercaderia' ? 'active' : ''}`}
            onClick={() => handleTabChange('mercaderia')}
            style={{ fontWeight: 'bold', padding: '15px' }}
          >
            📦 Mercadería
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'embutidos' ? 'active' : ''}`}
            onClick={() => handleTabChange('embutidos')}
            style={{ fontWeight: 'bold', padding: '15px' }}
          >
            🌭 Embutidos
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'empleados' ? 'active' : ''}`}
            onClick={() => handleTabChange('empleados')}
            style={{ fontWeight: 'bold', padding: '15px' }}
          >
            👨‍💼 Empleados
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'gastos' ? 'active' : ''}`}
            onClick={() => handleTabChange('gastos')}
            style={{ fontWeight: 'bold', padding: '15px' }}
          >
            💰 Gastos
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => handleTabChange('clientes')}
            style={{ fontWeight: 'bold', padding: '15px' }}
          >
            🧾 Clientes
          </button>
        </li>
      </ul>

      {/* CONTENIDO DE LOS TABS */}
      <div className="tab-content">
        {/* TAB MERCADERÍA */}
        {activeTab === 'mercaderia' && (
          <div className="row">
            <div className="col-lg-5" data-tab="mercaderia">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Agregar Mercadería (Carne)</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Día de la semana:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formMercaderia.dia}
                      onChange={(e) => setFormMercaderia({...formMercaderia, dia: e.target.value})}
                    >
                      {DIAS_SEMANA.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Proveedor:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formMercaderia.proveedor}
                      onChange={(e) => setFormMercaderia({...formMercaderia, proveedor: e.target.value})}
                    >
                      {PROVEEDORES.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                      <option value="Otro">Otro...</option>
                    </select>
                  </div>

                  {formMercaderia.proveedor === 'Otro' && (
                    <div className="mb-3">
                      <input 
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Nombre del proveedor"
                        value={formMercaderia.proveedorOtro}
                        onChange={(e) => setFormMercaderia({...formMercaderia, proveedorOtro: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0">Cortes (kg y precio por kg):</label>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => setMostrarInputNuevoCorte(!mostrarInputNuevoCorte)}
                      >
                        {mostrarInputNuevoCorte ? '✕ Cancelar' : '➕ Agregar Corte'}
                      </button>
                    </div>

                    {/* Input para agregar nuevo corte */}
                    {mostrarInputNuevoCorte && (
                      <div className="card mb-3 border-success">
                        <div className="card-body p-3">
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Nombre del nuevo corte (ej: Bife de chorizo, Asado, etc.)"
                              value={nuevoCorte}
                              onChange={(e) => setNuevoCorte(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  agregarNuevoCorte();
                                }
                              }}
                            />
                            <button
                              className="btn btn-success"
                              onClick={agregarNuevoCorte}
                            >
                              ✅ Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      {/* Cortes predefinidos */}
                      {CORTES_CARNE.map(corte => {
                        const nombreCorto = corte.length > 8 ? corte.substring(0, 8) : corte;
                        const esPersonalizado = !CORTES_CARNE.includes(corte);
                        return (
                          <div key={corte} className="col-lg-4 col-md-6 mb-3">
                            <div className={`card h-100 ${esPersonalizado ? 'border-success' : ''}`}>
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{corte}</label>
                                  {esPersonalizado && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                      onClick={() => eliminarCorteDelFormulario(corte)}
                                      title="Eliminar corte"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <div className="d-flex flex-column gap-1">
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">Kg</span>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="0"
                                      step="0.1"
                                      value={formMercaderia.cortes[corte]?.kg || ''}
                                      onChange={(e) => setFormMercaderia({
                                        ...formMercaderia,
                                        cortes: { 
                                          ...formMercaderia.cortes, 
                                          [corte]: {
                                            ...formMercaderia.cortes[corte],
                                            kg: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                  </div>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">$/Kg</span>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="0"
                                      step="0.01"
                                      value={formMercaderia.cortes[corte]?.precioKg || ''}
                                      onChange={(e) => setFormMercaderia({
                                        ...formMercaderia,
                                        cortes: { 
                                          ...formMercaderia.cortes, 
                                          [corte]: {
                                            ...formMercaderia.cortes[corte],
                                            precioKg: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Cortes personalizados */}
                      {Object.keys(formMercaderia.cortes)
                        .filter(corte => !CORTES_CARNE.includes(corte))
                        .map(corte => (
                          <div key={corte} className="col-lg-4 col-md-6 mb-3">
                            <div className="card h-100 border-success">
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                                    {corte}
                                    <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>Personalizado</span>
                                  </label>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                    onClick={() => eliminarCorteDelFormulario(corte)}
                                    title="Eliminar corte"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="d-flex flex-column gap-1">
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">Kg</span>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="0"
                                      step="0.1"
                                      value={formMercaderia.cortes[corte]?.kg || ''}
                                      onChange={(e) => setFormMercaderia({
                                        ...formMercaderia,
                                        cortes: { 
                                          ...formMercaderia.cortes, 
                                          [corte]: {
                                            ...formMercaderia.cortes[corte],
                                            kg: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                  </div>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">$/Kg</span>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="0"
                                      step="0.01"
                                      value={formMercaderia.cortes[corte]?.precioKg || ''}
                                      onChange={(e) => setFormMercaderia({
                                        ...formMercaderia,
                                        cortes: { 
                                          ...formMercaderia.cortes, 
                                          [corte]: {
                                            ...formMercaderia.cortes[corte],
                                            precioKg: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <button 
                    className="btn btn-success btn-lg w-100"
                    onClick={handleAgregarMercaderia}
                  >
                    ✅ Agregar Entrada
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">Entradas de la Semana</h5>
                </div>
                <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {!semanaActiva?.mercaderia || semanaActiva.mercaderia.length === 0 ? (
                    <p className="text-muted text-center">No hay entradas registradas</p>
                  ) : (
                    <div className="row">
                      {semanaActiva.mercaderia.map((entrada, index) => {
                        const totalKilos = entrada.cortes.reduce((sum, corte) => sum + corte.kg, 0);
                        const costoTotal = entrada.cortes.reduce((sum, corte) => sum + (corte.kg * (corte.precioKg || 0)), 0);
                        const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
                        const isExpanded = expandedMercaderia[index];
                        
                        return (
                          <div key={index} className={`mb-3 card-transition ${editingMercaderia === index ? 'col-12 card-expand' : 'col-lg-4 col-md-6 col-sm-6'}`}>
                            <div 
                              className={`card border-primary h-100 ${editingMercaderia !== index ? 'smooth-hover' : ''}`}
                              style={{ cursor: editingMercaderia === index ? 'default' : 'pointer' }}
                              onClick={() => editingMercaderia === index ? null : toggleExpandedMercaderia(index)}
                            >
                              {!isExpanded ? (
                                // Versión compacta
                                <div className="card-body p-2 text-center">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0">
                                      <span className="badge bg-primary">{entrada.dia}</span>
                                      {' '}
                                      <strong>{entrada.proveedor}</strong>
                                    </h6>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarMercaderia(index);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <h5 className="text-primary mb-1">
                                    <strong>{totalKilos} kg</strong>
                                  </h5>
                                  {costoPromedioKg > 0 && (
                                    <h6 className="text-success mb-1" style={{ fontSize: '0.9rem' }}>
                                      <strong>${costoPromedioKg.toFixed(2)}/kg</strong>
                                    </h6>
                                  )}
                                  <small className="text-muted">
                                    {entrada.cortes.length} tipos de corte
                                  </small>
                                </div>
                              ) : (
                                // Versión expandida
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      {editingMercaderia === index ? (
                                        <div className="d-flex gap-2 align-items-center">
                                          <select 
                                            className="form-select form-select-sm" 
                                            style={{width: 'auto'}}
                                            value={tempMercaderiaData.dia}
                                            onChange={(e) => setTempMercaderiaData(prev => ({...prev, dia: e.target.value}))}
                                          >
                                            {DIAS_SEMANA.map(dia => (
                                              <option key={dia} value={dia}>{dia}</option>
                                            ))}
                                          </select>
                                          <input 
                                            type="text" 
                                            className="form-control form-control-sm" 
                                            style={{width: '120px'}}
                                            value={tempMercaderiaData.proveedor}
                                            onChange={(e) => setTempMercaderiaData(prev => ({...prev, proveedor: e.target.value}))}
                                          />
                                        </div>
                                      ) : (
                                        <h6 className="mb-1">
                                          <span className="badge bg-primary">{entrada.dia}</span>
                                          {' '}
                                          <strong>{entrada.proveedor}</strong>
                                        </h6>
                                      )}
                                    </div>
                                    <div className="d-flex gap-1">
                                      {editingMercaderia === index ? (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-success"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              saveEditingMercaderia(index);
                                            }}
                                          >
                                            ✓
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              cancelEditingMercaderia();
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-warning"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingMercaderia(index, entrada);
                                            }}
                                          >
                                            ✏️
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              eliminarMercaderia(index);
                                            }}
                                          >
                                            🗑️
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {editingMercaderia === index ? (
                                    // Modo edición - Layout en columnas para aprovechar el ancho completo
                                    <div className="fade-in">
                                      <div className="row g-2">
                                        {tempMercaderiaData.cortes.map((corte, i) => (
                                          <div key={i} className="col-md-3 col-sm-6">
                                            <div className="border rounded p-2 position-relative">
                                              <button 
                                                className="btn btn-sm btn-danger position-absolute"
                                                style={{ top: '2px', right: '2px', padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  eliminarCorteEnEdicion(i);
                                                }}
                                                title="Eliminar corte"
                                              >
                                                ✕
                                              </button>
                                              <input 
                                                type="text" 
                                                className="form-control form-control-sm mb-1" 
                                                value={corte.corte}
                                                onChange={(e) => updateCorte(i, 'corte', e.target.value)}
                                                placeholder="Nombre del corte"
                                              />
                                              <div className="input-group input-group-sm mb-1">
                                                <span className="input-group-text" style={{fontSize: '0.75rem'}}>Kg</span>
                                                <input 
                                                  type="number" 
                                                  className="form-control" 
                                                  value={corte.kg}
                                                  onChange={(e) => updateCorte(i, 'kg', parseFloat(e.target.value) || 0)}
                                                  step="0.1"
                                                  placeholder="0"
                                                />
                                              </div>
                                              <div className="input-group input-group-sm">
                                                <span className="input-group-text" style={{fontSize: '0.75rem'}}>$/Kg</span>
                                                <input 
                                                  type="number" 
                                                  className="form-control" 
                                                  value={corte.precioKg || 0}
                                                  onChange={(e) => updateCorte(i, 'precioKg', parseFloat(e.target.value) || 0)}
                                                  step="0.01"
                                                  placeholder="0"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        {/* Botón para agregar nuevo corte */}
                                        <div className="col-md-3 col-sm-6">
                                          <button 
                                            className="btn btn-outline-primary w-100 h-100 d-flex align-items-center justify-content-center"
                                            style={{ minHeight: '80px' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              agregarCorteEnEdicion();
                                            }}
                                          >
                                            <span style={{ fontSize: '2rem' }}>+</span>
                                          </button>
                                        </div>
                                      </div>
                                      <div className="mt-3 pt-2 border-top">
                                        <div className="d-flex justify-content-between">
                                          <strong>Total:</strong>
                                          <strong className="text-primary fs-5">
                                            {tempMercaderiaData.cortes.reduce((sum, corte) => sum + corte.kg, 0).toFixed(1)} kg
                                          </strong>
                                        </div>
                                        {tempMercaderiaData.cortes.some(c => c.precioKg && c.precioKg > 0) && (
                                          <>
                                            <div className="d-flex justify-content-between mt-1">
                                              <strong>Costo Total:</strong>
                                              <strong className="text-success">
                                                ${tempMercaderiaData.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0).toFixed(2)}
                                              </strong>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                              <strong>Costo Promedio:</strong>
                                              <strong className="text-info">
                                                ${tempMercaderiaData.cortes.reduce((sum, c) => sum + c.kg, 0) > 0 ? 
                                                  (tempMercaderiaData.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0) / 
                                                   tempMercaderiaData.cortes.reduce((sum, c) => sum + c.kg, 0)).toFixed(2) : '0.00'}/kg
                                              </strong>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    // Modo lectura
                                    <div>
                                      <ul className="list-unstyled mb-0 small">
                                        {entrada.cortes.map((corte, i) => (
                                          <li key={i} className="mb-1 d-flex justify-content-between align-items-center">
                                            <div>
                                              • {corte.corte}: <strong>{corte.kg} kg</strong>
                                              {corte.precioKg ? (
                                                <span className="text-muted"> (${corte.precioKg}/kg = ${(corte.kg * corte.precioKg).toFixed(2)})</span>
                                              ) : null}
                                            </div>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                confirmarEliminarCorte(index, i);
                                              }}
                                              title="Eliminar corte"
                                            >
                                              ✕
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                      <div className="mt-2 pt-2 border-top">
                                        <div className="d-flex justify-content-between">
                                          <strong>Total:</strong>
                                          <strong className="text-primary">
                                            {totalKilos} kg
                                          </strong>
                                        </div>
                                        {entrada.cortes.some(c => c.precioKg) && (
                                          <>
                                            <div className="d-flex justify-content-between mt-1">
                                              <strong>Costo Total:</strong>
                                              <strong className="text-success">
                                                ${entrada.cortes.reduce((sum, c) => sum + (c.kg * (c.precioKg || 0)), 0).toFixed(2)}
                                              </strong>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                              <strong>Costo Promedio:</strong>
                                              <strong className="text-info">
                                                ${costoPromedioKg.toFixed(2)}/kg
                                              </strong>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* TOTALES */}
              {semanaActiva?.mercaderia && semanaActiva.mercaderia.length > 0 && (
                <div className="card mt-3 border-success">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">Totales Semanales</h5>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const { porCorte, total } = calcularTotalesMercaderia();
                      return (
                        <>
                          <div className="row">
                            {Object.entries(porCorte).map(([corte, kg]) => (
                              <div key={corte} className="col-6 mb-2">
                                <strong>{corte}:</strong> {kg.toFixed(1)} kg
                              </div>
                            ))}
                          </div>
                          <hr />
                          <h4 className="text-center mb-0">
                            <strong>TOTAL: {total.toFixed(1)} kg</strong>
                          </h4>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB EMBUTIDOS */}
        {activeTab === 'embutidos' && (
          <div className="row">
            <div className="col-lg-5" data-tab="embutidos">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Agregar Embutidos</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Día de la semana:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formEmbutidos.dia}
                      onChange={(e) => setFormEmbutidos({...formEmbutidos, dia: e.target.value})}
                    >
                      {DIAS_SEMANA.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0">Embutidos (kg y precio por kg):</label>
                      <button 
                        className="btn btn-sm btn-outline-success"
                        onClick={() => setMostrarInputNuevoTipo(!mostrarInputNuevoTipo)}
                      >
                        {mostrarInputNuevoTipo ? '✕ Cancelar' : '➕ Agregar Tipo'}
                      </button>
                    </div>
                    
                    {/* Input para agregar nuevo tipo */}
                    {mostrarInputNuevoTipo && (
                      <div className="card mb-3 border-success">
                        <div className="card-body p-3">
                          <div className="input-group">
                            <input 
                              type="text"
                              className="form-control"
                              placeholder="Nombre del nuevo tipo de embutido"
                              value={nuevoTipoEmbutido}
                              onChange={(e) => setNuevoTipoEmbutido(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  agregarTipoEmbutidoPersonalizado();
                                }
                              }}
                            />
                            <button 
                              className="btn btn-success"
                              onClick={agregarTipoEmbutidoPersonalizado}
                            >
                              ✅ Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      {getTodosLosTiposEmbutidos().map(tipo => {
                        const esPersonalizado = tiposEmbutidosPersonalizados.includes(tipo);
                        return (
                          <div key={tipo} className="col-lg-4 col-md-6 mb-3">
                            <div className={`card h-100 ${esPersonalizado ? 'border-success' : ''}`}>
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <label className="form-label mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{tipo}</label>
                                  {esPersonalizado && (
                                    <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>Personalizado</span>
                                  )}
                                </div>
                                <div className="d-flex flex-column gap-1">
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">Kg</span>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="0"
                                      step="0.1"
                                      value={formEmbutidos.embutidos[tipo]?.kg || ''}
                                      onChange={(e) => setFormEmbutidos({
                                        ...formEmbutidos,
                                        embutidos: { 
                                          ...formEmbutidos.embutidos, 
                                          [tipo]: {
                                            ...formEmbutidos.embutidos[tipo],
                                            kg: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                  </div>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">$/Kg</span>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="0"
                                      step="0.01"
                                      value={formEmbutidos.embutidos[tipo]?.precioKg || ''}
                                      onChange={(e) => setFormEmbutidos({
                                        ...formEmbutidos,
                                        embutidos: { 
                                          ...formEmbutidos.embutidos, 
                                          [tipo]: {
                                            ...formEmbutidos.embutidos[tipo],
                                            precioKg: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    className="btn btn-success btn-lg w-100"
                    onClick={handleAgregarEmbutidos}
                  >
                    ✅ Agregar Entrada
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">Entradas de la Semana</h5>
                </div>
                <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {!semanaActiva?.embutidos || semanaActiva.embutidos.length === 0 ? (
                    <p className="text-muted text-center">No hay entradas registradas</p>
                  ) : (
                    <div className="row">
                      {semanaActiva.embutidos.map((entrada, index) => {
                        const totalKilos = entrada.embutidos.reduce((sum, emb) => sum + emb.kg, 0);
                        const costoTotal = entrada.embutidos.reduce((sum, emb) => sum + (emb.kg * (emb.precioKg || 0)), 0);
                        const costoPromedioKg = totalKilos > 0 ? costoTotal / totalKilos : 0;
                        const isExpanded = expandedEmbutidos[index];
                        
                        return (
                          <div key={index} className={`mb-3 card-transition ${editingEmbutidos === index ? 'col-12 card-expand' : 'col-md-4 col-sm-6'}`}>
                            <div 
                              className={`card border-primary h-100 ${editingEmbutidos !== index ? 'smooth-hover' : ''}`}
                              style={{ cursor: editingEmbutidos === index ? 'default' : 'pointer' }}
                              onClick={() => editingEmbutidos === index ? null : toggleExpandedEmbutidos(index)}
                            >
                              {!isExpanded ? (
                                // Versión compacta
                                <div className="card-body p-2 text-center">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0">
                                      <span className="badge bg-primary">{entrada.dia}</span>
                                    </h6>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarEmbutidos(index);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <h5 className="text-primary mb-1">
                                    <strong>{totalKilos} kg</strong>
                                  </h5>
                                  {costoPromedioKg > 0 && (
                                    <h6 className="text-success mb-1" style={{ fontSize: '0.9rem' }}>
                                      <strong>${costoPromedioKg.toFixed(2)}/kg</strong>
                                    </h6>
                                  )}
                                  <small className="text-muted">
                                    {entrada.embutidos.length} tipos de embutidos
                                  </small>
                                </div>
                              ) : (
                                // Versión expandida
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      {editingEmbutidos === index ? (
                                        <div className="d-flex gap-2 align-items-center">
                                          <select 
                                            className="form-select form-select-sm" 
                                            style={{width: 'auto'}}
                                            value={tempEmbutidosData.dia}
                                            onChange={(e) => setTempEmbutidosData(prev => ({...prev, dia: e.target.value}))}
                                          >
                                            {DIAS_SEMANA.map(dia => (
                                              <option key={dia} value={dia}>{dia}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : (
                                        <h6 className="mb-1">
                                          <span className="badge bg-primary">{entrada.dia}</span>
                                        </h6>
                                      )}
                                    </div>
                                    <div className="d-flex gap-1">
                                      {editingEmbutidos === index ? (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-success"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              saveEditingEmbutidos(index);
                                            }}
                                          >
                                            ✓
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              cancelEditingEmbutidos();
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-warning"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingEmbutidos(index, entrada);
                                            }}
                                          >
                                            ✏️
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              eliminarEmbutidos(index);
                                            }}
                                          >
                                            🗑️
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {editingEmbutidos === index ? (
                                    // Modo edición - Layout en columnas para aprovechar el ancho completo
                                    <div className="fade-in">
                                      <div className="row g-2">
                                        {tempEmbutidosData.embutidos.map((emb, i) => (
                                          <div key={i} className="col-md-3 col-sm-6">
                                            <div className="border rounded p-2 position-relative">
                                              <button 
                                                className="btn btn-sm btn-danger position-absolute"
                                                style={{ top: '2px', right: '2px', padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  eliminarEmbutidoEnEdicion(i);
                                                }}
                                                title="Eliminar embutido"
                                              >
                                                ✕
                                              </button>
                                              <input 
                                                type="text" 
                                                className="form-control form-control-sm mb-1" 
                                                value={emb.tipo}
                                                onChange={(e) => updateEmbutido(i, 'tipo', e.target.value)}
                                                placeholder="Tipo de embutido"
                                              />
                                              <div className="input-group input-group-sm mb-1">
                                                <span className="input-group-text" style={{fontSize: '0.75rem'}}>Kg</span>
                                                <input 
                                                  type="number" 
                                                  className="form-control" 
                                                  value={emb.kg}
                                                  onChange={(e) => updateEmbutido(i, 'kg', parseFloat(e.target.value) || 0)}
                                                  step="0.1"
                                                  placeholder="0"
                                                />
                                              </div>
                                              <div className="input-group input-group-sm">
                                                <span className="input-group-text" style={{fontSize: '0.75rem'}}>$/Kg</span>
                                                <input 
                                                  type="number" 
                                                  className="form-control" 
                                                  value={emb.precioKg || 0}
                                                  onChange={(e) => updateEmbutido(i, 'precioKg', parseFloat(e.target.value) || 0)}
                                                  step="0.01"
                                                  placeholder="0"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        {/* Botón para agregar nuevo embutido */}
                                        <div className="col-md-3 col-sm-6">
                                          <button 
                                            className="btn btn-outline-primary w-100 h-100 d-flex align-items-center justify-content-center"
                                            style={{ minHeight: '80px' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              agregarEmbutidoEnEdicion();
                                            }}
                                          >
                                            <span style={{ fontSize: '2rem' }}>+</span>
                                          </button>
                                        </div>
                                      </div>
                                      <div className="mt-3 pt-2 border-top">
                                        <div className="d-flex justify-content-between">
                                          <strong>Total:</strong>
                                          <strong className="text-primary fs-5">
                                            {tempEmbutidosData.embutidos.reduce((sum, emb) => sum + emb.kg, 0).toFixed(1)} kg
                                          </strong>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Modo lectura
                                    <div>
                                      <ul className="list-unstyled mb-0 small">
                                        {entrada.embutidos.map((emb, i) => (
                                          <li key={i} className="mb-1">
                                            • {emb.tipo}: <strong>{emb.kg} kg</strong>
                                            {emb.precioKg ? (
                                              <span className="text-muted"> (${emb.precioKg}/kg = ${(emb.kg * emb.precioKg).toFixed(2)})</span>
                                            ) : null}
                                          </li>
                                        ))}
                                      </ul>
                                      <div className="mt-2 pt-2 border-top">
                                        <div className="d-flex justify-content-between">
                                          <strong>Total:</strong>
                                          <strong className="text-primary">
                                            {totalKilos} kg
                                          </strong>
                                        </div>
                                        {entrada.embutidos.some(e => e.precioKg) && (
                                          <div className="d-flex justify-content-between mt-1">
                                            <strong>Costo Total:</strong>
                                            <strong className="text-success">
                                              ${entrada.embutidos.reduce((sum, e) => sum + (e.kg * (e.precioKg || 0)), 0).toFixed(2)}
                                            </strong>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* TOTALES */}
              {semanaActiva?.embutidos && semanaActiva.embutidos.length > 0 && (
                <div className="card mt-3 border-success">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">Totales Semanales</h5>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const { porTipo, total } = calcularTotalesEmbutidos();
                      return (
                        <>
                          <div className="row">
                            {Object.entries(porTipo).map(([tipo, kg]) => (
                              <div key={tipo} className="col-6 mb-2">
                                <strong>{tipo}:</strong> {kg.toFixed(1)} kg
                              </div>
                            ))}
                          </div>
                          <hr />
                          <h4 className="text-center mb-0">
                            <strong>TOTAL: {total.toFixed(1)} kg</strong>
                          </h4>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB EMPLEADOS */}
        {activeTab === 'empleados' && (
          <div className="row">
            <div className="col-lg-5">
              {/* CONFIGURAR EMPLEADO */}
              <div className="card mb-3">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Configurar Empleado</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Empleado:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formEmpleado.nombre}
                      onChange={(e) => setFormEmpleado({...formEmpleado, nombre: e.target.value})}
                    >
                      {EMPLEADOS_DEFAULT.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                      <option value="Otro">Otro...</option>
                    </select>
                  </div>

                  {formEmpleado.nombre === 'Otro' && (
                    <div className="mb-3">
                      <input 
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Nombre del empleado"
                        value={formEmpleado.nombreOtro}
                        onChange={(e) => setFormEmpleado({...formEmpleado, nombreOtro: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold">Sueldo Semanal:</label>
                    <input 
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="0"
                      value={formEmpleado.sueldoSemanal}
                      onChange={(e) => setFormEmpleado({...formEmpleado, sueldoSemanal: e.target.value})}
                    />
                  </div>

                  <button 
                    className="btn btn-success btn-lg w-100"
                    onClick={handleAgregarEmpleado}
                  >
                    ✅ Configurar
                  </button>
                </div>
              </div>

              {/* REGISTRAR ADELANTO */}
              <div className="card">
                <div className="card-header bg-warning">
                  <h5 className="mb-0">Registrar Adelanto</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Empleado:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formAdelanto.empleado}
                      onChange={(e) => setFormAdelanto({...formAdelanto, empleado: e.target.value})}
                    >
                      {semanaActiva?.empleados && semanaActiva.empleados.length > 0 ? (
                        semanaActiva.empleados.map(emp => (
                          <option key={emp.nombre} value={emp.nombre}>{emp.nombre}</option>
                        ))
                      ) : (
                        EMPLEADOS_DEFAULT.map(emp => (
                          <option key={emp} value={emp}>{emp}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Día:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formAdelanto.dia}
                      onChange={(e) => setFormAdelanto({...formAdelanto, dia: e.target.value})}
                    >
                      {DIAS_SEMANA.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Monto:</label>
                    <input 
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="0"
                      value={formAdelanto.monto}
                      onChange={(e) => setFormAdelanto({...formAdelanto, monto: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Descripción (opcional):</label>
                    <input 
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="ej: nafta, adelanto, etc."
                      value={formAdelanto.descripcion}
                      onChange={(e) => setFormAdelanto({...formAdelanto, descripcion: e.target.value})}
                    />
                  </div>

                  <button 
                    ref={botonAdelantoRef}
                    className="btn btn-warning btn-lg w-100"
                    onClick={handleAgregarAdelanto}
                  >
                    💵 Registrar Adelanto
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              {/* RESUMEN EMPLEADOS */}
              <div className="card mb-3" data-section="resumen-empleados">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">Resumen de Empleados</h5>
                </div>
                <div className="card-body">
                  {/* TOTAL GASTOS EN SUELDOS */}
                  {semanaActiva?.empleados && semanaActiva.empleados.length > 0 && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="card border-primary">
                          <div className="card-body text-center py-3">
                            <h6 className="text-muted mb-2">Gasto Total en Sueldos Semanales</h6>
                            <h3 className="text-primary mb-1">
                              <strong>{formatCurrency(semanaActiva.empleados.reduce((sum, emp) => sum + emp.sueldoSemanal, 0))}</strong>
                            </h3>
                            <small className="text-muted">
                              {semanaActiva.empleados.length} empleado{semanaActiva.empleados.length !== 1 ? 's' : ''} configurado{semanaActiva.empleados.length !== 1 ? 's' : ''}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!semanaActiva?.empleados || semanaActiva.empleados.length === 0 ? (
                    <p className="text-muted text-center">No hay empleados configurados</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Empleado</th>
                            <th>Sueldo Semanal</th>
                            <th>Adelantos</th>
                            <th>Debe Cobrar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semanaActiva.empleados.map((emp, index) => {
                            const deuda = calcularDeudaEmpleado(emp);
                            // Calcular total de adelantos correctamente
                            const adelantos = semanaActiva?.adelantos || [];
                            const totalAdelantos = adelantos
                              .filter(a => a.empleado === emp.nombre)
                              .reduce((sum, a) => sum + a.monto, 0);
                            const isEditing = editingSueldoId === emp.nombre;
                            
                            return (
                              <tr key={index}>
                                <td><strong>{emp.nombre}</strong></td>
                                <td>
                                  {isEditing ? (
                                    <div className="d-flex align-items-center gap-2">
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        style={{ width: '120px' }}
                                        value={tempSueldoValue}
                                        onChange={(e) => setTempSueldoValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            guardarSueldoEditado(emp);
                                          } else if (e.key === 'Escape') {
                                            cancelarEdicionSueldo();
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => guardarSueldoEditado(emp)}
                                        title="Guardar"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={cancelarEdicionSueldo}
                                        title="Cancelar"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <span
                                      onClick={() => iniciarEdicionSueldo(emp)}
                                      style={{ 
                                        cursor: 'pointer', 
                                        textDecoration: 'underline',
                                        color: '#0d6efd'
                                      }}
                                      title="Click para editar sueldo"
                                    >
                                      {formatCurrency(emp.sueldoSemanal)}
                                    </span>
                                  )}
                                </td>
                                <td className="text-danger">{formatCurrency(totalAdelantos)}</td>
                                <td className="text-success"><strong>{formatCurrency(deuda)}</strong></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* HISTORIAL DE ADELANTOS POR EMPLEADO */}
              <div className="card">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">Historial de Adelantos</h5>
                </div>
                <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {!semanaActiva?.adelantos || semanaActiva.adelantos.length === 0 ? (
                    <p className="text-muted text-center">No hay adelantos registrados</p>
                  ) : (
                    <div className="row">
                      {(() => {
                        // Agrupar adelantos por empleado
                        const adelantosPorEmpleado = {};
                        semanaActiva.adelantos.forEach((adelanto, index) => {
                          if (!adelantosPorEmpleado[adelanto.empleado]) {
                            adelantosPorEmpleado[adelanto.empleado] = [];
                          }
                          adelantosPorEmpleado[adelanto.empleado].push({ ...adelanto, originalIndex: index });
                        });

                        // Obtener lista de empleados que tienen adelantos
                        const empleadosConAdelantos = Object.keys(adelantosPorEmpleado);

                        return empleadosConAdelantos.map(empleado => {
                          // Calcular total de adelantos para este empleado
                          const totalAdelantos = adelantosPorEmpleado[empleado].reduce((sum, adelanto) => sum + adelanto.monto, 0);
                          
                          // Buscar el empleado en la lista para obtener su sueldo
                          const empleadoData = semanaActiva.empleados?.find(emp => emp.nombre === empleado);
                          const sueldoSemanal = empleadoData?.sueldoSemanal || 0;
                          
                          // Determinar si ya se alcanzó el pago total
                          const pagoCompleto = totalAdelantos >= sueldoSemanal;
                          
                          const isExpanded = empleadoExpandido === empleado;
                          
                          return (
                            <div key={empleado} className="col-lg-4 col-md-6 col-sm-6 mb-4">
                              <div 
                                className={`card card-transition smooth-hover ${pagoCompleto ? 'border-success' : 'border-warning'} ${isExpanded ? 'shadow card-expand' : ''}`}
                                style={{ 
                                  cursor: 'pointer',
                                  transform: isExpanded ? 'translateY(-2px)' : 'translateY(0)',
                                  position: 'relative'
                                }}
                                onClick={() => setEmpleadoExpandido(isExpanded ? null : empleado)}
                                onMouseEnter={() => handleMouseEnter(empleado)}
                                onMouseLeave={() => handleMouseLeave(empleado)}
                              >
                                {/* TOOLTIP */}
                                {tooltipVisible[empleado] && (
                                  <div 
                                    className="position-absolute fade-in"
                                    style={{
                                      top: '-40px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      backgroundColor: 'rgba(0,0,0,0.8)',
                                      color: 'white',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.8rem',
                                      whiteSpace: 'nowrap',
                                      zIndex: 1000,
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    {isExpanded ? 'Click para cerrar' : 'Click para expandir'}
                                    <div 
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderTop: '6px solid rgba(0,0,0,0.8)'
                                      }}
                                    ></div>
                                  </div>
                                )}
                                <div className={`card-header ${pagoCompleto ? 'bg-success' : 'bg-warning'} text-dark py-3`}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <h6 className="mb-2 fw-bold">
                                        {empleado}
                                        {pagoCompleto && <span className="ms-2">✅</span>}
                                      </h6>
                                      <button 
                                        className="btn btn-sm btn-light"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Evitar que se expanda la card
                                          handleImprimirEmpleado(empleado);
                                        }}
                                        title={`Imprimir comprobante de ${empleado}`}
                                        style={{ 
                                          fontSize: '0.7rem',
                                          padding: '4px 8px'
                                        }}
                                      >
                                        <i className="fas fa-print me-1"></i>
                                        Imprimir
                                      </button>
                                    </div>
                                    <div className="text-end">
                                      <div className="fw-bold small">
                                        {adelantosPorEmpleado[empleado].length} adelanto{adelantosPorEmpleado[empleado].length !== 1 ? 's' : ''}
                                      </div>
                                      <div className="fw-bold small" style={{ color: '#fff' }}>
                                        Total: {formatCurrency(totalAdelantos)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div 
                                  className="card-body p-3"
                                  style={{
                                    maxHeight: isExpanded ? '500px' : '0',
                                    overflow: 'hidden',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: isExpanded ? 1 : 0,
                                    padding: isExpanded ? '0.75rem' : '0'
                                  }}
                                >
                                  {isExpanded && adelantosPorEmpleado[empleado].map((adelanto, index) => (
                                    <div 
                                      key={index} 
                                      className="card mb-2 border-warning-subtle fade-in"
                                      style={{
                                        animationDelay: `${index * 0.05}s`
                                      }}
                                    >
                                      <div className="card-body py-2 px-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                          <div>
                                            <div className="fw-bold small">{adelanto.dia}</div>
                                            {adelanto.descripcion && (
                                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                {adelanto.descripcion}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-end">
                                            <div className="text-danger fw-bold small">
                                              {formatCurrency(adelanto.monto)}
                                            </div>
                                            <button 
                                              className="btn btn-sm btn-danger"
                                              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                              onClick={(e) => {
                                                e.stopPropagation(); // Evitar que se cierre la card
                                                eliminarAdelanto(adelanto.originalIndex);
                                              }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB GASTOS */}
        {activeTab === 'gastos' && (
          <div className="row">
            <div className="col-lg-5" data-tab="gastos">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Registrar Gasto</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Fecha:</label>
                    <input 
                      type="date"
                      className="form-control form-control-lg"
                      value={formGasto.fecha}
                      onChange={(e) => setFormGasto({...formGasto, fecha: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Descripción:</label>
                    <input 
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="ej: Luz, Gas, Repuestos, etc."
                      value={formGasto.descripcion}
                      onChange={(e) => setFormGasto({...formGasto, descripcion: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Monto:</label>
                    <input 
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="0"
                      value={formGasto.monto}
                      onChange={(e) => setFormGasto({...formGasto, monto: e.target.value})}
                    />
                  </div>

                  <button 
                    className="btn btn-success btn-lg w-100"
                    onClick={handleAgregarGasto}
                  >
                    ✅ Agregar Gasto
                  </button>
                </div>
              </div>

              {/* TOTAL GASTOS */}
              {semanaActiva?.gastos && semanaActiva.gastos.length > 0 && (
                <div className="card mt-3 border-danger">
                  <div className="card-body text-center">
                    <h3 className="mb-2">Total Gastos</h3>
                    <h1 className="text-danger mb-0">
                      <strong>{formatCurrency(calcularTotalGastos())}</strong>
                    </h1>
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-7">
              <div className="card">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">Lista de Gastos</h5>
                </div>
                <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {!semanaActiva?.gastos || semanaActiva.gastos.length === 0 ? (
                    <p className="text-muted text-center">No hay gastos registrados</p>
                  ) : (
                    <div className="row">
                      {semanaActiva.gastos.map((gasto, index) => (
                        <div key={index} className="col-lg-3 col-md-4 col-sm-6 mb-3">
                          <div className="card border-danger">
                            <div className="card-body p-2">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <small className="text-muted">
                                  {new Date(gasto.fecha).toLocaleDateString('es-AR')}
                                </small>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  style={{padding: '2px 6px', fontSize: '10px'}}
                                  onClick={() => eliminarGasto(index)}
                                >
                                  ✕
                                </button>
                              </div>
                              <h6 className="mb-1" style={{fontSize: '12px', lineHeight: '1.2'}}>
                                {gasto.descripcion}
                              </h6>
                              <div className="text-danger fw-bold" style={{fontSize: '14px'}}>
                                {formatCurrency(gasto.monto)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="row">
            <div className="col-lg-5" data-tab="clientes">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Registrar Boleta</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nombre del Cliente:</label>
                    <input 
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Nombre completo"
                      value={formCliente.nombre}
                      onChange={(e) => setFormCliente({...formCliente, nombre: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Día:</label>
                    <select 
                      className="form-select form-select-lg"
                      value={formCliente.dia}
                      onChange={(e) => setFormCliente({...formCliente, dia: e.target.value})}
                    >
                      {DIAS_SEMANA.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Monto de la Boleta:</label>
                    <input 
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="0"
                      value={formCliente.monto}
                      onChange={(e) => setFormCliente({...formCliente, monto: e.target.value})}
                    />
                  </div>

                  <button 
                    className="btn btn-success btn-lg w-100"
                    onClick={handleAgregarBoleta}
                  >
                    ✅ Agregar Boleta
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">Clientes con Cuenta Corriente</h5>
                </div>
                <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {!semanaActiva?.clientesCuenta || semanaActiva.clientesCuenta.length === 0 ? (
                    <p className="text-muted text-center">No hay clientes con cuenta</p>
                  ) : (
                    <div className="row">
                      {semanaActiva.clientesCuenta.map((cliente, clienteIndex) => {
                        const deuda = calcularDeudaCliente(cliente);
                        const isExpanded = expandedClientes[clienteIndex];
                        
                        return (
                          <div key={clienteIndex} className={`mb-3 card-transition ${editingClientes === clienteIndex ? 'col-12 card-expand' : 'col-lg-6 col-md-12'}`}>
                            <div 
                              className={`card border-primary h-100 ${editingClientes !== clienteIndex ? 'smooth-hover' : ''}`}
                              style={{ cursor: editingClientes === clienteIndex ? 'default' : 'pointer' }}
                              onClick={() => editingClientes === clienteIndex ? null : toggleExpandedClientes(clienteIndex)}
                            >
                              {!isExpanded ? (
                                // Versión compacta
                                <div className="card-body p-2 text-center">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0">
                                      <strong>{cliente.nombre}</strong>
                                    </h6>
                                    <button 
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Función para eliminar cliente completo
                                        // eliminarClienteCompleto(clienteIndex);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <h5 className="text-danger mb-1">
                                    <strong>{formatCurrency(deuda)}</strong>
                                  </h5>
                                  <small className="text-muted">
                                    {cliente.boletas.length} boletas
                                  </small>
                                </div>
                              ) : (
                                // Versión expandida
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      {editingClientes === clienteIndex ? (
                                        <input 
                                          type="text" 
                                          className="form-control form-control-sm" 
                                          style={{width: '200px'}}
                                          value={tempClientesData.nombre}
                                          onChange={(e) => setTempClientesData(prev => ({...prev, nombre: e.target.value}))}
                                        />
                                      ) : (
                                        <h6 className="mb-1">
                                          <strong>{cliente.nombre}</strong>
                                        </h6>
                                      )}
                                    </div>
                                    <div className="d-flex gap-1">
                                      {editingClientes === clienteIndex ? (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-success"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              saveEditingClientes(clienteIndex);
                                            }}
                                          >
                                            ✓
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              cancelEditingClientes();
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            className="btn btn-sm btn-warning"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingClientes(clienteIndex, cliente);
                                            }}
                                          >
                                            ✏️
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // eliminarClienteCompleto(clienteIndex);
                                            }}
                                          >
                                            🗑️
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mb-2">
                                    <span className="badge bg-danger fs-6">
                                      Debe: {editingClientes === clienteIndex ? 
                                        formatCurrency(tempClientesData.boletas?.reduce((sum, b) => sum + b.monto, 0) || 0) :
                                        formatCurrency(deuda)
                                      }
                                    </span>
                                  </div>
                                  
                                  {editingClientes === clienteIndex ? (
                                    // Modo edición
                                    <div className="fade-in">
                                      <table className="table table-sm mb-0">
                                        <thead>
                                          <tr>
                                            <th>Día</th>
                                            <th>Monto</th>
                                            <th></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {tempClientesData.boletas.map((boleta, i) => (
                                            <tr key={i}>
                                              <td>
                                                <select 
                                                  className="form-select form-select-sm" 
                                                  value={boleta.dia}
                                                  onChange={(e) => updateBoleta(i, 'dia', e.target.value)}
                                                >
                                                  {DIAS_SEMANA.map(dia => (
                                                    <option key={dia} value={dia}>{dia}</option>
                                                  ))}
                                                </select>
                                              </td>
                                              <td>
                                                <input 
                                                  type="number" 
                                                  className="form-control form-control-sm" 
                                                  value={boleta.monto}
                                                  onChange={(e) => updateBoleta(i, 'monto', parseFloat(e.target.value) || 0)}
                                                />
                                              </td>
                                              <td>
                                                <button 
                                                  className="btn btn-sm btn-danger"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    eliminarBoletaEnEdicion(i);
                                                  }}
                                                >
                                                  ✕
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      <button 
                                        className="btn btn-sm btn-outline-primary mt-2 w-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          agregarBoletaEnEdicion();
                                        }}
                                      >
                                        + Agregar Boleta
                                      </button>
                                    </div>
                                  ) : (
                                    // Modo lectura
                                    <div>
                                      <table className="table table-sm mb-0">
                                        <thead>
                                          <tr>
                                            <th>Día</th>
                                            <th className="text-end">Monto</th>
                                            <th></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {cliente.boletas.map((boleta, boletaIndex) => (
                                            <tr key={boletaIndex}>
                                              <td>{boleta.dia}</td>
                                              <td className="text-end">{formatCurrency(boleta.monto)}</td>
                                              <td>
                                                <button 
                                                  className="btn btn-sm btn-danger"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    eliminarBoletaCliente(cliente.nombre, boletaIndex);
                                                  }}
                                                >
                                                  ✕
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="row mt-4 mb-5">
        <div className="col-12">
          {/* BOTÓN BALANCE */}
          <div className="row mb-3">
            <div className="col-12 text-center">
              <button 
                className="btn btn-outline-primary btn-lg"
                style={{ fontSize: '1.2rem', padding: '12px 40px' }}
                onClick={irABalance}
              >
                📊 Ver Balance Semanal
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Modal de impresión */}
      {showPrintModal && printData && (
        <PrintDocument
          data={printData}
          type="empleado"
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
        />
      )}

      {/* Modal de confirmación para eliminar corte */}
      <ConfirmModal
        isOpen={showDeleteCorteModal}
        onClose={() => {
          setShowDeleteCorteModal(false);
          setCorteToDelete(null);
        }}
        onConfirm={eliminarCorteDeMercaderia}
        title="Eliminar Corte"
        message={`¿Estás seguro de que querés eliminar el corte "${corteToDelete?.corte?.corte}"?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonClass="btn-danger"
      />
      </div>
    </>
  );
}


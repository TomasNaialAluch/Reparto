import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';
import { useGestionSemanal } from '../firebase/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { styles } from '../components/gestionSemanal/styles';
import MercaderiaTab from '../components/gestionSemanal/MercaderiaTab';
import EmbutidosTab from '../components/gestionSemanal/EmbutidosTab';
import EmpleadosTab from '../components/gestionSemanal/EmpleadosTab';
import GastosTab from '../components/gestionSemanal/GastosTab';
import ClientesTab from '../components/gestionSemanal/ClientesTab';
import PagosProveedoresTab from '../components/gestionSemanal/PagosProveedoresTab';

const TAB_KEYS = ['mercaderia', 'embutidos', 'empleados', 'gastos', 'clientes', 'pagos-proveedores'];
const DEFAULT_TAB = TAB_KEYS[0];

const contentVariants = {
  initial: (dir) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir) => ({ x: dir * -40, opacity: 0 }),
};

export default function GestionSemanal() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  // Fuente de verdad en la URL (?tab=...) — así la FloatingNavbar puede leer
  // y cambiar el tab activo sin conocer el estado interno de esta página.
  // Ver README-NAVBAR-CONTEXTUAL.md.
  const activeTab = TAB_KEYS.includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : DEFAULT_TAB;
  const [tabDirection, setTabDirection] = useState(1);
  const prevTabIndexRef = useRef(Math.max(0, TAB_KEYS.indexOf(activeTab)));

  const {
    semanaActiva,
    loading,
    error,
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
    eliminarCliente,
    agregarPagoProveedor,
    eliminarPagoProveedor,
    guardarEstadoPagosProveedores,
    getConfiguracionesUsuario,
    guardarConfiguracionesUsuario
  } = useGestionSemanal(user?.uid);

  // Función para cambiar tab y hacer scroll si es necesario
  const handleTabChange = (tabName) => {
    const newIndex = TAB_KEYS.indexOf(tabName);
    const prevIndex = prevTabIndexRef.current;
    setTabDirection(newIndex >= prevIndex ? 1 : -1);
    prevTabIndexRef.current = newIndex;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabName);
        return next;
      },
      { replace: true }
    );

    // Scroll automático según el tab seleccionado
    setTimeout(() => {
      switch (tabName) {
        case 'mercaderia':
          const formMercaderia = document.querySelector('[data-tab="mercaderia"]');
          if (formMercaderia) {
            formMercaderia.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'embutidos':
          const formEmbutidos = document.querySelector('[data-tab="embutidos"]');
          if (formEmbutidos) {
            formEmbutidos.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'empleados':
          const resumenEmpleados = document.querySelector('[data-section="resumen-empleados"]');
          if (resumenEmpleados) {
            resumenEmpleados.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'gastos':
          const formGastos = document.querySelector('[data-tab="gastos"]');
          if (formGastos) {
            formGastos.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'clientes':
          const formClientes = document.querySelector('[data-tab="clientes"]');
          if (formClientes) {
            formClientes.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
          
        case 'pagos-proveedores':
          const formPagosProveedores = document.querySelector('[data-tab="pagos-proveedores"]');
          if (formPagosProveedores) {
            formPagosProveedores.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
          break;
      }
    }, 100);
  };

  const irABalance = () => {
    navigate('/balance');
  };

  // Calcular boletas sin marcar como pagadas (para badge en tab)
  const totalBoletas = semanaActiva?.mercaderia?.length || 0;
  const boletasPagadasCount = Object.values(
    semanaActiva?.pagosProveedoresEstado?.boletasPagadas || {}
  ).filter(Boolean).length;
  const boletasPendientes = Math.max(0, totalBoletas - boletasPagadasCount);

  const TABS = [
    {
      key: 'mercaderia', label: 'Mercadería',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
    {
      key: 'embutidos', label: 'Embutidos',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      ),
    },
    {
      key: 'empleados', label: 'Empleados',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      key: 'gastos', label: 'Gastos',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
          <line x1="6" y1="15" x2="10" y2="15"/>
        </svg>
      ),
    },
    {
      key: 'clientes', label: 'Clientes',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      key: 'pagos-proveedores', label: 'Pagos Proveedores', badge: boletasPendientes,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6A8899', animation: 'connectedPulse 1.4s infinite' }} />
        <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 500 }}>Cargando semana activa…</span>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="container-fluid mt-4 px-lg-5" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>
              Gestión Semanal
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#212529' }}>
              {semanaActiva
                ? `Semana iniciada el ${new Date(semanaActiva.fechaInicio).toLocaleDateString('es-AR')}`
                : 'Sin semana activa'}
            </div>
          </div>
          <button onClick={() => navigate('/balance')}
            style={{ border: '1px solid #6A8899', borderRadius: '10px', padding: '8px 16px', background: 'transparent', color: '#3a5060', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Ver Balance
          </button>
        </div>

        {/* Aviso sin semana activa */}
        {!semanaActiva && (
          <div style={{ borderLeft: '3px solid #FFD166', background: 'rgba(255,209,102,0.08)', borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: '16px', fontSize: '0.78rem', color: '#6c757d' }}>
            No hay semana activa. Los datos se guardarán automáticamente al agregar la primera entrada.
          </div>
        )}

        {/* Segmented tabs + contenido — fondo gris unificado */}
        <div style={{ background: '#e9ecef', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>

          {/* Tabs row */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '4px', width: 'max-content', minWidth: '100%' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                  style={{
                    flex: '1 0 auto',
                    border: 'none',
                    borderRadius: '9px',
                    padding: '9px 14px',
                    background: 'transparent',
                    boxShadow: 'none',
                    color: activeTab === tab.key ? '#212529' : '#6c757d',
                    fontWeight: activeTab === tab.key ? 700 : 400,
                    fontSize: '0.78rem', cursor: 'pointer',
                    transition: 'color 0.2s, font-weight 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    whiteSpace: 'nowrap', position: 'relative',
                  }}>
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="tab-indicator"
                      style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '9px 9px 0 0', zIndex: 0 }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{tab.icon}</span>
                  <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span style={{ position: 'relative', zIndex: 1, background: '#FFD166', color: '#856404', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', lineHeight: 1.4 }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido tabs */}
          <div className="gs-content" style={{ background: 'white', borderRadius: '0 0 9px 9px', padding: '16px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
          {activeTab === 'mercaderia' && (
            <MercaderiaTab
              semanaActiva={semanaActiva}
              agregarMercaderia={agregarMercaderia}
              eliminarMercaderia={eliminarMercaderia}
              actualizarMercaderia={actualizarMercaderia}
              getConfiguracionesUsuario={getConfiguracionesUsuario}
              guardarConfiguracionesUsuario={guardarConfiguracionesUsuario}
              addNotification={addNotification}
              user={user}
            />
          )}
          {activeTab === 'embutidos' && (
            <EmbutidosTab
              semanaActiva={semanaActiva}
              agregarEmbutidos={agregarEmbutidos}
              eliminarEmbutidos={eliminarEmbutidos}
              actualizarEmbutidos={actualizarEmbutidos}
              getConfiguracionesUsuario={getConfiguracionesUsuario}
              guardarConfiguracionesUsuario={guardarConfiguracionesUsuario}
              addNotification={addNotification}
              user={user}
            />
          )}
          {activeTab === 'empleados' && (
            <EmpleadosTab
              semanaActiva={semanaActiva}
              gestionarEmpleado={gestionarEmpleado}
              agregarAdelanto={agregarAdelanto}
              eliminarAdelanto={eliminarAdelanto}
              addNotification={addNotification}
            />
          )}
          {activeTab === 'gastos' && (
            <GastosTab
              semanaActiva={semanaActiva}
              agregarGasto={agregarGasto}
              eliminarGasto={eliminarGasto}
              addNotification={addNotification}
            />
          )}
          {activeTab === 'clientes' && (
            <ClientesTab
              semanaActiva={semanaActiva}
              agregarBoletaCliente={agregarBoletaCliente}
              eliminarBoletaCliente={eliminarBoletaCliente}
              actualizarCliente={actualizarCliente}
              eliminarCliente={eliminarCliente}
              addNotification={addNotification}
            />
          )}
          {activeTab === 'pagos-proveedores' && (
            <PagosProveedoresTab
              semanaActiva={semanaActiva}
              agregarPagoProveedor={agregarPagoProveedor}
              eliminarPagoProveedor={eliminarPagoProveedor}
              guardarEstadoPagosProveedores={guardarEstadoPagosProveedores}
              addNotification={addNotification}
            />
          )}
          </motion.div>
          </AnimatePresence>
          </div>{/* fin contenido tabs */}
        </div>{/* fin wrapper gris */}

        {/* Botón balance al pie */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={irABalance}
            style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: '#6A8899', color: 'white', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#506878'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#6A8899'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Ver Balance Semanal
          </button>
        </div>
      </div>
    </>
  );
}

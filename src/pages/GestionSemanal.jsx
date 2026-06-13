import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function GestionSemanal() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('mercaderia');

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
    setActiveTab(tabName);
    
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
    { key: 'mercaderia',        label: 'Mercadería',         icon: '📦' },
    { key: 'embutidos',         label: 'Embutidos',          icon: '🌭' },
    { key: 'empleados',         label: 'Empleados',          icon: '👨‍💼' },
    { key: 'gastos',            label: 'Gastos',             icon: '💰' },
    { key: 'clientes',          label: 'Clientes',           icon: '🧾' },
    { key: 'pagos-proveedores', label: 'Pagos Proveedores',  icon: '💳', badge: boletasPendientes },
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

        {/* Segmented tabs — scroll horizontal en mobile */}
        <div style={{ overflowX: 'auto', marginBottom: '20px', paddingBottom: '2px' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#e9ecef', borderRadius: '12px', padding: '4px', width: 'max-content', minWidth: '100%' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                style={{
                  flex: '1 0 auto',
                  border: 'none', borderRadius: '9px',
                  padding: '9px 14px',
                  background: activeTab === tab.key ? 'white' : 'transparent',
                  boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.14)' : 'none',
                  color: activeTab === tab.key ? '#212529' : '#6c757d',
                  fontWeight: activeTab === tab.key ? 700 : 400,
                  fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  whiteSpace: 'nowrap', position: 'relative',
                }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{ background: '#FFD166', color: '#856404', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', lineHeight: 1.4 }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido tabs */}
        <div>
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
        </div>

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

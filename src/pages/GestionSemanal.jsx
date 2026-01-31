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
              <div style={{ width: '200px' }}></div>
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
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'pagos-proveedores' ? 'active' : ''}`}
            onClick={() => handleTabChange('pagos-proveedores')}
            style={{ fontWeight: 'bold', padding: '15px' }}
            title={boletasPendientes > 0 ? `${boletasPendientes} boleta(s) sin marcar como pagadas` : ''}
          >
            💳 Pagos a Proveedores
            {boletasPendientes > 0 && (
              <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.75rem' }}>
                {boletasPendientes}
              </span>
            )}
          </button>
        </li>
        </ul>

        {/* CONTENIDO DE LOS TABS */}
        <div className="tab-content">
        {activeTab === 'mercaderia' && (
          <MercaderiaTab
            semanaActiva={semanaActiva}
            agregarMercaderia={agregarMercaderia}
            eliminarMercaderia={eliminarMercaderia}
            actualizarMercaderia={actualizarMercaderia}
            addNotification={addNotification}
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

        {/* BOTONES DE ACCIÓN */}
        <div className="row mt-4 mb-5">
          <div className="col-12">
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
      </div>
    </>
  );
}

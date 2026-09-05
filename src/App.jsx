import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Navbar from './components/Navbar';
import NavbarAI from './components/NavbarAI';
import Login from './components/Login';
import { FabGeneral } from './components/fab';
import { FloatingNavbar } from './components/floatingNavbar';

// Pages
import Home from './pages/Home';
import HomeAI from './pages/HomeAI';
import MiReparto from './pages/MiReparto';
import SaldoClientes from './pages/SaldoClientes';
import Transferencias from './pages/Transferencias';
import Asistente from './pages/Asistente';
import GestionSemanal from './pages/GestionSemanal';
import Balance from './pages/Balance';
import Contador from './pages/Contador';
import ListaPrecios from './pages/ListaPrecios';
import PreciosClientes from './pages/PreciosClientes';
import DolarHoy from './pages/DolarHoy';
import GestionDeudas from './pages/GestionDeudas';
import LibroCheques from './pages/LibroCheques';
import Facturacion from './pages/Facturacion';
import TablasPrecios from './pages/TablasPrecios';

// Firebase Provider
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { PagosProveedoresProvider } from './contexts/PagosProveedoresContext';

// Espacio libre abajo para que el contenido no quede tapado por la FloatingNavbar
// (que es fixed + bottom). Ver src/components/floatingNavbar/.
const PAGE_BOTTOM_PADDING = '96px';

// Componente interno que usa el contexto
const AppContent = () => {
  const { user, loading, error } = useFirebase();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#FAFBFF' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  // Si hay error, mostrarlo
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#FAFBFF' }}>
        <div className="card p-4 text-center">
          <div className="text-danger mb-3">
            <i className="fas fa-exclamation-triangle fa-3x"></i>
          </div>
          <h4>Error de Conexión</h4>
          <p className="text-muted">{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!user) {
    return <Login />;
  }

  // Si está autenticado, mostrar la aplicación
  return (
    <PagosProveedoresProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home-ai" element={<HomeAI />} />
            <Route path="/mi-reparto" element={
              <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <MiReparto />
              </div>
            } />
            <Route path="/reparto" element={
              <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <MiReparto />
              </div>
            } />
            <Route path="/saldo-clientes" element={
              <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <SaldoClientes />
              </div>
            } />
          <Route path="/dolar" element={
            <div style={{ backgroundColor: '#F0F8FF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <DolarHoy />
            </div>
          } />
          <Route path="/transferencias" element={
            <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <Transferencias />
            </div>
          } />
          <Route path="/asistente" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <Asistente />
            </div>
          } />
          <Route path="/gestion-semanal" element={
            <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <GestionSemanal />
            </div>
          } />
          <Route path="/balance" element={
            <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <Balance />
            </div>
          } />
          <Route path="/contador" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <Contador />
            </div>
          } />
          <Route path="/lista-precios" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
              <Navbar />
              <ListaPrecios />
            </div>
          } />
          <Route path="/precios-clientes" element={
              <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <PreciosClientes />
              </div>
            } />
          <Route path="/gestion-deudas" element={
              <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <GestionDeudas />
              </div>
            } />
          <Route path="/libro-cheques" element={
              <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <LibroCheques />
              </div>
            } />
          <Route path="/facturacion" element={
              <div style={{ backgroundColor: 'rgba(106,136,153,0.08)', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <Facturacion />
              </div>
            } />
          <Route path="/tablas-precios" element={
              <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh', paddingBottom: PAGE_BOTTOM_PADDING }}>
                <Navbar />
                <TablasPrecios />
              </div>
            } />
        </Routes>
        <FloatingNavbar />
        <FabGeneral />
        </div>
      </Router>
    </PagosProveedoresProvider>
  );
};

// Componente principal que envuelve todo con el provider
function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

export default App;

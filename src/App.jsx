import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';

// Pages
import Home from './pages/Home';
import MiReparto from './pages/MiReparto';
import SaldoClientes from './pages/SaldoClientes';
import Transferencias from './pages/Transferencias';
import Asistente from './pages/Asistente';

// Firebase Provider
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';

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
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reparto" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh' }}>
              <Navbar />
              <MiReparto />
            </div>
          } />
          <Route path="/saldo-clientes" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh' }}>
              <Navbar />
              <SaldoClientes />
            </div>
          } />
          <Route path="/dolar" element={
            <div style={{ backgroundColor: '#F0F8FF', minHeight: '100vh' }}>
              <Navbar />
              <div className="container mt-4"><h1>Dólar Hoy - En construcción</h1></div>
            </div>
          } />
          <Route path="/transferencias" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh' }}>
              <Navbar />
              <Transferencias />
            </div>
          } />
          <Route path="/asistente" element={
            <div style={{ backgroundColor: '#FAFBFF', minHeight: '100vh' }}>
              <Navbar />
              <Asistente />
            </div>
          } />
        </Routes>
      </div>
    </Router>
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
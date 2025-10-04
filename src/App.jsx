import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import MiReparto from './pages/MiReparto';
import SaldoClientes from './pages/SaldoClientes';

// Firebase
import { initAuth } from './firebase/config';

function App() {
  useEffect(() => {
    // Inicializar autenticación anónima de Firebase
    initAuth();
  }, []);

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
            <div style={{ backgroundColor: '#F0F8FF', minHeight: '100vh' }}>
              <Navbar />
              <div className="container mt-4"><h1>Transferencias - En construcción</h1></div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
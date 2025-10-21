import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#17a2b8' }}>
      <div className="container">
        {/* Logo/Brand */}
        <Link className="navbar-brand text-white fw-bold" to="/">
          <i className="fas fa-chart-line me-2"></i>
          Mi Reparto
        </Link>
        
        {/* Toggle button para móviles */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Menu items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">
                <i className="fas fa-home me-1"></i>
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/mi-reparto">
                <i className="fas fa-list me-1"></i>
                Mi Reparto
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/transferencias">
                <i className="fas fa-exchange-alt me-1"></i>
                Transferencias
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/saldo-clientes">
                <i className="fas fa-users me-1"></i>
                Saldo Clientes
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/balance">
                <i className="fas fa-balance-scale me-1"></i>
                Balance
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/gestion-semanal">
                <i className="fas fa-calendar-week me-1"></i>
                Gestión Semanal
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/contador">
                <i className="fas fa-calculator me-1"></i>
                Contador
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/asistente">
                <i className="fas fa-robot me-1"></i>
                Asistente
              </Link>
            </li>
          </ul>
          
          {/* Home AI Button */}
          <div className="d-flex">
            <Link 
              className="btn btn-light text-primary fw-bold" 
              to="/home-ai"
              style={{ 
                backgroundColor: 'white',
                border: '2px solid white',
                borderRadius: '25px',
                padding: '8px 20px'
              }}
            >
              <i className="fas fa-brain me-2"></i>
              Home AI
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
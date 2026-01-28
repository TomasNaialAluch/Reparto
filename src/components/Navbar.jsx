import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav 
      className="navbar navbar-expand-lg main-navbar" 
      style={{ backgroundColor: '#A9D6E5' }}
    >
      <div className="container">
        {/* Menu items - Visible en desktop */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <Link 
                className="nav-link text-white fw-bold" 
                to="/" 
                style={{ 
                  fontSize: '1.2rem',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1rem'
                }}
              >
                <i className="fas fa-home me-2"></i>
                Inicio
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Botón siempre visible en mobile (fuera del collapse) */}
        <div className="d-lg-none mobile-nav-button">
          <Link 
            className="nav-link text-white fw-bold" 
            to="/" 
            style={{ 
              fontSize: '1.5rem',
              minHeight: '44px',
              minWidth: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              borderRadius: '8px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <i className="fas fa-home"></i>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
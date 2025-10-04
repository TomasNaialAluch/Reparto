import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Inicio' },
    { path: '/saldo-clientes', label: 'Saldo Clientes' },
    { path: '/reparto', label: 'Mi Reparto' },
    { path: '/dolar', label: 'DolarHoy' },
    { path: '/transferencias', label: 'Transferencias' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Cerrar menú al hacer clic fuera o en escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Offcanvas Menu - Estilo original */}
      <div 
        className={`offcanvas offcanvas-start no-print ${isMenuOpen ? 'show' : ''}`} 
        tabIndex="-1" 
        id="offcanvasMenu"
        style={{ 
          backgroundColor: '#fff',
          visibility: isMenuOpen ? 'visible' : 'hidden'
        }}
      >
        <div className="offcanvas-header" style={{ backgroundColor: '#A9D6E5', color: '#fff' }}>
          <h5 className="offcanvas-title" id="offcanvasMenuLabel">Menú</h5>
          <button 
            type="button" 
            className="btn-close text-reset" 
            onClick={() => setIsMenuOpen(false)}
            aria-label="Cerrar"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav nav-pills flex-column">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link 
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navbar - Estilo original */}
      <nav className="navbar navbar-expand-lg no-print" style={{ backgroundColor: '#A9D6E5' }}>
        <div className="container">
          <button 
            className="hamburger-btn me-2" 
            type="button" 
            onClick={() => setIsMenuOpen(true)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '0.5rem'
            }}
            aria-controls="offcanvasMenu"
          >
            <span 
              className="navbar-toggler-icon"
              style={{
                width: '30px',
                height: '30px',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundImage: `url("data:image/svg+xml;charset=utf8,%3Csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='rgba(255,255,255,1)' stroke-width='2' stroke-linecap='round' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E")`
              }}
            ></span>
          </button>
          <Link className="navbar-brand" to="#" style={{ color: '#fff', fontWeight: '700' }}>
            Mi Reparto
          </Link>
        </div>
      </nav>

      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="offcanvas-backdrop fade show" 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1040,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;

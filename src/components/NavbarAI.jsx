import React from 'react';

const NavbarAI = ({ onToggleChat, isChatOpen }) => {
  return (
    <nav 
      className="navbar navbar-expand-lg" 
      style={{ 
        backgroundColor: '#A9D6E5', 
        minHeight: '40px',
        position: 'relative',
        zIndex: 1000 // Alto z-index para que los dropdowns aparezcan por encima del contenido
      }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logo/Brand */}
        <div className="d-flex align-items-center">
          <h5 className="mb-0 text-dark fw-bold">
            <i className="fas fa-chart-line me-2"></i>
            Mi Reparto AI
          </h5>
        </div>
        
        {/* Botón Chat AI (como en Cursor) */}
        <div className="d-flex align-items-center">
          <button
            onClick={onToggleChat}
            style={{
              background: isChatOpen ? '#007bff' : 'transparent',
              border: '1px solid #007bff',
              borderRadius: '6px',
              padding: '6px 12px',
              color: isChatOpen ? '#fff' : '#007bff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isChatOpen) {
                e.target.style.backgroundColor = '#007bff';
                e.target.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isChatOpen) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#007bff';
              }
            }}
          >
            <i className="fas fa-robot"></i>
            <span>AI</span>
            {isChatOpen && <i className="fas fa-times"></i>}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarAI;
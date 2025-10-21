import React from 'react';
import MiddleNavbarAI from './MiddleNavbarAI';

const NavbarAI = ({ onToggleChat, isChatOpen }) => {
  return (
    <nav 
      className="navbar navbar-expand-lg" 
      style={{ 
        backgroundColor: '#A9D6E5', 
        minHeight: '50px',
        position: 'relative',
        zIndex: 1000 // Alto z-index para que los dropdowns aparezcan por encima del contenido
      }}
    >
      <div className="container-fluid">
        <div className="row w-100">
          {/* Parte Izquierda - Vacía */}
          <div className="col-4 d-flex align-items-center justify-content-start">
            {/* Vacía por ahora */}
          </div>
          
          {/* Parte Central - MiddleNavbarAI con las 4 cosas */}
          <div className="col-4 d-flex align-items-center justify-content-center">
            <MiddleNavbarAI 
              onToggleChat={onToggleChat}
              isChatOpen={isChatOpen}
            />
          </div>
          
          {/* Parte Derecha - Vacía */}
          <div className="col-4 d-flex align-items-center justify-content-end">
            {/* Vacía por ahora */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarAI;
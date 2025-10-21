import React from 'react';

const ContentAreaAI = ({ children, isChatOpen = false }) => {
  return (
    <div 
      className="flex-grow-1" 
      style={{ 
        backgroundColor: '#FAFBFF', // Mismo fondo que el resto de la app
        minHeight: 'calc(100vh - 80px)', // Se ajusta automáticamente cuando las barras crezcan
        padding: '20px 0',
        position: 'relative', // Para que los dropdowns puedan posicionarse correctamente
        zIndex: 1, // Menor que los dropdowns de las barras
        marginRight: isChatOpen ? '400px' : '0px', // Se achica cuando el chat está abierto
        transition: 'margin-right 0.3s ease' // Transición suave
      }}
    >
      <div className="container-fluid">
        {children}
      </div>
    </div>
  );
};

export default ContentAreaAI;

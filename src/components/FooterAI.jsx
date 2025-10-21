import React from 'react';

const FooterAI = () => {
  return (
    <footer 
      className="py-2" 
      style={{ 
        backgroundColor: '#A9D6E5', 
        minHeight: '40px',
        position: 'relative',
        zIndex: 1000 // Alto z-index para que los dropdowns aparezcan por encima del contenido
      }}
    >
      <div className="container-fluid">
        {/* Contenido vacío - se agregará después */}
        {/* Los dropdowns aquí tendrán z-index alto para aparecer por encima del ContentAreaAI */}
      </div>
    </footer>
  );
};

export default FooterAI;

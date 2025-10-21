import React, { useState } from 'react';
import NavbarAI from '../components/NavbarAI';
import FooterAI from '../components/FooterAI';
import ContentAreaAI from '../components/ContentAreaAI';
import ChatAI from '../components/ChatAI';

const HomeAI = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div 
      className="d-flex flex-column min-vh-100"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        backgroundColor: '#FAFBFF',
        color: '#333'
      }}
    >
      {/* Navbar superior */}
      <NavbarAI 
        onToggleChat={handleToggleChat}
        isChatOpen={isChatOpen}
      />
      
      {/* Área de contenido principal */}
      <ContentAreaAI isChatOpen={isChatOpen}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: '#333'
          }}>
            <i className="fas fa-robot me-3" style={{ color: '#A9D6E5' }}></i>
            Home AI
          </h1>
          <p style={{
            fontSize: '1.2rem',
            fontWeight: '300',
            marginBottom: '2rem',
            color: '#555'
          }}>
            Bienvenido al asistente inteligente de Mi Reparto
          </p>
          
          {/* Contenido placeholder - aquí irán los componentes que me digas */}
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #bbdefb',
              color: '#1976d2'
            }}>
              <i className="fas fa-info-circle me-2"></i>
              Los componentes específicos se agregarán próximamente
            </div>
          </div>
        </div>
      </ContentAreaAI>
      
      {/* Footer inferior */}
      <FooterAI />
      
      {/* Chat AI */}
      <ChatAI 
        isOpen={isChatOpen}
        onToggle={handleToggleChat}
      />
    </div>
  );
};

export default HomeAI;

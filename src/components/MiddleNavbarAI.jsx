import React from 'react';
import DollarAI from './DollarAI';
import WeatherAI from './WeatherAI';

const MiddleNavbarAI = ({ onToggleChat, isChatOpen }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      width: '100%',
      height: '50px',
      padding: '0 20px'
    }}>
      {/* Dólar */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <DollarAI />
      </div>
      
      {/* Separador vertical */}
      <div style={{ 
        width: '2px', 
        height: '40px', 
        backgroundColor: 'rgba(0,0,0,0.2)',
        margin: '0 20px',
        borderRadius: '1px',
        boxShadow: '0 0 2px rgba(0,0,0,0.1)'
      }}></div>
      
      {/* Clima */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <WeatherAI />
      </div>
      
      {/* Separador vertical */}
      <div style={{ 
        width: '2px', 
        height: '40px', 
        backgroundColor: 'rgba(0,0,0,0.2)',
        margin: '0 20px',
        borderRadius: '1px',
        boxShadow: '0 0 2px rgba(0,0,0,0.1)'
      }}></div>
      
      {/* Chat AI */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <button
          onClick={onToggleChat}
          onTouchStart={(e) => {
            // Solo prevenir si no es un evento pasivo
            if (e.cancelable) {
              e.preventDefault();
            }
            onToggleChat();
          }}
          style={{
            background: isChatOpen ? '#fff' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: isChatOpen ? '#A9D6E5' : '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: isChatOpen ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none',
            // Mejorar la accesibilidad táctil
            minHeight: '44px',
            minWidth: '44px',
            position: 'relative',
            zIndex: 10,
            // Asegurar que el botón sea clickeable
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isChatOpen) {
              e.target.style.backgroundColor = '#fff';
              e.target.style.color = '#A9D6E5';
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
              // Cambiar color del ícono y texto
              const icon = e.target.querySelector('i');
              const text = e.target.querySelector('span');
              if (icon) icon.style.color = '#A9D6E5';
              if (text) text.style.color = '#A9D6E5';
            }
          }}
          onMouseLeave={(e) => {
            if (!isChatOpen) {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#fff';
              e.target.style.boxShadow = 'none';
              // Restaurar color del ícono y texto
              const icon = e.target.querySelector('i');
              const text = e.target.querySelector('span');
              if (icon) icon.style.color = '#fff';
              if (text) text.style.color = '#fff';
            }
          }}
          onMouseDown={(e) => {
            if (!isChatOpen) {
              e.target.style.backgroundColor = '#A9D6E5';
              e.target.style.color = '#333';
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
              // Cambiar color del ícono y texto al hacer click
              const icon = e.target.querySelector('i');
              const text = e.target.querySelector('span');
              if (icon) icon.style.color = '#333';
              if (text) text.style.color = '#333';
            }
          }}
          onMouseUp={(e) => {
            if (!isChatOpen) {
              e.target.style.backgroundColor = '#fff';
              e.target.style.color = '#A9D6E5';
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
              // Restaurar color del ícono y texto
              const icon = e.target.querySelector('i');
              const text = e.target.querySelector('span');
              if (icon) icon.style.color = '#A9D6E5';
              if (text) text.style.color = '#A9D6E5';
            }
          }}
        >
          <i className="fas fa-brain" style={{ color: isChatOpen ? '#A9D6E5' : 'inherit' }}></i>
          <span style={{ color: isChatOpen ? '#A9D6E5' : 'inherit' }}>AI</span>
        </button>
      </div>
    </div>
  );
};

export default MiddleNavbarAI;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [hoverGestion, setHoverGestion] = useState(false);

  const menuItems = [
    { 
      path: '/reparto', 
      label: 'Mi Reparto'
    },
    { 
      path: '/saldo-clientes', 
      label: 'Saldo Clientes'
    },
    { 
      path: '/dolar', 
      label: 'DolarHoy'
    },
    { 
      path: '/transferencias', 
      label: 'Transferencias'
    },
    { 
      path: '/asistente', 
      label: 'Asistente'
    },
    { 
      path: '/gestion-semanal', 
      label: 'Gestión Semanal',
      submenu: { path: '/balance', label: 'Balance' }
    },
    { 
      path: '/contador', 
      label: 'Contador'
    }
  ];

  return (
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          backgroundColor: '#FAFBFF',
          color: '#333',
          height: '100vh',
          margin: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '1rem',
          color: '#333'
        }}>
          Bienvenido
        </h1>
        <p style={{
          fontSize: '1.2rem',
          fontWeight: '300',
          marginBottom: '2rem',
          color: '#555'
        }}>
          ¿Qué necesitas hacer hoy?
        </p>
        <div>
          {menuItems.map((item) => (
            <div 
              key={item.path} 
              style={{ 
                display: 'inline-block',
                position: 'relative',
                margin: '1rem',
                paddingBottom: item.submenu ? '3rem' : '0' // Espacio para el submenú
              }}
              onMouseEnter={() => item.submenu && setHoverGestion(true)}
              onMouseLeave={() => item.submenu && setHoverGestion(false)}
            >
              <Link
                to={item.path}
                style={{
                  textDecoration: 'none',
                  color: '#fff',
                  backgroundColor: '#A9D6E5',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  transition: 'background-color 0.3s ease, transform 0.3s ease',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#90C3D4';
                  e.target.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#A9D6E5';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {item.label}
              </Link>
              
              {/* Submenú que aparece en hover */}
              {item.submenu && hoverGestion && (
                <Link
                  to={item.submenu.path}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textDecoration: 'none',
                    color: '#fff',
                    backgroundColor: '#61a5c2',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    animation: 'fadeInDown 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4a8ba6';
                    e.target.style.transform = 'translateX(-50%) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#61a5c2';
                    e.target.style.transform = 'translateX(-50%) translateY(0)';
                  }}
                >
                  {item.submenu.label}
                </Link>
              )}
            </div>
          ))}
        </div>
        
        {/* Animación para el submenú */}
        <style>{`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Home;

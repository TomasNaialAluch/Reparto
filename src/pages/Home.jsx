import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [expandedGestion, setExpandedGestion] = useState(false);

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
      hasSubmenu: true,
      submenuItems: [
        { path: '/balance', label: 'Balance' }
      ]
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
        <div style={{ padding: '0 2rem' }}>
          {menuItems.map((item) => (
            <div 
              key={item.path} 
              style={{ 
                display: 'inline-block',
                margin: '1rem',
                position: 'relative',
                verticalAlign: 'top'
              }}
            >
              {/* Botón principal - siempre navega */}
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
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  display: 'inline-block',
                  cursor: 'pointer'
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

              {/* Botón separado para ver opciones */}
              {item.hasSubmenu && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => setExpandedGestion(!expandedGestion)}
                    style={{
                      background: 'transparent',
                      border: '2px solid #A9D6E5',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      color: '#A9D6E5',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#A9D6E5';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#A9D6E5';
                    }}
                  >
                    <span>{expandedGestion ? 'Ocultar opciones' : 'Ver opciones'}</span>
                    <span style={{
                      transform: expandedGestion ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}>
                      ▼
                    </span>
                  </button>
                </div>
              )}

              {/* Submenú */}
              {item.hasSubmenu && expandedGestion && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'slideDown 0.3s ease'
                }}>
                  {item.submenuItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      style={{
                        textDecoration: 'none',
                        color: '#fff',
                        backgroundColor: '#61a5c2',
                        padding: '0.7rem 1.5rem',
                        borderRadius: '6px',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#4a8ba6';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#61a5c2';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Animación CSS */}
        <style>{`
          @keyframes slideDown {
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

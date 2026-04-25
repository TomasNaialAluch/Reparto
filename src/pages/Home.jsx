import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

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
      path: '/transferencias', 
      label: 'Transferencias'
    },
    { 
      path: '/gestion-semanal', 
      label: 'Gestión Semanal',
      hasSubmenu: true,
      menuKey: 'gestion',
      submenuItems: [
        { path: '/balance', label: 'Balance' }
      ]
    },
    { 
      path: '#', 
      label: 'Herramientas',
      hasSubmenu: true,
      menuKey: 'herramientas',
      submenuItems: [
        { path: '/dolar', label: 'DolarHoy' },
        { path: '/asistente', label: 'Asistente' },
        { path: '/contador', label: 'Contador' },
        { path: '/lista-precios', label: 'Lista de Precios' },
        { path: '/precios-clientes', label: 'Precios Clientes' }
      ]
    },
    { 
      path: '#', 
      label: 'Gestión',
      hasSubmenu: true,
      menuKey: 'gestionMenu',
      submenuItems: [
        { path: '/gestion-deudas', label: '📋 Deudas' },
        { path: '/libro-cheques', label: '📒 Libro de Cheques' },
      ]
    }
  ];

  const homeAIButton = {
    path: '/home-ai',
    label: 'Home AI',
    isSpecial: true
  };

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
        <div className="home-menu-container" style={{ padding: '0 2rem' }}>
          {menuItems.map((item) => (
            <div 
              key={item.path} 
              className="home-menu-item"
              style={{ 
                display: 'inline-block',
                margin: '1rem',
                position: 'relative',
                verticalAlign: 'top'
              }}
            >
              {/* Botón principal - siempre igual, sin cambios de estilo al expandir */}
              {item.hasSubmenu && item.path === '#' ? (
                <div
                  style={{
                    textDecoration: 'none',
                    color: '#fff',
                    backgroundColor: '#A9D6E5',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    display: 'inline-block',
                    fontFamily: "'Montserrat', sans-serif"
                  }}
                >
                  {item.label}
                </div>
              ) : (
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
              )}

              {/* Botón separado para ver opciones (para todos los menús con submenú) */}
              {item.hasSubmenu && (
                <div className="home-ver-opciones-button" style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleMenu(item.menuKey)}
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
                    <span>{expandedMenus[item.menuKey] ? 'Ocultar opciones' : 'Ver opciones'}</span>
                    <span style={{
                      transform: expandedMenus[item.menuKey] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}>
                      ▼
                    </span>
                  </button>
                </div>
              )}

              {/* Submenú */}
              {item.hasSubmenu && expandedMenus[item.menuKey] && (
                <div className="home-submenu" style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'slideDown 0.3s ease',
                  zIndex: 10
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

        {/* Botón especial Home AI */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            to={homeAIButton.path}
            style={{
              textDecoration: 'none',
              color: '#fff',
              background: 'linear-gradient(135deg, #A9D6E5, #90C3D4)',
              padding: '1.2rem 3rem',
              borderRadius: '50px',
              fontSize: '1.6rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(169, 214, 229, 0.3)',
              display: 'inline-block',
              cursor: 'pointer',
              border: '3px solid transparent',
              backgroundClip: 'padding-box'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px) scale(1.05)';
              e.target.style.boxShadow = '0 10px 30px rgba(169, 214, 229, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 6px 20px rgba(169, 214, 229, 0.3)';
            }}
          >
            <i className="fas fa-brain me-3"></i>
            {homeAIButton.label}
            <i className="fas fa-arrow-right ms-3"></i>
          </Link>
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
          
          /* Estilos responsive para mobile */
          @media (max-width: 768px) {
            .home-menu-container {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              padding: 0 1rem !important;
            }
            
            .home-menu-item {
              display: block !important;
              width: 100% !important;
              max-width: 300px !important;
              margin: 0.75rem 0 !important;
              margin-bottom: 1.5rem !important;
            }
            
            .home-menu-item:last-child {
              margin-bottom: 1rem !important;
            }
            
            .home-ver-opciones-button {
              margin-top: 12px !important;
              margin-bottom: 8px !important;
            }
            
            .home-submenu {
              position: relative !important;
              top: auto !important;
              left: auto !important;
              transform: none !important;
              margin-top: 8px !important;
              width: 100% !important;
            }
            
            .home-submenu a {
              width: 100% !important;
              text-align: center !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Home;

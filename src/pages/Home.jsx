import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
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
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                color: '#fff',
                backgroundColor: '#A9D6E5',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '1rem',
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

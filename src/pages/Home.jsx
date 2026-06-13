import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/reparto',
    label: 'Mi Reparto',
    desc: 'Clientes del día y repartos guardados',
    icon: '🚚',
  },
  {
    path: '/saldo-clientes',
    label: 'Saldo Clientes',
    desc: 'Calculá y guardá saldos de clientes',
    icon: '⚖️',
  },
  {
    path: '/transferencias',
    label: 'Transferencias',
    desc: 'Transferencias vs boletas vendidas',
    icon: '💸',
  },
  {
    key: 'gestion-semanal',
    label: 'Gestión Semanal',
    desc: 'Gestión semanal y cierre de caja',
    icon: '📊',
    submenu: [
      { path: '/balance', label: 'Balance' },
    ],
  },
  {
    key: 'herramientas',
    label: 'Herramientas',
    desc: 'Dólar, asistente, precios y más',
    icon: '🛠️',
    submenu: [
      { path: '/dolar',           label: 'DolarHoy' },
      { path: '/asistente',       label: 'Asistente' },
      { path: '/contador',        label: 'Contador' },
      { path: '/lista-precios',   label: 'Lista de Precios' },
      { path: '/precios-clientes',label: 'Precios Clientes' },
    ],
  },
  {
    key: 'gestion',
    label: 'Gestión',
    desc: 'Deudas y libro de cheques',
    icon: '📋',
    submenu: [
      { path: '/gestion-deudas',  label: 'Deudas' },
      { path: '/libro-cheques',   label: 'Libro de Cheques' },
    ],
  },
];

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const NavCard = ({ item }) => {
  const [open, setOpen] = useState(false);
  const hasSubmenu = !!item.submenu;

  const cardStyle = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '14px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s, transform 0.2s',
  };

  const headerStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '16px 18px',
    cursor: hasSubmenu ? 'pointer' : 'default',
    userSelect: 'none',
    textDecoration: 'none',
    color: 'inherit',
  };

  const content = (
    <>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>
          {item.label}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.desc}
        </div>
      </div>
      {hasSubmenu && <ChevronIcon open={open} />}
      {!hasSubmenu && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </>
  );

  return (
    <div style={cardStyle}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

      {hasSubmenu ? (
        <div style={headerStyle} onClick={() => setOpen(o => !o)}>
          {content}
        </div>
      ) : (
        <Link to={item.path} style={headerStyle}>
          {content}
        </Link>
      )}

      {/* Submenú con max-height transition */}
      {hasSubmenu && (
        <div style={{
          maxHeight: open ? `${item.submenu.length * 52}px` : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1)',
        }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(0,0,0,0.1)' }}>
            {item.submenu.map(sub => (
              <Link key={sub.path} to={sub.path}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 12px 44px', textDecoration: 'none', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 500, transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}>
                {sub.label}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Home = () => (
  <div style={{
    fontFamily: "'Montserrat', sans-serif",
    backgroundImage: 'url(/fondo.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: '40px 20px',
  }}>
    {/* Overlay */}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 24, 32, 0.58)', backdropFilter: 'blur(1.5px)' }} />

    {/* Contenido */}
    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '8px' }}>
          Panel de control
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Mi Reparto
        </div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '6px', fontWeight: 400 }}>
          ¿Qué necesitás hacer hoy?
        </div>
      </div>

      {/* Grid de navegación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {NAV_ITEMS.map((item, i) => (
          <NavCard key={item.path || item.key || i} item={item} />
        ))}
      </div>

      {/* CTA Home AI */}
      <Link to="/home-ai"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', background: 'rgba(106,136,153,0.35)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(106,136,153,0.5)', borderRadius: '14px', padding: '14px 18px', transition: 'all 0.2s', color: 'white' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(106,136,153,0.55)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(106,136,153,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.3rem' }}>🤖</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Home AI</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginTop: '1px' }}>Asistente inteligente</div>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>

    <style>{`
      @media (max-width: 480px) {
        /* ya está en columna, nada extra necesario */
      }
    `}</style>
  </div>
);

export default Home;

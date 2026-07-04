import { IconReceipt, IconX } from '../../gestionSemanal/icons';

export default function FacturasTaskbar({ minimizadas, getLabel, onRestaurar, onCerrar }) {
  if (minimizadas.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
      maxWidth: '92vw', zIndex: 990,
    }}>
      {minimizadas.map(v => (
        <div key={v.key}
          onClick={() => onRestaurar(v.key)}
          className="d-inline-flex align-items-center gap-2"
          style={{
            padding: '8px 10px 8px 12px', borderRadius: '10px',
            border: '1px solid #d3d9de', background: 'white',
            boxShadow: '0 4px 14px rgba(0,0,0,0.14)', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600, color: '#212529',
          }}
        >
          <span style={{ display: 'flex', color: '#6A8899' }}><IconReceipt size={13} /></span>
          {getLabel(v)}
          <button
            onClick={(e) => { e.stopPropagation(); onCerrar(v.key); }}
            title="Cerrar"
            className="d-inline-flex align-items-center justify-content-center"
            style={{ width: '20px', height: '20px', border: 'none', borderRadius: '5px', background: 'rgba(220,53,69,0.1)', color: '#dc3545', cursor: 'pointer' }}
          >
            <IconX size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}

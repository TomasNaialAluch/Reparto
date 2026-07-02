import React from 'react';
import { motion } from 'framer-motion';
import { IconReceipt, IconUsers, IconBox } from '../gestionSemanal/icons';

export const TABS = [
  { key: 'facturacion', label: 'Facturación', Icon: IconReceipt },
  { key: 'clientes',    label: 'Clientes',    Icon: IconUsers },
  { key: 'productos',   label: 'Productos',   Icon: IconBox },
];

export default function Toolbar({ activeTab, setActiveTab }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '4px', width: 'max-content', minWidth: '100%' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              flex: '1 0 auto',
              border: 'none',
              borderRadius: activeTab === tab.key ? '9px 9px 0 0' : '9px',
              padding: '9px 14px',
              background: 'transparent',
              boxShadow: 'none',
              color: activeTab === tab.key ? '#212529' : '#6c757d',
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize: '0.78rem', cursor: 'pointer',
              transition: 'color 0.2s, font-weight 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              whiteSpace: 'nowrap', position: 'relative',
            }}>
            {activeTab === tab.key && (
              <motion.div
                layoutId="facturacion-tab-indicator"
                style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '9px 9px 0 0', zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex' }}><tab.Icon size={14} /></span>
            <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Toolbar, { TABS } from '../components/facturacion/Toolbar';
import FacturacionTab from '../components/facturacion/FacturacionTab';
import ClientesTab from '../components/facturacion/ClientesTab';
import ProductosTab from '../components/facturacion/ProductosTab';

const TAB_KEYS = TABS.map(t => t.key);

const contentVariants = {
  initial: (dir) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir) => ({ x: dir * -40, opacity: 0 }),
};

export default function Facturacion() {
  const [activeTab, setActiveTab] = useState('facturacion');
  const [tabDirection, setTabDirection] = useState(1);
  const prevTabIndexRef = useRef(0);

  const handleTabChange = (tabKey) => {
    const newIndex = TAB_KEYS.indexOf(tabKey);
    setTabDirection(newIndex >= prevTabIndexRef.current ? 1 : -1);
    prevTabIndexRef.current = newIndex;
    setActiveTab(tabKey);
  };

  return (
    <div className="container-fluid mt-4 px-lg-5" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '48px' }}>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>
          Facturación
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#212529' }}>
          Facturas, clientes y productos
        </div>
      </div>

      <div style={{ background: '#e9ecef', borderRadius: '12px', padding: '4px' }}>
        <Toolbar activeTab={activeTab} setActiveTab={handleTabChange} />

        <div style={{ background: 'white', borderRadius: '0 0 9px 9px', padding: '16px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={tabDirection}>
            <motion.div
              key={activeTab}
              custom={tabDirection}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {activeTab === 'facturacion' && <FacturacionTab />}
              {activeTab === 'clientes' && <ClientesTab />}
              {activeTab === 'productos' && <ProductosTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

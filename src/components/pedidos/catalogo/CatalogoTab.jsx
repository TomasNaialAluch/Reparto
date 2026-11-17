// Catálogo del bot: los datos que WhatsApp contesta solo (precios, promociones y preguntas frecuentes).
// Se carga acá, en Pedidos, y el bot lo lee. Diseño: README-PEDIDOS-BOT.md, secciones 4, 4 bis y 4 ter.
import { useState } from 'react';
import { getLocalDateString } from '../../../utils/date';
import { useCortes } from '../../../hooks/useCortes';
import { usePedidosFaq, usePedidosPrecios, usePedidosPromociones } from '../../../hooks/usePedidosCatalogos';
import { Nota, Segmentado } from './piezas';
import PreciosPanel from './PreciosPanel';
import PromocionesPanel from './PromocionesPanel';
import FaqPanel from './FaqPanel';

const SECCIONES = [
  { clave: 'precios', titulo: 'Precios' },
  { clave: 'promociones', titulo: 'Promociones' },
  { clave: 'faq', titulo: 'Preguntas frecuentes' },
];

const CatalogoTab = () => {
  const hoy = getLocalDateString();
  const [seccion, setSeccion] = useState('precios');
  const { activos, loading: cargandoCortes } = useCortes();
  const precios = usePedidosPrecios();
  const promos = usePedidosPromociones();
  const faq = usePedidosFaq();

  const error = precios.error || promos.error || faq.error;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Segmentado opciones={SECCIONES} valor={seccion} onCambiar={setSeccion} />

      {error && <Nota tipo="error">No se pudieron cargar los datos: {error}</Nota>}

      {seccion === 'precios' && (
        <PreciosPanel
          cortes={activos}
          cargandoCortes={cargandoCortes || precios.loading}
          precios={precios.precios}
          actualizado={precios.actualizado}
          onGuardar={precios.guardarPrecio}
        />
      )}

      {seccion === 'promociones' && (
        <PromocionesPanel
          hoy={hoy}
          promociones={promos.promociones}
          onGuardar={promos.guardarPromocion}
          onQuitar={promos.quitarPromocion}
          onActivar={promos.activar}
        />
      )}

      {seccion === 'faq' && (
        <FaqPanel
          faq={faq.faq}
          onGuardar={faq.guardarFaq}
          onQuitar={faq.quitarFaq}
          onActivar={faq.activar}
        />
      )}
    </div>
  );
};

export default CatalogoTab;

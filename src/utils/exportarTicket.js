// Exporta un ticket (nodo del DOM con estilos en línea) como imagen PNG, PDF o impresión.
// Sin dependencias: el nodo se rasteriza vía SVG <foreignObject> a un canvas y de ahí salen los tres formatos.

const ESCALA = 2;
const MARGEN = 20; // px alrededor del ticket

const nombreSeguro = (texto) => String(texto || 'comprobante')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'comprobante';

/** Rasteriza el nodo (sin la sombra) sobre fondo blanco. */
export const ticketACanvas = (nodo) => new Promise((resolve, reject) => {
  const ancho = Math.ceil(nodo.offsetWidth);
  const alto = Math.ceil(nodo.offsetHeight);
  const clon = nodo.cloneNode(true);
  clon.style.filter = 'none';
  clon.style.margin = '0';
  clon.style.width = `${ancho}px`;

  const w = ancho + MARGEN * 2;
  const h = alto + MARGEN * 2;
  const xhtml = new XMLSerializer().serializeToString(clon);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
    + `<foreignObject x="${MARGEN}" y="${MARGEN}" width="${ancho}" height="${alto}">`
    + `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div></foreignObject></svg>`;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * ESCALA;
    canvas.height = h * ESCALA;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(ESCALA, ESCALA);
    ctx.drawImage(img, 0, 0);
    resolve(canvas);
  };
  img.onerror = () => reject(new Error('No se pudo generar la imagen del comprobante'));
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

const canvasABlob = (canvas, tipo, calidad) => new Promise((resolve, reject) => {
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar el archivo'))), tipo, calidad);
});

const descargarBlob = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const descargarTicketPng = async (nodo, nombre) => {
  const blob = await canvasABlob(await ticketACanvas(nodo), 'image/png');
  descargarBlob(blob, `${nombreSeguro(nombre)}.png`);
};

/** PDF A4 con el ticket centrado arriba, como imagen JPEG embebida. */
export const descargarTicketPdf = async (nodo, nombre) => {
  const canvas = await ticketACanvas(nodo);
  const jpeg = new Uint8Array(await (await canvasABlob(canvas, 'image/jpeg', 0.95)).arrayBuffer());

  const pagAncho = 595;
  const pagAlto = 842;
  const margen = 40;
  const proporcion = canvas.height / canvas.width;
  let w = Math.min(canvas.width / ESCALA, pagAncho - margen * 2); // tamaño real del ticket, sin agrandarlo
  let h = w * proporcion;
  if (h > pagAlto - margen * 2) { h = pagAlto - margen * 2; w = h / proporcion; }
  const x = (pagAncho - w) / 2;
  const y = pagAlto - margen - h;

  const enc = new TextEncoder();
  const partes = [];
  const offsets = [];
  let largo = 0;
  const poner = (dato) => {
    const bytes = typeof dato === 'string' ? enc.encode(dato) : dato;
    partes.push(bytes);
    largo += bytes.length;
  };
  const objeto = (n, contenido) => {
    offsets[n] = largo;
    poner(`${n} 0 obj\n`);
    contenido();
    poner('\nendobj\n');
  };

  const flujo = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
  poner('%PDF-1.4\n');
  objeto(1, () => poner('<< /Type /Catalog /Pages 2 0 R >>'));
  objeto(2, () => poner('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  objeto(3, () => poner(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pagAncho} ${pagAlto}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`));
  objeto(4, () => poner(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`));
  objeto(5, () => {
    poner(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    poner(jpeg);
    poner('\nendstream');
  });
  const inicioXref = largo;
  poner('xref\n0 6\n0000000000 65535 f \n');
  for (let n = 1; n <= 5; n += 1) poner(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
  poner(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);

  descargarBlob(new Blob(partes, { type: 'application/pdf' }), `${nombreSeguro(nombre)}.pdf`);
};

/** Imprime el ticket desde un iframe oculto (sin ventanas emergentes). */
export const imprimirTicket = async (nodo, nombre) => {
  const src = (await ticketACanvas(nodo)).toDataURL('image/png');
  await new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html><head><title>${nombreSeguro(nombre)}</title>
      <style>@page{size:A4;margin:12mm}html,body{margin:0}img{display:block;margin:0 auto;max-width:100%;max-height:270mm;width:110mm}</style>
      </head><body><img alt="Comprobante"></body></html>`);
    doc.close();
    const img = doc.querySelector('img');
    img.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => { iframe.remove(); resolve(); }, 1000);
    };
    img.src = src;
  });
};

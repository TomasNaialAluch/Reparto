// Función para imprimir contenido personalizado
export const printContent = (content) => {
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  
  // HTML optimizado para impresión
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Impresión</title>
      <style>
        @page {
          margin: 1cm;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .print-content {
          max-height: 50vh;
          overflow: hidden;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 15px;
          font-size: 16px;
          font-weight: bold;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 11px;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .totals {
          border-top: 1px solid #000;
          padding-top: 8px;
          text-align: right;
        }
        
        .final-total {
          font-size: 13px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="print-content">
        ${content}
      </div>
    </body>
    </html>
  `;
  
  // Escribir el HTML y imprimir
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Esperar a que cargue y luego imprimir
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};

// Función específica para imprimir saldo de cliente
export const printSaldoCliente = (cliente) => {
  if (!cliente) return;
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };
  
  const parseCurrencyValue = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
    }
    return 0;
  };

  let content = `
    <h2>Resumen de Cuenta - ${cliente.clientName}</h2>
  `;

  // Boletas
  if (cliente.boletas && cliente.boletas.length > 0) {
    content += `
      <div style="margin-bottom: 10px;">
        <strong>Boletas:</strong>
        <div style="margin-left: 10px;">
    `;
    cliente.boletas.forEach(b => {
      content += `
        <div style="font-size: 11px;">
          ${formatDate(b.date)} - ${formatCurrency(parseCurrencyValue(b.amount))}
        </div>
      `;
    });
    content += `</div></div>`;
  }

  // Pagos
  if (cliente.efectivo && cliente.efectivo.length > 0) {
    content += `
      <div style="margin-bottom: 10px;">
        <strong>Pagos en Efectivo:</strong>
        <div style="margin-left: 10px;">
    `;
    cliente.efectivo.forEach(p => {
      content += `
        <div style="font-size: 11px;">
          ${formatDate(p.date)} - ${formatCurrency(parseCurrencyValue(p.amount))}
        </div>
      `;
    });
    content += `</div></div>`;
  }

  // Plata a Favor
  if (cliente.plataFavor && cliente.plataFavor.length > 0) {
    content += `
      <div style="margin-bottom: 10px;">
        <strong>Plata a Favor:</strong>
        <div style="margin-left: 10px;">
    `;
    cliente.plataFavor.forEach(p => {
      content += `
        <div style="font-size: 11px;">
          ${formatDate(p.date)} - ${formatCurrency(parseCurrencyValue(p.amount))}
        </div>
      `;
    });
    content += `</div></div>`;
  }

  // Saldo Final
  content += `
    <div style="border-top: 1px solid #000; padding-top: 8px; margin-top: 10px; text-align: center;">
      <strong style="font-size: 14px;">
        Saldo Final: ${formatCurrency(cliente.finalBalance || 0)}
      </strong>
    </div>
  `;

  printContent(content);
};

// Función específica para imprimir reparto
export const printReparto = (clientes, date) => {
  if (!clientes || clientes.length === 0) return;
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const subtotal = clientes.reduce((sum, cliente) => sum + (cliente.billAmount || 0), 0);
  const totalPendiente = clientes.reduce((sum, cliente) => {
    const pagado = cliente.paymentAmount || 0;
    return sum + (cliente.billAmount - pagado);
  }, 0);

  let content = `
    <h2>Clientes del Día - ${date}</h2>
    <table>
      <thead>
        <tr>
          <th>Cliente</th>
          <th style="text-align: right;">Monto</th>
        </tr>
      </thead>
      <tbody>
  `;

  clientes.forEach(cliente => {
    content += `
      <tr>
        <td>${cliente.clientName}</td>
        <td style="text-align: right;">${formatCurrency(cliente.billAmount)}</td>
      </tr>
    `;
  });

  content += `
      </tbody>
    </table>
    <div class="totals">
      <div style="margin-bottom: 2px;">
        <strong>Subtotal: ${formatCurrency(subtotal)}</strong>
      </div>
      <div class="final-total">
        Total Pendiente: ${formatCurrency(totalPendiente)}
      </div>
    </div>
  `;

  printContent(content);
};

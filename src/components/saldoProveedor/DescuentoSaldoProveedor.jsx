import React from 'react';
import { formatCurrency } from '../../utils/money';

/**
 * Componente para mostrar y gestionar descuentos por saldo a favor del proveedor
 * Muestra información del saldo disponible y permite aplicar/quitar descuentos
 */
const DescuentoSaldoProveedor = ({
  nombreProveedor,
  saldoAFavor,
  descuentoAplicado,
  tieneDescuento,
  onAplicarDescuento,
  onQuitarDescuento,
  totalBoletasSeleccionadas = 0
}) => {
  // Si no hay saldo a favor, no mostrar nada
  if (!saldoAFavor || saldoAFavor <= 0) {
    return null;
  }

  const totalConDescuento = Math.max(0, totalBoletasSeleccionadas - descuentoAplicado);

  return (
    <div className="alert alert-warning mb-3" style={{ borderLeft: '4px solid #ffc107' }}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="flex-grow-1">
          <h6 className="mb-1 fw-bold">
            <i className="fas fa-info-circle me-2"></i>
            Saldo a Favor Disponible
          </h6>
          <div className="mb-2">
            <small className="text-muted">
              Tienes un saldo a favor con <strong>{nombreProveedor}</strong> de:
            </small>
            <div className="fs-4 fw-bold text-success mt-1">
              {formatCurrency(saldoAFavor)}
            </div>
          </div>
        </div>
        {!tieneDescuento ? (
          <button
            className="btn btn-sm btn-success"
            onClick={() => onAplicarDescuento(nombreProveedor, saldoAFavor)}
            title="Aplicar descuento del saldo a favor"
          >
            <i className="fas fa-check me-1"></i>
            Aplicar Descuento
          </button>
        ) : (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => onQuitarDescuento(nombreProveedor)}
            title="Quitar descuento aplicado"
          >
            <i className="fas fa-times me-1"></i>
            Quitar Descuento
          </button>
        )}
      </div>

      {tieneDescuento && (
        <div className="mt-2 pt-2 border-top">
          <div className="row">
            <div className="col-md-6">
              <small className="text-muted d-block">Total boletas seleccionadas:</small>
              <div className="fw-bold">{formatCurrency(totalBoletasSeleccionadas)}</div>
            </div>
            <div className="col-md-6">
              <small className="text-muted d-block">Descuento aplicado:</small>
              <div className="fw-bold text-success">- {formatCurrency(descuentoAplicado)}</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-top">
            <small className="text-muted d-block">Total final a pagar:</small>
            <div className="fs-4 fw-bold text-primary">
              {formatCurrency(totalConDescuento)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DescuentoSaldoProveedor;

import { useState } from 'react';
import { formatCurrency } from '../../utils/money';
import { getLocalDateString } from '../../utils/date';

export default function GastosTab({ 
  semanaActiva, 
  agregarGasto, 
  eliminarGasto,
  addNotification 
}) {
  const [formGasto, setFormGasto] = useState({
    fecha: getLocalDateString(),
    descripcion: '',
    monto: ''
  });

  const handleAgregarGasto = async () => {
    try {
      if (!formGasto.descripcion || !formGasto.monto) {
        addNotification('Complete todos los campos', 'warning');
        return;
      }

      await agregarGasto({
        fecha: formGasto.fecha,
        descripcion: formGasto.descripcion,
        monto: parseFloat(formGasto.monto)
      });

      setFormGasto({
        fecha: getLocalDateString(),
        descripcion: '',
        monto: ''
      });

      addNotification('Gasto registrado', 'success');
    } catch (err) {
      addNotification('Error al registrar gasto', 'error');
    }
  };

  const calcularTotalGastos = () => {
    if (!semanaActiva?.gastos) return 0;
    return semanaActiva.gastos.reduce((sum, g) => sum + g.monto, 0);
  };

  return (
    <div className="row">
      <div className="col-lg-5" data-tab="gastos">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Registrar Gasto</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Fecha:</label>
              <input 
                type="date"
                className="form-control form-control-lg"
                value={formGasto.fecha}
                onChange={(e) => setFormGasto({...formGasto, fecha: e.target.value})}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Descripción:</label>
              <input 
                type="text"
                className="form-control form-control-lg"
                placeholder="ej: Luz, Gas, Repuestos, etc."
                value={formGasto.descripcion}
                onChange={(e) => setFormGasto({...formGasto, descripcion: e.target.value})}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Monto:</label>
              <input 
                type="number"
                className="form-control form-control-lg"
                placeholder="0"
                value={formGasto.monto}
                onChange={(e) => setFormGasto({...formGasto, monto: e.target.value})}
              />
            </div>

            <button 
              className="btn btn-success btn-lg w-100"
              onClick={handleAgregarGasto}
            >
              ✅ Agregar Gasto
            </button>
          </div>
        </div>

        {semanaActiva?.gastos && semanaActiva.gastos.length > 0 && (
          <div className="card mt-3 border-danger">
            <div className="card-body text-center">
              <h3 className="mb-2">Total Gastos</h3>
              <h1 className="text-danger mb-0">
                <strong>{formatCurrency(calcularTotalGastos())}</strong>
              </h1>
            </div>
          </div>
        )}
      </div>

      <div className="col-lg-7">
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Lista de Gastos</h5>
          </div>
          <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {!semanaActiva?.gastos || semanaActiva.gastos.length === 0 ? (
              <p className="text-muted text-center">No hay gastos registrados</p>
            ) : (
              <div className="row">
                {semanaActiva.gastos.map((gasto, index) => (
                  <div key={index} className="col-lg-3 col-md-4 col-sm-6 mb-3">
                    <div className="card border-danger">
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <small className="text-muted">
                            {new Date(gasto.fecha).toLocaleDateString('es-AR')}
                          </small>
                          <button 
                            className="btn btn-sm btn-danger"
                            style={{padding: '2px 6px', fontSize: '10px'}}
                            onClick={() => eliminarGasto(index)}
                          >
                            ✕
                          </button>
                        </div>
                        <h6 className="mb-1" style={{fontSize: '12px', lineHeight: '1.2'}}>
                          {gasto.descripcion}
                        </h6>
                        <div className="text-danger fw-bold" style={{fontSize: '14px'}}>
                          {formatCurrency(gasto.monto)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


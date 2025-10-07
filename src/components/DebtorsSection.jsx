import React, { useState, useMemo } from 'react';

const DebtorsSection = ({ repartos, formatCurrency }) => {
  const [isVisible, setIsVisible] = useState(false);

  const debtors = useMemo(() => {
    return repartos
      .filter(reparto => {
        const billAmount = reparto.billAmount || 0;
        const paymentAmount = reparto.paymentAmount || 0;
        return (billAmount - paymentAmount) > 0;
      })
      .map(reparto => ({
        name: reparto.clientName,
        debt: (reparto.billAmount || 0) - (reparto.paymentAmount || 0)
      }));
  }, [repartos]);

  const toggleVisibility = () => {
    if (!isVisible && debtors.length === 0) {
      alert("No hay deudores.");
      return;
    }
    setIsVisible(!isVisible);
  };

  return (
    <div className="card p-4 no-print">
      <button 
        className="btn btn-warning" 
        onClick={toggleVisibility}
      >
        {isVisible ? 'Ocultar Deudores' : 'Ver Deudores'}
      </button>
      
      {isVisible && (
        <div className="mt-3">
          <h3>Lista de Deudores</h3>
          {debtors.length > 0 ? (
            <ul className="list-group">
              {debtors.map((debtor, index) => (
                <li key={index} className="list-group-item">
                  {debtor.name} debe {formatCurrency(debtor.debt)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No hay deudores pendientes.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DebtorsSection;



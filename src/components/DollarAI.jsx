import React, { useState, useEffect } from 'react';

const DollarAI = () => {
  const [dollarData, setDollarData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener datos reales del dólar
  useEffect(() => {
    const fetchDollar = async () => {
      try {
        // API gratuita del dólar argentino
        const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await response.json();
        
        if (data && data.oficial && data.mep) {
          setDollarData({
            oficial: {
              compra: data.oficial.value_buy,
              venta: data.oficial.value_sell,
              variacion: data.oficial.value_sell > data.oficial.value_buy ? 
                `+${((data.oficial.value_sell - data.oficial.value_buy) / data.oficial.value_buy * 100).toFixed(1)}%` : 
                `${((data.oficial.value_sell - data.oficial.value_buy) / data.oficial.value_buy * 100).toFixed(1)}%`
            },
            mep: {
              compra: data.mep.value_buy,
              venta: data.mep.value_sell,
              variacion: data.mep.value_sell > data.mep.value_buy ? 
                `+${((data.mep.value_sell - data.mep.value_buy) / data.mep.value_buy * 100).toFixed(1)}%` : 
                `${((data.mep.value_sell - data.mep.value_buy) / data.mep.value_buy * 100).toFixed(1)}%`
            }
          });
        } else {
          // Fallback con datos simulados si la API falla
          setDollarData({
            oficial: {
              compra: 850.50,
              venta: 870.25,
              variacion: '+2.5%'
            },
            mep: {
              compra: 920.00,
              venta: 940.00,
              variacion: '+0.9%'
            }
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dollar data:', error);
        // Fallback con datos simulados
        setDollarData({
          oficial: {
            compra: 850.50,
            venta: 870.25,
            variacion: '+2.5%'
          },
          mep: {
            compra: 920.00,
            venta: 940.00,
            variacion: '+0.9%'
          }
        });
        setLoading(false);
      }
    };

    fetchDollar();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDollar, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid #A9D6E5',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <span style={{ color: '#333', fontSize: '14px' }}>Cargando cotización...</span>
      </div>
    );
  }

  if (!dollarData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-dollar-sign" style={{ color: '#A9D6E5', fontSize: '16px' }}></i>
        <span style={{ color: '#666', fontSize: '14px' }}>Cotización no disponible</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      {/* Dólar Oficial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-dollar-sign" style={{ color: '#28a745', fontSize: '16px' }}></i>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
            Oficial: ${dollarData.oficial.venta}
          </div>
          <div style={{ fontSize: '11px', color: '#28a745' }}>
            {dollarData.oficial.variacion}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div style={{ width: '1px', height: '30px', backgroundColor: '#ddd' }}></div>

      {/* Dólar MEP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-exchange-alt" style={{ color: '#17a2b8', fontSize: '16px' }}></i>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
            MEP: ${dollarData.mep.venta}
          </div>
          <div style={{ fontSize: '11px', color: '#17a2b8' }}>
            {dollarData.mep.variacion}
          </div>
        </div>
      </div>

      {/* Estilos CSS para animación */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DollarAI;

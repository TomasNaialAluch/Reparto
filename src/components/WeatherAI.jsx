import React, { useState, useEffect } from 'react';

const WeatherAI = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simular datos del clima (aquí irá la integración real con API del clima)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos simulados del clima en CABA
        setWeather({
          city: 'Buenos Aires',
          temperature: 28,
          condition: 'Parcialmente nublado',
          humidity: 65,
          wind: 12,
          forecast: [
            { day: 'Hoy', high: 28, low: 18, condition: 'Parcialmente nublado' },
            { day: 'Mañana', high: 30, low: 20, condition: 'Soleado' },
            { day: 'Miér', high: 26, low: 16, condition: 'Lluvia' },
            { day: 'Jue', high: 24, low: 14, condition: 'Nublado' },
            { day: 'Vie', high: 27, low: 17, condition: 'Soleado' }
          ]
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid #A9D6E5',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <span style={{ color: '#333', fontSize: '14px' }}>Cargando clima...</span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-cloud" style={{ color: '#A9D6E5', fontSize: '16px' }}></i>
        <span style={{ color: '#666', fontSize: '14px' }}>Clima no disponible</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Clima actual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-sun" style={{ color: '#ffa726', fontSize: '18px' }}></i>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {weather.temperature}°C
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {weather.condition}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div style={{ width: '1px', height: '30px', backgroundColor: '#ddd' }}></div>

      {/* Pronóstico de la semana */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {weather.forecast.slice(0, 3).map((day, index) => (
          <div 
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px 6px',
              borderRadius: '4px',
              backgroundColor: index === 0 ? '#e3f2fd' : 'transparent',
              minWidth: '40px'
            }}
          >
            <div style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>
              {day.day}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
              {day.high}°
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {day.low}°
            </div>
          </div>
        ))}
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

export default WeatherAI;

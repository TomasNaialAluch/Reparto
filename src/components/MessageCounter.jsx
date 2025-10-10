import React, { useState, useEffect } from 'react';
import { useAsistenteUsage } from '../firebase/hooks';

const MessageCounter = ({ userId = 'default_user' }) => {
  const { getCurrentMonthUsage, getDaysUntilReset } = useAsistenteUsage();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const currentUsage = await getCurrentMonthUsage(userId);
        setUsage(currentUsage);
      } catch (error) {
        console.error('Error cargando uso:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [getCurrentMonthUsage, userId]);

  if (loading) {
    return (
      <div className="card mt-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            <small className="text-muted">Cargando contador...</small>
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const daysUntilReset = getDaysUntilReset();
  const percentage = (usage.messageCount / usage.maxMessages) * 100;
  const remaining = usage.maxMessages - usage.messageCount;
  
  // Determinar color según el uso
  let statusColor = 'success';
  let statusText = 'Disponible';
  
  if (percentage >= 80) {
    statusColor = 'warning';
    statusText = 'Casi al límite';
  }
  if (percentage >= 95) {
    statusColor = 'danger';
    statusText = 'Límite alcanzado';
  }

  return (
    <div className="card mt-3">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Uso del mes
          </h6>
          <span className={`badge bg-${statusColor}`}>
            {statusText}
          </span>
        </div>
        
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              {usage.messageCount} / {usage.maxMessages} mensajes
            </span>
            <span className="small text-muted">
              {remaining} restantes
            </span>
          </div>
          
          <div className="progress mt-1" style={{ height: '6px' }}>
            <div 
              className={`progress-bar bg-${statusColor}`}
              role="progressbar"
              style={{ width: `${Math.min(percentage, 100)}%` }}
              aria-valuenow={usage.messageCount}
              aria-valuemin="0"
              aria-valuemax={usage.maxMessages}
            ></div>
          </div>
        </div>
        
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            <i className="fas fa-calendar-alt me-1"></i>
            Reset en {daysUntilReset} días
          </small>
          <small className="text-muted">
            <i className="fas fa-sync-alt me-1"></i>
            {usage.monthId}
          </small>
        </div>
      </div>
    </div>
  );
};

export default MessageCounter;

import React, { useState, useEffect } from 'react';

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Esperar animación
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getNotificationStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      opacity: isVisible ? 1 : 0,
      fontSize: '14px',
      fontWeight: '500'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#d4edda',
          color: '#155724',
          borderLeft: '4px solid #28a745'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderLeft: '4px solid #dc3545'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderLeft: '4px solid #ffc107'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          borderLeft: '4px solid #17a2b8'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div style={getNotificationStyle()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getIcon()}</span>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '8px',
            color: 'inherit',
            opacity: 0.7
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;



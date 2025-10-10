import React, { useEffect } from 'react';

const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '400px'
      }}
    >
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onRemove }) => {
  const { id, message, type, duration } = notification;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(),
        color: '#fff',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-out ' + (duration - 300) + 'ms forwards',
        minWidth: '300px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{getIcon()}</span>
        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{message}</span>
      </div>
      <button
        onClick={() => onRemove(id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '1.3rem',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '10px',
          opacity: '0.8',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
      >
        ×
      </button>
      
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            transform: translateX(400px);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationContainer;


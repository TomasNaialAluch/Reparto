import React, { useState, useRef } from 'react';

const WindowAI = ({ 
  id, 
  title, 
  children, 
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  isMinimized = false,
  onMinimize,
  onMaximize,
  onClose,
  zIndex = 1
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.window-controls')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleResizeMouseMove = (e) => {
    if (isResizing) {
      const newWidth = Math.max(200, size.width + (e.clientX - dragStart.x));
      const newHeight = Math.max(150, size.height + (e.clientY - dragStart.y));
      
      setSize({ width: newWidth, height: newHeight });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMouseMove);
      document.addEventListener('mouseup', isDragging ? handleMouseUp : handleResizeMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMouseMove);
        document.removeEventListener('mouseup', isDragging ? handleMouseUp : handleResizeMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: `${10 + (id * 120)}px`,
          width: '100px',
          height: '30px',
          backgroundColor: '#2d2d2d',
          border: '1px solid #444',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          cursor: 'pointer',
          zIndex: 1000 + id,
          fontSize: '12px',
          color: '#fff'
        }}
        onClick={onMinimize}
      >
        <span>{title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000 + zIndex,
        userSelect: 'none'
      }}
    >
      {/* Header */}
      <div
        className="window-header"
        style={{
          backgroundColor: '#2d2d2d',
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move'
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff5f57'
            }}
          ></div>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ffbd2e'
            }}
          ></div>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#28ca42'
            }}
          ></div>
        </div>
        
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
          {title}
        </div>
        
        <div className="window-controls" style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onMinimize}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '2px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            −
          </button>
          <button
            onClick={onMaximize}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '2px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            □
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '2px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#fff'
        }}
      >
        {children}
      </div>

      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'nw-resize',
          background: 'linear-gradient(-45deg, transparent 30%, #444 30%, #444 50%, transparent 50%)'
        }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default WindowAI;

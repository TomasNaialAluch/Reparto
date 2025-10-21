import React, { useState, useRef, useEffect } from 'react';

const ChatAI = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '¡Hola! Soy tu asistente de Mi Reparto. Puedo ayudarte a gestionar facturas, ingresar mercadería, calcular balances y mucho más. ¿En qué puedo asistirte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simular respuesta de IA (aquí irá la integración real)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Entendido: "${inputMessage}". Procesando tu solicitud...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`chat-container ${isOpen ? 'open' : 'closed'}`}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: isOpen ? '400px' : '0px',
        backgroundColor: '#FAFBFF',
        borderLeft: '2px solid #A9D6E5',
        transition: 'width 0.3s ease',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header del Chat */}
      <div 
        className="chat-header"
        style={{
          padding: '16px 20px',
          borderBottom: '2px solid #A9D6E5',
          backgroundColor: '#A9D6E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
          <i className="fas fa-brain" style={{ color: '#fff', fontSize: '18px' }}></i>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>AI</span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
      </div>

      {/* Mensajes */}
      <div 
        className="chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: message.type === 'user' ? '#007bff' : '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              {message.type === 'user' ? 'U' : 'AI'}
            </div>

            {/* Mensaje */}
            <div
              style={{
                maxWidth: '80%',
                backgroundColor: message.type === 'user' ? '#A9D6E5' : '#fff',
                color: message.type === 'user' ? '#333' : '#333',
                padding: '12px 16px',
                borderRadius: '18px',
                fontSize: '14px',
                lineHeight: '1.4',
                wordWrap: 'break-word'
              }}
            >
              <div>{message.content}</div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px',
                  textAlign: message.type === 'user' ? 'right' : 'left'
                }}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de escritura */}
        {isTyping && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              AI
            </div>
            <div
              style={{
                backgroundColor: '#fff',
                color: '#333',
                padding: '12px 16px',
                borderRadius: '18px',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#A9D6E5',
                    animation: 'typing 1.4s infinite ease-in-out'
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#A9D6E5',
                    animation: 'typing 1.4s infinite ease-in-out 0.2s'
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#A9D6E5',
                    animation: 'typing 1.4s infinite ease-in-out 0.4s'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="chat-input"
        style={{
          padding: '16px 20px',
          borderTop: '2px solid #A9D6E5',
          backgroundColor: '#A9D6E5'
        }}
      >
        <form onSubmit={handleSendMessage}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1,
                backgroundColor: '#fff',
                border: '2px solid #A9D6E5',
                borderRadius: '20px',
                padding: '12px 16px',
                color: '#333',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#A9D6E5'}
              onBlur={(e) => e.target.style.borderColor = '#A9D6E5'}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                backgroundColor: inputMessage.trim() ? '#A9D6E5' : '#ccc',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: '#333',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              ➤
            </button>
          </div>
        </form>
      </div>

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatAI;

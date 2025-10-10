import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/NotificationContainer';
import { generateMessage } from '../config/gemini';

const Asistente = () => {
  const [userInput, setUserInput] = useState('');
  const [destinatario, setDestinatario] = useState('cliente');
  const [tono, setTono] = useState('amigable');
  const [contexto, setContexto] = useState('cobro');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);

  // Notificaciones
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  // Opciones para los selects
  const destinatarios = [
    { value: 'cliente', label: 'Cliente' },
    { value: 'proveedor', label: 'Proveedor' },
    { value: 'otro', label: 'Otro' }
  ];

  const tonos = [
    { value: 'formal', label: 'Formal' },
    { value: 'amigable', label: 'Amigable' },
    { value: 'directo', label: 'Directo' },
    { value: 'cortes', label: 'Cortés' }
  ];

  const contextos = [
    { value: 'cobro', label: 'Cobro' },
    { value: 'entrega', label: 'Entrega' },
    { value: 'consulta', label: 'Consulta' },
    { value: 'reclamo', label: 'Reclamo' },
    { value: 'otro', label: 'Otro' }
  ];

  // Función para generar mensaje con Gemini AI
  const handleGenerateMessage = async () => {
    if (!userInput.trim()) {
      showError('Por favor describe qué mensaje quieres escribir');
      return;
    }

    // Verificar si hay API key configurada
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') {
      showError('⚠️ API Key de Gemini no configurada. Por favor configura VITE_GEMINI_API_KEY en tu archivo .env');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Llamar a Gemini AI
      const aiMessage = await generateMessage(userInput, destinatario, tono, contexto);
      
      setGeneratedMessage(aiMessage);
      
      // Agregar al historial
      const newHistoryItem = {
        id: Date.now(),
        input: userInput,
        destinatario,
        tono,
        contexto,
        message: aiMessage,
        timestamp: new Date().toLocaleString('es-AR')
      };
      
      setMessageHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]); // Mantener solo 5
      showSuccess('✓ Mensaje generado con IA exitosamente');
      
    } catch (error) {
      console.error('Error generando mensaje:', error);
      showError(`Error al generar el mensaje: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      showSuccess('✓ Mensaje copiado al portapapeles');
    } catch (error) {
      showError('Error al copiar el mensaje');
    }
  };

  // Función para limpiar formulario
  const clearForm = () => {
    setUserInput('');
    setGeneratedMessage('');
    setDestinatario('cliente');
    setTono('amigable');
    setContexto('cobro');
  };

  // Función para regenerar mensaje
  const regenerateMessage = () => {
    if (userInput.trim()) {
      handleGenerateMessage();
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Panel Izquierdo - Input */}
        <div className="col-lg-6">
          <div className="card p-4">
            <h4 className="mb-4">
              <i className="fas fa-robot me-2 text-primary"></i>
              Asistente de Mensajes
            </h4>
            <p className="text-muted mb-4">
              Describe qué mensaje quieres escribir y el asistente te ayudará a redactarlo de forma profesional.
            </p>
            
            {/* Información sobre configuración */}
            {(!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') && (
              <div className="alert alert-warning mb-4">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Configuración requerida:</strong> Para usar el asistente con IA, necesitas configurar tu API Key de Gemini en el archivo <code>.env</code>
              </div>
            )}

            {/* Campo de texto principal */}
            <div className="mb-4">
              <label htmlFor="userInput" className="form-label fw-bold">
                ¿Qué mensaje quieres escribir?
              </label>
              <textarea
                id="userInput"
                className="form-control"
                rows="4"
                placeholder="Ejemplo: Recordar a Juan que debe pagar la factura del mes pasado..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Opciones */}
            <div className="row mb-4">
              <div className="col-md-4">
                <label htmlFor="destinatario" className="form-label fw-bold">
                  Para quién es:
                </label>
                <select
                  id="destinatario"
                  className="form-select"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                >
                  {destinatarios.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="tono" className="form-label fw-bold">
                  Tono:
                </label>
                <select
                  id="tono"
                  className="form-select"
                  value={tono}
                  onChange={(e) => setTono(e.target.value)}
                >
                  {tonos.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="contexto" className="form-label fw-bold">
                  Contexto:
                </label>
                <select
                  id="contexto"
                  className="form-select"
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                >
                  {contextos.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="d-flex gap-3">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleGenerateMessage}
                disabled={isGenerating || !userInput.trim()}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Generando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic me-2"></i>
                    Generar Mensaje
                  </>
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearForm}
                disabled={isGenerating}
              >
                <i className="fas fa-eraser me-2"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Output */}
        <div className="col-lg-6">
          <div className="card p-4">
            <h5 className="mb-3">
              <i className="fas fa-comment-dots me-2 text-success"></i>
              Mensaje Generado
            </h5>

            {generatedMessage ? (
              <>
                {/* Mensaje generado */}
                <div className="mb-4">
                  <div className="bg-light p-3 rounded border">
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {generatedMessage}
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="d-flex gap-2 mb-4">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={copyToClipboard}
                  >
                    <i className="fas fa-copy me-2"></i>
                    Copiar
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={regenerateMessage}
                    disabled={isGenerating}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Regenerar
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      const edited = prompt('Edita el mensaje:', generatedMessage);
                      if (edited !== null) {
                        setGeneratedMessage(edited);
                      }
                    }}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Editar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-muted py-5">
                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                <p>Escribe tu idea en el panel izquierdo y haz clic en "Generar Mensaje"</p>
              </div>
            )}

            {/* Historial */}
            {messageHistory.length > 0 && (
              <div className="mt-4">
                <h6 className="mb-3">
                  <i className="fas fa-history me-2"></i>
                  Historial (últimos 5)
                </h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {messageHistory.map((item) => (
                    <div key={item.id} className="card mb-2">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <small className="text-muted">
                            {item.timestamp} • {item.destinatario} • {item.tono} • {item.contexto}
                          </small>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setGeneratedMessage(item.message)}
                          >
                            Usar
                          </button>
                        </div>
                        <p className="mb-1 small fw-bold text-primary">{item.input}</p>
                        <p className="mb-0 small">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default Asistente;


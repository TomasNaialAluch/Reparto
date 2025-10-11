import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/NotificationContainer';
import MessageCounter from '../components/MessageCounter';
import { generateMessage, generateMessageWithFeedback, consolidateFeedback } from '../config/gemini';
import { useAsistenteFeedback, useAsistenteProfile, useAsistenteUsage, useAsistenteMessages, useAsistentePreferences } from '../firebase/hooks';

const Asistente = () => {
  const [userInput, setUserInput] = useState('');
  const [destinatario, setDestinatario] = useState('cliente');
  const [tono, setTono] = useState('amigable');
  const [contexto, setContexto] = useState('cobro');
  const [tipoMensaje, setTipoMensaje] = useState('whatsapp');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  
  // Estados para el chat
  const [chatMessages, setChatMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDestinatario, setFilterDestinatario] = useState('');
  const [filterTono, setFilterTono] = useState('');
  const [filterContexto, setFilterContexto] = useState('');
  const [filterTipoMensaje, setFilterTipoMensaje] = useState('');
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  // Notificaciones
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Firebase para feedback, perfil, uso, mensajes y preferencias
  const { addFeedback, feedbacks } = useAsistenteFeedback();
  const { addProfile, updateProfile, getProfileByUser } = useAsistenteProfile();
  const { incrementMessageCount, canGenerateMessage } = useAsistenteUsage();
  const { addMessage, updateMessage, messages, loading: messagesLoading } = useAsistenteMessages();
  const { preferences, savePreferences } = useAsistentePreferences();
  
  // Log de mensajes cuando cambian
  useEffect(() => {
    console.log('🔄 Mensajes actualizados:', messages.length, 'mensajes');
    console.log('📋 Lista completa:', messages);
  }, [messages]);

  // Función para filtrar mensajes
  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm || 
      message.userInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.generatedMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.editedMessage && message.editedMessage.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDestinatario = !filterDestinatario || message.destinatario === filterDestinatario;
    const matchesTono = !filterTono || message.tono === filterTono;
    const matchesContexto = !filterContexto || message.contexto === filterContexto;
    const matchesTipoMensaje = !filterTipoMensaje || message.tipoMensaje === filterTipoMensaje;
    
    return matchesSearch && matchesDestinatario && matchesTono && matchesContexto && matchesTipoMensaje;
  });
  
  // Estado para el perfil personalizado
  const [userProfile, setUserProfile] = useState(null);

  // Cargar perfil personalizado y preferencias al inicio
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getProfileByUser('default_user');
        if (profile) {
          setUserProfile(profile.profile);
          console.log('👤 Perfil personalizado cargado:', profile.profile);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };
    
    loadUserProfile();
  }, [getProfileByUser]);

  // Cargar preferencias guardadas
  useEffect(() => {
    if (preferences) {
      setDestinatario(preferences.destinatario || 'cliente');
      setTono(preferences.tono || 'amigable');
      setContexto(preferences.contexto || 'cobro');
      setTipoMensaje(preferences.tipoMensaje || 'whatsapp');
      console.log('⚙️ Preferencias cargadas:', preferences);
    }
  }, [preferences]);

  // Guardar preferencias automáticamente cuando cambian (con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (destinatario && tono && contexto && tipoMensaje) {
        savePreferences({ destinatario, tono, contexto, tipoMensaje });
      }
    }, 1000); // Esperar 1 segundo después del último cambio

    return () => clearTimeout(timeoutId);
  }, [destinatario, tono, contexto, tipoMensaje, savePreferences]);

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

  // Función para enviar mensaje en el chat
  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      showError('Por favor describe qué mensaje quieres escribir');
      return;
    }

    // Verificar si hay API key configurada
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') {
      showError('⚠️ API Key de Gemini no configurada. Por favor configura VITE_GEMINI_API_KEY en tu archivo .env');
      return;
    }

    // Verificar límite de mensajes
    try {
      const canGenerate = await canGenerateMessage('shared');
      if (!canGenerate) {
        showError('🚫 Has alcanzado el límite mensual de 1,500 mensajes de la API gratuita. El contador se reiniciará el próximo mes.');
        return;
      }
    } catch (error) {
      console.error('Error verificando límite:', error);
      showError('Error verificando límite de mensajes');
      return;
    }

    // Crear nuevo chat si no existe
    if (!currentChatId) {
      setCurrentChatId(Date.now().toString());
    }

    // Agregar mensaje del usuario al chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    
    try {
      console.log('🚀 Llamando a Gemini AI...');
      console.log('📝 Input:', userInput);
      console.log('👤 Destinatario:', destinatario);
      console.log('🎭 Tono:', tono);
      console.log('📋 Contexto:', contexto);
      console.log('📱 Tipo de mensaje:', tipoMensaje);
      console.log('👤 Perfil personalizado:', userProfile ? 'SÍ' : 'NO');
      
      // Llamar a Gemini AI con perfil personalizado
      const aiMessage = await generateMessage(userInput, destinatario, tono, contexto, userProfile, tipoMensaje);
      
      console.log('✅ Respuesta de Gemini:', aiMessage);
      
      // Agregar respuesta de la IA al chat
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiMessage,
        timestamp: new Date().toISOString(),
        metadata: {
          destinatario,
          tono,
          contexto,
          tipoMensaje
        }
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      
      // Incrementar contador de mensajes
      try {
        await incrementMessageCount('shared');
        console.log('📊 Contador de mensajes incrementado');
      } catch (error) {
        console.error('Error incrementando contador:', error);
      }
      
      // Limpiar input
      setUserInput('');
      
    } catch (error) {
      console.error('Error generando mensaje:', error);
      showError(`Error al generar el mensaje: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para generar mensaje con Gemini AI (mantener para compatibilidad)
  const handleGenerateMessage = async () => {
    if (!userInput.trim()) {
      showError('Por favor describe qué mensaje quieres escribir');
      return;
    }

    // Verificar si hay API key configurada
    console.log('🔍 API Key configurada:', import.meta.env.VITE_GEMINI_API_KEY ? 'SÍ' : 'NO');
    console.log('🔍 API Key valor:', import.meta.env.VITE_GEMINI_API_KEY);
    
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') {
      showError('⚠️ API Key de Gemini no configurada. Por favor configura VITE_GEMINI_API_KEY en tu archivo .env');
      return;
    }

    // Verificar límite de mensajes
    try {
      const canGenerate = await canGenerateMessage('shared');
      if (!canGenerate) {
        showError('🚫 Has alcanzado el límite mensual de 1,500 mensajes de la API gratuita. El contador se reiniciará el próximo mes.');
        return;
      }
    } catch (error) {
      console.error('Error verificando límite:', error);
      showError('Error verificando límite de mensajes');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🚀 Llamando a Gemini AI...');
      console.log('📝 Input:', userInput);
      console.log('👤 Destinatario:', destinatario);
      console.log('🎭 Tono:', tono);
      console.log('📋 Contexto:', contexto);
      console.log('📱 Tipo de mensaje:', tipoMensaje);
      console.log('👤 Perfil personalizado:', userProfile ? 'SÍ' : 'NO');
      
      // Llamar a Gemini AI con perfil personalizado
      const aiMessage = await generateMessage(userInput, destinatario, tono, contexto, userProfile, tipoMensaje);
      
      console.log('✅ Respuesta de Gemini:', aiMessage);
      setGeneratedMessage(aiMessage);
      
      // Guardar mensaje en Firebase
      try {
        await addMessage({
          userInput,
          generatedMessage: aiMessage,
          destinatario,
          tono,
          contexto,
          tipoMensaje,
          userProfile
        });
        console.log('💾 Mensaje guardado en Firebase');
      } catch (error) {
        console.error('Error guardando mensaje:', error);
        // No mostrar error al usuario, solo log
      }
      
      // Incrementar contador de mensajes
      try {
        await incrementMessageCount('shared');
        console.log('📊 Contador de mensajes incrementado');
      } catch (error) {
        console.error('Error incrementando contador:', error);
        // No mostrar error al usuario, solo log
      }
      
      // Agregar al historial local (para mostrar inmediatamente)
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
      showSuccess('✓ Mensaje generado y guardado exitosamente');
      
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

  // Función para guardar mensaje del chat
  const saveChatMessage = async (messageId) => {
    try {
      const message = chatMessages.find(m => m.id === messageId);
      if (!message || message.type !== 'ai') {
        showError('No se puede guardar este mensaje');
        return;
      }

      await addMessage({
        userInput: chatMessages.find(m => m.id === messageId - 1)?.content || '',
        generatedMessage: message.content,
        destinatario: message.metadata?.destinatario || destinatario,
        tono: message.metadata?.tono || tono,
        contexto: message.metadata?.contexto || contexto,
        tipoMensaje: message.metadata?.tipoMensaje || tipoMensaje,
        userProfile
      });
      
      showSuccess('✓ Mensaje guardado exitosamente');
    } catch (error) {
      console.error('Error guardando mensaje:', error);
      showError('Error al guardar el mensaje');
    }
  };

  // Función para limpiar chat
  const clearChat = () => {
    setChatMessages([]);
    setCurrentChatId(null);
    setUserInput('');
  };

  // Función para limpiar formulario (mantener para compatibilidad)
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

  // Función para abrir modal de edición
  const openEditModal = () => {
    setEditedMessage(generatedMessage);
    setIsEditModalOpen(true);
  };

  // Función para cerrar modal de edición
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditedMessage('');
    setFeedbackText('');
  };

  // Función para guardar mensaje editado
  const saveEditedMessage = async () => {
    try {
      setGeneratedMessage(editedMessage);
      
      // Guardar como nuevo mensaje en Firebase
      await addMessage({
        userInput,
        generatedMessage: editedMessage,
        destinatario,
        tono,
        contexto,
        tipoMensaje,
        userProfile
      });
      console.log('💾 Mensaje editado guardado como nuevo en Firebase');
      
      closeEditModal();
      showSuccess('✓ Mensaje actualizado y guardado');
    } catch (error) {
      console.error('Error guardando mensaje editado:', error);
      showError('Error al guardar el mensaje editado');
    }
  };

  // Función para enviar feedback
  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      showError('Por favor escribe tu feedback');
      return;
    }

    try {
      // Guardar feedback en Firebase
      const feedbackData = {
        originalMessage: generatedMessage,
        editedMessage: editedMessage,
        feedback: feedbackText,
        destinatario,
        tono,
        contexto,
        tipoMensaje
      };
      
      await addFeedback(feedbackData);
      
      showSuccess('✓ Feedback guardado - Regenerando mensaje...');
      setFeedbackText('');
      
      // Regenerar mensaje basado en el feedback
      try {
        console.log('🔄 Regenerando mensaje con feedback...');
        const improvedMessage = await generateMessageWithFeedback(
          userInput, 
          destinatario, 
          tono, 
          contexto, 
          userProfile, 
          tipoMensaje,
          generatedMessage,
          feedbackText
        );
        
        // Actualizar el mensaje editado en el modal
        setEditedMessage(improvedMessage);
        showSuccess('✓ Mensaje regenerado con tu feedback - Puedes seguir editándolo');
        
      } catch (error) {
        console.error('Error regenerando mensaje:', error);
        showError('Error al regenerar el mensaje');
      }
      
      // Verificar si necesitamos consolidar feedback
      const totalFeedbacks = feedbacks.length + 1;
      console.log('📊 Total de feedbacks guardados:', totalFeedbacks);
      
      // Consolidar cada 5 feedbacks
      if (totalFeedbacks % 5 === 0) {
        console.log('🔄 Iniciando consolidación automática...');
        await consolidateUserProfile();
      }
      
    } catch (error) {
      console.error('Error guardando feedback:', error);
      showError('Error al guardar el feedback en la base de datos');
    }
  };

  // Función para consolidar perfil del usuario
  const consolidateUserProfile = async () => {
    try {
      console.log('🧠 Consolidando perfil personalizado...');
      
      // Obtener los últimos 5 feedbacks
      const recentFeedbacks = feedbacks.slice(-5);
      
      if (recentFeedbacks.length < 5) {
        console.log('⚠️ No hay suficientes feedbacks para consolidar');
        return;
      }
      
      // Consolidar con Gemini
      const consolidatedProfile = await consolidateFeedback(recentFeedbacks);
      console.log('✅ Perfil consolidado:', consolidatedProfile);
      
      // Guardar o actualizar perfil en Firebase
      const existingProfile = await getProfileByUser('default_user');
      
      if (existingProfile) {
        // Actualizar perfil existente
        await updateProfile(existingProfile.id, {
          profile: consolidatedProfile,
          feedbackCount: feedbacks.length + 1,
          version: (existingProfile.version || 1) + 1
        });
        console.log('✅ Perfil actualizado');
      } else {
        // Crear nuevo perfil
        await addProfile({
          profile: consolidatedProfile,
          feedbackCount: feedbacks.length + 1,
          version: 1
        });
        console.log('✅ Nuevo perfil creado');
      }
      
      // Actualizar estado local
      setUserProfile(consolidatedProfile);
      
      showSuccess('🎉 ¡Perfil personalizado actualizado! El asistente ahora conoce mejor tus preferencias.');
      
    } catch (error) {
      console.error('❌ Error consolidando perfil:', error);
      showError('Error al consolidar el perfil personalizado');
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Panel Izquierdo - Chat */}
        <div className="col-lg-6">
          <div className="card" style={{ height: '600px' }}>
            {/* Header del chat */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-robot me-2 text-primary"></i>
                Chat con Asistente
              </h4>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={clearChat}
                disabled={chatMessages.length === 0}
              >
                <i className="fas fa-trash me-1"></i>
                Limpiar
              </button>
            </div>

            {/* Configuración de API Key */}
            {(!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') && (
              <div className="alert alert-warning m-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Configuración requerida:</strong> Para usar el asistente con IA, necesitas configurar tu API Key de Gemini en el archivo <code>.env</code>
              </div>
            )}

            {/* Configuración rápida */}
            <div className="p-2 border-bottom">
              <div className="row g-1">
                <div className="col-md-3">
                  <label className="form-label small">Tipo</label>
                  <select
                    className="form-select form-select-sm"
                    value={tipoMensaje}
                    onChange={(e) => setTipoMensaje(e.target.value)}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Para</label>
                  <select
                    className="form-select form-select-sm"
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                  >
                    {destinatarios.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Tono</label>
                  <select
                    className="form-select form-select-sm"
                    value={tono}
                    onChange={(e) => setTono(e.target.value)}
                  >
                    {tonos.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Contexto</label>
                  <select
                    className="form-select form-select-sm"
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                  >
                    {contextos.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Input del chat - FIJO EN LA PARTE INFERIOR */}
            <div className="p-3 border-top bg-light" style={{ position: 'absolute', bottom: '0', left: '0', right: '0' }}>
              <div className="input-group">
                <textarea
                  className="form-control"
                  placeholder="Describe qué mensaje quieres escribir..."
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    // Ajustar altura automáticamente
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{ 
                    resize: 'none',
                    overflow: 'hidden',
                    minHeight: '40px',
                    maxHeight: '80px'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={isGenerating || !userInput.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>

            {/* Área de mensajes del chat - CON PADDING INFERIOR PARA EL INPUT */}
            <div className="p-3" style={{ height: 'calc(100% - 200px)', overflowY: 'auto', paddingBottom: '120px' }}>
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted py-2">
                  <i className="fas fa-comments fa-2x mb-2"></i>
                  <p className="mb-1 small">¡Hola! Soy tu asistente de mensajes.</p>
                  <p className="small">Describe qué mensaje quieres escribir y te ayudaré a redactarlo.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`d-flex ${message.type === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`p-3 rounded-3 ${
                          message.type === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-light border'
                        }`}
                        style={{ maxWidth: '80%' }}
                      >
                        <div className="d-flex align-items-start gap-2">
                          <div className="flex-grow-1">
                            <p className="mb-0">{message.content}</p>
                            {message.type === 'ai' && (
                              <div className="mt-2 d-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => saveChatMessage(message.id)}
                                  title="Guardar este mensaje"
                                >
                                  <i className="fas fa-save me-1"></i>
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => {
                                    setUserInput(`Mejora este mensaje: ${message.content}`);
                                  }}
                                  title="Pedir mejora de este mensaje"
                                >
                                  <i className="fas fa-edit me-1"></i>
                                  Mejorar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="d-flex justify-content-start">
                      <div className="p-3 bg-light border rounded-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Generando respuesta...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                    onClick={openEditModal}
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

            {/* Contador de mensajes */}
            <MessageCounter userId="default_user" />

            {/* Historial de mensajes guardados */}
            <div className="mt-4">
              <h6 className="mb-3">
                <i className="fas fa-history me-2"></i>
                Mensajes Guardados ({filteredMessages.length} de {messages.length})
                {messagesLoading && <span className="spinner-border spinner-border-sm ms-2"></span>}
              </h6>
              
              {/* Buscador y filtros */}
              {messages.length > 0 && (
                <div className="card mb-3">
                  <div className="card-body p-3">
                    {/* Buscador */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-search me-2"></i>
                        Buscar mensajes
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar en mensajes guardados..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    {/* Filtros */}
                    <div className="row g-2">
                      <div className="col-md-3">
                        <label className="form-label small">Destinatario</label>
                        <select
                          className="form-select form-select-sm"
                          value={filterDestinatario}
                          onChange={(e) => setFilterDestinatario(e.target.value)}
                        >
                          <option value="">Todos</option>
                          {destinatarios.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label small">Tono</label>
                        <select
                          className="form-select form-select-sm"
                          value={filterTono}
                          onChange={(e) => setFilterTono(e.target.value)}
                        >
                          <option value="">Todos</option>
                          {tonos.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label small">Contexto</label>
                        <select
                          className="form-select form-select-sm"
                          value={filterContexto}
                          onChange={(e) => setFilterContexto(e.target.value)}
                        >
                          <option value="">Todos</option>
                          {contextos.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3">
                        <label className="form-label small">Tipo</label>
                        <select
                          className="form-select form-select-sm"
                          value={filterTipoMensaje}
                          onChange={(e) => setFilterTipoMensaje(e.target.value)}
                        >
                          <option value="">Todos</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="email">Email</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Botón limpiar filtros */}
                    {(searchTerm || filterDestinatario || filterTono || filterContexto || filterTipoMensaje) && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setSearchTerm('');
                            setFilterDestinatario('');
                            setFilterTono('');
                            setFilterContexto('');
                            setFilterTipoMensaje('');
                          }}
                        >
                          <i className="fas fa-times me-1"></i>
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {messagesLoading && messages.length === 0 ? (
                <div className="text-center text-muted py-3">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando mensajes guardados...</p>
                </div>
              ) : filteredMessages.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredMessages.slice(0, 20).map((message) => (
                    <div key={message.id} className="card mb-2">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <small className="text-muted">
                            {new Date(message.timestamp).toLocaleString('es-AR')} • 
                            {message.destinatario} • {message.tono} • {message.contexto} • 
                            <span className={`badge ${message.tipoMensaje === 'whatsapp' ? 'bg-success' : 'bg-primary'} ms-1`}>
                              {message.tipoMensaje === 'whatsapp' ? 'WhatsApp' : 'Email'}
                            </span>
                            {message.isEdited && <span className="badge bg-warning ms-1">Editado</span>}
                          </small>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => {
                                setGeneratedMessage(message.editedMessage || message.generatedMessage);
                                showSuccess('✓ Mensaje cargado en el área de resultado');
                              }}
                              title="Cargar este mensaje en el área de resultado"
                            >
                              <i className="fas fa-arrow-up me-1"></i>
                              Copiar este mensaje
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setUserInput(message.editedMessage || message.generatedMessage);
                                setDestinatario(message.destinatario);
                                setTono(message.tono);
                                setContexto(message.contexto);
                                setTipoMensaje(message.tipoMensaje || 'whatsapp');
                                showSuccess('✓ Mensaje y parámetros cargados para editar');
                              }}
                              title="Cargar este mensaje en el input para editarlo"
                            >
                              <i className="fas fa-cog me-1"></i>
                              Reutilizar respuesta
                            </button>
                          </div>
                        </div>
                        <p className="mb-1 small fw-bold text-primary">
                          <i className="fas fa-quote-left me-1"></i>
                          {message.userInput}
                        </p>
                        <p className="mb-0 small">
                          <i className="fas fa-robot me-1"></i>
                          {message.editedMessage || message.generatedMessage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted py-3">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p>No hay mensajes guardados aún</p>
                  <small>Genera tu primer mensaje para verlo aquí</small>
                </div>
              ) : (
                <div className="text-center text-muted py-3">
                  <i className="fas fa-search fa-2x mb-2"></i>
                  <p>No se encontraron mensajes</p>
                  <small>Intenta con otros filtros o términos de búsqueda</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {isEditModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-edit me-2"></i>
                  Editar Mensaje
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditModal}
                ></button>
              </div>
              
              <div className="modal-body">
                {/* Mensaje editado */}
                <div className="mb-4">
                  <label htmlFor="editedMessage" className="form-label fw-bold">
                    Mensaje:
                  </label>
                  <textarea
                    id="editedMessage"
                    className="form-control"
                    rows="6"
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    placeholder="Edita el mensaje aquí..."
                  />
                </div>

                {/* Feedback */}
                <div className="mb-4">
                  <label htmlFor="feedbackText" className="form-label fw-bold">
                    <i className="fas fa-comment-dots me-2 text-info"></i>
                    Feedback (opcional):
                  </label>
                  <textarea
                    id="feedbackText"
                    className="form-control"
                    rows="3"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Ejemplo: 'Prefiero mensajes más cortos' o 'No me gusta que use tanto formal'..."
                  />
                  <div className="form-text">
                    Tu feedback ayuda al asistente a aprender tus preferencias para futuros mensajes.
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                >
                  Cancelar
                </button>
                
                {feedbackText.trim() && (
                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={sendFeedback}
                  >
                    <i className="fas fa-comment-dots me-2"></i>
                    Enviar Feedback
                  </button>
                )}
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveEditedMessage}
                >
                  <i className="fas fa-save me-2"></i>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default Asistente;

